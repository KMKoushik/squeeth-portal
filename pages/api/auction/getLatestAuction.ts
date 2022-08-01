import { NextApiRequest, NextApiResponse } from 'next'
import { getAuction } from '../../../server/utils/firebase-admin'
import { Auction, AuctionStatus } from '../../../types'
import { getAuctionStatus } from '../../../utils/auction'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(400).json({ message: 'Only get is allowed' })

  const auction = (await getAuction()).data() as Auction

  if (!auction) res.status(200).json({ isLive: false, message: 'No auction created' })

  const status = getAuctionStatus(auction)
  const isLive = !(status === AuctionStatus.SETTLED || status === AuctionStatus.SETTLEMENT)

  res.status(200).json({ auction: auction, isLive: isLive, status: status, message: 'Retrieve successful' })
}
