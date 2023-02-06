import { BigNumber } from 'ethers'
import create from 'zustand'
import { BIG_ZERO } from '../constants/numbers'

interface CalmBullStore {
  isReady: boolean
  auctionManager: string
  crabBalance: BigNumber
  delta: BigNumber
  cr: BigNumber
  bullSupply: BigNumber
  loanCollat: BigNumber
  loanDebt: BigNumber
  deltaUpper: BigNumber
  deltaLower: BigNumber
  crUpper: BigNumber
  crLower: BigNumber
  bullEthValue: BigNumber
  bullDepositQueued: BigNumber
  bullWithdrawQueued: BigNumber
  isAuctionLive: boolean
  nettingOwner: string
  actions: {
    setAuctionManager: (owner: string) => void
    setCrabBalance: (crabBalance: BigNumber) => void
    setDelta: (delta: BigNumber) => void
    setCR: (cr: BigNumber) => void
    setBullSupply: (bullSupply: BigNumber) => void
    setLoanCollat: (loanCollat: BigNumber) => void
    setLoanDebt: (loanDebt: BigNumber) => void
    setDeltaUpper: (deltaUpper: BigNumber) => void
    setDeltaLower: (deltaLower: BigNumber) => void
    setCrUpper: (crUpper: BigNumber) => void
    setCrLower: (crLower: BigNumber) => void
    setIsReady: (isReady: boolean) => void
    setBullEthValue: (bullUsdcValue: BigNumber) => void
    setBullDepositQueued: (bullDepositQueued: BigNumber) => void
    setBullWithdrawQueued: (bullWithdrawQueued: BigNumber) => void
    setIsAuctionLive: (isAuctionLive: boolean) => void
    setNettingOwner: (nettingOwner: string) => void
  }
}

export const useCalmBullStore = create<CalmBullStore>(set => ({
  isReady: false,
  auctionManager: '',
  crabBalance: BIG_ZERO,
  delta: BIG_ZERO,
  cr: BIG_ZERO,
  bullSupply: BIG_ZERO,
  loanCollat: BIG_ZERO,
  loanDebt: BIG_ZERO,
  deltaUpper: BIG_ZERO,
  deltaLower: BIG_ZERO,
  crUpper: BIG_ZERO,
  crLower: BIG_ZERO,
  bullEthValue: BIG_ZERO,
  bullDepositQueued: BIG_ZERO,
  bullWithdrawQueued: BIG_ZERO,
  isAuctionLive: false,
  nettingOwner: '',
  actions: {
    setAuctionManager: auctionManager => set({ auctionManager }),
    setCrabBalance: crabBalance => set({ crabBalance }),
    setDelta: delta => set({ delta }),
    setCR: cr => set({ cr }),
    setBullSupply: bullSupply => set({ bullSupply }),
    setLoanCollat: loanCollat => set({ loanCollat }),
    setLoanDebt: loanDebt => set({ loanDebt }),
    setDeltaUpper: deltaUpper => set({ deltaUpper }),
    setDeltaLower: deltaLower => set({ deltaLower }),
    setCrUpper: crUpper => set({ crUpper }),
    setCrLower: crLower => set({ crLower }),
    setIsReady: isReady => set({ isReady }),
    setBullEthValue: bullEthValue => set({ bullEthValue }),
    setBullDepositQueued: bullDepositQueued => set({ bullDepositQueued }),
    setBullWithdrawQueued: bullWithdrawQueued => set({ bullWithdrawQueued }),
    setIsAuctionLive: isAuctionLive => set({ isAuctionLive }),
    setNettingOwner: nettingOwner => set({ nettingOwner }),
  },
}))

export const useCalmBullActions = () => useCalmBullStore(state => state.actions)
