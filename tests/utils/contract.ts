import { Contract } from 'ethers'
import { BIG_ONE } from '../../constants/numbers'

export default class MockContract extends Contract {
  balanceOf(owner: string) {
    return Promise.resolve(BIG_ONE)
  }
}
