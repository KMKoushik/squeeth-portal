import { NextApiRequest, NextApiResponse } from 'next'
import { getAuction, getAuctionById, getLastAuctionForType } from '../../../server/utils/firebase-admin'
import { Auction, AuctionType } from '../../../types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(400).json({ message: 'Only get is allowed' })

  const auctionType = req.query.type

  const auction = (await getAuction()).data() as Auction

  if (!auction) res.status(500).json({ message: 'Error occurred while fetching information' })

  if (auctionType) {
    const lastAuction = await getLastAuctionForType(Number(auctionType) as AuctionType, auction.currentAuctionId)
    if (!lastAuction) res.status(500).json({ message: 'Error occurred while fetching information' })
    return res.status(200).json({ auction: lastAuction, message: 'Retrieve successful' })
  }

  const lastHedgeAuction = (await getAuctionById((auction.currentAuctionId - 1).toString())).data() as Auction

  res.status(200).json({ auction: lastHedgeAuction, message: 'Retrieve successful' })
}
