import { Grid, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useEffect, useMemo } from 'react'
import { useSigner } from 'wagmi'
import shallow from 'zustand/shallow'
import DangerButton from '../../../components/button/DangerButton'
import { BoxLoadingButton } from '../../../components/button/PrimaryButton'
import { SecondaryButton } from '../../../components/button/SecondaryButton'
import { MM_CANCEL } from '../../../constants/message'
import useAccountStore from '../../../store/accountStore'
import useCrabV2Store from '../../../store/crabV2Store'
import { Order } from '../../../types'
import { signOrder } from '../../../utils/auction'
import { convertBigNumber, toBigNumber } from '../../../utils/math'
import Bids from './Bids'

const AuctionBody: React.FC = () => {
  return (
    <Grid container spacing={5}>
      <Grid item xs={12} md={12} lg={8}>
        <Bids />
      </Grid>
      <Grid item xs={12} md={12} lg={4}>
        <BidForm />
      </Grid>
    </Grid>
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
  const setBidToEdit = useCrabV2Store(s => s.setBidToEdit)
  const { oSqthApproval, wethApproval } = useCrabV2Store(
    s => ({ oSqthApproval: s.oSqthApproval, wethApproval: s.wethApproval }),
    shallow,
  )
  const { oSqthBalance, wethBalance } = useAccountStore(
    s => ({ oSqthBalance: s.oSqthBalance, wethBalance: s.wethBalance }),
    shallow,
  )

  const isEditBid = useMemo(() => {
    return bidToEdit && !!auction.bids[bidToEdit]
  }, [auction.bids, bidToEdit])

  useEffect(() => {
    if (bidToEdit && isEditBid) {
      setPrice(convertBigNumber(auction.bids[bidToEdit].order.price, 18).toString())
      setQty(convertBigNumber(auction.bids[bidToEdit].order.quantity, 18).toString())
    }
  }, [auction.bids, bidToEdit, isEditBid])

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

      console.log(resp.status)
    } catch (e) {
      console.log(e)
    }

    setLoading(false)
  }, [address, auction, bidToEdit, isEditBid, price, qty, signer])

  const cancelBid = React.useCallback(async () => {
    setDeleteLoading(true)
    try {
      const signature = await signer?.signMessage(MM_CANCEL)

      if (bidToEdit) {
        await fetch('/api/auction/deleteBid', {
          method: 'POST',
          body: JSON.stringify({ signature, bidId: bidToEdit }),
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } catch (e) {
      console.log(e)
    }
    setDeleteLoading(false)
  }, [bidToEdit, signer])

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
    if (auction.oSqthAmount === '0') return
    const aucQty = convertBigNumber(auction.oSqthAmount, 18)
    if (aucQty < Number(qty)) return 'Quantity should be less than auction quantity'
  }, [auction.oSqthAmount, qty])

  const approvalError = React.useMemo(() => {
    if (auction.isSelling && totalWeth > convertBigNumber(wethApproval)) {
      return 'Approve WETH in token approval section in the top'
    } else if (!auction.isSelling && Number(qty) > convertBigNumber(oSqthApproval)) {
      return 'Approve oSQTH in token approval section in the top'
    }
  }, [auction.isSelling, oSqthApproval, qty, totalWeth, wethApproval])

  const balanceError = React.useMemo(() => {
    console.log(wethBalance.toString())
    if (auction.isSelling && totalWeth > convertBigNumber(wethBalance)) {
      return 'Need more WETH'
    } else if (!auction.isSelling && Number(qty) > convertBigNumber(oSqthBalance)) {
      return 'Need more oSQTH'
    }
  }, [auction.isSelling, oSqthBalance, qty, totalWeth, wethBalance])

  const error = priceError || quantityError || approvalError || balanceError

  return (
    <Box
      boxShadow={1}
      py={5}
      px={8}
      borderRadius={2}
      bgcolor="background.overlayDark"
      display="flex"
      flexDirection="column"
    >
      <Typography align="center" color="primary">
        {isEditBid ? 'Edit Bid' : 'Place Bid'}
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
      />
      <Box display="flex" mt={2} justifyContent="space-between">
        <Typography variant="body3">Total</Typography>
        <Typography variant="body2" color="textSecondary">
          <Typography color="textPrimary" component="span" variant="numeric">
            {totalWeth.toFixed(4)}
          </Typography>{' '}
          WETH
        </Typography>
      </Box>
      <Typography align="center" mt={3} color="error.main" variant="body3">
        {error}
      </Typography>
      <BoxLoadingButton disabled={!!error} onClick={placeBid} sx={{ mt: 1 }} loading={isLoading}>
        {isEditBid ? 'Edit Bid' : 'Place Bid'}
      </BoxLoadingButton>
      {isEditBid ? (
        <>
          <SecondaryButton onClick={() => setBidToEdit(null)} sx={{ mt: 2 }}>
            Don&apos;t Edit
          </SecondaryButton>
          <DangerButton loading={deleteLoading} onClick={cancelBid} sx={{ mt: 2 }}>
            Cancel Bid
          </DangerButton>
        </>
      ) : null}
    </Box>
  )
}

export default AuctionBody
