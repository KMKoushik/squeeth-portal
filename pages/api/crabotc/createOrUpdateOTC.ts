import { NextApiRequest, NextApiResponse } from 'next'
import { createOrUpdateOTC } from '../../../server/utils/crab-otc'
import { verifyMessageWithTime } from '../../../utils/auction'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(400).json({ message: 'Only post is allowed' })
  const { signature, crabOTC, mandate } = req.body

  const crabOTCData = crabOTC.data
  delete crabOTC.data

  try {
    const isOwner = verifyMessageWithTime(mandate, signature, crabOTC.createdBy)
    if (!isOwner) return res.status(401).json({ message: 'Not owner' })
  } catch (e) {
    return res.status(401).json({ message: "Signature can't be verified" })
  }

  await createOrUpdateOTC(crabOTC, crabOTCData)

  res.status(200).json({ message: 'Successfully updated OTC' })
}
