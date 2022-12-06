import { BigNumber } from 'ethers'
import { USDC, WETH } from '../constants/address'
import { DEFAULT_SLIPPAGE, ETH_USDC_FEE } from '../constants/numbers'
import { ERC20, Quoter } from '../types/contracts'

export async function quoteExactIn(
  quoter: Quoter,
  tokenIn: string,
  tokenOut: string,
  amountIn: BigNumber,
  poolFee: number,
  slippage = DEFAULT_SLIPPAGE,
) {
  const { amountOut } = await quoter.callStatic.quoteExactInputSingle({
    tokenIn,
    tokenOut,
    amountIn: amountIn,
    fee: poolFee,
    sqrtPriceLimitX96: 0,
  })
  console.log('Amount out', amountOut.toString())

  return amountOut.mul(100 * (100 - slippage)).div(10000) // Include slippage
}

export async function quoteExactOut(
  quoter: Quoter,
  tokenIn: string,
  tokenOut: string,
  amountOut: BigNumber,
  poolFee: number,
  slippage = DEFAULT_SLIPPAGE,
) {
  const { amountIn } = await quoter.callStatic.quoteExactOutputSingle({
    tokenIn,
    tokenOut,
    amount: amountOut,
    fee: poolFee,
    sqrtPriceLimitX96: 0,
  })

  return amountIn.mul(100 * (100 + slippage)).div(10000) // Include slippage
}
