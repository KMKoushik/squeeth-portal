import { NextApiRequest, NextApiResponse } from 'next'
import { KING_CRAB } from '../../../constants/message'
import { crabV2Contract, verifyMessage } from '../../../server/utils/ether'
import { addOrUpdateAuction, createNewAuction, getAuction } from '../../../server/utils/firebase-admin'
import { Auction } from '../../../types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(400).json({ message: 'Only post is allowed' })
  const { auction } = req.body

  const currentAuction = (await getAuction()).data() as Auction

  const { bids, tx, clearingPrice, winningBids, ethPrice, oSqthPrice, osqthRefvol, normFactor, executedTime } = auction

  await addOrUpdateAuction({
    ...currentAuction,
    bids,
    tx,
    clearingPrice,
    winningBids,
    ethPrice,
    oSqthPrice,
    osqthRefvol,
    normFactor,
    executedTime,
  })

  await createNewAuction()

  res.status(200).json({ message: 'Auction successful' })
}
