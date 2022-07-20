import { BigNumber } from 'ethers'

export const BIG_ZERO = BigNumber.from(0)

export const BIG_ONE = BigNumber.from(10).pow(18)

export const INDEX_SCALE = 10000

export const FUNDING_PERIOD = 17.5

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 1)

export const MAX_UINT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

export const AUCTION_TIME = 1200

export const V2_AUCTION_TIME = 10 //10 mins
