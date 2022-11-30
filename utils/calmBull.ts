import { BigNumber } from 'ethers'
import { USDC, WETH } from '../constants/address'
import { ETH_USDC_FEE, WETH_DECIMALS_DIFF } from '../constants/numbers'
import { Quoter } from '../types/contracts'
import { quoteExactIn, quoteExactOut } from './quoter'

type getAuctionDetailsType = {
  quoter: Quoter
  crabUsdPrice: BigNumber
  loanCollat: BigNumber
  loanDebt: BigNumber
  crabBalance: BigNumber
  squeethInCrab: BigNumber
  ethInCrab: BigNumber
  crabTotalSupply: BigNumber
  ethUsdPrice: BigNumber
  targetCr: BigNumber
  slippageTolerance: number

}

export async function getAuctionDetails(params: getAuctionDetailsType) {
  const {
    crabUsdPrice,
    loanCollat,
    loanDebt,
    crabBalance,
    squeethInCrab,
    ethInCrab,
    crabTotalSupply,
    quoter,
    ethUsdPrice,
    targetCr,
    slippageTolerance
  } = params

  // Change to 18 decimals
  const loanDebtAdj = loanDebt.mul(WETH_DECIMALS_DIFF)
  const ethUsdPriceAdj = ethUsdPrice.mul(WETH_DECIMALS_DIFF)
  // new collateral should be total equity value
  const newEquityValue = (crabBalance.wmul(crabUsdPrice).add(loanCollat.wmul(ethUsdPriceAdj)).sub(loanDebtAdj)).div(WETH_DECIMALS_DIFF)
  const newLoanCollat = newEquityValue.wdiv(ethUsdPrice)
   // new loan debt to hit target cr
  const newLoanDebt = newLoanCollat.wmul(ethUsdPrice).div(targetCr)
  // dollar value of eth collateral change
  const dollarProceeds = (loanCollat.sub(newLoanCollat)).wmul(ethUsdPrice)
  // need $ to/from crab
  const needFromCrab = loanDebt.sub(newLoanDebt).sub(dollarProceeds)
  // amount of crab to pay/recieve target dollar amount
  const crabToTrade = needFromCrab.mul(WETH_DECIMALS_DIFF).wdiv(crabUsdPrice)
  // deposit into crab if we have extra $ after changing loan composition 
  const isDepositingIntoCrab = needFromCrab.gt(0) ? false: true
  // fee adjustment for deposit to crab case
  const adjEthInCrab = ethInCrab // TODO: Get strategydebt/collateral Add fee adjust
  // Auction oSQTH amount will include provision for the fee if depositing
  const oSQTHAuctionAmount = isDepositingIntoCrab ?
    (crabToTrade.wmul(squeethInCrab).wdiv(crabTotalSupply)).wmul(ethInCrab).wdiv(adjEthInCrab):
    crabToTrade.wmul(squeethInCrab).wdiv(crabTotalSupply)

  const wethAmount = dollarProceeds.gt(0) ? await getWethAmountForUSDC(dollarProceeds.abs(), false, quoter, slippageTolerance):
                                            await getWethAmountForUSDC(dollarProceeds.abs(), true, quoter, slippageTolerance)

  const wethLimitPrice = dollarProceeds.abs().wdiv(wethAmount)

  // console.log('wethAmount from quoter', wethAmount.toString())
  // console.log('dollarProceeds.abs()', dollarProceeds.abs().toString())
  // console.log('wethLimitPrice', wethLimitPrice.toString())
  // console.log('crabBalance',crabBalance.toString())
  // console.log('newEquityValue', newEquityValue.toString())
  // console.log('newLoanCollat', newLoanCollat.toString()) 
  // console.log('targetCr', targetCr.toString())
  // console.log('newLoanDebt', newLoanDebt.toString())
  // console.log('dollarProceeds', dollarProceeds.toString())
  // console.log('needFromCrab', needFromCrab.toString())
  // console.log('crabToTrade',crabToTrade.toString())
  // console.log('oSQTHAuctionAmount', oSQTHAuctionAmount.toString())



  return {crabToTrade, oSQTHAuctionAmount, isDepositingIntoCrab, wethLimitPrice}

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

  } = params

  // TODO: slippage
  // Initialize

  // Change to 18 decimals
  const loanDebtAdj = loanDebt.mul(WETH_DECIMALS_DIFF)
  const adjEthInCrab = ethInCrab // TODO: adjust for fee

  const crabAmount = isDepositingIntoCrab? 
        oSQTHAuctionAmount.wmul(crabTotalSupply).wdiv(squeethInCrab).wmul(adjEthInCrab).wdiv(ethInCrab):
        oSQTHAuctionAmount.wmul(crabTotalSupply).wdiv(squeethInCrab)
  
  // Starting equity value in USD
  const oldEquityValue = (crabBalance.wmul(crabUsdPrice).add(loanCollat.wmul(ethUsdPrice.mul(WETH_DECIMALS_DIFF))).sub(loanDebtAdj)).div(WETH_DECIMALS_DIFF)
  
  // Auction pnl from difference between squeeth price and clearing price
  const auctionPnl = isDepositingIntoCrab? 
        ((oSQTHAuctionAmount.wmul(clearingPrice)).sub(oSQTHAuctionAmount.wmul(squeethEthPrice))).wmul(ethUsdPrice):  
        ((oSQTHAuctionAmount.wmul(squeethEthPrice)).sub(oSQTHAuctionAmount.wmul(clearingPrice))).wmul(ethUsdPrice)  

  // New equity value 
  const newEquityValue = oldEquityValue.add(auctionPnl)
  const wethTargetInEuler = newEquityValue.wdiv(ethUsdPrice)

  return {crabAmount, wethTargetInEuler}

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

async function getWethAmountForUSDC(
  usdcAmount: BigNumber,
  isSelling: boolean,
  quoter: Quoter,
  slippage: number,
) {
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
