import { ethers } from 'ethers'
import { NextApiRequest, NextApiResponse } from 'next'
import { addOrUpdateAuction, getAuction } from '../../../server/utils/firebase-admin'
import { Auction, Bid, Order } from '../../../types'
import { verifyOrder } from '../../../utils/auction'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(400).json({ message: 'Only post is allowed' })
  const { signature, order }: { signature: string; order: Order } = req.body

  const auction = (await getAuction()).data() as Auction
  const oldBid = auction.bids[`${order.trader}-${order.nonce}`] as Bid

  try {
    const isOwner = verifyOrder(order, signature, oldBid?.bidder || order.trader)
    if (!isOwner) return res.status(401).json({ message: 'Not owner' })
  } catch (e) {
    return res.status(401).json({ message: "Signature can't be verified" })
  }

  const { r, s, v } = ethers.utils.splitSignature(signature)

  const bid: Bid = {
    order,
    bidder: order.trader,
    signature,
    r,
    s,
    v,
  }
  auction.bids[`${bid.bidder}-${order.nonce}`] = bid

  await addOrUpdateAuction(auction)
  res.status(200).json({ message: 'success' })
}
