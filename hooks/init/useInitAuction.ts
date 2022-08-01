import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import React from 'react'
import useCrabV2Store from '../../store/crabV2Store'
import { Auction } from '../../types'
import { sortBids } from '../../utils/auction'
import { db } from '../../utils/firebase'

const useInitAuction = (isAdmin: boolean) => {
  const setAuction = useCrabV2Store(s => s.setAuction)
  const setAuctionLoading = useCrabV2Store(s => s.setAuctionLoading)
  const setIsHistoricalView = useCrabV2Store(s => s.setIsHistoricalView)
  const setSortedBids = useCrabV2Store(s => s.setSortedBids)

  React.useEffect(() => {
    const unSubscribe = onSnapshot(doc(db, 'auction', 'current'), d => {
      setAuctionLoading(false)
      if (d.exists()) {
        const auction = d.data() as Auction
        if (auction.auctionEnd === 0 && !isAdmin) {
          const _previousDoc = doc(db, 'auction', `${auction.currentAuctionId - 1}`)
          getDoc(_previousDoc).then(pd => {
            if (pd.exists()) {
              const _oldAuction = pd.data() as Auction
              setAuction(_oldAuction)
              setIsHistoricalView(true)
              setSortedBids(sortBids(_oldAuction))
            }
          })
        } else {
          setAuction(auction)
          setIsHistoricalView(false)
          setSortedBids(sortBids(auction))
        }
      }
    })

    return unSubscribe
  }, [isAdmin, setAuction, setAuctionLoading, setIsHistoricalView, setSortedBids])
}

export default useInitAuction
