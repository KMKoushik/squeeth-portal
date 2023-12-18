import { NextApiRequest, NextApiResponse } from 'next'
import { MM_CANCEL } from '../../../constants/message'
import { V2_BID_REQUEST_USAGE_EXPIRY_TIME_MILLIS } from '../../../constants/numbers'
import { trackEvent } from '../../../server/utils/analytics'
import { addOrUpdateAuction, getAuction } from '../../../server/utils/firebase-admin'
import { Auction, AuctionStatus, MessageWithTimeSignature } from '../../../types'
import { isApiRequest } from '../../../utils'
import { getAuctionStatus, verifyMessageWithTime } from '../../../utils/auction'
import { handler } from '../../../server/utils/middleware'
import { restrictAccessMiddleware } from '../../../server/middlewares/restrict-access'

async function requestHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(400).json({ message: 'Only delete method is allowed' })
  const { signature, bidId, mandate } = req.body

  const typeMessage = mandate as MessageWithTimeSignature

  if (!typeMessage?.message || typeMessage.message !== MM_CANCEL || !typeMessage?.time)
    return res.status(400).json({ message: 'Invalid Authorization Message' })

  const diffInMillis = Date.now() - typeMessage.time
  if (diffInMillis < 0 || diffInMillis > V2_BID_REQUEST_USAGE_EXPIRY_TIME_MILLIS)
    return res.status(400).json({ message: 'Invalid timestamp submitted for bid' })

  const auction = (await getAuction()).data() as Auction

  const bid = auction.bids[bidId]

  try {
    const isOwner = verifyMessageWithTime(mandate, signature, bid.bidder, auction.type)
    if (!isOwner) return res.status(401).json({ message: 'Not owner' })
  } catch (e) {
    return res.status(401).json({ message: "Signature can't be verified" })
  }

  const status = getAuctionStatus(auction)
  const isRunning = !(status === AuctionStatus.SETTLED || status === AuctionStatus.SETTLEMENT)
  if (!isRunning) return res.status(400).json({ message: 'Auction is not live anymore' })

  delete auction.bids[bidId]
  await addOrUpdateAuction(auction)
  if (isApiRequest(req)) {
    await trackEvent('API_REQUEST', bid.bidder, { eventType: 'DELETE_BID' })
  }

  res.status(200).json({ message: 'Successfully deleted bid' })
}

export default handler(restrictAccessMiddleware, requestHandler)
