/* eslint-disable prettier/prettier */
import { initializeApp, cert } from 'firebase-admin/app'
import { apps, auth, firestore } from 'firebase-admin'
import { Auction, AuctionType, BullRebalance, Bid } from '../../types'
import { AUCTION_COLLECTION, emptyAuction } from '../../utils/auction'
import { CHAIN_ID } from '../../constants/numbers'



try {
  apps.length > 0
    ? apps[0]
    : initializeApp({
      credential: cert({
        projectId: CHAIN_ID === 1 ? 'crab-v2-mainnet' : 'crab-v2-testnet',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
      }),
    })
} catch (e) {
  console.log('error in init', e)
}


export const authAdmin = auth()
export const dbAdmin = firestore()

export const addOrUpdateAuction = (auction: Auction, merge?: boolean) => {
  return dbAdmin.collection(AUCTION_COLLECTION).doc('current').set(auction, { merge })
}

export const addOrUpdateBid = (bidId: string, bid: Bid) => {
  return dbAdmin.collection(AUCTION_COLLECTION).doc('current').update({
    [`bids.${bidId}`]: bid
  })
}

export const getAuction = () => {
  return dbAdmin.collection(AUCTION_COLLECTION).doc('current').get()
}

export const getAuctionById = (auctionId: string) =>  {
    return dbAdmin.collection(AUCTION_COLLECTION).doc(auctionId).get()
}

export const createNewAuction = async () => {
  const auctionDoc = await getAuction()
  const auction = auctionDoc.data() as Auction
  await dbAdmin.collection(AUCTION_COLLECTION).doc(auction!.currentAuctionId.toString()).set(auction!)
  return dbAdmin.collection(AUCTION_COLLECTION).doc('current').set({ ...emptyAuction, nextAuctionId: auction.nextAuctionId + 1, currentAuctionId: auction.nextAuctionId })
}

export const getUserBids = async (userAddress: string) => {

  const auctionDoc = await getAuction()
  const auction = auctionDoc.data() as Auction

  const bidObjArray = Object.values(auction.bids)
  const bids =  bidObjArray.filter(o => o.bidder === userAddress)

  const orders = bids.map((item) => {
    return item.order
  });
  return  orders
}

export const addBullRebalance = async (bullRebalance: BullRebalance) => {
  const id = Date.now()
  return dbAdmin.collection('bull-rebalance').doc(id.toString()).set({ ...bullRebalance, id })
}

export const getLastAuctionForType = async (type: AuctionType, currentId: number) => {
  const auctions =  await dbAdmin.collection(AUCTION_COLLECTION).where('type', '==', type).where('currentAuctionId', '!=', currentId).orderBy('currentAuctionId', 'desc').limit(1).get()
  return auctions.docs[0].data() as Auction
}