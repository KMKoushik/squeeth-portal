import { BigNumber } from 'ethers'
import { USDC, WETH } from '../constants/address'
import { DEFAULT_SLIPPAGE, ETH_USDC_FEE } from '../constants/numbers'
import { ERC20, Quoter } from '../types/contracts'

export async function convertWETHToEth(quoter: Quoter, wethAmount: BigNumber, slippage = DEFAULT_SLIPPAGE) {
  const { amountOut } = await quoter.callStatic.quoteExactInputSingle({
    tokenIn: WETH,
    tokenOut: USDC,
    amountIn: wethAmount,
    fee: ETH_USDC_FEE,
    sqrtPriceLimitX96: 0,
  })

  return amountOut.mul(100 * (100 - slippage)).div(10000) // Include slippage
}

export async function getBalance(erc20: ERC20, address: string) {
  const balance = erc20.balanceOf(address)

  return balance
}
