import { BigNumber } from 'ethers'
import create from 'zustand'
import { BIG_ZERO, ZERO } from '../constants/numbers'
import { Auction, AuctionStatus, Bid, BidWithStatus, Vault } from '../types'
import { emptyAuction } from '../utils/auction'

interface CrabV2Store {
  isContractLoading: boolean
  owner: string
  auction: Auction
  auctionLoading: boolean
  isLoading: boolean
  bidToEdit: string | null
  isHistoricalView: boolean
  oSqthApproval: BigNumber
  wethApproval: BigNumber
  auctionStatus: AuctionStatus
  vault: Vault | null
  sortedBids: Bid[]
  categorizedBids: BidWithStatus[]
  ethDvolIndex: number
  estClearingPrice: string
  setOwner: (owner: string) => void
  setIsContractLoading: (isLoading: boolean) => void
  setAuction: (a: Auction) => void
  setAuctionLoading: (l: boolean) => void
  setBidToEdit: (bidId: string | null) => void
  setIsHistoricalView: (isHistory: boolean) => void
  setOsqthApproval: (approval: BigNumber) => void
  setWethApproval: (approval: BigNumber) => void
  setAuctionStatus: (status: AuctionStatus) => void
  setVault: (v: Vault) => void
  setSortedBids: (bids: Bid[]) => void
  setCategorizedBids: (bids: BidWithStatus[]) => void
  setEthDvolIndex: (p: number) => void
  setEstClearingPrice: (price: string) => void
}

const useCrabV2Store = create<CrabV2Store>((set, get) => ({
  isContractLoading: true,
  owner: '',
  auction: emptyAuction,
  auctionLoading: true,
  isLoading: true,
  bidToEdit: null,
  isHistoricalView: false,
  oSqthApproval: BIG_ZERO,
  wethApproval: BIG_ZERO,
  auctionStatus: AuctionStatus.UPCOMING,
  vault: null,
  sortedBids: [],
  categorizedBids: [],
  ethDvolIndex: ZERO,
  estClearingPrice: '0',
  setOwner: owner => set({ owner }),
  setIsContractLoading: l => set({ isContractLoading: l, isLoading: l || get().auctionLoading }),
  setAuction: auction => set({ auction }),
  setAuctionLoading: (auctionLoading: boolean) =>
    set({ auctionLoading, isLoading: auctionLoading || get().isContractLoading }),
  setBidToEdit: bidId => set({ bidToEdit: bidId }),
  setIsHistoricalView: isHistoricalView => set({ isHistoricalView }),
  setOsqthApproval: approval => set({ oSqthApproval: approval }),
  setWethApproval: approval => set({ wethApproval: approval }),
  setAuctionStatus: status => set({ auctionStatus: status }),
  setVault: vault => set({ vault }),
  setSortedBids: bids => set({ sortedBids: bids }),
  setCategorizedBids: bids => set({ categorizedBids: bids }),
  setEthDvolIndex: p => set({ ethDvolIndex: p }),
  setEstClearingPrice: price => set({ estClearingPrice: price }),
}))

export default useCrabV2Store
