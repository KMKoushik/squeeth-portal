import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import React from 'react'
import useCrabV2Store from '../../store/crabV2Store'
import { Auction, AuctionType } from '../../types'
import { getEstimatedClearingPrice, sortBids, AUCTION_COLLECTION } from '../../utils/auction'
import { db } from '../../utils/firebase'

function getAuction(auction: Auction) {
  return { ...auction, type: auction.type || AuctionType.CRAB_HEDGE }
}

const useInitAuction = (isAdmin: boolean) => {
  const setAuction = useCrabV2Store(s => s.setAuction)
  const setAuctionLoading = useCrabV2Store(s => s.setAuctionLoading)
  const setIsHistoricalView = useCrabV2Store(s => s.setIsHistoricalView)
  const setSortedBids = useCrabV2Store(s => s.setSortedBids)
  const setEstClearingPrice = useCrabV2Store(s => s.setEstClearingPrice)

  React.useEffect(() => {
    const unSubscribe = onSnapshot(doc(db, AUCTION_COLLECTION, 'current'), d => {
      if (d.exists()) {
        const auction = getAuction(d.data() as Auction)
        if (auction.auctionEnd === 0 && !isAdmin) {
          const _previousDoc = doc(db, AUCTION_COLLECTION, `${auction.currentAuctionId - 1}`)
          getDoc(_previousDoc).then(pd => {
            if (pd.exists()) {
              const _oldAuction = getAuction(pd.data() as Auction)
              setAuction(_oldAuction)
              setIsHistoricalView(true)
              setSortedBids(sortBids(_oldAuction))
              setAuctionLoading(false)
            }
          })
        } else {
          setAuction(auction)
          setIsHistoricalView(false)
          const _sortedBids = sortBids(auction)
          setSortedBids(_sortedBids)
          setEstClearingPrice(getEstimatedClearingPrice(_sortedBids, auction.oSqthAmount))
          setAuctionLoading(false)
        }
      }
    })

    return unSubscribe
  }, [isAdmin, setAuction, setAuctionLoading, setEstClearingPrice, setIsHistoricalView, setSortedBids])
}

export default useInitAuction
