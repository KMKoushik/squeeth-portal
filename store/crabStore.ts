import { BigNumber } from 'ethers'
import create from 'zustand'
import { BIG_ZERO } from '../constants/numbers'

export type AuctionDetail = {
  isSelling: boolean
  oSqthAmount: BigNumber
  ethProceeds: BigNumber
  auctionPrice: BigNumber
  isDirectionChanged: boolean
}

export type Vault = {
  operator: string
  collateralAmount: BigNumber
  shortAmount: BigNumber
}

interface CrabState {
  loaded: boolean
  timeAtLastHedge: number
  priceAtLastHedge: BigNumber
  hedgeTimeThreshold: number
  hedgePriceThreshold: BigNumber
  isTimeHedgeAvailable: boolean
  auctionTriggerTime: number
  auctionDetails: AuctionDetail
  vaultId: number
  deltaHedgeThreshold: BigNumber
  vault: Vault | null
  totalSupply: BigNumber
  setLoaded: (l: boolean) => void
  setTimeAtLastHedge: (time: number) => void
  setPriceAtLastHedge: (price: BigNumber) => void
  setHedgeTimeThreshold: (threshold: number) => void
  setHedgePriceThreshold: (threshold: BigNumber) => void
  setIsTimeHedgeAvailable: (isAvailable: boolean) => void
  setAuctionTriggerTime: (auctionTriggerTime: number) => void
  setAuctionDetails: (data: AuctionDetail) => void
  setVaultId: (id: number) => void
  setDeltaHedgeThreshold: (t: BigNumber) => void
  setCrabVault: (v: Vault) => void
  setTotalSupply: (t: BigNumber) => void
}

const useCrabStore = create<CrabState>(set => ({
  loaded: false,
  timeAtLastHedge: 0,
  priceAtLastHedge: BIG_ZERO,
  hedgeTimeThreshold: 0,
  hedgePriceThreshold: BIG_ZERO,
  isTimeHedgeAvailable: false,
  auctionTriggerTime: 0,
  auctionDetails: {
    isSelling: false,
    oSqthAmount: BIG_ZERO,
    ethProceeds: BIG_ZERO,
    auctionPrice: BIG_ZERO,
    isDirectionChanged: false,
  },
  vaultId: 0,
  deltaHedgeThreshold: BIG_ZERO,
  vault: null,
  totalSupply: BIG_ZERO,
  setLoaded: l => set({ loaded: l }),
  setTimeAtLastHedge: time => set({ timeAtLastHedge: time }),
  setPriceAtLastHedge: price => set({ priceAtLastHedge: price }),
  setHedgeTimeThreshold: threshold => set({ hedgeTimeThreshold: threshold }),
  setHedgePriceThreshold: threshold => set({ hedgePriceThreshold: threshold }),
  setIsTimeHedgeAvailable: isAvailable => set({ isTimeHedgeAvailable: isAvailable }),
  setAuctionTriggerTime: auctionTriggerTime => set({ auctionTriggerTime }),
  setAuctionDetails: aucData => set({ auctionDetails: aucData }),
  setVaultId: id => set({ vaultId: id }),
  setDeltaHedgeThreshold: t => set({ deltaHedgeThreshold: t }),
  setCrabVault: v => set({ vault: v }),
  setTotalSupply: t => set({ totalSupply: t }),
}))

export default useCrabStore
