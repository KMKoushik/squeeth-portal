import { NextApiRequest, NextApiResponse } from 'next'
import { getAuctionById } from '../../../server/utils/firebase-admin'
import { Auction } from '../../../types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(400).json({ message: 'Only get is allowed' })
  const { id } = req.query.id ? req.query : { id: '' }

  if (id == '') return res.status(400).json({ message: 'Invalid query paramater supplied' })

  let auction: Auction

  try {
    auction = (await getAuctionById(id as string)).data() as Auction
  } catch (e) {
    return res.status(400).json({ message: 'Auction not found' })
  }

  res.status(200).json({ auction: auction })
}
