import { CRAB_STRATEGY_V2, OSQUEETH, WETH, CRAB_OTC } from './address'
import crabAbi from '../abis/crabStrategyV2.json'
import crabOtcAbi from '../abis/crabOtc.json'
import erc20Abi from '../abis/ERC20.json'

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
