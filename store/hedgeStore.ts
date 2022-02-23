import create from 'zustand'
import { HedgeType } from '../types'

interface HedgeStore {
  type: HedgeType
  isApprovalNeeded: boolean
  isApproved: boolean
  txLoading: boolean
  setHedgeType: (type: HedgeType) => void
  setIsApprovalNeeded: (isApprove: boolean) => void
  setIsApproved: (isApproved: boolean) => void
  setTxLoading: (txLoading: boolean) => void
}

const useHedgeStore = create<HedgeStore>(set => ({
  type: HedgeType.TIME_HEDGE,
  isApprovalNeeded: false,
  isApproved: false,
  txLoading: false,
  setHedgeType: type => set({ type }),
  setIsApprovalNeeded: isApprovalNeeded => set({ isApprovalNeeded }),
  setIsApproved: isApproved => set({ isApproved }),
  setTxLoading: txLoading => set({ txLoading }),
}))

export default useHedgeStore
