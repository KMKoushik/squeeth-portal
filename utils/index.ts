import { BigNumber } from 'ethers'

export const bnComparator = (a: BigNumber, b: BigNumber) => a.toString() === b.toString()
