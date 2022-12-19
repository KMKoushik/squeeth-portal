import { BigNumber } from 'ethers'
import { useCallback, useEffect, useState } from 'react'
import shallow from 'zustand/shallow'
import { BIG_ZERO } from '../constants/numbers'
import { useCalmBullStore } from '../store/calmBullStore'
import { useCrabNettingStore } from '../store/crabNettingStore'
import useCrabV2Store from '../store/crabV2Store'
import usePriceStore from '../store/priceStore'
import { AuctionStatus, AuctionType } from '../types'
import { bnComparator } from '../utils'
import { estimateAuction as estimateCrabAuction, getAuctionStatus } from '../utils/auction'
import { getWsqueethFromCrabAmount } from '../utils/crab'
import { calculateTotalDeposit } from '../utils/crabNetting'
import { convertBigNumber, convertBigNumberStr, toBigNumber } from '../utils/math'
import { useBullAuction } from './useBullAuction'
import useQuoter from './useQuoter'

export const useAuctionEstimate = () => {
  const auction = useCrabV2Store(s => s.auction)
  const oSqthPrice = usePriceStore(s => s.oSqthPrice, bnComparator)
  const vault = useCrabV2Store(s => s.vault, shallow)
  const usdcDeposits = useCrabNettingStore(s => s.depositQueued, bnComparator)
  const crabDeposits = useCrabNettingStore(s => s.withdrawQueued, bnComparator)
  const crabUsdcPrice = useCrabV2Store(s => s.crabUsdcValue, bnComparator)
  const totalSupply = useCrabV2Store(s => s.totalSupply, bnComparator)
  const quoter = useQuoter()
  const bullDelta = useCalmBullStore(s => s.delta, bnComparator)

  const [osqthEstimate, setOsqthEstimate] = useState(BIG_ZERO)
  const [isSelling, setIsSelling] = useState(false)
  const [delta, setDelta] = useState(BIG_ZERO)

  const { getBullAuctionDetails } = useBullAuction()

  const estimateAuctions = useCallback(async () => {
    const auctionStatus = getAuctionStatus(auction)
    if (!vault || oSqthPrice.isZero() || auctionStatus !== AuctionStatus.UPCOMING) return
    console.log('Hello')

    let _isSelling = false
    let _osqthEstimate = BIG_ZERO
    let _delta = BIG_ZERO
    if (auction.type === AuctionType.CRAB_HEDGE) {
      const { isSellingAuction, oSqthAmount, delta } = estimateCrabAuction(
        vault?.shortAmount,
        vault?.collateral,
        oSqthPrice,
      )
      _isSelling = isSellingAuction
      _osqthEstimate = oSqthAmount
      _delta = delta
    } else if (auction.type === AuctionType.NETTING) {
      const isUSDCHigher = convertBigNumber(usdcDeposits, 6) > convertBigNumber(crabDeposits.wmul(crabUsdcPrice), 18)
      if (isUSDCHigher) {
        const { sqthToMint } = await calculateTotalDeposit(quoter, usdcDeposits, oSqthPrice, vault)
        _osqthEstimate = sqthToMint
      } else {
        const osqthToBuy = getWsqueethFromCrabAmount(crabDeposits, vault, totalSupply)
        _osqthEstimate = osqthToBuy
      }
      _isSelling = isUSDCHigher
    } else if (auction.type === AuctionType.CALM_BULL) {
      const { oSQTHAuctionAmount, isDepositingIntoCrab } = await getBullAuctionDetails()
      _osqthEstimate = oSQTHAuctionAmount
      _isSelling = isDepositingIntoCrab
      _delta = bullDelta
    }

    setIsSelling(_isSelling)
    setOsqthEstimate(_osqthEstimate)
    setDelta(_delta)
  }, [auction.type, crabDeposits, crabUsdcPrice, oSqthPrice, quoter, totalSupply, usdcDeposits, vault])

  useEffect(() => {
    estimateAuctions()
  }, [estimateAuctions])

  return { osqthEstimate, isSelling, delta }
}
