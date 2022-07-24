import { AlertColor } from '@mui/material'
import create from 'zustand'

interface ToastMsg {
  message: string
  severity: AlertColor
}

interface AppStore {
  openCat: boolean
  toast: ToastMsg | null
  gasFee: number
  setOpenCat: (type: boolean) => void
  setToast: (toast: ToastMsg | null) => void
  setGasFee: (gasFee: number) => void
}

const useAppStore = create<AppStore>(set => ({
  openCat: false,
  toast: null,
  gasFee: 0,
  setOpenCat: open => set({ openCat: open }),
  setToast: toast => set({ toast }),
  setGasFee: gasFee => set({ gasFee }),
}))

export default useAppStore
