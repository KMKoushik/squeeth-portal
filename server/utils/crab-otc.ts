import { CrabOTC } from '../../types'
import { dbAdmin } from './firebase-admin'

export const createOrUpdateOTC = (crabOTC: CrabOTC, merge?: boolean) => {
  if (!crabOTC.id) {
    return dbAdmin.collection('crabotc').add(crabOTC)
  }
  return dbAdmin.collection('crabotc').doc(crabOTC.id).set(crabOTC, { merge })
}

export const getOtc = (otcId: string) => {
  return dbAdmin.collection('crabotc').doc(otcId).get()
}
