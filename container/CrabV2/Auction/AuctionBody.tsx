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
import useAccountStore from '../../../store/accountStore'
import useCrabV2Store from '../../../store/crabV2Store'
import { AuctionStatus, Order } from '../../../types'
import { getUserBids, signOrder } from '../../../utils/auction'
import { convertBigNumber, formatBigNumber, toBigNumber } from '../../../utils/math'
import Bids from './Bids'
import FilledBids from './FilledBids'

const AuctionBody: React.FC = () => {
  const isHistoricalView = useCrabV2Store(s => s.isHistoricalView)
  const auction = useCrabV2Store(s => s.auction)
  const [seeMyBids, setSeeMyBids] = React.useState(false)

  const toggleSeeMyBid = () => {
    setSeeMyBids(!seeMyBids)
  }

  const action = auction.isSelling ? 'Bids' : 'Offers'

  return (
    <>
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
        <Grid item xs={12} md={12} lg={8}>
          <Bids seeMyBids={seeMyBids} />
        </Grid>
        <Grid item xs={12} md={12} lg={4}>
          {isHistoricalView ? <FilledBids /> : <BidForm />}
        </Grid>
      </Grid>
    </>
  )
}

const BidForm: React.FC = () => {
  const [price, setPrice] = React.useState('0')
  const [qty, setQty] = React.useState('0')
  const [isLoading, setLoading] = React.useState(false)
  const [deleteLoading, setDeleteLoading] = React.useState(false)

  const { data: signer } = useSigner()
  const auction = useCrabV2Store(s => s.auction)
  const address = useAccountStore(s => s.address)
  const bidToEdit = useCrabV2Store(s => s.bidToEdit)
  const minSize = useCrabV2Store(s => s.minOrder)
  const setBidToEdit = useCrabV2Store(s => s.setBidToEdit)
  const { oSqthApproval, wethApproval, auctionStatus } = useCrabV2Store(
    s => ({ oSqthApproval: s.oSqthApproval, wethApproval: s.wethApproval, auctionStatus: s.auctionStatus }),
    shallow,
  )
  const { oSqthBalance, wethBalance } = useAccountStore(
    s => ({ oSqthBalance: s.oSqthBalance, wethBalance: s.wethBalance }),
    shallow,
  )

  const showMessageFromServer = useToaster()

  const isEditBid = useMemo(() => {
    return bidToEdit && !!auction.bids[bidToEdit]
  }, [auction.bids, bidToEdit])

  const action = auction.isSelling ? 'Bid' : 'Offer'

  useEffect(() => {
    if (bidToEdit && isEditBid) {
      setPrice(convertBigNumber(auction.bids[bidToEdit].order.price, 18).toString())
      setQty(convertBigNumber(auction.bids[bidToEdit].order.quantity, 18).toString())
    }
  }, [auction.bids, bidToEdit, isEditBid])

  const userBids = useMemo(() => {
    return getUserBids(Object.values(auction.bids), address!)
  }, [address, auction.bids])

  const totalToSpendAcrossBids = useMemo(
    () =>
      userBids.reduce((acc, bid) => {
        if (auction.isSelling) {
          acc = acc.add(Number(bid.order.price) * Number(bid.order.quantity))
        } else {
          acc = acc.add(bid.order.quantity)
        }
        return acc
      }, BIG_ZERO),
    [auction.isSelling, userBids],
  )

  console.log('Total to spen', totalToSpendAcrossBids)

  const placeBid = React.useCallback(async () => {
    setLoading(true)

    try {
      const order: Order = {
        bidId: auction.currentAuctionId!,
        trader: address!,
        quantity: toBigNumber(Number(qty)).toString(),
        price: toBigNumber(Number(price)).toString(),
        isBuying: auction.isSelling,
        expiry: auction.auctionEnd + 30 * 60 * 1000,
        nonce: isEditBid ? auction.bids[bidToEdit!].order.nonce : Date.now(),
      }
      const { signature } = await signOrder(signer, order)

      const resp = await fetch('/api/auction/createOrEditBid', {
        method: 'POST',
        body: JSON.stringify({ signature, order }),
        headers: { 'Content-Type': 'application/json' },
      })

      showMessageFromServer(resp)
    } catch (e) {
      console.log(e)
    }

    setLoading(false)
  }, [
    address,
    auction.auctionEnd,
    auction.bids,
    auction.currentAuctionId,
    auction.isSelling,
    bidToEdit,
    isEditBid,
    price,
    qty,
    showMessageFromServer,
    signer,
  ])

  const cancelBid = React.useCallback(async () => {
    setDeleteLoading(true)
    try {
      const signature = await signer?.signMessage(MM_CANCEL)

      if (bidToEdit) {
        const resp = await fetch('/api/auction/deleteBid', {
          method: 'POST',
          body: JSON.stringify({ signature, bidId: bidToEdit }),
          headers: { 'Content-Type': 'application/json' },
        })
        showMessageFromServer(resp)
      }
    } catch (e) {
      console.log(e)
    }
    setDeleteLoading(false)
  }, [bidToEdit, showMessageFromServer, signer])

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
    if (minSize > Number(qty)) return `Qty should be more than min size: ${minSize.toFixed(1)}`
    if (auction.oSqthAmount === '0') return
    const aucQty = convertBigNumber(auction.oSqthAmount, 18)
    if (aucQty < Number(qty)) return 'Quantity should be less than auction quantity'
  }, [auction.oSqthAmount, minSize, qty])

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
      setQty(new BigNumber(balance).div(new BigNumber(price)).toFixed(4))
    } else {
      setQty(balance.toString())
    }
  }, [balance, price, auction.isSelling])

  const error = priceError || quantityError || approvalError || balanceError

  const canPlaceBid = auctionStatus === AuctionStatus.LIVE || auctionStatus === AuctionStatus.UPCOMING

  return (
    <Box
      boxShadow={1}
      py={3}
      px={8}
      borderRadius={2}
      bgcolor="background.overlayDark"
      display="flex"
      flexDirection="column"
    >
      <Typography align="center" color="primary">
        {isEditBid ? `Edit ${action}` : `Place ${action}`}
      </Typography>
      <TextField
        value={price}
        onChange={e => setPrice(e.target.value)}
        type="number"
        id="price"
        label="Price"
        variant="outlined"
        size="small"
        sx={{ mt: 3 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Typography variant="caption" color="textSecondary">
                WETH
              </Typography>
            </InputAdornment>
          ),
        }}
      />
      <TextField
        value={qty}
        onChange={e => setQty(e.target.value)}
        type="number"
        id="quantity"
        label="Quantity"
        variant="outlined"
        size="small"
        sx={{ mt: 4 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Typography variant="caption" color="textSecondary">
                oSQTH
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
            {balance.toFixed(4)}
          </Typography>{' '}
          {balanceToken}
        </Typography>
      </Box>
      <Box display="flex" mt={2} justifyContent="space-between">
        <Typography variant="body3">Total</Typography>
        <Typography variant="body2" color="textSecondary">
          <Typography color="textPrimary" component="span" variant="numeric">
            {totalWeth.toFixed(4)}
          </Typography>{' '}
          WETH
        </Typography>
      </Box>
      <Box display="flex" mt={2} justifyContent="space-between">
        <Typography variant="body3">Total spending across bids</Typography>
        <Typography variant="body2" color="textSecondary">
          <Typography color="textPrimary" component="span" variant="numeric">
            {formatBigNumber(totalToSpendAcrossBids, 18)}
          </Typography>{' '}
          {auction.isSelling ? 'WETH' : 'oSQTH'}
        </Typography>
      </Box>
      <Typography align="center" mt={3} color="error.main" variant="body3">
        {error}
      </Typography>
      <Typography align="center" mt={3} color="warning.main" variant="body3">
        {auctionStatus === AuctionStatus.UPCOMING
          ? 'Auction not started yet. If the price not matched, bid will be cancelled'
          : ''}
      </Typography>
      <BoxLoadingButton disabled={!!error || !canPlaceBid} onClick={placeBid} sx={{ mt: 1 }} loading={isLoading}>
        {isEditBid ? `Edit ${action}` : `Place ${action}`}
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
  )
}

export default AuctionBody
