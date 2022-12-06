import { BigNumber } from 'ethers'
import { USDC, WETH } from '../constants/address'
import { ETH_USDC_FEE, WETH_DECIMALS_DIFF } from '../constants/numbers'
import { Quoter } from '../types/contracts'
import { quoteExactIn, quoteExactOut } from './quoter'

type getAuctionDetailsType = {
  quoter: Quoter
  crabUsdPrice: BigNumber
  squeethEthPrice: BigNumber
  loanCollat: BigNumber
  loanDebt: BigNumber
  crabBalance: BigNumber
  squeethInCrab: BigNumber
  ethInCrab: BigNumber
  crabTotalSupply: BigNumber
  ethUsdPrice: BigNumber
  targetCr: BigNumber
  slippageTolerance: number
  feeRate: BigNumber
}

export async function getAuctionDetails(params: getAuctionDetailsType) {
  const {
    crabUsdPrice,
    squeethEthPrice,
    loanCollat,
    loanDebt,
    crabBalance,
    squeethInCrab,
    ethInCrab,
    crabTotalSupply,
    quoter,
    ethUsdPrice,
    targetCr,
    slippageTolerance,
    feeRate,
  } = params

  // new collateral should be total equity value 
  const newEquityValue = (crabBalance
    .wmul(crabUsdPrice)
    .add(loanCollat.wmul(ethUsdPrice))
    .sub(loanDebt.mul(WETH_DECIMALS_DIFF))).div(WETH_DECIMALS_DIFF)
  console.log('newEquityValue', newEquityValue.toString())  
  const newLoanCollat = newEquityValue.wdiv(ethUsdPrice).mul(WETH_DECIMALS_DIFF)
  // new loan debt to hit target cr
  const newLoanDebt = newLoanCollat.wmul(ethUsdPrice).wdiv(targetCr).div(WETH_DECIMALS_DIFF)
  console.log('newLoanCollat', newLoanCollat.toString())
  console.log('ethUsdPrice', ethUsdPrice.toString())
  console.log('targetCr', targetCr.toString())

  console.log('newLoanDebt', newLoanDebt.toString())
  console.log('ethUsdPrice', ethUsdPrice.toString())
  // dollar value of eth collateral change
  const dollarProceeds = (loanCollat.sub(newLoanCollat)).wmul(ethUsdPrice).div(WETH_DECIMALS_DIFF)
  console.log('dollarProceeds', dollarProceeds.toString())
  // $ to/from crab
  const needFromCrab = loanDebt.sub(newLoanDebt).sub(dollarProceeds)
  console.log('needFromCrab', needFromCrab.toString())
  // deposit into crab if we have extra $ after changing loan composition
  const isDepositingIntoCrab = needFromCrab.gt(0) ? false : true
  // amount of crab to pay/recieve target dollar amount
  const crabToTrade = needFromCrab.mul(WETH_DECIMALS_DIFF).wdiv(crabUsdPrice).abs()
  console.log('crabToTrade', crabToTrade.toString())
  // fee adjustment for deposit to crab case
  const feeAdjustment = squeethEthPrice.mul(feeRate).div(10000)
  // Adjustented collateral for mint fee when depositing
  const adjEthInCrab = ethInCrab.add(squeethInCrab.wmul(feeAdjustment))
  console.log('adjEthInCrab', adjEthInCrab.toString())
  // Auction oSQTH amount will include provision for the fee if depositing
  const oSQTHAuctionAmount = isDepositingIntoCrab
    ? crabToTrade.wmul(squeethInCrab).wdiv(crabTotalSupply).wmul(ethInCrab).wdiv(adjEthInCrab)
    : crabToTrade.wmul(squeethInCrab).wdiv(crabTotalSupply)
  console.log('oSQTHAuctionAmount', oSQTHAuctionAmount.toString())
  const wethAmount = dollarProceeds.gt(0)
    ? (await getWethAmountForUSDC(dollarProceeds.abs(), false, quoter, slippageTolerance)).mul(WETH_DECIMALS_DIFF)
    : (await getWethAmountForUSDC(dollarProceeds.abs(), true, quoter, slippageTolerance)).mul(WETH_DECIMALS_DIFF)
  console.log('wethAmount', wethAmount.toString()) 
  // Price for weth/usd trade including slippage
  const wethLimitPrice = dollarProceeds.abs().wdiv(wethAmount).mul(WETH_DECIMALS_DIFF)
  console.log('wethLimitPrice', wethLimitPrice.toString())
  console.log('ETH proceeds', wethAmount.toString(), dollarProceeds.toString(), wethLimitPrice.toString())
  return { crabToTrade, oSQTHAuctionAmount, isDepositingIntoCrab, wethLimitPrice }
}

type getFullRebalanceType = {
  oSQTHAuctionAmount: BigNumber
  isDepositingIntoCrab: Boolean
  loanCollat: BigNumber
  loanDebt: BigNumber
  crabBalance: BigNumber
  squeethInCrab: BigNumber
  ethInCrab: BigNumber
  crabTotalSupply: BigNumber
  ethUsdPrice: BigNumber
  crabUsdPrice: BigNumber
  squeethEthPrice: BigNumber
  clearingPrice: BigNumber
  feeRate: BigNumber
}

export async function getFullRebalanceDetails(params: getFullRebalanceType) {
  const {
    oSQTHAuctionAmount,
    isDepositingIntoCrab,
    loanCollat,
    loanDebt,
    crabBalance,
    squeethInCrab,
    ethInCrab,
    crabTotalSupply,
    ethUsdPrice,
    crabUsdPrice,
    squeethEthPrice,
    clearingPrice,
    feeRate,
  } = params

  // Adjustented collateral for mint fee when depositing
  const feeAdjustment = squeethEthPrice.mul(feeRate).div(10000)
  const adjEthInCrab = ethInCrab.add(squeethInCrab.wmul(feeAdjustment))
  console.log('adjEthInCrab', adjEthInCrab.toString())
  const crabAmount = isDepositingIntoCrab
    ? (oSQTHAuctionAmount.wmul(crabTotalSupply).wdiv(squeethInCrab).wmul(adjEthInCrab).wdiv(ethInCrab)).abs()
    : (oSQTHAuctionAmount.wmul(crabTotalSupply).wdiv(squeethInCrab)).abs()

  console.log('crabAmount', crabAmount.toString())
    // Starting equity value in USD
  const oldEquityValue = crabBalance
    .wmul(crabUsdPrice)
    .add(loanCollat.wmul(ethUsdPrice))
    .sub(loanDebt.mul(WETH_DECIMALS_DIFF))
    .div(WETH_DECIMALS_DIFF)
  console.log('oldEquityValue', oldEquityValue.toString())
  // Auction pnl from difference between squeeth price and clearing price
  const auctionPnl = isDepositingIntoCrab
    ? (oSQTHAuctionAmount.wmul(clearingPrice).sub(oSQTHAuctionAmount.wmul(squeethEthPrice))).wmul(ethUsdPrice)
    : (oSQTHAuctionAmount.wmul(squeethEthPrice).sub(oSQTHAuctionAmount.wmul(clearingPrice))).wmul(ethUsdPrice)
  console.log('auctionPnl', auctionPnl.toString())
  // New equity value
  const newEquityValue = oldEquityValue.add(auctionPnl)
  console.log('newEquityValue', newEquityValue.toString())
  const wethTargetInEuler = newEquityValue.wdiv(ethUsdPrice).mul(WETH_DECIMALS_DIFF)
  console.log('wethTargetInEuler', wethTargetInEuler.toString())
  // Order eth value + weth from crab - weth to pay?

  return { crabAmount, wethTargetInEuler }
}

type levRebalDetailsType = {
  quoter: Quoter
  crabUsdPrice: BigNumber
  loanCollat: BigNumber
  loanDebt: BigNumber
  crabBalance: BigNumber
  ethUsdPrice: BigNumber
  deltaUpper: BigNumber
  deltaLower: BigNumber
  crUpper: BigNumber
  crLower: BigNumber
  slippage: number
}

export async function getLeverageRebalanceDetails(params: levRebalDetailsType) {
  const {
    crabUsdPrice,
    loanCollat,
    loanDebt,
    crabBalance,
    quoter,
    ethUsdPrice,
    deltaLower,
    deltaUpper,
    crLower,
    crUpper,
    slippage,
  } = params

  const usdcDebtTarget = crabUsdPrice.wmul(crabBalance).div(WETH_DECIMALS_DIFF)
  const isSellingUsdc = usdcDebtTarget.gt(loanDebt) ? true : false
  const usdcAmount = isSellingUsdc ? usdcDebtTarget.sub(loanDebt) : loanDebt.sub(usdcDebtTarget)
  const wethAmount = await getWethAmountForUSDC(usdcAmount, isSellingUsdc, quoter, slippage)

  const limitPrice = usdcAmount.mul(WETH_DECIMALS_DIFF).wdiv(wethAmount)

  const { delta: deltaNew, cr: crNew } = getDeltaAndCollat({
    crabUsdPrice,
    crabBalance,
    ethUsdPrice,
    loanCollat: isSellingUsdc ? loanCollat.add(wethAmount) : loanCollat.sub(wethAmount),
    loanDebt: usdcDebtTarget,
  })

  const isRebalPossible = isDeltaAndCrValid(deltaNew, crNew, deltaUpper, deltaLower, crUpper, crLower)

  return { limitPrice, usdcAmount, isSellingUsdc, isRebalPossible, delta: deltaNew, cr: crNew }
}

async function getWethAmountForUSDC(usdcAmount: BigNumber, isSelling: boolean, quoter: Quoter, slippage: number) {
  if (isSelling) {
    return await quoteExactIn(quoter, USDC, WETH, usdcAmount, ETH_USDC_FEE, slippage)
  } else {
    return await quoteExactOut(quoter, WETH, USDC, usdcAmount, ETH_USDC_FEE, slippage)
  }
}

type getDeltaAndCollatType = {
  crabUsdPrice: BigNumber
  ethUsdPrice: BigNumber
  loanDebt: BigNumber
  loanCollat: BigNumber
  crabBalance: BigNumber
}

export function getDeltaAndCollat(params: getDeltaAndCollatType) {
  const { crabUsdPrice, ethUsdPrice, loanCollat, loanDebt, crabBalance } = params

  console.log(crabBalance.toString(), crabUsdPrice.toString())

  const delta = loanCollat
    .wmul(ethUsdPrice)
    .wdiv(crabBalance.wmul(crabUsdPrice).add(loanCollat.wmul(ethUsdPrice)).sub(loanDebt.mul(WETH_DECIMALS_DIFF)))

  const cr = loanCollat.wmul(ethUsdPrice).wdiv(loanDebt.mul(WETH_DECIMALS_DIFF))

  return { delta, cr }
}

export function isDeltaAndCrValid(
  delta: BigNumber,
  cr: BigNumber,
  deltaUpper: BigNumber,
  deltaLower: BigNumber,
  crUpper: BigNumber,
  crLower: BigNumber,
) {
  return delta.lte(deltaUpper) && delta.gte(deltaLower) && cr.lte(crUpper) && cr.gte(crLower)
}
