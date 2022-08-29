import { describe, expect, test } from '@jest/globals'
import { BidStatus } from '../../types'
import { getBidStatus } from '../../utils/auction'

describe('Util: Auction', () => {
  describe('Bid status', () => {
    test('Should not get "--" as bid status', () => {
      console.log(Object.values(BidStatus))
    })
  })
})
