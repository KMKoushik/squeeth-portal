import { BigNumber } from 'ethers'
import { USDC, WETH } from '../constants/address'
import { ETH_USDC_FEE, WETH_DECIMALS_DIFF, BIG_ONE, DEFAULT_SLIPPAGE } from '../constants/numbers'
import { Quoter } from '../types/contracts'
import { quoteExactIn, quoteExactOut } from './quoter'

type getAuctionOutcomesType = {
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
  feeRate: BigNumber
  quoter: Quoter
  slippageTolerance: number
}

export async function getAuctionOutcomes(params: getAuctionOutcomesType) {
  const {
    crabUsdPrice,
    squeethEthPrice,
    loanCollat,
    loanDebt,
    crabBalance,
    squeethInCrab,
    ethInCrab,
    crabTotalSupply,
    ethUsdPrice,
    targetCr,
    feeRate,
    quoter,
    slippageTolerance,
  } = params

  const { crabToTrade, oSQTHAuctionAmount, isDepositingIntoCrab } = await getAuctionDetails({
    crabUsdPrice,
    squeethEthPrice,
    loanCollat,
    loanDebt,
    crabBalance,
    squeethInCrab,
    ethInCrab,
    crabTotalSupply,
    ethUsdPrice,
    targetCr,
    feeRate,
  })

  const { crabAmount, wethTargetInEuler, usdcTargetInEuler } = await getFullRebalanceDetails({
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
    clearingPrice: squeethEthPrice,
    feeRate,
    quoter,
    slippageTolerance: DEFAULT_SLIPPAGE,
  })

  const isIncreaseWeth = wethTargetInEuler.gt(loanCollat)
  const isBorrowUsdc = usdcTargetInEuler.lt(loanDebt)

  return { isIncreaseWeth, isBorrowUsdc, isDepositingIntoCrab }
}

type getAuctionDetailsType = {
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
    ethUsdPrice,
    targetCr,
    feeRate,
  } = params

  // new collateral should be total equity value
  const newEquityValue = crabBalance
    .wmul(crabUsdPrice)
    .add(loanCollat.wmul(ethUsdPrice))
    .sub(loanDebt.mul(WETH_DECIMALS_DIFF))
    .div(WETH_DECIMALS_DIFF)
  const newLoanCollat = newEquityValue.wdiv(ethUsdPrice).mul(WETH_DECIMALS_DIFF)
  // new loan debt to hit target cr
  const newLoanDebt = newLoanCollat.wmul(ethUsdPrice).wdiv(targetCr).div(WETH_DECIMALS_DIFF)

  // dollar value of eth collateral change
  const dollarProceeds = loanCollat.sub(newLoanCollat).wmul(ethUsdPrice).div(WETH_DECIMALS_DIFF)
  // $ to/from crab
  const needFromCrab = loanDebt.sub(newLoanDebt).sub(dollarProceeds)
  console.log(
    'newLoandebt',
    newLoanDebt.toString(),
    'loandebt',
    loanDebt.toString(),
    'dollarProceeds',
    dollarProceeds.toString(),
    'needFromCrab',
    needFromCrab.toString(),
  )
  // deposit into crab if we have extra $ after changing loan composition
  const isDepositingIntoCrab = needFromCrab.gt(0) ? false : true
  // amount of crab to pay/recieve target dollar amount
  const crabToTrade = needFromCrab.mul(WETH_DECIMALS_DIFF).wdiv(crabUsdPrice).abs()
  // fee adjustment for deposit to crab case
  const feeAdjustment = squeethEthPrice.mul(feeRate).div(10000)
  // Adjustented collateral for mint fee when depositing
  const adjEthInCrab = ethInCrab.add(squeethInCrab.wmul(feeAdjustment))
  // Auction oSQTH amount will include provision for the fee if depositing
  const oSQTHAuctionAmount = isDepositingIntoCrab
    ? crabToTrade.wmul(squeethInCrab).wdiv(crabTotalSupply).wmul(ethInCrab).wdiv(adjEthInCrab)
    : crabToTrade.wmul(squeethInCrab).wdiv(crabTotalSupply)

  return { crabToTrade, oSQTHAuctionAmount, isDepositingIntoCrab, newLoanCollat }
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
  quoter: Quoter
  slippageTolerance: number
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
    quoter,
    slippageTolerance,
  } = params

  // Adjustented collateral for mint fee when depositing
  const feeAdjustment = squeethEthPrice.mul(feeRate).div(10000)
  const adjEthInCrab = ethInCrab.add(squeethInCrab.wmul(feeAdjustment))
  const crabAmount = isDepositingIntoCrab
    ? oSQTHAuctionAmount.wmul(crabTotalSupply).wdiv(squeethInCrab).wmul(adjEthInCrab).wdiv(ethInCrab).abs()
    : oSQTHAuctionAmount.wmul(crabTotalSupply).wdiv(squeethInCrab).abs()

  // Starting equity value in USD
  const oldEquityValue = crabBalance
    .wmul(crabUsdPrice)
    .add(loanCollat.wmul(ethUsdPrice))
    .sub(loanDebt.mul(WETH_DECIMALS_DIFF))
    .div(WETH_DECIMALS_DIFF)
  // Auction pnl from difference between squeeth price and clearing price
  const auctionPnl = (
    isDepositingIntoCrab
      ? oSQTHAuctionAmount.wmul(clearingPrice).sub(oSQTHAuctionAmount.wmul(squeethEthPrice)).wmul(ethUsdPrice)
      : oSQTHAuctionAmount.wmul(squeethEthPrice).sub(oSQTHAuctionAmount.wmul(clearingPrice)).wmul(ethUsdPrice)
  ).div(WETH_DECIMALS_DIFF)
  // New equity value
  const newEquityValue = oldEquityValue.add(auctionPnl)
  const wethTargetInEuler = newEquityValue.wdiv(ethUsdPrice).mul(WETH_DECIMALS_DIFF)
  // Order eth value + weth from crab - weth to pay?

  let netWethToTrade = BigNumber.from(0)
  if (isDepositingIntoCrab) {
    // Deposit into crab
    const wethToCrab = ethInCrab.wdiv(squeethInCrab).wmul(squeethInCrab.add(oSQTHAuctionAmount)).sub(ethInCrab)
    const wethFromAuction = oSQTHAuctionAmount.wmul(clearingPrice)
    netWethToTrade = wethTargetInEuler.sub(loanCollat.sub(wethToCrab).sub(wethFromAuction))
  } else {
    // Withdraw from crab
    const wethFromCrab = crabAmount.wmul(ethInCrab).wdiv(crabTotalSupply)
    const wethToAuction = oSQTHAuctionAmount.wmul(clearingPrice)
    netWethToTrade = wethTargetInEuler.sub(loanCollat.add(wethFromCrab).sub(wethToAuction))
  }

  console.log('netWethToTrade', netWethToTrade.toString())

  const usdcAmount = netWethToTrade.lt(0)
    ? await getUsdcAmountForWeth(netWethToTrade.abs(), true, quoter, slippageTolerance)
    : await getUsdcAmountForWeth(netWethToTrade.abs(), false, quoter, slippageTolerance)

  const wethLimitPrice = usdcAmount.wdiv(netWethToTrade.abs()).mul(WETH_DECIMALS_DIFF)
  const usdcTargetInEuler = wethTargetInEuler.wmul(ethUsdPrice).div(2).div(WETH_DECIMALS_DIFF)

  const { delta: deltaNew, cr: crNew } = getDeltaAndCollat({
    crabUsdPrice,
    crabBalance,
    ethUsdPrice,
    loanCollat: wethTargetInEuler,
    loanDebt: usdcTargetInEuler,
  })

  return { crabAmount, wethTargetInEuler, usdcTargetInEuler, wethLimitPrice, deltaNew, crNew }
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

async function getUsdcAmountForWeth(wethAmount: BigNumber, isSelling: boolean, quoter: Quoter, slippage: number) {
  if (isSelling) {
    return await quoteExactIn(quoter, WETH, USDC, wethAmount, ETH_USDC_FEE, slippage)
  } else {
    return await quoteExactOut(quoter, USDC, WETH, wethAmount, ETH_USDC_FEE, slippage)
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
