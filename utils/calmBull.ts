import { BigNumber } from 'ethers'
import { USDC, WETH } from '../constants/address'
import { ETH_USDC_FEE, WETH_DECIMALS_DIFF } from '../constants/numbers'
import { Quoter } from '../types/contracts'
import { quoteExactIn, quoteExactOut } from './quoter'

type getAuctionDetailsType = {
  quoter: Quoter
  crabUsdPrice: BigNumber
  loanCollat: BigNumber
  loanDebtRaw: BigNumber
  crabBalance: BigNumber
  strategyDebt: BigNumber
  strategyCollateral: BigNumber
  crabTotalSupply: BigNumber
  ethUsdPrice: BigNumber
  targetCr: BigNumber
  slippageTolerance: number

}

export async function getAuctionDetails(params: getAuctionDetailsType) {
  const {
    crabUsdPrice,
    loanCollat,
    loanDebtRaw,
    crabBalance,
    strategyDebt,
    strategyCollateral,
    crabTotalSupply,
    quoter,
    ethUsdPrice,
    targetCr,
    slippageTolerance
  } = params

  // Change to 18 decimals
  const loanDebt = loanDebtRaw.mul(WETH_DECIMALS_DIFF)

  // new collateral should be total equity value
  const newLoanCollat = crabBalance.wmul(crabUsdPrice).add(loanCollat.wmul(ethUsdPrice)).sub(loanDebt)
  // new loan debt to hit target cr
  const newLoanDebt = newLoanCollat.wmul(ethUsdPrice).wdiv(targetCr)
  // dollar value of eth collateral change
  const dollarProceeds = (loanCollat.sub(newLoanCollat)).wmul(ethUsdPrice)
  // amount of crab to pay/recieve target dollar amount
  const crabToTrade = dollarProceeds.wdiv(crabUsdPrice)
  // deposit into crab if we have extra $ after changing loan composition 
  const isDepositingIntoCrab = loanDebt.sub(newLoanDebt).sub(dollarProceeds).gt(0) ? false: true
  // fee adjustment for deposit to crab case
  const adjStrategyCollateral = strategyCollateral // TODO: Get strategydebt/collateral Add fee adjust
  // Auction oSQTH amount will include provision for the fee if depositing
  const oSQTHAuctionAmount = isDepositingIntoCrab ?
    (crabToTrade.wmul(strategyDebt).div(crabTotalSupply)).wmul(strategyCollateral).wdiv(adjStrategyCollateral):
    crabToTrade.wmul(strategyDebt).div(crabTotalSupply)

  const wethLimitPrice = 0
  if (dollarProceeds.gt(0)) {
     // selling eth, buying usdc (exactOut)
     const wethAmount = await getWethAmountForUSDC(dollarProceeds.abs(), false, quoter, slippageTolerance)
     const wethLimitPrice = (dollarProceeds.abs()).wdiv(wethAmount)
  } else {
    // selling usdc, buying eth (exactIn)
    const wethAmount = await getWethAmountForUSDC(dollarProceeds.abs(), true, quoter, slippageTolerance)
    const wethLimitPrice = (dollarProceeds.abs()).wdiv(wethAmount)
  }

  return {oSQTHAuctionAmount, isDepositingIntoCrab, wethLimitPrice}

}

type getFullRebalanceType = {
  oSQTHAuctionAmount: BigNumber
  isDepositingIntoCrab: Boolean
  quoter: Quoter
  crabUsdPrice: BigNumber
  loanCollat: BigNumber
  loanDebtRaw: BigNumber
  crabBalance: BigNumber
  strategyDebt: BigNumber
  strategyCollateral: BigNumber
  crabTotalSupply: BigNumber
  ethUsdPrice: BigNumber
  squeethEthPrice: BigNumber
  clearingPrice: BigNumber
  deltaUpper: BigNumber
  deltaLower: BigNumber
  crUpper: BigNumber
  crLower: BigNumber
  targetCr: BigNumber
}

export async function getFullRebalanceDetails(params: getFullRebalanceType) {
  const {
    oSQTHAuctionAmount,
    isDepositingIntoCrab,
    loanCollat,
    loanDebtRaw,
    strategyDebt,
    strategyCollateral,
    crabTotalSupply,
    ethUsdPrice,
    squeethEthPrice,
    clearingPrice,

  } = params

  // TODO: slippage
  // Initialize
  const crabAmount = 0
  const wethTargetInEuler = 0
  const wethLimitPrice = 0
  const adjStrategyCollateral = strategyCollateral

  // Change to 18 decimals
  const loanDebt = loanDebtRaw.mul(WETH_DECIMALS_DIFF)

  if (isDepositingIntoCrab){
    // get crab amount to match oSQTH amount traded in auction
    const crabAmount = oSQTHAuctionAmount.wmul(crabTotalSupply).wdiv(strategyDebt).wmul(adjStrategyCollateral).wdiv(strategyCollateral)
    // depositing into crab so auction sells oSQTH (change is difference between auction clearing price and mark price)
    const wethTargetInEuler = strategyCollateral.sub(strategyDebt.wmul(squeethEthPrice)).add(loanCollat).sub(loanDebt.div(ethUsdPrice)).add(oSQTHAuctionAmount.wmul(clearingPrice)).sub(oSQTHAuctionAmount.wmul(squeethEthPrice))
    const wethLimitPrice = ethUsdPrice // TODO: use quoter and switch on deposit case or pass in as input
        
  } else {
    const crabAmount = oSQTHAuctionAmount.wmul(crabTotalSupply).wdiv(strategyDebt)
    // Withdrawing from crab so auction buys oSQTH
    const wethTargetInEuler = strategyCollateral.sub(strategyDebt.wmul(squeethEthPrice)).add(loanCollat).sub(loanDebt.div(ethUsdPrice)).sub(oSQTHAuctionAmount.wmul(clearingPrice)).add(oSQTHAuctionAmount.wmul(squeethEthPrice))
    const wethLimitPrice = ethUsdPrice // TODO: use quoter and switch on deposit case or pass in as input
    }

  return {crabAmount, wethTargetInEuler, wethLimitPrice}

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
