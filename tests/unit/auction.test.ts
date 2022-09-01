import { describe, expect, test } from '@jest/globals'
import { BIG_ONE } from '../../constants/numbers'
import { Auction, BidStatus, Order } from '../../types'
import { emptyAuction, getBidStatus, validateOrderWithBalance } from '../../utils/auction'
import { toBigNumber } from '../../utils/math'

const POINT_ONE = toBigNumber(0.1)

describe('Util: Auction: Validate order', () => {
  const auctionWithoutParams: Auction = { ...emptyAuction, currentAuctionId: 1, nextAuctionId: 2 }
  const auctionWithParams: Auction = {
    ...emptyAuction,
    currentAuctionId: 1,
    nextAuctionId: 2,
    auctionEnd: Date.now() + 500000000,
    minSize: 1,
    price: BIG_ONE.toString(),
    oSqthAmount: BIG_ONE.toString(),
  }
  const ten = toBigNumber(10, 18)

  test('Should not throw error for incorrect direction if quantity is 0', () => {
    const order: Order = {
      bidId: 1,
      trader: '0x1',
      quantity: ten.toString(),
      price: BIG_ONE.toString(),
      isBuying: true,
      expiry: Date.now(),
      nonce: 1,
    }

    const { isValidOrder, response } = validateOrderWithBalance(order, auctionWithoutParams, ten, ten)
    expect(response).toBe('')
    expect(isValidOrder).toBe(true)
  })

  test('Should throw error for wrong bidId', () => {
    const order: Order = {
      bidId: 2,
      trader: '0x1',
      quantity: ten.toString(),
      price: BIG_ONE.toString(),
      isBuying: true,
      expiry: Date.now(),
      nonce: 1,
    }

    const { isValidOrder, response } = validateOrderWithBalance(order, auctionWithoutParams, ten, ten)
    expect(response).toBe("Bid ID should be same of auction's currentAuctionId")
    expect(isValidOrder).toBe(false)
  })

  test('Should throw error for incorrect direction', () => {
    const order: Order = {
      bidId: 1,
      trader: '0x1',
      quantity: ten.toString(),
      price: BIG_ONE.toString(),
      isBuying: true,
      expiry: Date.now(),
      nonce: 1,
    }

    const { isValidOrder, response } = validateOrderWithBalance(order, auctionWithParams, ten, ten)
    expect(response).toBe('Incorrect order direction')
    expect(isValidOrder).toBe(false)
  })

  test('Should not throw error for min size if auction end is 0', () => {
    const order: Order = {
      bidId: 1,
      trader: '0x1',
      quantity: toBigNumber(0.1, 18).toString(),
      price: BIG_ONE.toString(),
      isBuying: false,
      expiry: Date.now(),
      nonce: 1,
    }

    const { isValidOrder, response } = validateOrderWithBalance(order, auctionWithoutParams, ten, ten)
    expect(response).toBe('')
    expect(isValidOrder).toBe(true)
  })

  test('Should throw error for min size', () => {
    const order: Order = {
      bidId: 1,
      trader: '0x1',
      quantity: toBigNumber(0.1, 18).toString(),
      price: BIG_ONE.toString(),
      isBuying: false,
      expiry: Date.now(),
      nonce: 1,
    }

    const { isValidOrder, response } = validateOrderWithBalance(order, auctionWithParams, ten, ten)
    expect(response).toBe('Order qunatity is less than auction min size')
    expect(isValidOrder).toBe(false)
  })

  test('Should throw error auction is over', () => {
    const endedAuction = { ...auctionWithParams, auctionEnd: Date.now() - 10 }

    const order: Order = {
      bidId: 1,
      trader: '0x1',
      quantity: BIG_ONE.toString(),
      price: BIG_ONE.toString(),
      isBuying: false,
      expiry: Date.now(),
      nonce: 1,
    }

    const { isValidOrder, response } = validateOrderWithBalance(order, endedAuction, BIG_ONE, BIG_ONE)
    expect(response).toBe('Auction already over')
    expect(isValidOrder).toBe(false)
  })

  describe('Auction selling', () => {
    const sellingAuctionWithoutParams: Auction = { ...auctionWithoutParams, isSelling: true }
    const sellingAuctionWithParams: Auction = {
      ...auctionWithParams,
      isSelling: true,
      price: toBigNumber(0.1).toString(),
    }

    test('Should not throw error if for min price if min price is 0', () => {
      const order: Order = {
        bidId: 1,
        trader: '0x1',
        quantity: toBigNumber(0.1, 18).toString(),
        price: BIG_ONE.toString(),
        isBuying: true,
        expiry: Date.now(),
        nonce: 1,
      }

      const { isValidOrder } = validateOrderWithBalance(order, sellingAuctionWithoutParams, ten, ten)
      expect(isValidOrder).toBe(true)
    })

    test('Should throw error if for min price', () => {
      const order: Order = {
        bidId: 1,
        trader: '0x1',
        quantity: BIG_ONE.toString(),
        price: toBigNumber(0.01).toString(),
        isBuying: true,
        expiry: Date.now(),
        nonce: 1,
      }

      const { isValidOrder, response } = validateOrderWithBalance(order, sellingAuctionWithParams, ten, ten)
      expect(response).toBe('Price should be greater than min price')
      expect(isValidOrder).toBe(false)
    })

    test('Should throw error if approval or balance not enough', () => {
      const order: Order = {
        bidId: 1,
        trader: '0x1',
        quantity: BIG_ONE.toString(),
        price: toBigNumber(0.2).toString(),
        isBuying: true,
        expiry: Date.now(),
        nonce: 1,
      }

      const { isValidOrder: isValidOrderApproval, response: responseApproval } = validateOrderWithBalance(
        order,
        sellingAuctionWithParams,
        POINT_ONE,
        POINT_ONE,
      )
      expect(responseApproval).toBe('Amount approved or balance is less than order quantity')
      expect(isValidOrderApproval).toBe(false)

      const { isValidOrder: isValidOrderBal, response: responseBal } = validateOrderWithBalance(
        order,
        sellingAuctionWithParams,
        toBigNumber(0.2),
        POINT_ONE,
      )
      expect(responseBal).toBe('Amount approved or balance is less than order quantity')
      expect(isValidOrderBal).toBe(false)
    })

    test('Should not throw error if approval and balance is enough', () => {
      const order: Order = {
        bidId: 1,
        trader: '0x1',
        quantity: BIG_ONE.toString(),
        price: POINT_ONE.toString(),
        isBuying: true,
        expiry: Date.now(),
        nonce: 1,
      }

      const { isValidOrder } = validateOrderWithBalance(order, sellingAuctionWithParams, POINT_ONE, POINT_ONE)
      expect(isValidOrder).toBe(true)
    })
  })

  describe('Auction buying', () => {
    const buyingAuctionWithoutParams: Auction = { ...auctionWithoutParams, isSelling: false }
    const buyingAuctionWithParams: Auction = {
      ...auctionWithParams,
      isSelling: false,
      price: BIG_ONE.toString(),
    }

    test('Should not throw error for max price if max price is 0', () => {
      const order: Order = {
        bidId: 1,
        trader: '0x1',
        quantity: toBigNumber(0.1, 18).toString(),
        price: toBigNumber(2).toString(),
        isBuying: false,
        expiry: Date.now(),
        nonce: 1,
      }

      const { isValidOrder } = validateOrderWithBalance(order, buyingAuctionWithoutParams, ten, ten)
      expect(isValidOrder).toBe(true)
    })

    test('Should throw error if for max price', () => {
      const order: Order = {
        bidId: 1,
        trader: '0x1',
        quantity: BIG_ONE.toString(),
        price: toBigNumber(2).toString(),
        isBuying: false,
        expiry: Date.now(),
        nonce: 1,
      }

      const { isValidOrder, response } = validateOrderWithBalance(order, buyingAuctionWithParams, ten, ten)
      expect(response).toBe('Price should be less than max price')
      expect(isValidOrder).toBe(false)
    })

    test('Should throw error if approval or balance not enough', () => {
      const order: Order = {
        bidId: 1,
        trader: '0x1',
        quantity: BIG_ONE.toString(),
        price: BIG_ONE.toString(),
        isBuying: false,
        expiry: Date.now(),
        nonce: 1,
      }

      const { isValidOrder: isValidOrderApproval, response: responseApproval } = validateOrderWithBalance(
        order,
        buyingAuctionWithParams,
        POINT_ONE,
        BIG_ONE,
      )
      expect(responseApproval).toBe('Amount approved or balance is less than order quantity')
      expect(isValidOrderApproval).toBe(false)

      const { isValidOrder: isValidOrderBal, response: responseBal } = validateOrderWithBalance(
        order,
        buyingAuctionWithParams,
        BIG_ONE,
        POINT_ONE,
      )
      expect(responseBal).toBe('Amount approved or balance is less than order quantity')
      expect(isValidOrderBal).toBe(false)
    })

    test('Should not throw error if approval and balance is enough', () => {
      const order: Order = {
        bidId: 1,
        trader: '0x1',
        quantity: BIG_ONE.toString(),
        price: POINT_ONE.toString(),
        isBuying: false,
        expiry: Date.now(),
        nonce: 1,
      }

      const { isValidOrder } = validateOrderWithBalance(order, buyingAuctionWithParams, BIG_ONE, BIG_ONE)
      expect(isValidOrder).toBe(true)
    })
  })
})
