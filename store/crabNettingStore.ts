import { BigNumber } from 'ethers'
import create from 'zustand'
import { BIG_ZERO } from '../constants/numbers'

interface CrabNettingStore {
  owner: string
  depositQueued: BigNumber
  withdrawQueued: BigNumber
  isAuctionLive: boolean
  setDepositQueued: (depositQueued: BigNumber) => void
  setWithdrawQueued: (withdrawQueued: BigNumber) => void
  setOwner: (owner: string) => void
  setAuctionLive: (isAuctionLive: boolean) => void
}

export const useCrabNettingStore = create<CrabNettingStore>(set => ({
  owner: '',
  depositQueued: BIG_ZERO,
  withdrawQueued: BIG_ZERO,
  isAuctionLive: false,
  setDepositQueued: depositQueued => set({ depositQueued }),
  setWithdrawQueued: withdrawQueued => set({ withdrawQueued }),
  setOwner: owner => set({ owner }),
  setAuctionLive: isAuctionLive => set({ isAuctionLive }),
}))
