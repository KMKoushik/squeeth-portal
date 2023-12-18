/* eslint-disable prettier/prettier */
import { initializeApp, cert, App } from 'firebase-admin/app'
import { apps, AppOptions } from 'firebase-admin'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { Auction, AuctionType, BullRebalance, Bid } from '../../types'
import { AUCTION_COLLECTION, emptyAuction } from '../../utils/auction'
import { CHAIN_ID } from '../../constants/numbers'

let appCrab: App
let appOpyn: App
export let dbAdminCrab: Firestore
let dbAdminOpyn: Firestore

function initializeFirebaseApp(config: AppOptions, name: string) {
  return apps.find(app => app?.name === name) || initializeApp(config, name)
}

try {
  appCrab = initializeFirebaseApp(
    {
      credential: cert({
        projectId: CHAIN_ID === 1 ? 'crab-v2-mainnet' : 'crab-v2-testnet',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
      }),
    },
    'crab',
  )
  dbAdminCrab = getFirestore(appCrab)
} catch (e) {
  console.log('Error initializing crab app', e)
}

try {
  appOpyn = initializeFirebaseApp(
    {
      credential: cert({
        projectId: 'mm-bot-prod',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL_OPYN,
        privateKey: process.env.FIREBASE_PRIVATE_KEY_OPYN,
      }),
    },
    'opyn',
  )

  dbAdminOpyn = getFirestore(appOpyn)
} catch (e) {
  console.log('Error initializing opyn app', e)
}

export const addOrUpdateAuction = (auction: Auction, merge?: boolean) => {
  return dbAdminCrab.collection(AUCTION_COLLECTION).doc('current').set(auction, { merge })
}

export const addOrUpdateBid = (bidId: string, bid: Bid) => {
  return dbAdminCrab
    .collection(AUCTION_COLLECTION)
    .doc('current')
    .update({
      [`bids.${bidId}`]: bid,
    })
}

export const getAuction = () => {
  return dbAdminCrab.collection(AUCTION_COLLECTION).doc('current').get()
}

export const getAuctionById = (auctionId: string) => {
  return dbAdminCrab.collection(AUCTION_COLLECTION).doc(auctionId).get()
}

export const createNewAuction = async () => {
  const auctionDoc = await getAuction()
  const auction = auctionDoc.data() as Auction
  await dbAdminCrab.collection(AUCTION_COLLECTION).doc(auction!.currentAuctionId.toString()).set(auction!)
  return dbAdminCrab
    .collection(AUCTION_COLLECTION)
    .doc('current')
    .set({ ...emptyAuction, nextAuctionId: auction.nextAuctionId + 1, currentAuctionId: auction.nextAuctionId })
}

export const getUserBids = async (userAddress: string) => {
  const auctionDoc = await getAuction()
  const auction = auctionDoc.data() as Auction

  const bidObjArray = Object.values(auction.bids)
  const bids = bidObjArray.filter(o => o.bidder === userAddress)

  const orders = bids.map(item => {
    return item.order
  })
  return orders
}

export const addBullRebalance = async (bullRebalance: BullRebalance) => {
  const id = Date.now()
  return dbAdminCrab
    .collection('bull-rebalance')
    .doc(id.toString())
    .set({ ...bullRebalance, id })
}

export const getLastAuctionForType = async (type: AuctionType, currentId: number) => {
  const auctions = await dbAdminCrab
    .collection(AUCTION_COLLECTION)
    .where('type', '==', type)
    .where('currentAuctionId', '!=', currentId)
    .orderBy('currentAuctionId', 'desc')
    .limit(1)
    .get()
  return auctions.docs[0].data() as Auction
}

/* utility functions for strikes logic */
export const getAddressVisitCount = async (address: string) => {
  const docRef = dbAdminOpyn.collection('blocked-addresses').doc(address)
  const doc = await docRef.get()
  if (doc.exists) {
    return doc.data()?.visitCount
  } else {
    return 0
  }
}

export const incrementAddressVisitCount = async (address: string) => {
  const docRef = dbAdminOpyn.collection('blocked-addresses').doc(address)
  const doc = await docRef.get()

  let visitCount = 0

  if (doc.exists) {
    visitCount = doc.data()?.visitCount + 1
    await docRef.set({ address, visitCount })
  } else {
    visitCount = 1
    await docRef.set({ address, visitCount: 1 })
  }

  return visitCount
}
