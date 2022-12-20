import { NextApiRequest, NextApiResponse } from 'next'
import { addBullRebalance } from '../../../server/utils/firebase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(400).json({ message: 'Only post is allowed' })
  const { rebalance } = req.body

  await addBullRebalance(rebalance)

  res.status(200).json({ message: 'Updated successfully' })
}
