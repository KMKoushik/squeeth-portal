import { NextApiRequest, NextApiResponse } from 'next'
import { getUserBids } from '../../../server/utils/firebase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(400).json({ message: 'Only get is allowed' })
  const { user } = req.query.user ? req.query : { user: '' }

  if (user == '') return res.status(400).json({ message: 'No user address supplied' })
  let bids: any
  let message = 'Retrieve successful'
  try {
    bids = await getUserBids(user as string)

    if (bids.length < 1) message = 'No Bids made for current auction'
  } catch (e) {
    return res.status(400).json({ message: 'Could not get user bids' })
  }
  res.status(200).json({ bids, message })
}
