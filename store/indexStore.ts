import create from 'zustand'
import {  ZERO } from '../constants/numbers'

interface IndexState {
    ethDvolIndex: Number
    setEthDvolIndex: (p: Number) => void
}

const useIndexStore = create<IndexState>(set => ({
    ethDvolIndex: ZERO,
    setEthDvolIndex: p => set({ ethDvolIndex: p })
}))

export default useIndexStore
