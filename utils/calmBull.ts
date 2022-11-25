import { BigNumber } from 'ethers'
import { USDC, WETH } from '../constants/address'
import { ETH_USDC_FEE, WETH_DECIMALS_DIFF } from '../constants/numbers'
import { Quoter } from '../types/contracts'
import { wdiv, wmul } from './math'

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
  } = params

  const usdcDebtTarget = wmul(crabUsdPrice, crabBalance).div(WETH_DECIMALS_DIFF)
  const isSellingUsdc = usdcDebtTarget.gt(loanDebt) ? true : false
  const usdcAmount = isSellingUsdc ? usdcDebtTarget.sub(loanDebt) : loanDebt.sub(usdcDebtTarget)
  const wethAmount = await getEthAmountToLeverageRebalance(usdcAmount, isSellingUsdc, quoter)

  const limitPrice = wdiv(usdcAmount.mul(WETH_DECIMALS_DIFF), wethAmount)

  const { delta: deltaNew, cr: crNew } = getDeltaAndCollat({
    crabUsdPrice,
    crabBalance,
    ethUsdPrice,
    loanCollat: isSellingUsdc ? loanCollat.add(wethAmount) : loanCollat.sub(wethAmount),
    loanDebt: isSellingUsdc ? loanDebt.add(usdcAmount) : loanDebt.sub(usdcAmount),
  })

  const isRebalPossible = isDeltaAndCrValid(deltaNew, crNew, deltaUpper, deltaLower, crUpper, crLower)

  return { limitPrice, usdcAmount, isSellingUsdc, isRebalPossible }
}

async function getEthAmountToLeverageRebalance(usdcAmount: BigNumber, isSelling: boolean, quoter: Quoter) {
  if (isSelling) {
    const { amountOut: wethAmount } = await quoter.callStatic.quoteExactInputSingle({
      tokenIn: USDC,
      tokenOut: WETH,
      amountIn: usdcAmount,
      fee: ETH_USDC_FEE,
      sqrtPriceLimitX96: 0,
    })

    return wethAmount
  } else {
    const { amountIn: wethAmount } = await quoter.callStatic.quoteExactOutputSingle({
      tokenIn: WETH,
      tokenOut: USDC,
      amount: usdcAmount,
      fee: ETH_USDC_FEE,
      sqrtPriceLimitX96: 0,
    })

    return wethAmount
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
  return delta.gt(deltaUpper) || delta.lt(deltaLower) || cr.gt(crUpper) || cr.lt(crLower)
}
