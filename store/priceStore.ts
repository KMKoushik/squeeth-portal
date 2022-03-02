import { BigNumber } from 'ethers'
import create from 'zustand'
import { BIG_ZERO } from '../constants/numbers'

interface PriceState {
  ethPrice: BigNumber
  oSqthPrice: BigNumber
  setEthPrice: (p: BigNumber) => void
  setOsqthPrice: (p: BigNumber) => void
}

const usePriceStore = create<PriceState>(set => ({
  ethPrice: BIG_ZERO,
  oSqthPrice: BIG_ZERO,
  setEthPrice: p => set({ ethPrice: p }),
  setOsqthPrice: p => set({ oSqthPrice: p }),
}))

export default usePriceStore
