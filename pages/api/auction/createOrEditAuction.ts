import { NextApiRequest, NextApiResponse } from 'next'
import { KING_CRAB } from '../../../constants/message'
import { crabV2Contract, verifyMessage } from '../../../server/utils/ether'
import { addOrUpdateAuction } from '../../../server/utils/firebase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(400).json({ message: 'Only post is allowed' })
  const { signature, auction } = req.body
  const owner = await crabV2Contract.owner()

  if (process.env.NODE_ENV === 'production') {
    try {
      const isOwner = verifyMessage(KING_CRAB, signature, owner)
      if (!isOwner) return res.status(401).json({ message: 'Not owner' })
    } catch (e) {
      return res.status(401).json({ message: "Signature can't be verified" })
    }
  }

  await addOrUpdateAuction(auction)

  res.status(200).json({ message: 'Successfully updated auction' })
}
