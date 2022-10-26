import { ethers, BigNumber } from 'ethers'
import { CRAB_OTC, WETH, OSQUEETH, CRAB_STRATEGY_V2 } from '../constants/address'
import { BIG_ZERO, CHAIN_ID } from '../constants/numbers'
import { CrabOTCBid, CrabOTCOrder, CrabOtcType, CrabOTCWithData } from '../types'
import erc20Abi from '../abis/ERC20.json'
import { provider } from '../server/utils/ether'
import { ERC20 } from '../types/contracts'
import { convertBigNumber } from './math'

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

export const validateOrder = async (bid: CrabOTCBid, crabOtc: CrabOTCWithData, bidId: Number) => {
  let isValidOrder = true
  let response = ''
  const executionTime = Date.now()

  if (executionTime > (crabOtc?.data?.expiry || 0)) {
    isValidOrder = false
    response = 'Order expired...Create/Update order above'
    return { isValidOrder, response }
  } else if (executionTime > (bid?.order.expiry || 0)) {
    isValidOrder = false
    response = `Bid #${bidId} expired`
    return { isValidOrder, response }
  }

  if (crabOtc.data.type == CrabOtcType.DEPOSIT) {
    const wethContract = new ethers.Contract(WETH, erc20Abi, provider) as ERC20
    const traderBalance = await wethContract.balanceOf(bid?.order?.trader)
    const traderAllowance = await wethContract.allowance(bid?.order?.trader, CRAB_OTC)
    return validateBalance(bid, crabOtc, bidId, traderAllowance, traderBalance)
  } else {
    const squeethContract = new ethers.Contract(OSQUEETH, erc20Abi, provider)
    const traderBalance = await squeethContract.balanceOf(bid?.order?.trader)
    const traderAllowance = await squeethContract.allowance(bid?.order?.trader, CRAB_OTC)
    return validateBalance(bid, crabOtc, bidId, traderAllowance, traderBalance)
  }
}

export const validateBalance = (
  bid: CrabOTCBid,
  crabOtc: CrabOTCWithData,
  bidId: Number,
  traderAllowance: BigNumber,
  traderBalance: BigNumber,
) => {
  let isValidOrder = true
  let response = ''

  const tradeAmount =
    crabOtc.data.type == CrabOtcType.DEPOSIT
      ? convertBigNumber(bid?.order?.price || BIG_ZERO) * convertBigNumber(bid?.order.quantity || BIG_ZERO)
      : convertBigNumber(bid?.order?.quantity || BIG_ZERO)
  if (tradeAmount > convertBigNumber(traderBalance)) {
    isValidOrder = false
    response = `Insufficient bidder funds for Bid #${bidId}`
    return { isValidOrder, response }
  }
  if (convertBigNumber(traderAllowance) < tradeAmount || convertBigNumber(traderBalance) < tradeAmount) {
    isValidOrder = false
    response = `Amount approved or balance is less than order quantity for Bid #${bidId}`
    return { isValidOrder, response }
  }

  return { isValidOrder, response }
}

export const sortBidsForBidArray = (bids: Array<CrabOTCBid>, isSelling: boolean) => {
  const sortedBids = bids.sort((a, b) => {
    if (b.order.price === a.order.price) return Number(a.order.nonce) - Number(b.order.nonce)
    if (isSelling) return Number(b.order.price) - Number(a.order.price)

    return Number(a.order.price) - Number(b.order.price)
  })

  return sortedBids
}
