import { collection, doc, limit, onSnapshot, query, where } from 'firebase/firestore'
import React from 'react'
import useAccountStore from '../../store/accountStore'
import { useCrabOTCStore } from '../../store/crabOTCStore'
import { CrabOTC, CrabOtcType, CrabOTCWithData } from '../../types'
import { sortBidsForBidArray } from '../../utils/crabotc'
import { db } from '../../utils/firebase'

export const useInitCrabOTC = () => {
  const address = useAccountStore(s => s.address)
  const setOtcLoading = useCrabOTCStore(s => s.setOtcLoading)
  const setUserOTC = useCrabOTCStore(s => s.setUserOTC)

  React.useEffect(() => {
    if (!address) return
    const q = query(collection(db, 'crabotc'), where('createdBy', '==', address), where('tx', '==', ''), limit(1))
    const unsubscribe = onSnapshot(q, querySnapshot => {
      if (querySnapshot.docs.length) {
        fetch(`/api/crabotc/getCrabOTCById?id=${querySnapshot.docs[0].id}`).then(async resp => {
          const otc = (await resp.json()) as CrabOTCWithData
          otc.data.sortedBids = sortBidsForBidArray(Object.values(otc.data.bids), otc.data.type == CrabOtcType.DEPOSIT ? true : false)
          setUserOTC(otc)
          setOtcLoading(false)
        })
      } else {
        setUserOTC(null)
        setOtcLoading(false)
      }
    })

    return unsubscribe
  }, [address, setOtcLoading, setUserOTC])
}
