import { Telegraf } from 'telegraf'
import { CrabOTC, CrabOTCData } from '../../types'
import { formatBigNumber } from '../../utils/math'

export const bot = new Telegraf(String(process.env.TELEGRAM_BOT_TOKEN))

export const sendTelegramMessage = (crabOTC: CrabOTC, crabOTCData: CrabOTCData, isDeleting: boolean) => {
  //   if (isDeleting) {
  //     notificationType = 'Deleted OTC'
  //   } else

  //   if (crabOTC.cid !== '') {
  //     notificationType = 'Updated OTC'
  //   } else {
  //     notificationType = 'New OTC'
  //   }

  let msg: string
  if (crabOTCData.depositAmount !== 0) {
    msg = `Size ${formatBigNumber(crabOTCData.quantity)} oSQTH \nDirection: User selling, request oSQTH bid  \nLink: ${process.env.VERCEL_URL}/crab-otc/${crabOTC.id}`
  } else {
    msg = `Size ${formatBigNumber(crabOTCData.quantity)} oSQTH \nDirection: User  buying, request oSQTH offer \nLink: ${
      process.env.VERCEL_URL
    }/crab-otc/${crabOTC.id}`
  }
  bot.telegram.sendMessage(Number(process.env.TELEGRAM_CHANNEL_ID), msg)
}
