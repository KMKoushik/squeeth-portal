import { describe, expect, test } from '@jest/globals'
import { BigNumber, Contract } from 'ethers'
import { QUOTER } from '../../constants/address'
import { BIG_ONE, DEFAULT_SLIPPAGE, WETH_DECIMALS_DIFF } from '../../constants/numbers'
import { Quoter } from '../../types/contracts'
import quoterAbi from '../../abis/quoter.json'
import { getLeverageRebalanceDetails } from '../../utils/calmBull'
import * as quoterFns from '../../utils/quoter'
import '../../utils/math'

const quoter = new Contract(QUOTER, quoterAbi) as Quoter

describe('CalmBull: Leverage Rebalance', () => {
  const crabBalance = BIG_ONE.mul(200)
  const loanCollat = BIG_ONE.mul(200)
  const loanDebt = BIG_ONE.mul(100_000).div(WETH_DECIMALS_DIFF)
  const crUpper = BigNumber.from('3000000') // 3
  const crLower = BigNumber.from('1200000') // 1.2
  const deltaUpper = BIG_ONE.mul(12).div(10) // 1.2
  const deltaLower = BIG_ONE.mul(9).div(10) //.9

  function mockQuoterFunctions(ethPrice: BigNumber) {
    jest
      .spyOn(quoterFns, 'quoteExactIn')
      .mockImplementation((quoter: Quoter, tokenIn: string, tokenOut: string, amountIn: BigNumber, poolFee: number) => {
        return Promise.resolve(amountIn.wdiv(ethPrice))
      })

    jest
      .spyOn(quoterFns, 'quoteExactOut')
      .mockImplementation(
        (quoter: Quoter, tokenIn: string, tokenOut: string, amountOut: BigNumber, poolFee: number) => {
          return Promise.resolve(amountOut.wdiv(ethPrice))
        },
      )
  }

  /**
   * Initial values
   * ETH price = 1000
   * crabPrice = 500
   * sqth price = .1
   * CR = 2
   * delta = 1
   */
  test('Rebalance when ETH price go down', async () => {
    const ethPrice = BIG_ONE.mul(800).div(WETH_DECIMALS_DIFF)
    const crabUsdPrice = BIG_ONE.mul(480)

    mockQuoterFunctions(ethPrice)

    const { isRebalPossible, isSellingUsdc, usdcAmount, delta, cr } = await getLeverageRebalanceDetails({
      quoter,
      crabUsdPrice,
      ethUsdPrice: ethPrice,
      loanCollat,
      loanDebt,
      crabBalance,
      crLower,
      crUpper,
      deltaLower,
      deltaUpper,
      slippage: DEFAULT_SLIPPAGE,
    })

    expect(isRebalPossible).toBe(true)
    expect(isSellingUsdc).toBe(false)
    expect(usdcAmount.toString()).toBe('4000000000') // 4000 USDC
    expect(delta.toString()).toBe(BIG_ONE.toString())
    expect(cr.toString()).toBe('1625000')
  })

  test('Rebalance when ETH price go up', async () => {
    const ethPrice = BIG_ONE.mul(1200).div(WETH_DECIMALS_DIFF)
    const crabUsdPrice = BIG_ONE.mul(510)
    mockQuoterFunctions(ethPrice)

    const { isRebalPossible, isSellingUsdc, usdcAmount, delta, cr } = await getLeverageRebalanceDetails({
      quoter,
      crabUsdPrice,
      ethUsdPrice: ethPrice,
      loanCollat,
      loanDebt,
      crabBalance,
      crLower,
      crUpper,
      deltaLower,
      deltaUpper,
      slippage: DEFAULT_SLIPPAGE,
    })

    expect(isRebalPossible).toBe(true)
    expect(isSellingUsdc).toBe(true)
    expect(usdcAmount.toString()).toBe('2000000000')
    expect(delta.toString()).toBe(BIG_ONE.toString())
    expect(cr.toString()).toBe('2372549')
  })

  test('Rebalance should if CR is higher than limit', async () => {
    const ethPrice = BIG_ONE.mul(1200).div(WETH_DECIMALS_DIFF)
    const crabUsdPrice = BIG_ONE.mul(300)
    mockQuoterFunctions(ethPrice)

    const { isRebalPossible, isSellingUsdc, usdcAmount, delta, cr } = await getLeverageRebalanceDetails({
      quoter,
      crabUsdPrice,
      ethUsdPrice: ethPrice,
      loanCollat,
      loanDebt,
      crabBalance,
      crLower,
      crUpper,
      deltaLower,
      deltaUpper,
      slippage: DEFAULT_SLIPPAGE,
    })

    expect(isRebalPossible).toBe(false)
  })

  test('Rebalance should if CR is lower than limit', async () => {
    const ethPrice = BIG_ONE.mul(800).div(WETH_DECIMALS_DIFF)
    const crabUsdPrice = BIG_ONE.mul(1600)
    mockQuoterFunctions(ethPrice)

    const { isRebalPossible, delta, cr } = await getLeverageRebalanceDetails({
      quoter,
      crabUsdPrice,
      ethUsdPrice: ethPrice,
      loanCollat,
      loanDebt,
      crabBalance,
      crLower,
      crUpper,
      deltaLower,
      deltaUpper,
      slippage: DEFAULT_SLIPPAGE,
    })

    expect(isRebalPossible).toBe(false)
  })
})
