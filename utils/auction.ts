import { BigNumber, ethers, Signer } from 'ethers'
import { doc, increment, setDoc } from 'firebase/firestore'
import { CRAB_STRATEGY_V2 } from '../constants/address'
import { BIG_ONE, BIG_ZERO, CHAIN_ID, V2_AUCTION_TIME } from '../constants/numbers'
import { Auction, AuctionStatus, Bid, BidStatus, BigNumMap, Order } from '../types'
import { db } from './firebase'
import { wmul } from './math'

export const emptyAuction: Auction = {
  currentAuctionId: 0,
  nextAuctionId: 1,
  oSqthAmount: '0',
  price: '0',
  auctionEnd: 0,
  isSelling: false,
  bids: {},
  winningBids: [],
  clearingPrice: '0',
}

export const createOrEditAuction = async (auction: Auction) => {
  await setDoc(doc(db, 'auction', 'current'), { ...auction }, { merge: true })
}

export const sortBids = (auction: Auction) => {
  const bids = Object.values(auction.bids)

  const sortedBids = bids.sort((a, b) => {
    if (auction.isSelling) return Number(b.order.price) - Number(a.order.price)

    return Number(a.order.price) - Number(b.order.price)
  })

  return sortedBids
}

export const getUniqueTraders = (bids: Array<Bid>) => {
  const uniqueApprovalMap = bids.reduce((acc, bid) => {
    acc[bid.bidder] = true
    return acc
  }, {} as { [key: string]: boolean })
  return Object.keys(uniqueApprovalMap)
}

export const filterBidsWithReason = (
  sortedBids: Array<Bid>,
  auction: Auction,
  _approvalMap: BigNumMap,
  _balanceMap: BigNumMap,
) => {
  const approvalMap = { ..._approvalMap }
  const balanceMap = { ..._balanceMap }
  const quantity = BigNumber.from(auction.oSqthAmount)
  let filledAmt = BigNumber.from(0)

  const filteredBids = sortedBids
    .map(b => {
      const _osqth = BigNumber.from(b.order.quantity)
      const _price = BigNumber.from(b.order.price)
      const erc20Needed = auction.isSelling ? wmul(_osqth, _price) : _osqth

      if (filledAmt.eq(quantity)) return { ...b, status: BidStatus.ALREADY_FILLED }

      if (!approvalMap[b.bidder] || !approvalMap[b.bidder].gte(erc20Needed))
        return { ...b, status: BidStatus.NO_APPROVAL }

      if (!balanceMap[b.bidder] || !balanceMap[b.bidder].gte(erc20Needed)) return { ...b, status: BidStatus.NO_BALANCE }

      if (quantity.lt(filledAmt.add(_osqth))) {
        balanceMap[b.bidder] = balanceMap[b.bidder].sub(wmul(quantity.sub(filledAmt), _price))
        filledAmt = quantity
        return { ...b, status: BidStatus.PARTIALLY_FILLED }
      }

      filledAmt = filledAmt.add(_osqth)
      balanceMap[b.bidder] = balanceMap[b.bidder].sub(erc20Needed)
      return { ...b, status: BidStatus.INCLUDED }
    })
    .sort((a, b) => a.status - b.status)

  return filteredBids
}

export const getAuctionStatus = (auction: Auction) => {
  const auctionTimeInMS = V2_AUCTION_TIME * 60 * 1000
  const currentMillis = Date.now()
  if (currentMillis < auction.auctionEnd && currentMillis > auction.auctionEnd - auctionTimeInMS)
    return AuctionStatus.LIVE
  if (currentMillis < auction.auctionEnd + auctionTimeInMS && currentMillis > auction.auctionEnd)
    return AuctionStatus.SETTLEMENT
  if (currentMillis < auction.auctionEnd) return AuctionStatus.UPCOMING

  return AuctionStatus.SETTLED
}

export const getTxBidsAndClearingPrice = (filteredBids: Array<Bid & { status: BidStatus }>) => {
  const bids = filteredBids.filter(b => b.status <= BidStatus.PARTIALLY_FILLED)

  return { bids, clearingPrice: bids[bids.length - 1].order.price }
}

export function convertArrayToMap<Type>(arr1: Array<string>, arr2: Array<Type>) {
  const result: { [key: string]: Type } = {}
  if (arr1.length !== arr2.length) throw Error('Length should be same')

  for (let i = 0; i < arr1.length; i++) {
    result[arr1[i]] = arr2[i]
  }

  return result
}

export const domain = {
  name: 'CrabOTC',
  version: '2',
  chainId: CHAIN_ID,
  verifyingContract: CRAB_STRATEGY_V2,
}

export const type = {
  Order: [
    { type: 'uint256', name: 'bidId' },
    { type: 'address', name: 'trader' },
    { type: 'uint256', name: 'quantity' },
    { type: 'uint256', name: 'price' },
    { type: 'bool', name: 'isBuying' },
    { type: 'uint256', name: 'expiry' },
    { type: 'uint256', name: 'nonce' },
  ],
}

export const signOrder = async (signer: any, order: Order) => {
  const signature = await signer._signTypedData(domain, type, order)
  const { r, s, v } = ethers.utils.splitSignature(signature)

  return { signature, r, s, v }
}

export const verifyOrder = async (order: Order, signature: string, address: string) => {
  const addr = ethers.utils.verifyTypedData(domain, type, order, signature)
  return address.toLowerCase() === addr.toLowerCase()
}
