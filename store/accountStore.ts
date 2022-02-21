import create from 'zustand'

interface AccountState {
  address?: string
  ens?: string
  setAddress: (addr: string) => void
  setEns: (ens: string) => void
}

const useAccountStore = create<AccountState>(set => ({
  address: undefined,
  ens: undefined,
  setAddress: (addr: string) => set({ address: addr }),
  setEns: (ens: string) => set({ ens }),
}))

export default useAccountStore
