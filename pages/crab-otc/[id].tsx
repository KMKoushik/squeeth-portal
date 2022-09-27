import { Grid, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { doc, onSnapshot } from 'firebase/firestore'
import { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { useSigner } from 'wagmi'
import shallow from 'zustand/shallow'
import PrimaryButton from '../../components/button/PrimaryButton'
import {BoxLoadingButton}  from '../../components/button/PrimaryButton'
import { BIG_ZERO } from '../../constants/numbers'
import ApprovalsOtc from '../../container/CrabV2/Auction/ApprovalsOtc'
import { Nav } from '../../container/Nav'
import useToaster from '../../hooks/useToaster'
import useAccountStore from '../../store/accountStore'
import useCrabV2Store from '../../store/crabV2Store'
import { CrabOTC, CrabOTCOrder, CrabOtcType, CrabOTCWithData } from '../../types'
import { signOTCOrder } from '../../utils/crabotc'
import { db } from '../../utils/firebase'
import { convertBigNumber, toBigNumber } from '../../utils/math'
import { BigNumber } from 'ethers'

const OTCBidPage: NextPage = () => {
  const router = useRouter()
  const { id } = router.query

  const [otc, setOtc] = useState<CrabOTCWithData | null>(null)
  const [loading, setLoading] = useState(true)
  const showMessageFromServer = useToaster()
  const address = useAccountStore(s => s.address)
  const { data: signer } = useSigner()
  const [bidPrice, setBidPrice] = useState('0')
  const auctionIsSellingOSqth = otc?.data.type == CrabOtcType.DEPOSIT ? true : false
  const bidderAction = otc?.data.type == CrabOtcType.DEPOSIT ? 'Buying' : 'Selling'
  const [isLoading, setFormLoading] = useState(false)

  const { wethApproval, oSqthApproval } = useCrabV2Store(
    s => ({ wethApproval: s.wethApprovalOtc, oSqthApproval: s.oSqthApprovalOtc }),
    shallow,
  )

  const { wethBalance, oSqthBalance } = useAccountStore(
    s => ({ wethBalance: s.wethBalance, oSqthBalance: s.oSqthBalance }),
    shallow,
  )

  const totalWeth = Number(bidPrice) * convertBigNumber(otc?.data.quantity || BIG_ZERO)
  const priceError = React.useMemo(() => {
    if (bidPrice === '0') return
    if (auctionIsSellingOSqth && Number(bidPrice) < Number(otc?.data.limitPrice)) {
      return 'Bid Price should be greater than limit price'
    } else if (!auctionIsSellingOSqth && Number(bidPrice) > Number(otc?.data.limitPrice)) {
      return 'Bid Price should be less than limit price'
    }
  }, [auctionIsSellingOSqth, otc?.data.limitPrice, bidPrice])

  const approvalError = React.useMemo(() => {
    if (totalWeth > convertBigNumber(wethApproval)) {
      return 'Approve WETH in token approval section in the top'
    } else if (!auctionIsSellingOSqth && Number(otc?.data.quantity) > convertBigNumber(oSqthApproval)) {
      return 'Approve oSQTH in token approval section in the top'
    }
  }, [totalWeth, wethApproval, auctionIsSellingOSqth, otc?.data.quantity, oSqthApproval])

  const balanceError = React.useMemo(() => {
    if (auctionIsSellingOSqth && totalWeth > convertBigNumber(wethBalance)) {
      return 'Need more WETH'
    } else if (
      !auctionIsSellingOSqth &&
      convertBigNumber(otc?.data.quantity || BIG_ZERO) > convertBigNumber(oSqthBalance)
    ) {
      return 'Need more oSQTH'
    }
  }, [auctionIsSellingOSqth, totalWeth, wethBalance, otc?.data.quantity, oSqthBalance])
  const error = priceError || approvalError || balanceError

  React.useEffect(() => {
    if (!id) return
    const unSubscribe = onSnapshot(doc(db, 'crabotc', id?.toString()), async d => {
      setLoading(false)
      if (d.exists()) {
        const resp = await fetch(`/api/crabotc/getCrabOTCById?id=${id}`)
        const _otc = (await resp.json()) as CrabOTCWithData
        setOtc(_otc)
      }
    })

    return unSubscribe
  }, [id])

  const createBid = async () => {
    const _qty = otc?.data.quantity ? otc?.data.quantity : '0'
    const _price = toBigNumber(bidPrice || 0)
    const approxQty = toBigNumber(otc?.data.quantity || 0, 0).add(100)

    const order: CrabOTCOrder = {
      trader: address!,
      quantity: approxQty.toString(),
      price: _price.toString(),
      isBuying: auctionIsSellingOSqth,
      expiry: Date.now() + 30 * 60 * 1000,
      nonce: Date.now(),
    }
    const { signature } = await signOTCOrder(signer, order)
    setFormLoading(true)
    const resp = await fetch('/api/crabotc/createOrEditBid?web=true', {
      method: 'POST',
      body: JSON.stringify({ signature, order, otcId: id }),
      headers: { 'Content-Type': 'application/json' },
    })

    if(resp.ok)
    setBidPrice('0')

    showMessageFromServer(resp)
    setFormLoading(false)
  }

  if (loading) return <Typography>Loading...</Typography>

  if (!otc)
    return (
      <div>
        <Head>
          <title>Squeeth Strategy Auction</title>
        </Head>
        <Nav />
        <Box margin="auto" px={10}>
          Invalid ID
        </Box>
      </div>
    )

  return (
    <div>
      <Head>
        <title>Squeeth Strategy Auction</title>
      </Head>
      <Nav />
      <Box margin="auto" px={10}>
        <Typography variant="h6" sx={{ textAlign: { xs: 'center', sm: 'left' } }} mb={1}>
          Token Approvals
        </Typography>
        <ApprovalsOtc />
    
        <Grid container gap={2} mt={2}>
          <Grid item xs={12} md={12} lg={5} bgcolor="background.overlayDark" borderRadius={2}>
            <Box display="flex" flexDirection="column" mt={4} px={2}>
              <Box display="flex" flexDirection="column"  margin="auto">
                <Typography variant="h6" align="center" mt={2}> Submit bid: {id} </Typography>
                <Typography mt={4} color="textSecondary" align="center">You are {bidderAction} oSQTH</Typography>
                <Typography color="textSecondary" mt={4}>
                  Quantity: ~{convertBigNumber(otc?.data.quantity)} ({otc?.data.quantity})
                </Typography>
                <Typography color="textSecondary"  mt={1}>Limit Price: {otc?.data.limitPrice}</Typography>
                <TextField
                  value={bidPrice}
                  onChange={e => setBidPrice(e.target.value)}
                  type="number"
                  id="bidPrice"
                  label="Enter Bid Price (ETH)"
                  variant="outlined"
                  size="small"
                  sx={{ mt: 4, mb: 2 }}
                  onWheel={e => (e.target as any).blur()}
                />


                <Typography variant="body2" color="textSecondary" mt={2}>
                    Your Weth Balance: {convertBigNumber(wethBalance)}
                </Typography>
                <Typography variant="body2" color="textSecondary" mt={2}>
                    Total Weth to Spend: {totalWeth}
                </Typography>

                {(bidPrice && (bidPrice != '0') && !error) && (
                <BoxLoadingButton onClick={createBid} sx={{ mt: 2 }} loading={isLoading}>
                  Submit order
                </BoxLoadingButton>
                ) }
                <Typography style={{ whiteSpace: 'pre-line' }} align="center" mt={2} mb={2} color="error.main" variant="body3">
                  {bidPrice ? error : ''}
                </Typography>
                
              </Box>
            </Box>
          </Grid>      
        </Grid>

        
      </Box>
    </div>
  )
}

export default OTCBidPage
