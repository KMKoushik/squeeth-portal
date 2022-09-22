import { ethers } from 'ethers'
import { NextApiRequest, NextApiResponse } from 'next'
import { Auction, AuctionStatus, Bid, CrabOTC, CrabOTCBid, CrabOTCOrder, Order } from '../../../types'
import { getAuctionStatus, verifyOrder, validateOrder } from '../../../utils/auction'
import { addOrUpdateAuction, getAuction } from '../../../server/utils/firebase-admin'
import { trackEvent } from '../../../server/utils/analytics'
import { isApiRequest } from '../../../utils'
import { createOrUpdateOTC, getOtc } from '../../../server/utils/crab-otc'
import { verifyOTCOrder } from '../../../utils/crabotc'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(400).json({ message: 'Only post is allowed' })
  const { signature, order, otcId }: { signature: string; order: CrabOTCOrder; otcId: string } = req.body

  const crabOtc = (await getOtc(otcId)).data() as CrabOTC
  crabOtc.id = otcId
  const oldBid = crabOtc.bids[`${order.trader}-${order.nonce}`] as Bid

  try {
    const isOwner = verifyOTCOrder(order, signature, oldBid?.bidder || order.trader)
    if (!isOwner) return res.status(401).json({ message: 'Not owner' })
  } catch (e) {
    return res.status(401).json({ message: "Signature can't be verified" })
  }

  const bid: CrabOTCBid = {
    order,
    signature,
  }
  crabOtc.bids[`${bid.order.trader}-${order.nonce}`] = bid

  await createOrUpdateOTC(crabOtc)

  res.status(200).json({ message: 'Successfully placed/updated bid' })
}
