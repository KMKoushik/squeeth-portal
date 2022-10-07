import { CrabOTC, CrabOTCWithData } from '../types'
import create from 'zustand'

interface CrabOTCStore {
  otcLoading: boolean
  userOTC: CrabOTCWithData | null
  setOtcLoading: (loading: boolean) => void
  setUserOTC: (otcs: CrabOTCWithData | null) => void
}

export const useCrabOTCStore = create<CrabOTCStore>((set, get) => ({
  otcLoading: true,
  userOTC: null,
  setOtcLoading: loading => set({ otcLoading: loading }),
  setUserOTC: otc => set({ userOTC: otc }),
}))
