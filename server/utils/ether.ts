import { ethers } from 'ethers'
import { CRAB_STRATEGY_V2, NETWORK } from '../../constants/address'
import crabAbi from '../../abis/crabStrategyV2.json'
import { CrabStrategyV2 } from '../../types/contracts'
import { CHAIN_ID } from '../../constants/numbers'

export const verifyMessage = (message: string, signature: string, address: string) => {
  const addr = ethers.utils.verifyMessage(message, signature!)
  return address.toLowerCase() === addr.toLowerCase()
}

export const provider = new ethers.providers.AlchemyProvider(CHAIN_ID, process.env.NEXT_PUBLIC_ALCHEMY_API_KEY)

export const crabV2Contract = new ethers.Contract(CRAB_STRATEGY_V2, crabAbi, provider) as CrabStrategyV2
