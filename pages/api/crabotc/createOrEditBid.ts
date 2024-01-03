import { NextApiRequest, NextApiResponse } from 'next'
import { Bid, CrabOTC, CrabOTCBid, CrabOTCOrder } from '../../../types'
import { createOrUpdateOTC, getOtc } from '../../../server/utils/crab-otc'
import { verifyOTCOrder } from '../../../utils/crabotc'
import { handler } from '../../../server/utils/middleware'
import { restrictAccessMiddleware } from '../../../server/middlewares/restrict-access'

async function requestHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(400).json({ message: 'Only post is allowed' })
  const { signature, order, otcId }: { signature: string; order: CrabOTCOrder; otcId: string } = req.body

  const crabOtcwithData = await getOtc(otcId)

  try {
    const isOwner = verifyOTCOrder(order, signature, order.trader)
    if (!isOwner) return res.status(401).json({ message: 'Not owner' })
  } catch (e) {
    return res.status(401).json({ message: "Signature can't be verified" })
  }

  const bid: CrabOTCBid = {
    order,
    signature,
  }
  crabOtcwithData.data.bids[`${bid.order.trader}-${order.nonce}`] = bid
  const crabOtcData = { ...crabOtcwithData.data }
  const crabOtc: CrabOTC = {
    id: crabOtcwithData.id,
    createdBy: crabOtcwithData.createdBy,
    cid: crabOtcwithData.cid,
    tx: '',
  }

  await createOrUpdateOTC(crabOtc, crabOtcData)

  res.status(200).json({ message: 'Successfully placed/updated bid' })
}

export default handler(restrictAccessMiddleware, requestHandler)
