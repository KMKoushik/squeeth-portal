import { NextApiRequest, NextApiResponse } from 'next'
import { getAuction, getAuctionById } from '../../../server/utils/firebase-admin'
import { Auction } from '../../../types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(400).json({ message: 'Only get is allowed' })

  const auction = (await getAuction()).data() as Auction

  if (!auction) res.status(500).json({ message: 'Error occurred while fetching information' })

  const lastHedgeAuction = (await getAuctionById((auction.currentAuctionId - 1).toString())).data() as Auction

  res
    .status(200)
    .json({ auction: lastHedgeAuction, message: 'Retrieve successful' })
}
