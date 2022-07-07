/* eslint-disable prettier/prettier */
import { initializeApp, cert } from 'firebase-admin/app'
import { apps, auth, firestore } from 'firebase-admin'
import { Auction } from '../../types'

export const appAdmin =
  apps.length > 0
    ? apps[0]
    : initializeApp({
      credential: cert({
        projectId: 'crab-v2-testnet',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
      }),
    })


export const authAdmin = auth()

export const dbAdmin = firestore()

export const addOrUpdateAuction = (auction: Auction, merge?: boolean) => {
  return dbAdmin.collection('auction').doc('current').set(auction, { merge })
}

export const getAuction = () => {
  return dbAdmin.collection('auction').doc('current').get()
}