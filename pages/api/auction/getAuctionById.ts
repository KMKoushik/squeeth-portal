import { NextApiRequest, NextApiResponse } from 'next'
import { getAuctionById } from '../../../server/utils/firebase-admin'
import { Auction } from '../../../types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(400).json({ message: 'Only get is allowed' })
  const { auctionId } = req.body

  let auction : Auction

  try {
    auction = getAuctionById(auctionId)
    // if (!auction) return res.status(400).json({ message: 'Auction not found' })
  } catch (e) {
    return res.status(400).json({ message: "Auction not found" })
  }

  res.status(200).json({ auction: auction })
}
