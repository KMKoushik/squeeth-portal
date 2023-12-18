import { NextApiRequest, NextApiResponse } from 'next'
import { addBullRebalance } from '../../../server/utils/firebase-admin'
import { handler } from '../../../server/utils/middleware'
import { restrictAccessMiddleware } from '../../../server/middlewares/restrict-access'

async function requestHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(400).json({ message: 'Only post is allowed' })
  const { rebalance } = req.body

  await addBullRebalance(rebalance)

  res.status(200).json({ message: 'Updated successfully' })
}

export default handler(restrictAccessMiddleware, requestHandler)
