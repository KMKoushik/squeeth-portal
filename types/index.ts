import { BigNumber } from 'ethers'

declare module '@mui/material/styles/createPalette' {
  interface TypeBackground {
    base?: string
    surface?: string
    overlayDark?: string
    overlayLight?: string
  }
}

export enum HedgeType {
  TIME_HEDGE = 1,
  PRICE_HEDGE,
  TIME_HEDGE_ON_UNISWAP,
  PRICE_HEDGE_ON_UNISWAP,
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
  r: string
  s: string
  v: number
  bidder: string
}

export type BidWithStatus = Bid & { status: BidStatus }

export type Auction = {
  currentAuctionId: number
  nextAuctionId: number
  oSqthAmount: string
  price: string
  auctionEnd: number
  isSelling: boolean
  tx?: string
  bids: { [k: string]: Bid }
  winningBids: Array<string>
  clearingPrice: string
  minSize: number
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
