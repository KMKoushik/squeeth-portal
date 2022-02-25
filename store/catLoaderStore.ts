import create from 'zustand'

interface CatLoaderStore {
  open: boolean,
  setOpen: (type: boolean) => void
}

const useCatLoaderStore = create<CatLoaderStore>(set => ({
  open: false,
  setOpen: open => set({ open })
}))

export default useCatLoaderStore