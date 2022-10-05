import { NextApiRequest, NextApiResponse } from 'next'
import { deleteOtc, getOtc } from '../../../server/utils/crab-otc'
import { verifyMessageWithTime } from '../../../utils/auction'
import { sendTelegramMessage } from '../../../server/utils/telegram-bot'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(400).json({ message: 'Only delete is allowed' })
  const { signature, id, mandate } = req.body

  const crabOtc = await getOtc(id)

  try {
    const isOwner = verifyMessageWithTime(mandate, signature, crabOtc.createdBy)
    if (!isOwner) return res.status(401).json({ message: 'Not owner' })
  } catch (e) {
    return res.status(401).json({ message: "Signature can't be verified" })
  }

  await deleteOtc(crabOtc)
  res.status(200).json({ message: 'Successfully deleted OTC' })
}
