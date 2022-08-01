/* eslint-disable prettier/prettier */
import { initializeApp, cert } from 'firebase-admin/app'
import { apps, auth, firestore } from 'firebase-admin'
import { Auction } from '../../types'
import { emptyAuction } from '../../utils/auction'
import { CHAIN_ID } from '../../constants/numbers'



try {
  apps.length > 0
    ? apps[0]
    : initializeApp({
      credential: cert({
        projectId: CHAIN_ID === 3 ? 'crab-v2-testnet' : 'crab-v2-mainnet',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
      }),
    })
} catch (e) {
  console.log('error in init', e)
}

console.log("initialized")

export const authAdmin = auth()

export const dbAdmin = firestore()

console.log("db initialized")

export const addOrUpdateAuction = (auction: Auction, merge?: boolean) => {
  return dbAdmin.collection('auction').doc('current').set(auction, { merge })
}


export const getAuction = () => {
  return dbAdmin.collection('auction').doc('current').get()
}

export const getAuctionById = (auctionId: string): Auction => {
  return dbAdmin.collection('auction').doc(auctionId).get() as Auction
}

export const createNewAuction = async () => {
  const auctionDoc = await getAuction()
  const auction = auctionDoc.data() as Auction
  await dbAdmin.collection('auction').doc(auction!.currentAuctionId.toString()).set(auction!)
  return dbAdmin.collection('auction').doc('current').set({ ...emptyAuction, nextAuctionId: auction.nextAuctionId + 1, currentAuctionId: auction.nextAuctionId })
}
