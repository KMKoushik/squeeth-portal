import { BigNumber, ethers } from 'ethers'
import { doc, setDoc } from 'firebase/firestore'
import { CRAB_STRATEGY_V2, WETH, OSQUEETH } from '../constants/address'
import { BIG_ONE, BIG_ZERO, CHAIN_ID, V2_AUCTION_TIME_MILLIS } from '../constants/numbers'
import {
  Auction,
  AuctionStatus,
  Bid,
  BidStatus,
  BidWithStatus,
  BigNumMap,
  MessageWithTimeSignature,
  Order,
} from '../types'
import { db } from './firebase'
import { convertBigNumber, toBigNumber, wdiv, wmul } from './math'
import erc20Abi from '../abis/ERC20.json'
import { provider } from '../server/utils/ether'
import { ERC20 } from '../types/contracts'

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
  minSize: 0,
}

export const createOrEditAuction = async (auction: Auction) => {
  await setDoc(doc(db, 'auction', 'current'), { ...auction }, { merge: true })
}

export const sortBids = (auction: Auction) => {
  const bids = Object.values(auction.bids)

  return sortBidsForBidArray(bids, auction.isSelling)
}

export const sortBidsForBidArray = (bids: Array<Bid>, isSelling: boolean) => {
  const sortedBids = bids.sort((a, b) => {
    if (b.order.price === a.order.price) return Number(a.order.nonce) - Number(b.order.nonce)
    if (isSelling) return Number(b.order.price) - Number(a.order.price)

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

export const categorizeBidsWithReason = (
  sortedBids: Array<Bid>,
  auction: Auction,
  _approvalMap: BigNumMap,
  _balanceMap: BigNumMap,
) => {
  const approvalMap = { ..._approvalMap }
  const balanceMap = { ..._balanceMap }
  const quantity = BigNumber.from(auction.oSqthAmount)
  const auctionPrice = BigNumber.from(auction.price)

  let filledAmt = BigNumber.from(0)

  const filteredBids = sortedBids
    .map(b => {
      const _osqth = BigNumber.from(b.order.quantity)
      const _price = BigNumber.from(b.order.price)
      const erc20Needed = auction.isSelling ? wmul(_osqth, _price) : _osqth

      if ((auction.isSelling && _price.lt(auctionPrice)) || (!auction.isSelling && _price.gt(auctionPrice)))
        return { ...b, status: BidStatus.PRICE_MISMATCH }

      if (auction.isSelling != b.order.isBuying) return { ...b, status: BidStatus.ORDER_DIRECTION_MISMATCH }

      if (_osqth.lt(toBigNumber(auction.minSize, 18))) return { ...b, status: BidStatus.MIN_SIZE_NOT_MET }

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

export const getBidsWithReasonMap = (bids: Array<Bid & { status?: BidStatus }>) => {
  return bids.reduce((acc, bid) => {
    acc[`${bid.bidder}-${bid.order.nonce}`] = bid
    return acc
  }, {} as { [key: string]: Bid & { status?: BidStatus } })
}

export const getWinningBidsForUser = (auction: Auction, user: string) => {
  let qtyLeft = BigNumber.from(auction.oSqthAmount)

  const winningBids = auction.winningBids.map(wb => {
    const bid = { ...auction.bids[wb] }
    const filledAmount = qtyLeft.lt(bid.order.quantity) ? qtyLeft : BigNumber.from(bid.order.quantity)
    qtyLeft = qtyLeft.sub(filledAmount)
    return { ...auction.bids[wb], filledAmount }
  })

  return winningBids.filter(b => b.bidder.toLowerCase() === user.toLowerCase())
}

export const getQtyFromBids = (bids: Array<BidWithStatus>, maxQty: string) => {
  const _max = BigNumber.from(maxQty)

  const qty = bids.reduce((acc, b) => {
    return acc.add(b.order.quantity)
  }, BigNumber.from(0))

  return qty.gt(_max) ? maxQty : qty.toString()
}

export const getUserBids = (bids: Bid[], user: string) => {
  return bids.filter(b => b.bidder.toLowerCase() === user.toLowerCase())
}

export const getAuctionStatus = (auction: Auction) => {
  const currentMillis = Date.now()
  if (auction.tx) return AuctionStatus.SETTLED
  if (currentMillis < auction.auctionEnd && currentMillis > auction.auctionEnd - V2_AUCTION_TIME_MILLIS)
    return AuctionStatus.LIVE
  if (currentMillis < auction.auctionEnd + V2_AUCTION_TIME_MILLIS && currentMillis > auction.auctionEnd)
    return AuctionStatus.SETTLEMENT
  if (currentMillis < auction.auctionEnd) return AuctionStatus.UPCOMING

  return AuctionStatus.SETTLED
}

export const getTxBidsAndClearingPrice = (filteredBids: Array<BidWithStatus>) => {
  const bids = filteredBids.filter(b => b.status <= BidStatus.PARTIALLY_FILLED)

  return { bids, clearingPrice: bids[bids.length - 1].order.price }
}

export const getEstimatedClearingPrice = (bids: Bid[], qty: string) => {
  const quantity = BigNumber.from(qty)
  let clearingPrice = '0'
  let usedQty = BIG_ZERO
  for (const bid of bids) {
    if (usedQty.lt(quantity)) {
      usedQty = usedQty.add(bid.order.quantity)
      clearingPrice = bid.order.price
    } else {
      break
    }
  }

  return clearingPrice
}

export const getMinSize = (maxFeePerGas: BigNumber, oSqthPrice: number) => {
  const minEth = (Number(maxFeePerGas.toString()) * 125_000) / 1e18 / 0.005
  const minSqth = minEth / oSqthPrice

  return Math.ceil(minSqth * 10) / 10
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

export const messageWithTimeType = {
  Mandate: [
    { type: 'string', name: 'message' },
    { type: 'uint256', name: 'time' },
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
    const delta = oSqthDelta.gt(ethDelta) ? oSqthDelta.sub(ethDelta) : ethDelta.sub(oSqthDelta)
    return { isSellingAuction: !oSqthDelta.gt(ethDelta), target: wdiv(delta, sqthPrice), delta }
  }

  const { isSellingAuction, target, delta } = getAuctionTypeAndTargetHedge()
  const ethProceeds = wmul(target, sqthPrice)

  return { isSellingAuction, oSqthAmount: target, ethAmount: ethProceeds, delta }
}

export const getBgColor = (status?: BidStatus) => {
  if (status === undefined) return ''

  if (status > BidStatus.PARTIALLY_FILLED) return 'error.light'
  if (status === BidStatus.PARTIALLY_FILLED) return 'warning.light'

  return 'success.light'
}

export const signMessageWithTime = async (signer: any, data: MessageWithTimeSignature) => {
  const signature = await signer._signTypedData(domain, messageWithTimeType, data)
  const { r, s, v } = ethers.utils.splitSignature(signature)

  return { signature, r, s, v }
}

export const verifyMessageWithTime = (data: MessageWithTimeSignature, signature: string, address: string) => {
  const addr = ethers.utils.verifyTypedData(domain, messageWithTimeType, data, signature!)
  return address.toLowerCase() === addr.toLowerCase()
}

export const validateOrderWithBalance = (
  order: Order,
  auction: Auction,
  traderAllowance: BigNumber,
  traderBalance: BigNumber,
) => {
  let isValidOrder = true
  let response = ''

  if (order.isBuying != auction.isSelling && auction.oSqthAmount !== '0') {
    isValidOrder = false
    response = 'Incorrect order direction'
  } else if (auction.auctionEnd < Date.now() && auction.auctionEnd != 0) {
    isValidOrder = false
    response = 'Auction already over'
  } else if (BigNumber.from(order.quantity).lt(toBigNumber(auction.minSize.toString(), 18))) {
    isValidOrder = false
    response = 'Order qunatity is less than auction min size'
  } else if (order.bidId != auction.currentAuctionId) {
    isValidOrder = false
    response = "Bid ID should be same of auction's currentAuctionId"
  } else if (order.isBuying) {
    if (BigNumber.from(order.price).lt(auction.price)) {
      isValidOrder = false
      response = 'Price should be greater than min price'
    }

    const tradeAmount = wmul(BigNumber.from(order.quantity), order.price)
    if (traderAllowance.lt(tradeAmount) || traderBalance.lt(tradeAmount)) {
      isValidOrder = false
      response = 'Amount approved or balance is less than order quantity'
    }
  } else if (!order.isBuying) {
    if (BigNumber.from(order.price).gt(auction.price) && auction.price !== '0') {
      isValidOrder = false
      response = 'Price should be less than max price'
    }

    if (traderAllowance.lt(order.quantity) || traderBalance.lt(order.quantity)) {
      isValidOrder = false
      response = 'Amount approved or balance is less than order quantity'
    }
  }

  return { isValidOrder, response }
}

export const validateOrder = async (order: Order, auction: Auction) => {
  if (order.isBuying) {
    const wethContract = new ethers.Contract(WETH, erc20Abi, provider) as ERC20
    const traderBalance = await wethContract.balanceOf(order.trader)
    const traderAllowance = await wethContract.allowance(order.trader, CRAB_STRATEGY_V2)
    return validateOrderWithBalance(order, auction, traderAllowance, traderBalance)
  } else {
    const squeethContract = new ethers.Contract(OSQUEETH, erc20Abi, provider)
    const traderBalance = await squeethContract.balanceOf(order.trader)
    const traderAllowance = await squeethContract.allowance(order.trader, CRAB_STRATEGY_V2)
    return validateOrderWithBalance(order, auction, traderAllowance, traderBalance)
  }
}

export const getBidStatus = (status?: BidStatus) => {
  if (status === BidStatus.INCLUDED) return 'Included'
  if (status === BidStatus.PARTIALLY_FILLED) return 'Partially included'
  if (status === BidStatus.NO_APPROVAL) return 'Not enough approval'
  if (status === BidStatus.NO_BALANCE) return 'Not enough balance'
  if (status === BidStatus.ALREADY_FILLED) return 'Not included'
  if (status === BidStatus.PRICE_MISMATCH) return 'min/max price criteria not met'
  if (status === BidStatus.ORDER_DIRECTION_MISMATCH) return 'Wrong order direction'
  if (status === BidStatus.MIN_SIZE_NOT_MET) return 'Qty less than min size'

  return '--'
}
