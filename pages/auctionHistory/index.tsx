import { Box, Typography } from '@mui/material'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import CrabLoader from '../../components/loaders/CrabLoader'
import AuctionHistory from '../../container/CrabV2/Auction/AuctionHistory'
import { Nav } from '../../container/Nav'
import useInitAuction from '../../hooks/init/useInitAuction'
import useCrabV2Store from '../../store/crabV2Store'

const AuctionHistoryPage: NextPage = () => {
  useInitAuction(false)
  const isAuctionLoading = useCrabV2Store(s => s.auctionLoading)
  const auction = useCrabV2Store(s => s.auction)

  return (
    <div>
      <Head>
        <title>Past Crab v2 auctions</title>
      </Head>
      <Nav />
      <Box mt={4} px={40}>
        {isAuctionLoading || !auction.currentAuctionId ? <CrabLoader /> : <AuctionHistory />}
      </Box>
    </div>
  )
}

export default AuctionHistoryPage
