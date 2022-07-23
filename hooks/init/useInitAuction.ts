import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import React from 'react'
import useCrabV2Store from '../../store/crabV2Store'
import { Auction } from '../../types'
import { db } from '../../utils/firebase'

const useInitAuction = (isAdmin: boolean) => {
  const setAuction = useCrabV2Store(s => s.setAuction)
  const setAuctionLoading = useCrabV2Store(s => s.setAuctionLoading)
  const setIsHistoricalView = useCrabV2Store(s => s.setIsHistoricalView)

  React.useEffect(() => {
    const unSubscribe = onSnapshot(doc(db, 'auction', 'current'), d => {
      setAuctionLoading(false)
      if (d.exists()) {
        const auction = d.data() as Auction
        if (auction.auctionEnd === 0 && !isAdmin) {
          console.log('Hereee')
          const _previousDoc = doc(db, 'auction', `${auction.currentAuctionId - 1}`)
          getDoc(_previousDoc).then(pd => {
            if (pd.exists()) {
              setAuction(pd.data() as Auction)
              console.log('Inside the init auction ')
              setIsHistoricalView(true)
            }
          })
        } else {
          setAuction(auction)
          console.log(auction)
          setIsHistoricalView(false)
        }
      }
    })

    return unSubscribe
  }, [isAdmin, setAuction, setAuctionLoading, setIsHistoricalView])
}

export default useInitAuction
