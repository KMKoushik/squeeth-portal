import { BigNumber } from 'ethers'
import create from 'zustand'
import { BIG_ZERO } from '../constants/numbers'

interface AccountState {
  address?: string
  ens?: string
  oSqthBalance: BigNumber
  wethBalance: BigNumber
  setAddress: (addr: string) => void
  setEns: (ens: string) => void
  setOsqthBalance: (bal: BigNumber) => void
  setWethBalance: (bal: BigNumber) => void
}

const useAccountStore = create<AccountState>(set => ({
  address: undefined,
  ens: undefined,
  oSqthBalance: BIG_ZERO,
  wethBalance: BIG_ZERO,
  setAddress: (addr: string) => set({ address: addr }),
  setEns: (ens: string) => set({ ens }),
  setOsqthBalance: bal => set({ oSqthBalance: bal }),
  setWethBalance: bal => set({ wethBalance: bal }),
}))

export default useAccountStore
