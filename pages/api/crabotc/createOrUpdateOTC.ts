import { NextApiRequest, NextApiResponse } from 'next'
import { createOrUpdateOTC } from '../../../server/utils/crab-otc'
import { verifyMessageWithTime } from '../../../utils/auction'
import { sendTelegramMessage } from '../../../server/utils/telegram-bot'
import { sendDiscordMessage } from '../../../server/utils/discord-bot'
import { handler } from '../../../server/utils/middleware'
import { restrictAccessMiddleware } from '../../../server/middlewares/restrict-access'

async function requestHandler(req: NextApiRequest, res: NextApiResponse) {
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

  const resp = await createOrUpdateOTC(crabOTC, crabOTCData)
  if (!crabOTC.id) {
    crabOTC.id = (resp as FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>).id
  }
  // Don't send if the tx is already over
  if (!crabOTC.tx) {
    // sendTelegramMessage(crabOTC, crabOTCData, false)
    //sendDiscordMessage()
  }

  res.status(200).json({ message: 'Successfully updated OTC' })
}

export default handler(restrictAccessMiddleware, requestHandler)
