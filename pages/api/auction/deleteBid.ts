import { NextApiRequest, NextApiResponse } from 'next'
import { KING_CRAB, MM_CANCEL } from '../../../constants/message'
import { crabV2Contract, verifyMessage } from '../../../server/utils/ether'
import { addOrUpdateAuction, getAuction } from '../../../server/utils/firebase-admin'
import { Auction } from '../../../types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(400).json({ message: 'Only post is allowed' })
  const { signature, bidId } = req.body

  const auction = (await getAuction()).data() as Auction

  const bid = auction.bids[bidId]

  try {
    const isOwner = verifyMessage(MM_CANCEL, signature, bid.bidder)
    if (!isOwner) return res.status(401).json({ message: 'Not owner' })
  } catch (e) {
    return res.status(401).json({ message: "Signature can't be verified" })
  }

  delete auction.bids[bidId]
  console.log(auction.bids[bidId])
  await addOrUpdateAuction(auction)

  res.status(200).json({ message: 'success' })
}
