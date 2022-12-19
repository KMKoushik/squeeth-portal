import { BigNumber } from 'ethers'
import { BIG_ONE, BIG_ZERO, DEFAULT_SLIPPAGE, ETH_USDC_FEE } from '../constants/numbers'
import { useCalmBullStore } from '../store/calmBullStore'
import useCrabV2Store from '../store/crabV2Store'
import usePriceStore from '../store/priceStore'
import { bnComparator } from '../utils'
import { getAuctionDetails, getFullRebalanceDetails } from '../utils/calmBull'
import useQuoter from './useQuoter'

export const useBullAuction = () => {
  const loanCollat = useCalmBullStore(s => s.loanCollat, bnComparator)
  const loanDebt = useCalmBullStore(s => s.loanDebt, bnComparator)
  const crabBalance = useCalmBullStore(s => s.crabBalance, bnComparator)
  const isReady = useCalmBullStore(s => s.isReady)

  const crabUsdPrice = useCrabV2Store(s => s.crabUsdcValue, bnComparator)
  const vault = useCrabV2Store(s => s.vault)
  const crabTotalSupply = useCrabV2Store(s => s.totalSupply)
  const { ethPrice, oSqthPrice } = usePriceStore(s => ({ ethPrice: s.ethPrice, oSqthPrice: s.oSqthPrice }))

  const quoter = useQuoter()

  async function getBullAuctionDetails() {
    if (!vault || !isReady || crabUsdPrice.isZero())
      return {
        crabToTrade: BIG_ZERO,
        oSQTHAuctionAmount: BIG_ZERO,
        isDepositingIntoCrab: false,
      }

    return getAuctionDetails({
      crabUsdPrice,
      squeethEthPrice: oSqthPrice,
      loanCollat,
      loanDebt,
      crabBalance,
      squeethInCrab: vault?.shortAmount,
      ethInCrab: vault?.collateral,
      crabTotalSupply,
      ethUsdPrice: ethPrice,
      targetCr: BIG_ONE.mul(2),
      feeRate: BIG_ZERO,
    })
  }

  async function getRebalanceDetails(oSqthAmount: BigNumber, isDepositingIntoCrab: boolean, clearingPrice: BigNumber) {
    if (!vault || !isReady) return { crabAmount: BIG_ZERO, wethTargetInEuler: BIG_ZERO, wethLimitPrice: BIG_ZERO }

    return getFullRebalanceDetails({
      oSQTHAuctionAmount: oSqthAmount,
      isDepositingIntoCrab,
      loanCollat,
      loanDebt,
      crabBalance,
      squeethInCrab: vault?.shortAmount,
      ethInCrab: vault?.collateral,
      crabTotalSupply,
      ethUsdPrice: ethPrice,
      crabUsdPrice,
      squeethEthPrice: oSqthPrice,
      clearingPrice,
      feeRate: BIG_ZERO,
      quoter,
      slippageTolerance: DEFAULT_SLIPPAGE,
    })
  }

  return {
    getBullAuctionDetails,
    getRebalanceDetails,
  }
}
