import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'
import React from 'react'
import useAccountStore from '../../store/accountStore'
import { useCrabOTCStore } from '../../store/crabOTCStore'
import { CrabOTC } from '../../types'
import { db } from '../../utils/firebase'

export const useInitCrabOTC = () => {
  const address = useAccountStore(s => s.address)
  const setOtcLoading = useCrabOTCStore(s => s.setOtcLoading)
  const setUserOTCs = useCrabOTCStore(s => s.setUserOTCs)

  React.useEffect(() => {
    if (!address) return
    const q = query(collection(db, 'crabotc'), where('createdBy', '==', address))
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const _otcs: Array<CrabOTC> = []
      querySnapshot.forEach(doc => {
        _otcs.push({ ...doc.data(), id: doc.id } as CrabOTC)
      })
      setUserOTCs(_otcs)
      setOtcLoading(false)
    })

    return unsubscribe
  }, [address, setOtcLoading, setUserOTCs])
}
