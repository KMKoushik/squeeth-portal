import { BigNumber } from 'ethers'
import { etherscanBlockExplorers } from 'wagmi'
import { NETWORK } from './address'

export const BIG_ZERO = BigNumber.from(0)

export const ZERO = 0

export const BIG_ONE = BigNumber.from(10).pow(18)

export const POINT_ONE = BIG_ONE.div(10)

export const INDEX_SCALE = 10000

export const FUNDING_PERIOD = 17.5

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 1)

export const MAX_UINT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

export const AUCTION_TIME = 1200

export const V2_AUCTION_TIME = 10 //10 mins

export const V2_AUCTION_TIME_MILLIS = V2_AUCTION_TIME * 60 * 1000 //10 mins in milliseconds

export const ETHERSCAN = CHAIN_ID === 1 ? etherscanBlockExplorers.mainnet : etherscanBlockExplorers.goerli

export const V2_BID_REQUEST_USUAGE_EXPIRY = 5 //5 mins

export const V2_BID_REQUEST_USAGE_EXPIRY_TIME_MILLIS = V2_BID_REQUEST_USUAGE_EXPIRY * 60 * 1000 //2 mins in milliseconds

export const ETH_USDC_FEE = CHAIN_ID === 1 ? 500 : 3000

export const ETH_OSQTH_FEE = 3000

export const DEFAULT_SLIPPAGE = 0.25

export const TWAP_PERIOD = 420

export const WETH_DECIMALS_DIFF = 1e12

export const SHUTDOWN_DATE = '2023-11-16T13:00:00-08:00'
