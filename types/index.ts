import { BigNumber } from 'ethers'

declare module '@mui/material/styles/createPalette' {
  interface TypeBackground {
    base?: string
    surface?: string
    overlayDark?: string
    overlayLight?: string
  }
}

declare module 'ethers' {
  interface BigNumber {
    wmul(num: BigNumber): BigNumber
    wdiv(divisor: BigNumber): BigNumber
  }
}

export enum HedgeType {
  TIME_HEDGE = 1,
  PRICE_HEDGE,
  TIME_HEDGE_ON_UNISWAP,
  PRICE_HEDGE_ON_UNISWAP,
}

export enum AuctionType {
  CRAB_HEDGE,
  NETTING,
  CALM_BULL,
}

export type Order = {
  bidId: number
  trader: string
  quantity: string
  price: string
  isBuying: boolean
  expiry: number
  nonce: number
}

export type Bid = {
  order: Order
  signature: string
  bidder: string
  updatedTime?: number
  status?: BidStatus
}

export type BidWithStatus = Bid & { status: BidStatus }

export type Auction = {
  currentAuctionId: number
  nextAuctionId: number
  oSqthAmount: string
  usdAmount?: string
  crabAmount?: string
  price: string
  auctionEnd: number
  isSelling: boolean
  tx?: string
  bids: { [k: string]: Bid }
  winningBids: Array<string>
  clearingPrice: string
  minSize: number
  ethPrice?: string
  oSqthPrice?: string
  osqthRefVol?: number
  normFactor?: string
  executedTime?: number
  type: AuctionType
  wethLimitPrice?: string
}

export enum BidStatus {
  INCLUDED = 1,
  PARTIALLY_FILLED,
  ALREADY_FILLED,
  PRICE_MISMATCH,
  ORDER_DIRECTION_MISMATCH,
  MIN_SIZE_NOT_MET,
  NO_BALANCE,
  NO_APPROVAL,
  WRONG_AUCTION_TYPE,
}

export enum AuctionStatus {
  LIVE = 1,
  SETTLEMENT,
  SETTLED,
  UPCOMING,
}

export type Vault = {
  address: string
  shortAmount: BigNumber
  collateral: BigNumber
}

export type BigNumMap = { [key: string]: BigNumber }

export type MessageWithTimeSignature = {
  message: string
  time: number
}

export enum CrabOtcType {
  DEPOSIT = 1,
  WITHDRAW,
}

export type CrabOTCOrder = {
  initiator: string
  trader: string
  quantity: string
  price: string
  isBuying: boolean
  expiry: number
  nonce: number
}

export type CrabOTCBid = {
  order: CrabOTCOrder
  signature: string
}

export type CrabOTC = {
  cid: string
  createdBy: string
  id?: string
  tx?: string
  usedBid?: string
}

export type CrabOTCData = {
  depositAmount: number
  withdrawAmount: number
  createdBy: string
  expiry: number
  limitPrice: number
  quantity: string
  type: CrabOtcType
  bids: { [k: string]: CrabOTCBid }
  sortedBids: CrabOTCBid[]
}

export type CrabOTCWithData = CrabOTC & {
  data: CrabOTCData
}

export enum BullRebalanceType {
  LEVERAGE = 1,
  FULL,
}

export type BullRebalance = {
  id: number
  type: BullRebalanceType
  safeTxHash: string
  cr: string
  delta: string
  estimatedCr: string
  estimatedDelta: string
  timestamp: number
  leverageParams?: {
    isSellingUSDC: boolean
    usdcToTrade: string
    limitPrice: string
  }
  fullParams?: {
    auctionId: number
    isSelling: boolean
    crabAmount: string
    wethTargetInEuler: string
    wethLimitPrice: string
  }
}
