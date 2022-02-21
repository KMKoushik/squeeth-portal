import { BigNumber } from 'ethers'
import create from 'zustand'
import { BIG_ZERO } from '../constants/numbers'

interface ControllerState {
  loaded: boolean
  normFactor: BigNumber
  indexPrice: BigNumber
  markPrice: BigNumber
  setNormFactor: (nf: BigNumber) => void
  setLoaded: (l: boolean) => void
  setIndexPrice: (i: BigNumber) => void
  setMarkPrice: (m: BigNumber) => void
}

const useControllerStore = create<ControllerState>(set => ({
  loaded: false,
  normFactor: BIG_ZERO,
  indexPrice: BIG_ZERO,
  markPrice: BIG_ZERO,
  setNormFactor: nf => set({ normFactor: nf }),
  setLoaded: l => set({ loaded: l }),
  setIndexPrice: i => set({ indexPrice: i }),
  setMarkPrice: m => set({ markPrice: m }),
}))

export default useControllerStore
