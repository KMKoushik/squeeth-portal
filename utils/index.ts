import { BigNumber } from 'ethers'

export const bnComparator = (a: BigNumber, b: BigNumber) => a.toString() === b.toString()

// export const bnComparatorObj = (a: { [key: string]: BigNumber }, b: { [key: string]: BigNumber }) => {

// }
