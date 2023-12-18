import { NextApiRequest, NextApiResponse } from 'next'
import { getAuction } from '../../../server/utils/firebase-admin'
import { Auction, AuctionStatus } from '../../../types'
import { getAuctionStatus } from '../../../utils/auction'
import { handler } from '../../../server/utils/middleware'
import { restrictAccessMiddleware } from '../../../server/middlewares/restrict-access'

async function requestHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(400).json({ message: 'Only get is allowed' })

  const auction = (await getAuction()).data() as Auction

  if (!auction) res.status(200).json({ isLive: false, message: 'No auction created' })

  const _status = getAuctionStatus(auction)
  const status = auction.auctionEnd === 0 ? AuctionStatus.UPCOMING : _status
  const isLive = status === AuctionStatus.LIVE ? true : false

  res
    .status(200)
    .json({ auction: auction, isLive: isLive, status: AuctionStatus[status], message: 'Retrieve successful' })
}

export default handler(restrictAccessMiddleware, requestHandler)
