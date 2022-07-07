import create from 'zustand'
import { Auction } from '../types'
import { emptyAuction } from '../utils/auction'

interface CrabV2Store {
  isContractLoading: boolean
  owner: string
  auction: Auction
  auctionLoading: boolean
  isLoading: boolean
  bidToEdit: string | null
  setOwner: (owner: string) => void
  setIsContractLoading: (isLoading: boolean) => void
  setAuction: (a: Auction) => void
  setAuctionLoading: (l: boolean) => void
  setBidToEdit: (bidId: string | null) => void
}

const useCrabV2Store = create<CrabV2Store>((set, get) => ({
  isContractLoading: true,
  owner: '',
  auction: emptyAuction,
  auctionLoading: true,
  isLoading: true,
  bidToEdit: null,
  setOwner: owner => set({ owner }),
  setIsContractLoading: l => set({ isContractLoading: l, isLoading: l || get().auctionLoading }),
  setAuction: auction => set({ auction }),
  setAuctionLoading: (auctionLoading: boolean) =>
    set({ auctionLoading, isLoading: auctionLoading || get().isContractLoading }),
  setBidToEdit: bidId => set({ bidToEdit: bidId }),
}))

export default useCrabV2Store
