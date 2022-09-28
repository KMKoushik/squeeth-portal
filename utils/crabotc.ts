import { ethers } from 'ethers'
import { CRAB_OTC } from '../constants/address'
import { CHAIN_ID } from '../constants/numbers'
import { CrabOTCOrder } from '../types'

export const crabOtcdomain = {
  name: 'CrabOTC',
  version: '2',
  chainId: CHAIN_ID,
  verifyingContract: CRAB_OTC,
}

export const crabOtctype = {
  Order: [
    { type: 'address', name: 'initiator' },
    { type: 'address', name: 'trader' },
    { type: 'uint256', name: 'quantity' },
    { type: 'uint256', name: 'price' },
    { type: 'bool', name: 'isBuying' },
    { type: 'uint256', name: 'expiry' },
    { type: 'uint256', name: 'nonce' },
  ],
}

export const verifyOTCOrder = (order: CrabOTCOrder, signature: string, address: string) => {
  const addr = ethers.utils.verifyTypedData(crabOtcdomain, crabOtctype, order, signature)
  return address.toLowerCase() === addr.toLowerCase()
}

export const signOTCOrder = async (signer: any, order: CrabOTCOrder) => {
  const signature = await signer._signTypedData(crabOtcdomain, crabOtctype, order)
  const { r, s, v } = ethers.utils.splitSignature(signature)

  return { signature, r, s, v }
}
