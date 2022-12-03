import {
  CRAB_STRATEGY_V2,
  OSQUEETH,
  WETH,
  CRAB_OTC,
  CRAB_NETTING,
  QUOTER,
  BULL_STRATEGY,
  AUCTION_BULL,
  USDC_D_TOKEN,
  WETH_E_TOKEN,
} from './address'
import crabAbi from '../abis/crabStrategyV2.json'
import crabOtcAbi from '../abis/crabOtc.json'
import erc20Abi from '../abis/ERC20.json'
import crabNettingAbi from '../abis/crabNetting.json'
import quoterAbi from '../abis/quoter.json'
import bullStrategyAbi from '../abis/bullStrategy.json'
import auctionBullAbi from '../abis/auctionBull.json'
import eulerDTokenAbi from '../abis/eulerDToken.json'
import eulerETokenAbi from '../abis/eulerEToken.json'

// Need to implement for other contracts as well

export const CRAB_V2_CONTRACT = {
  addressOrName: CRAB_STRATEGY_V2,
  contractInterface: crabAbi,
}

export const OSQUEETH_CONTRACT = {
  addressOrName: OSQUEETH,
  contractInterface: erc20Abi,
}

export const WETH_CONTRACT = {
  addressOrName: WETH,
  contractInterface: erc20Abi,
}

export const CRAB_OTC_CONTRACT = {
  addressOrName: CRAB_OTC,
  contractInterface: crabOtcAbi,
}

export const CRAB_NETTING_CONTRACT = {
  addressOrName: CRAB_NETTING,
  contractInterface: crabNettingAbi,
}

export const QUOTER_CONTRACT = {
  addressOrName: QUOTER,
  contractInterface: quoterAbi,
}

export const BULL_CONTRACT = {
  addressOrName: BULL_STRATEGY,
  contractInterface: bullStrategyAbi,
}

export const AUCTION_BULL_CONTRACT = {
  addressOrName: AUCTION_BULL,
  contractInterface: auctionBullAbi,
}

export const USDC_D_TOKEN_CONTRACT = {
  addressOrName: USDC_D_TOKEN,
  contractInterface: eulerDTokenAbi,
}

export const WETH_E_TOKEN_CONTRACT = {
  addressOrName: WETH_E_TOKEN,
  contractInterface: eulerETokenAbi,
}
