import { NextApiRequest, NextApiResponse } from 'next'
import { getOtc } from '../../../server/utils/crab-otc'
import { getAuctionById } from '../../../server/utils/firebase-admin'
import { Auction, CrabOTC } from '../../../types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(400).json({ message: 'Only get is allowed' })
  const { id } = req.query.id ? req.query : { id: '' }

  if (id == '') return res.status(400).json({ message: 'Invalid query parameter supplied' })

  try {
    const crabOTC = await getOtc(id as string)
    return res.status(200).json(crabOTC)
  } catch (e) {
    return res.status(400).json({ message: 'CrabOTC not found' })
  }
}
