import { BigNumber } from 'ethers'
import { NextApiRequest } from 'next'

export const bnComparator = (a: BigNumber, b: BigNumber) => a.toString() === b.toString()

export const isApiRequest = (req: NextApiRequest) => {
  return !req.query['web']
}
