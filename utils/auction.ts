import { BigNumber, ethers, Signer } from 'ethers'
import { doc, increment, setDoc } from 'firebase/firestore'
import { CRAB_STRATEGY_V2 } from '../constants/address'
import { BIG_ONE, BIG_ZERO, CHAIN_ID, V2_AUCTION_TIME, V2_AUCTION_TIME_MILLIS } from '../constants/numbers'
import { Auction, AuctionStatus, Bid, BidStatus, BigNumMap, Order } from '../types'
import { db } from './firebase'
import { wdiv, wmul } from './math'

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

      if (!approvalMap[b.bidder] || !approvalMap[b.bidder].gte(erc20Needed))
        return { ...b, status: BidStatus.NO_APPROVAL }

      if (!balanceMap[b.bidder] || !balanceMap[b.bidder].gte(erc20Needed)) return { ...b, status: BidStatus.NO_BALANCE }

      if (filledAmt.eq(quantity)) return { ...b, status: BidStatus.ALREADY_FILLED }

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
  const currentMillis = Date.now()
  if (currentMillis < auction.auctionEnd && currentMillis > auction.auctionEnd - V2_AUCTION_TIME_MILLIS)
    return AuctionStatus.LIVE
  if (currentMillis < auction.auctionEnd + V2_AUCTION_TIME_MILLIS && currentMillis > auction.auctionEnd)
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

export const estimateAuction = (debt: BigNumber, ethDelta: BigNumber, sqthPrice: BigNumber) => {
  const oSqthDelta = wmul(wmul(debt, BigNumber.from(BIG_ONE).mul(2)), sqthPrice)

  const getAuctionTypeAndTargetHedge = () => {
    if (oSqthDelta.gt(ethDelta)) {
      return { isSellingAuction: false, target: wdiv(oSqthDelta.sub(ethDelta), sqthPrice) }
    }
    return { isSellingAuction: true, target: wdiv(ethDelta.sub(oSqthDelta), sqthPrice) }
  }

  const { isSellingAuction, target } = getAuctionTypeAndTargetHedge()
  const ethProceeds = wmul(target, sqthPrice)
  console.log(
    ethProceeds.toString(),
    target.toString(),
    sqthPrice.toString(),
    oSqthDelta.toString(),
    'Is Selling',
    !oSqthDelta.gt(ethDelta),
    ethDelta.toString(),
    oSqthDelta.sub(ethDelta).toString(),
  )

  return { isSellingAuction, oSqthAmount: target, ethAmount: ethProceeds }
}

export const getBgColor = (status?: BidStatus) => {
  if (status === undefined) return ''

  if (status > BidStatus.PARTIALLY_FILLED) return 'error.light'
  if (status === BidStatus.PARTIALLY_FILLED) return 'warning.light'

  return 'success.light'
}
