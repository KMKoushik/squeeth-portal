import { describe, expect, test } from '@jest/globals'
import Contract from '../utils/contract'
import { erc20ABI } from 'wagmi'
import { USDC } from '../../constants/address'
import { BIG_ONE } from '../../constants/numbers'
import { ERC20, Quoter } from '../../types/contracts'
import { getBalance } from '../../utils/quoter'

const contractMock = jest.spyOn(Contract.prototype, 'balanceOf').mockImplementation((owner: string) => {
  return Promise.resolve(BIG_ONE.mul(2))
})

describe('Util: Quoter', () => {
  test('A random test', async () => {
    const erc20 = new Contract(USDC, erc20ABI) as ERC20

    const balance = await getBalance(erc20, '0x2')
    expect(contractMock).toHaveBeenCalled()
    expect(balance.toString()).toBe(BIG_ONE.mul(2).toString())
  })
})
