import { describe, expect, test } from '@jest/globals'
import { BigNumber, Contract } from 'ethers'
import { QUOTER, USDC, WETH } from '../../constants/address'
import { BIG_ONE, BIG_ZERO, DEFAULT_SLIPPAGE, WETH_DECIMALS_DIFF } from '../../constants/numbers'
import { Quoter } from '../../types/contracts'
import quoterAbi from '../../abis/quoter.json'
import { getAuctionDetails, getFullRebalanceDetails, getLeverageRebalanceDetails, getAuctionOutcomes } from '../../utils/calmBull'
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
  test('Rebalance when crab price go down', async () => {
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

  test('Rebalance when crab price go up', async () => {
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

  test('Should not rebalance if CR is higher than limit', async () => {
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

  test('Should not rebalance if CR is lower than limit', async () => {
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

describe('CalmBull: Full Rebalance', () => {
  const crabBalance = BIG_ONE.mul(200)
  const loanCollat = BIG_ONE.mul(200)
  const loanDebt = BIG_ONE.mul(100_000).div(WETH_DECIMALS_DIFF)
  const squeethInCrab = BIG_ONE.mul(5_000)
  const ethInCrab = BIG_ONE.mul(1000)
  const crabTotalSupply = BIG_ONE.mul(1000)
  const targetCr = BIG_ONE.mul(2) // 2
  const feeRate = BIG_ONE.mul(0) // minting fee]
  // const slippageTolerance = BIG_ONE.mul()

  function mockQuoterFunctions(ethPrice: BigNumber) {
    jest
      .spyOn(quoterFns, 'quoteExactIn')
      .mockImplementation((quoter: Quoter, tokenIn: string, tokenOut: string, amountIn: BigNumber, poolFee: number) => {
        if (tokenIn === USDC) {
          return Promise.resolve(amountIn.wdiv(ethPrice))
        } else if (tokenIn === WETH) {
          return Promise.resolve(amountIn.wmul(ethPrice).div(WETH_DECIMALS_DIFF))
        }

        return Promise.resolve(BIG_ZERO)
      })

    jest
      .spyOn(quoterFns, 'quoteExactOut')
      .mockImplementation(
        (quoter: Quoter, tokenIn: string, tokenOut: string, amountOut: BigNumber, poolFee: number) => {
          if (tokenOut === USDC) {
            return Promise.resolve(amountOut.wdiv(ethPrice))
          } else if (tokenOut === WETH) {
            return Promise.resolve(amountOut.wmul(ethPrice).div(WETH_DECIMALS_DIFF))
          }

          return Promise.resolve(BIG_ZERO)
        },
      )
  }

  /**
   * Eth down 20%
   * Squeeth down 20%
   */
  test('Full rebalance when ETH price go down', async () => {
    const ethUsdPrice = BIG_ONE.mul(800)
    const squeethEthPrice = BIG_ONE.mul(BigNumber.from(8)).div(100)
    const crabUsdPrice = BIG_ONE.mul(480)

    mockQuoterFunctions(ethUsdPrice)

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

    expect(crabToTrade.toString()).toBe('37500000000000000000')
    expect(oSQTHAuctionAmount.toString()).toBe('187500000000000000000')
    expect(isDepositingIntoCrab).toBe(false)

    const clearingPrice = BIG_ONE.mul(BigNumber.from(8)).div(100)

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
      clearingPrice,
      feeRate,
      quoter,
      slippageTolerance: DEFAULT_SLIPPAGE,
    })
    expect(crabAmount.toString()).toBe('37500000000000000000')
    expect(wethTargetInEuler.toString()).toBe('195000000000000000000')
  })

  /**
   * Eth up 20%
   * Squeeth up 20%
   */
  test('Full rebalance when ETH price go up', async () => {
    const ethUsdPrice = BIG_ONE.mul(1200)
    const crabUsdPrice = BIG_ONE.mul(480)
    const squeethEthPrice = BIG_ONE.mul(BigNumber.from(8)).div(100)

    mockQuoterFunctions(ethUsdPrice)

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

    expect(crabToTrade.toString()).toBe('45833332916666666666')
    expect(oSQTHAuctionAmount.toString()).toBe('229166664583333333330')
    expect(isDepositingIntoCrab).toBe(true)

    const clearingPrice = BIG_ONE.mul(BigNumber.from(8)).div(100)

    const { crabAmount, wethTargetInEuler, wethLimitPrice } = await getFullRebalanceDetails({
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
      slippageTolerance: DEFAULT_SLIPPAGE,
    })
    expect(crabAmount.toString()).toBe('45833332916666666666')
    expect(wethTargetInEuler.toString()).toBe('196666667000000000000')
  })

  //4
  test('testFullRebalanceDepositCrabDecreaseEthBorrowUsdc', async () => {
    const ethUsdPrice = BIG_ONE.mul(1200)
    const squeethEthPrice = BIG_ONE.mul(BigNumber.from(10)).div(100)
    const crabUsdPrice = BIG_ONE.mul(500);

    const loanCollat = BIG_ONE.mul(200)

    mockQuoterFunctions(ethUsdPrice)

    const { isIncreaseWeth, isBorrowUsdc, isDepositingIntoCrab } = await getAuctionOutcomes({
      crabUsdPrice,
      squeethEthPrice,
      loanCollat ,
      loanDebt,
      crabBalance,
      squeethInCrab,
      ethInCrab,
      crabTotalSupply,
      ethUsdPrice,
      targetCr,
      feeRate,
      quoter,
      slippageTolerance: DEFAULT_SLIPPAGE
    })
    // console.log('isDepositingIntoCrab', isDepositingIntoCrab.toString())
    // console.log('isIncreaseWeth', isIncreaseWeth.toString())
    // console.log('isBorrowUsdc', isBorrowUsdc.toString())

    expect(isDepositingIntoCrab).toBe(true)
    expect(isIncreaseWeth).toBe(false)
    expect(isBorrowUsdc).toBe(true)

   })

   //6
   test('testFullFullRebalanceWithdrawCrabIncreaseEthRepayUsdc', async () => {
    const ethUsdPrice = BIG_ONE.mul(800)
    const squeethEthPrice = BIG_ONE.mul(BigNumber.from(8)).div(480)
    const crabUsdPrice = BIG_ONE.mul(520);

    const loanCollat = BIG_ONE.mul(200)

    mockQuoterFunctions(ethUsdPrice)

    const { isIncreaseWeth, isBorrowUsdc, isDepositingIntoCrab } = await getAuctionOutcomes({
      crabUsdPrice,
      squeethEthPrice,
      loanCollat ,
      loanDebt,
      crabBalance,
      squeethInCrab,
      ethInCrab,
      crabTotalSupply,
      ethUsdPrice,
      targetCr,
      feeRate,
      quoter,
      slippageTolerance: DEFAULT_SLIPPAGE
    })

    expect(isDepositingIntoCrab).toBe(false)
    expect(isIncreaseWeth).toBe(true)
    expect(isBorrowUsdc).toBe(false)
   })


  //3
  test('testFullRebalanceWithdrawCrabDecreaseEthRepayUsdc', async () => {
    const ethUsdPrice = BIG_ONE.mul(800)
    const squeethEthPrice = BIG_ONE.mul(BigNumber.from(8)).div(100)
    const crabUsdPrice = BIG_ONE.mul(480);

    const loanCollat = BIG_ONE.mul(200)

    mockQuoterFunctions(ethUsdPrice)

    const { isIncreaseWeth, isBorrowUsdc, isDepositingIntoCrab } = await getAuctionOutcomes({
      crabUsdPrice,
      squeethEthPrice,
      loanCollat ,
      loanDebt,
      crabBalance,
      squeethInCrab,
      ethInCrab,
      crabTotalSupply,
      ethUsdPrice,
      targetCr,
      feeRate,
      quoter,
      slippageTolerance: DEFAULT_SLIPPAGE
    })

    console.log('isDepositingIntoCrab', isDepositingIntoCrab.toString())
    console.log('isIncreaseWeth', isIncreaseWeth.toString())
    console.log('isBorrowUsdc', isBorrowUsdc.toString())

    expect(isDepositingIntoCrab).toBe(false)
    expect(isIncreaseWeth).toBe(false)
    expect(isBorrowUsdc).toBe(false)

   })

   //5
   test('testFullRebalanceDepositCrabIncreaseEthBorrowUsdc', async () => {
    const ethUsdPrice = BIG_ONE.mul(1200)
    const squeethEthPrice = BIG_ONE.mul(BigNumber.from(8)).div(480)
    const crabUsdPrice = BIG_ONE.mul(520);

    const loanCollat = BIG_ONE.mul(200)
    // const ethInCrab = BIG_ONE.mul(1200)

    mockQuoterFunctions(ethUsdPrice)

    const { isIncreaseWeth, isBorrowUsdc, isDepositingIntoCrab } = await getAuctionOutcomes({
      crabUsdPrice,
      squeethEthPrice,
      loanCollat ,
      loanDebt,
      crabBalance,
      squeethInCrab,
      ethInCrab,
      crabTotalSupply,
      ethUsdPrice,
      targetCr,
      feeRate,
      quoter,
      slippageTolerance: DEFAULT_SLIPPAGE
    })

    expect(isDepositingIntoCrab).toBe(true)
    expect(isIncreaseWeth).toBe(true)
    expect(isBorrowUsdc).toBe(true)

   })

   //1
   test('testFullRebalanceDepositCrabDecreaseEthRepayUsdc', async () => {
    const ethUsdPrice = BIG_ONE.mul(800)
    const squeethEthPrice = BIG_ONE.mul(BigNumber.from(8)).div(480)
    const crabUsdPrice = BIG_ONE.mul(480);

    const loanCollat = BIG_ONE.mul(250)

    mockQuoterFunctions(ethUsdPrice)

    const { isIncreaseWeth, isBorrowUsdc, isDepositingIntoCrab } = await getAuctionOutcomes({
      crabUsdPrice,
      squeethEthPrice,
      loanCollat ,
      loanDebt,
      crabBalance,
      squeethInCrab,
      ethInCrab,
      crabTotalSupply,
      ethUsdPrice,
      targetCr,
      feeRate,
      quoter,
      slippageTolerance: DEFAULT_SLIPPAGE
    })

    expect(isDepositingIntoCrab).toBe(true)
    expect(isIncreaseWeth).toBe(false)
    expect(isBorrowUsdc).toBe(false)
   })

   //2
   test('testFullRebalanceWithdrawCrabIncreaseEthBorrrowUsdc', async () => {
    const ethUsdPrice = BIG_ONE.mul(800)
    const squeethEthPrice = BIG_ONE.mul(BigNumber.from(8)).div(480)
    const crabUsdPrice = BIG_ONE.mul(520);

    const loanCollat = BIG_ONE.mul(250)

    mockQuoterFunctions(ethUsdPrice)

    const { isIncreaseWeth, isBorrowUsdc, isDepositingIntoCrab } = await getAuctionOutcomes({
      crabUsdPrice,
      squeethEthPrice,
      loanCollat ,
      loanDebt,
      crabBalance,
      squeethInCrab,
      ethInCrab,
      crabTotalSupply,
      ethUsdPrice,
      targetCr,
      feeRate,
      quoter,
      slippageTolerance: DEFAULT_SLIPPAGE
    })

    expect(isDepositingIntoCrab).toBe(false)
    expect(isIncreaseWeth).toBe(true)
    expect(isBorrowUsdc).toBe(true)
   })

})
