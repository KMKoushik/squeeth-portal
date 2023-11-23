import { CrabOTC, CrabOTCData } from '../../types'
import { dbAdminCrab } from './firebase-admin'
import { ipfsClient } from './ipfs'

export const createOrUpdateOTC = async (crabOTC: CrabOTC, crabOTCData: CrabOTCData, merge?: boolean) => {
  if (crabOTC.cid !== '') {
    await ipfsClient.pin.rm(crabOTC.cid)
  }
  const { cid } = await ipfsClient.add(JSON.stringify(crabOTCData), { pin: true })
  crabOTC.cid = cid.toString()

  if (!crabOTC.id) {
    return dbAdminCrab.collection('crabotc').add(crabOTC)
  }
  return dbAdminCrab.collection('crabotc').doc(crabOTC.id).set(crabOTC, { merge })
}

export const getOtc = async (otcId: string) => {
  const crabOtc = (await dbAdminCrab.collection('crabotc').doc(otcId).get()).data() as CrabOTC
  const chunks = []
  for await (const chunk of ipfsClient.cat(crabOtc.cid)) {
    chunks.push(chunk)
  }
  const crabOtcData = JSON.parse(chunks.toString()) as CrabOTCData

  return { ...crabOtc, data: crabOtcData, id: otcId }
}

export const deleteOtc = async (crabOtc: CrabOTC) => {
  if (crabOtc.cid !== '') {
    await ipfsClient.pin.rm(crabOtc.cid)
  }

  if (crabOtc.id) {
    return dbAdminCrab.collection('crabotc').doc(crabOtc.id).delete()
  }
}
