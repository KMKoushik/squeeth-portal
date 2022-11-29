import { BigNumber } from 'ethers'
import create from 'zustand'
import { BIG_ZERO } from '../constants/numbers'

interface CalmBullStore {
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
  }
}

export const useCalmBullStore = create<CalmBullStore>(set => ({
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
  },
}))

export const useCalmBullActions = () => useCalmBullStore(state => state.actions)
