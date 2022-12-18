import { BigNumber } from 'ethers'
import { Vault } from '../types'
import { wdiv, wmul } from './math'

export function getWsqueethFromCrabAmount(crabAmount: BigNumber, vault: Vault, supply: BigNumber) {
  return wdiv(wmul(vault.shortAmount, crabAmount), supply)
}

export function getCrabFromSqueethAmount(squeethAmount: BigNumber, vault: Vault, supply: BigNumber) {
  return wdiv(wmul(squeethAmount, supply), vault.shortAmount)
}
