/* eslint-disable prettier/prettier */
import { Button, Grid, InputAdornment, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { BigNumber } from 'bignumber.js'
import React, { useEffect, useMemo } from 'react'
import { useSigner } from 'wagmi'
import shallow from 'zustand/shallow'
import DangerButton from '../../../components/button/DangerButton'
import { BoxLoadingButton } from '../../../components/button/PrimaryButton'
import { SecondaryButton } from '../../../components/button/SecondaryButton'
import { MM_CANCEL } from '../../../constants/message'
import { BIG_ZERO } from '../../../constants/numbers'
import useToaster from '../../../hooks/useToaster'
import useCrabV2Store from '../../../store/crabV2Store'
import { AuctionStatus, Order, MessageWithTimeSignature } from '../../../types'
import { getUserBids, signOrder, signMessageWithTime } from '../../../utils/auction'
import {
  convertBigNumber,
  formatBigNumber,
  toBigNumber,
  wmul,
  calculateDollarValue,
  calculateIV,
  convertBigNumberStr,
} from '../../../utils/math'
import Bids from './Bids'
import FilledBids from './FilledBids'
import usePriceStore from '../../../store/priceStore'
import useControllerStore from '../../../store/controllerStore'
import RestrictionInfo from '../../../components/RestrictionInfo'
import useAccountStore from '../../../store/accountStore'

const AuctionBody: React.FC = () => {
  const isHistoricalView = useCrabV2Store(s => s.isHistoricalView)
  const auction = useCrabV2Store(s => s.auction)
  const [seeMyBids, setSeeMyBids] = React.useState(false)

  const toggleSeeMyBid = () => {
    setSeeMyBids(!seeMyBids)
  }

  const action = auction.isSelling ? 'Bids' : 'Offers'

  return (
    <section id="bids_offers" style={{ paddingTop: '8px' }}>
      <Box display="flex" gap={2} mt={4} mb={1}>
        <Typography variant="h6">{action}</Typography>
        {seeMyBids ? (
          <Button color="error" onClick={toggleSeeMyBid}>
            Show All {action}
          </Button>
        ) : (
          <Button onClick={toggleSeeMyBid}>Show My {action}</Button>
        )}
      </Box>
      <Grid container spacing={5}>
        <Grid item xs={12} md={6} lg={8}>
          <Bids seeMyBids={seeMyBids} />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          {isHistoricalView ? <FilledBids /> : <BidForm />}
        </Grid>
      </Grid>
    </section>
  )
}

const BidForm: React.FC = () => {
  const [price, setPrice] = React.useState('')
  const [qty, setQty] = React.useState('')
  const [isLoading, setLoading] = React.useState(false)
  const [deleteLoading, setDeleteLoading] = React.useState(false)

  const { data: signer } = useSigner()
  const auction = useCrabV2Store(s => s.auction)
  const { address, isRestricted: isUserRestricted } = useAccountStore(
    s => ({
      address: s.address,
      isRestricted: s.isRestricted,
    }),
    shallow,
  )
  const bidToEdit = useCrabV2Store(s => s.bidToEdit)
  const setBidToEdit = useCrabV2Store(s => s.setBidToEdit)
  const { oSqthApproval, wethApproval, auctionStatus, estClearingPrice } = useCrabV2Store(
    s => ({
      oSqthApproval: s.oSqthApproval,
      wethApproval: s.wethApproval,
      auctionStatus: s.auctionStatus,
      estClearingPrice: s.estClearingPrice,
    }),
    shallow,
  )
  const { oSqthBalance, wethBalance } = useAccountStore(
    s => ({ oSqthBalance: s.oSqthBalance, wethBalance: s.wethBalance }),
    shallow,
  )

  const { nfBN } = useControllerStore(s => ({ nfBN: s.normFactor }), shallow)

  const { ethPriceBN, oSqthPriceBN } = usePriceStore(
    s => ({ ethPriceBN: s.ethPrice, oSqthPriceBN: s.oSqthPrice }),
    shallow,
  )

  const ethPrice = convertBigNumber(ethPriceBN, 18)
  const oSqthPrice = convertBigNumber(oSqthPriceBN, 18)
  const nf = convertBigNumber(nfBN, 18)

  const showMessageFromServer = useToaster()

  const isEditBid = useMemo(() => {
    return bidToEdit && !!auction.bids[bidToEdit]
  }, [auction.bids, bidToEdit])

  const action = auction.isSelling ? 'Bid' : 'Offer'

  useEffect(() => {
    if (bidToEdit && isEditBid) {
      setPrice(convertBigNumberStr(auction.bids[bidToEdit].order.price, 18))
      setQty(convertBigNumberStr(auction.bids[bidToEdit].order.quantity, 18))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bidToEdit, isEditBid])

  const userBids = useMemo(() => {
    return getUserBids(Object.values(auction.bids), address!)
  }, [address, auction.bids])

  const totalToSpendAcrossBids = useMemo(
    () =>
      userBids.reduce(
        (acc, bid) => {
          if (auction.isSelling) {
            acc = acc.add(wmul(bid.order.price, bid.order.quantity))
          } else {
            acc = acc.add(bid.order.quantity)
          }
          return acc
        },
        isEditBid
          ? BIG_ZERO.sub(
              auction.isSelling
                ? wmul(auction.bids[bidToEdit!].order.price, auction.bids[bidToEdit!].order.quantity)
                : auction.bids[bidToEdit!].order.quantity,
            )
          : BIG_ZERO,
      ),
    [auction.bids, auction.isSelling, bidToEdit, isEditBid, userBids],
  )

  const placeBid = React.useCallback(async () => {
    setLoading(true)

    try {
      const order: Order = {
        bidId: auction.currentAuctionId!,
        trader: address!,
        quantity: toBigNumber(qty).toString(),
        price: toBigNumber(price).toString(),
        isBuying: auction.isSelling,
        expiry: auction.auctionEnd + 30 * 60 * 1000,
        nonce: isEditBid ? auction.bids[bidToEdit!].order.nonce : Date.now(),
      }
      const { signature } = await signOrder(signer, order, auction.type)

      const resp = await fetch('/api/auction/createOrEditBid?web=true', {
        method: 'POST',
        body: JSON.stringify({ signature, order }),
        headers: { 'Content-Type': 'application/json' },
      })

      setBidToEdit(null)
      setPrice('')
      setQty('')

      showMessageFromServer(resp)
    } catch (e) {
      console.log(e)
    }

    setLoading(false)
  }, [
    auction.currentAuctionId,
    auction.isSelling,
    auction.auctionEnd,
    auction.bids,
    auction.type,
    address,
    qty,
    price,
    isEditBid,
    bidToEdit,
    signer,
    setBidToEdit,
    showMessageFromServer,
  ])

  const cancelBid = React.useCallback(async () => {
    setDeleteLoading(true)
    try {
      const mandate: MessageWithTimeSignature = {
        message: MM_CANCEL,
        time: Date.now(),
      }

      const signature = await signMessageWithTime(signer, mandate, auction.type)

      if (bidToEdit) {
        const resp = await fetch('/api/auction/deleteBid?web=true', {
          method: 'Delete',
          body: JSON.stringify({ signature, bidId: bidToEdit, mandate }),
          headers: { 'Content-Type': 'application/json' },
        })
        showMessageFromServer(resp)
      }
    } catch (e) {
      console.log(e)
    }
    setDeleteLoading(false)
  }, [bidToEdit, showMessageFromServer, signer, auction])

  const totalWeth = Number(price) * Number(qty)

  const priceError = React.useMemo(() => {
    if (auction.price === '0') return
    const aucPrice = convertBigNumber(auction.price, 18)
    if (auction.isSelling && Number(price) < Number(aucPrice)) {
      return 'Price should be greater than min price'
    } else if (!auction.isSelling && Number(price) > Number(aucPrice)) {
      return 'Price should be less than max price'
    }
  }, [auction.isSelling, auction.price, price])

  const quantityError = React.useMemo(() => {
    console.log(auction.minSize > Number(qty), Number(qty), auction.minSize, auction.oSqthAmount)
    if (auction.minSize > Number(qty)) return `Qty should be more than min size: ${auction.minSize.toFixed(1)}`
    if (auction.oSqthAmount === '0') return
    const aucQty = convertBigNumber(auction.oSqthAmount, 18)
    if (aucQty < Number(qty)) return 'Quantity should be less than auction quantity'
  }, [auction.minSize, auction.oSqthAmount, qty])

  const approvalError = React.useMemo(() => {
    if (auction.isSelling && totalWeth > convertBigNumber(wethApproval)) {
      return 'Approve WETH in token approval section in the top'
    } else if (!auction.isSelling && Number(qty) > convertBigNumber(oSqthApproval)) {
      return 'Approve oSQTH in token approval section in the top'
    }
  }, [auction.isSelling, oSqthApproval, qty, totalWeth, wethApproval])

  const balanceError = React.useMemo(() => {
    if (auction.isSelling && totalWeth > convertBigNumber(wethBalance) - convertBigNumber(totalToSpendAcrossBids)) {
      return 'Need more WETH'
    } else if (
      !auction.isSelling &&
      Number(qty) > convertBigNumber(oSqthBalance) - convertBigNumber(totalToSpendAcrossBids)
    ) {
      return 'Need more oSQTH'
    }
  }, [auction.isSelling, oSqthBalance, qty, totalToSpendAcrossBids, totalWeth, wethBalance])

  const balance = React.useMemo(() => {
    if (auction.isSelling) {
      return convertBigNumber(wethBalance)
    } else {
      return convertBigNumber(oSqthBalance)
    }
  }, [auction.isSelling, oSqthBalance, wethBalance])

  const balanceToken = React.useMemo(() => {
    if (auction.isSelling) {
      return 'WETH'
    } else {
      return 'oSQTH'
    }
  }, [auction.isSelling])

  const setMaxBalance = React.useCallback(async () => {
    if (auction.isSelling) {
      setQty(new BigNumber(balance).div(new BigNumber(price)).toFixed(5))
    } else {
      setQty(balance.toString())
    }
  }, [balance, price, auction.isSelling])

  const error = priceError || quantityError || approvalError || balanceError

  const canPlaceBid = auctionStatus === AuctionStatus.LIVE || auctionStatus === AuctionStatus.UPCOMING

  const warning = useMemo(() => {
    const _estPrice = convertBigNumber(estClearingPrice, 18)
    if (
      _estPrice !== 0 &&
      ((auction.isSelling && Number(price) < _estPrice) || (!auction.isSelling && Number(price) > _estPrice))
    ) {
      return `You are quoting a worse price than the est. clearing price: ${_estPrice.toFixed(5)}`
    }
    if (auctionStatus === AuctionStatus.UPCOMING) {
      return `Auction not started yet. If the ${
        auction.isSelling ? 'min' : 'max'
      } price not matched, order will be cancelled`
    }
  }, [auction.isSelling, auctionStatus, estClearingPrice, price])

  return (
    <section id="placeBid" style={{ paddingTop: '12px' }}>
      <Box
        boxShadow={1}
        py={3}
        px={3}
        borderRadius={2}
        bgcolor="background.overlayDark"
        display="flex"
        flexDirection="column"
      >
        <Typography align="center" color="primary">
          {isEditBid ? `Edit ${action}` : `Place ${action}`}
        </Typography>
        <TextField
          value={qty}
          onChange={e => setQty(e.target.value)}
          type="number"
          id="quantity"
          label="Quantity"
          variant="outlined"
          size="small"
          sx={{ mt: 4 }}
          onWheel={e => (e.target as any).blur()}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Typography variant="caption" color="textSecondary" fontSize={12}>
                  oSQTH
                </Typography>
                <Button sx={{ ml: 2 }} onClick={() => setQty(convertBigNumberStr(auction.oSqthAmount, 18))}>
                  Max
                </Button>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          value={price}
          onChange={e => setPrice(e.target.value)}
          type="number"
          id="price"
          label="Price"
          variant="outlined"
          size="small"
          sx={{ mt: 3 }}
          onWheel={e => (e.target as any).blur()}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Typography variant="caption" color="textSecondary" fontSize={12}>
                  WETH
                </Typography>
              </InputAdornment>
            ),
          }}
        />
        <Box
          py={0.5}
          px={1}
          borderRadius={2}
          bgcolor="background.overlayLight"
          display="flex"
          justifyContent="space-between"
          onClick={setMaxBalance}
        >
          <Typography variant="body3">Balance</Typography>
          <Typography variant="body3" color="textSecondary">
            <Typography color="textSecondary" component="span">
              {balance.toFixed(5)}
            </Typography>{' '}
            {balanceToken}
          </Typography>
        </Box>
        <Box display="flex" mt={2} justifyContent="space-between">
          <Typography variant="body3">Total</Typography>
          <Typography variant="body2" color="textSecondary">
            <Typography color="textPrimary" component="span" variant="numeric">
              {totalWeth.toFixed(5)}
            </Typography>{' '}
            WETH
          </Typography>
        </Box>
        {price ? (
          <>
            <Box display="flex" mt={1} justifyContent="space-between">
              <Typography variant="body3">IV</Typography>
              <Typography variant="body2" color="textSecondary">
                <Typography color="textPrimary" component="span" variant="numeric">
                  {(calculateIV(Number(price), nf, ethPrice) * 100).toFixed(2)}
                </Typography>{' '}
                %
              </Typography>
            </Box>
          </>
        ) : null}
        <Box display="flex" mt={1} justifyContent="space-between">
          <Typography variant="body3">Total spending across bids</Typography>
          <Typography variant="body2" color="textSecondary">
            <Typography color="textPrimary" component="span" variant="numeric">
              {formatBigNumber(
                totalToSpendAcrossBids.add(
                  auction.isSelling ? wmul(toBigNumber(qty || 0), toBigNumber(price || 0)) : toBigNumber(qty || 0),
                ),
                18,
              )}
            </Typography>{' '}
            {auction.isSelling ? 'WETH' : 'oSQTH'}
          </Typography>
        </Box>
        {price && qty ? (
          <Typography align="center" mt={3} color="error.main" variant="body3">
            {error}
          </Typography>
        ) : null}
        {price && qty ? (
          <Typography align="center" mt={3} color="warning.main" variant="body3">
            {warning}
          </Typography>
        ) : null}

        {isUserRestricted && <RestrictionInfo />}
        <BoxLoadingButton
          disabled={!!error || !canPlaceBid || isUserRestricted}
          onClick={placeBid}
          sx={{ mt: 1 }}
          loading={isLoading}
        >
          {isUserRestricted ? 'Unavailable' : isEditBid ? `Edit ${action}` : `Place ${action}`}
        </BoxLoadingButton>
        {isEditBid ? (
          <>
            <SecondaryButton onClick={() => setBidToEdit(null)} sx={{ mt: 2 }}>
              Don&apos;t Edit
            </SecondaryButton>
            <DangerButton disabled={!canPlaceBid} loading={deleteLoading} onClick={cancelBid} sx={{ mt: 2 }}>
              Cancel {action}
            </DangerButton>
          </>
        ) : null}
      </Box>
    </section>
  )
}

export default AuctionBody
