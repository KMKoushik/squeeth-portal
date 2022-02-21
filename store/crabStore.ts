import { BigNumber } from 'ethers'
import create from 'zustand'
import { BIG_ZERO } from '../constants/numbers'

interface CrabState {
  loaded: boolean
  timeAtLastHedge: number
  priceAtLastHedge: BigNumber
  hedgeTimeThreshold: number
  hedgePriceThreshold: BigNumber
  isTimeHedgeAvailable: boolean
  auctionTriggerTime: number
  setLoaded: (l: boolean) => void
  setTimeAtLastHedge: (time: number) => void
  setPriceAtLastHedge: (price: BigNumber) => void
  setHedgeTimeThreshold: (threshold: number) => void
  setHedgePriceThreshold: (threshold: BigNumber) => void
  setIsTimeHedgeAvailable: (isAvailable: boolean) => void
  setAuctionTriggerTime: (auctionTriggerTime: number) => void
}

const useCrabStore = create<CrabState>(set => ({
  loaded: false,
  timeAtLastHedge: 0,
  priceAtLastHedge: BIG_ZERO,
  hedgeTimeThreshold: 0,
  hedgePriceThreshold: BIG_ZERO,
  isTimeHedgeAvailable: false,
  auctionTriggerTime: 0,
  setLoaded: l => set({ loaded: l }),
  setTimeAtLastHedge: (time: number) => set({ timeAtLastHedge: time }),
  setPriceAtLastHedge: (price: BigNumber) => set({ priceAtLastHedge: price }),
  setHedgeTimeThreshold: (threshold: number) => set({ hedgeTimeThreshold: threshold }),
  setHedgePriceThreshold: (threshold: BigNumber) => set({ hedgePriceThreshold: threshold }),
  setIsTimeHedgeAvailable: (isAvailable: boolean) => set({ isTimeHedgeAvailable: isAvailable }),
  setAuctionTriggerTime: auctionTriggerTime => set({ auctionTriggerTime }),
}))

export default useCrabStore
