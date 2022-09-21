import { CrabOTC } from '../types'
import create from 'zustand'

interface CrabOTCStore {
  otcLoading: boolean
  userOTCs: CrabOTC[]
  setOtcLoading: (loading: boolean) => void
  setUserOTCs: (otcs: CrabOTC[]) => void
}

export const useCrabOTCStore = create<CrabOTCStore>((set, get) => ({
  otcLoading: true,
  userOTCs: [],
  setOtcLoading: loading => set({ otcLoading: loading }),
  setUserOTCs: otcs => set({ userOTCs: otcs }),
}))
