import { Box, Grid, Typography } from '@mui/material'
import { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import * as React from 'react'
import shallow from 'zustand/shallow'
import CrabLoader from '../components/loaders/CrabLoader'
import { CRAB_COUNCIL_MEMBERS } from '../constants/address'
import { V2_AUCTION_TIME_MILLIS } from '../constants/numbers'
import AdminBidView from '../container/CrabV2/Auction/Admin/AdminBidView'
import AuctionDetails from '../container/CrabV2/Auction/Admin/AuctionDetails'
import CreateAuction from '../container/CrabV2/Auction/Admin/CreateAuction'
import { Nav } from '../components/navbars/Nav'
import useInitAuction from '../hooks/init/useInitAuction'
import useController from '../hooks/useController'
import { useInitCrabV2 } from '../hooks/useCrabV2'
import useInterval from '../hooks/useInterval'
import useAccountStore from '../store/accountStore'
import useCrabV2Store from '../store/crabV2Store'
import { getAuctionStatus } from '../utils/auction'
import { useInitCrabNetting } from '../hooks/init/useInitCrabNetting'
import { useInitBull } from '../hooks/init/useInitBull'
import { useCalmBullStore } from '../store/calmBullStore'
import { AuctionType } from '../types'
import NotBullAdmin from '../container/CalmBull/NotBullAdmin'
import { useInitBullNetting } from '../hooks/init/useInitBullNetting'

const AuctionAdmin: NextPage = () => {
  useInitCrabV2()
  useInitAuction(true)
  useController()
  useInitCrabNetting()
  useInitBull()
  useInitBullNetting()

  const { isLoading, owner, auction, setAuctionStatus } = useCrabV2Store(
    s => ({ isLoading: s.isLoading, owner: s.owner, auction: s.auction, setAuctionStatus: s.setAuctionStatus }),
    shallow,
  )
  const auctionManager = useCalmBullStore(s => s.auctionManager)
  const address = useAccountStore(s => s.address)

  const isOwner = React.useMemo(
    () =>
      (auction.type === AuctionType.CALM_BULL
        ? address?.toLowerCase() === auctionManager.toLowerCase()
        : address?.toLowerCase() === owner?.toLowerCase()) || CRAB_COUNCIL_MEMBERS?.includes(address || ''),
    [address, auction.type, auctionManager, owner],
  )

  const updateStatus = React.useCallback(() => {
    setAuctionStatus(getAuctionStatus(auction))
  }, [auction, setAuctionStatus])

  React.useEffect(() => {
    updateStatus()
  }, [updateStatus])
  useInterval(updateStatus, auction.auctionEnd ? Date.now() - auction.auctionEnd : null)
  useInterval(updateStatus, auction.auctionEnd ? Date.now() - auction.auctionEnd - V2_AUCTION_TIME_MILLIS : null)
  useInterval(updateStatus, auction.auctionEnd ? Date.now() - auction.auctionEnd + V2_AUCTION_TIME_MILLIS : null)

  return (
    <div>
      <Head>
        <title>Squeeth Portal - Auction admin</title>
      </Head>
      <Nav />
      <Grid container spacing={5}>
        {isLoading ? (
          <Grid item xs={12} md={12} lg={12}>
            <CrabLoader />
          </Grid>
        ) : isOwner ? (
          <>
            <Grid item xs={0} md={0} lg={1} />
            <Grid item xs={12} md={12} lg={10} mt={5}>
              <AuctionDetails />
            </Grid>
            <Grid item xs={0} md={0} lg={1} />
            <Grid item xs={0} md={0} lg={1} />
            <Grid item xs={12} md={12} lg={3} mt={2}>
              <CreateAuction />
            </Grid>
            <Grid item xs={12} md={12} lg={7} mt={2}>
              <AdminBidView />
            </Grid>
          </>
        ) : auction.type === AuctionType.CALM_BULL ? (
          <NotBullAdmin />
        ) : (
          <NotOwner />
        )}
      </Grid>
    </div>
  )
}

const NotOwner: React.FC = () => {
  return (
    <Box margin="auto" mt={20}>
      <Typography align="center" variant="h6">
        You are not the king crab. Connect to the proper account!
      </Typography>
      <Box display="flex" justifyContent="center">
        <Image src="/images/crab-butt.gif" width={200} height={200} alt="Crab loader" />
      </Box>
    </Box>
  )
}

export default AuctionAdmin
