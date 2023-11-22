import { BigNumber } from 'ethers'
import create from 'zustand'
import { BIG_ZERO } from '../constants/numbers'

interface AccountState {
  address?: string
  ens?: string
  oSqthBalance: BigNumber
  wethBalance: BigNumber
  crabBalance: BigNumber
  isRestricted: boolean
  isBlocked: boolean
  isWithdrawalAllowed: boolean
  strikeCount: number
  isStrikeCountModalOpen: boolean
  setAddress: (addr: string | undefined) => void
  setEns: (ens: string) => void
  setOsqthBalance: (bal: BigNumber) => void
  setWethBalance: (bal: BigNumber) => void
  setCrabBalance: (bal: BigNumber) => void
  setIsRestricted: (value: boolean) => void
  setIsBlocked: (value: boolean) => void
  setIsWithdrawalAllowed: (value: boolean) => void
  setStrikeCount: (value: number) => void
  setIsStrikeCountModalOpen: (value: boolean) => void
}

const useAccountStore = create<AccountState>(set => ({
  address: undefined,
  ens: undefined,
  oSqthBalance: BIG_ZERO,
  wethBalance: BIG_ZERO,
  crabBalance: BIG_ZERO,
  isRestricted: false,
  isBlocked: false,
  isWithdrawalAllowed: false,
  strikeCount: 0,
  isStrikeCountModalOpen: false,
  setAddress: (addr: string | undefined) => set({ address: addr }),
  setEns: (ens: string) => set({ ens }),
  setOsqthBalance: bal => set({ oSqthBalance: bal }),
  setWethBalance: bal => set({ wethBalance: bal }),
  setCrabBalance: bal => set({ crabBalance: bal }),
  setIsRestricted: value => set({ isRestricted: value }),
  setIsBlocked: value => set({ isBlocked: value }),
  setIsWithdrawalAllowed: value => set({ isWithdrawalAllowed: value }),
  setStrikeCount: value => set({ strikeCount: value }),
  setIsStrikeCountModalOpen: value => set({ isStrikeCountModalOpen: value }),
}))

export default useAccountStore
