import React from 'react'
import shallow from 'zustand/shallow'
import { getStrikeCount, updateStrikeCount } from '../apis/strikeCount'

import useAccountStore from '../store/accountStore'

const useHandleStrikeCount = () => {
  const { address, isRestricted, setIsBlocked, setStrikeCount, setIsStrikeCountModalOpen } = useAccountStore(
    s => ({
      address: s.address,
      isRestricted: s.isRestricted,
      setIsBlocked: s.setIsBlocked,
      setStrikeCount: s.setStrikeCount,
      setIsStrikeCountModalOpen: s.setIsStrikeCountModalOpen,
    }),
    shallow,
  )

  React.useEffect(() => {
    if (!address) {
      return
    }

    getStrikeCount(address).then(visitCount => {
      setStrikeCount(visitCount)

      if (visitCount >= 3) {
        setIsBlocked(true)
      }
    })
  }, [address])

  // increment strike count if user is restricted
  React.useEffect(() => {
    // address should be there, and user should be restricted
    if (!address || !isRestricted) {
      return
    }

    updateStrikeCount(address).then(visitCount => {
      setStrikeCount(visitCount)

      if (visitCount >= 3) {
        setIsBlocked(true)
      }

      // show strike count modal after updating strike count
      setIsStrikeCountModalOpen(true)
    })
  }, [address, isRestricted])
}

export default useHandleStrikeCount
