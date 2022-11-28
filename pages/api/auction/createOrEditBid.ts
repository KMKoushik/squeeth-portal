import { ethers } from 'ethers'
import { NextApiRequest, NextApiResponse } from 'next'
import { Auction, AuctionStatus, Bid, Order } from '../../../types'
import { getAuctionStatus, verifyOrder, validateOrder } from '../../../utils/auction'
import { addOrUpdateAuction, getAuction } from '../../../server/utils/firebase-admin'
import { trackEvent } from '../../../server/utils/analytics'
import { isApiRequest } from '../../../utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(400).json({ message: 'Only post is allowed' })
  const { signature, order }: { signature: string; order: Order } = req.body

  const auction = (await getAuction()).data() as Auction

  if (auction.bids !== undefined) {
    const oldBid = auction.bids[`${order.trader}-${order.nonce}`] as Bid

    try {
      const isOwner = verifyOrder(order, signature, oldBid?.bidder || order.trader)
      if (!isOwner) return res.status(401).json({ message: 'Not owner' })
    } catch (e) {
      return res.status(401).json({ message: "Signature can't be verified" })
    }
  } else {
    auction.bids = {}
  }

  try {
    const { isValidOrder, response: errorMessage } = await validateOrder(order, auction)
    if (!isValidOrder) return res.status(401).json({ message: errorMessage })
  } catch (e) {
    return res.status(401).json({ message: "Order can't be validated" })
  }

  const status = getAuctionStatus(auction)
  const isRunning = !(status === AuctionStatus.SETTLED || status === AuctionStatus.SETTLEMENT)
  if (!isRunning) return res.status(400).json({ message: 'Auction is not live anymore' })

  const bid: Bid = {
    order,
    bidder: order.trader,
    signature,
    updatedTime: Date.now(),
  }
  auction.bids[`${bid.bidder}-${order.nonce}`] = bid

  await addOrUpdateAuction(auction)
  if (isApiRequest(req)) {
    console.log('Updating Amplitude')
    await trackEvent('API_REQUEST', order.trader, { eventType: 'CREATE_BID' })
  }
  res.status(200).json({ message: 'Successfully placed/updated bid' })
}
