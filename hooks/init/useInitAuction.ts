import { doc, onSnapshot } from 'firebase/firestore'
import React from 'react'
import useCrabV2Store from '../../store/crabV2Store'
import { Auction } from '../../types'
import { db } from '../../utils/firebase'

const useInitAuction = () => {
  const setAuction = useCrabV2Store(s => s.setAuction)
  const setAuctionLoading = useCrabV2Store(s => s.setAuctionLoading)

  React.useEffect(() => {
    const unSubscribe = onSnapshot(doc(db, 'auction', 'current'), d => {
      setAuctionLoading(false)
      if (d.exists()) {
        setAuction(d.data() as Auction)
      }
    })

    return unSubscribe
  }, [setAuction, setAuctionLoading])
}

export default useInitAuction
