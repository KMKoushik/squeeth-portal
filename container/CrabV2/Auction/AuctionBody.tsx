import { Button, Grid, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { ethers } from 'ethersv5'
import React, { useEffect, useMemo } from 'react'
import { useSigner } from 'wagmi'
import DangerButton from '../../../components/button/DangerButton'
import { BoxLoadingButton } from '../../../components/button/PrimaryButton'
import { SecondaryButton } from '../../../components/button/SecondaryButton'
import { MM_CANCEL } from '../../../constants/message'
import useAccountStore from '../../../store/accountStore'
import useCrabV2Store from '../../../store/crabV2Store'
import { Bid, Order } from '../../../types'
import { createOrEditAuction, signOrder } from '../../../utils/auction'
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
        value={price}
        onChange={e => setPrice(e.target.value)}
        type="number"
        id="price"
        label="Price"
        variant="outlined"
        size="small"
        sx={{ mt: 3 }}
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
      />
      <BoxLoadingButton onClick={placeBid} sx={{ mt: 4 }} loading={isLoading}>
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
