import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import { NextPage } from 'next'
import Head from 'next/head'
import CrabLoader from '../components/loaders/CrabLoader'
import Auction from '../container/CrabV2/Auction/Auction'
import { Nav } from '../components/navbars/Nav'
import useInitAuction from '../hooks/init/useInitAuction'
import useController from '../hooks/useController'
import { useInitCrabV2 } from '../hooks/useCrabV2'
import useAccountStore from '../store/accountStore'
import useCrabV2Store from '../store/crabV2Store'
import { useInitBull } from '../hooks/init/useInitBull'
import { useInitCrabNetting } from '../hooks/init/useInitCrabNetting'
import { useInitBullNetting } from '../hooks/init/useInitBullNetting'

const AuctionPage: NextPage = () => {
  useInitCrabV2()
  useInitAuction(false)
  useController()
  useInitBull()
  useInitCrabNetting()
  useInitBullNetting()
  const isLoading = useCrabV2Store(s => s.isLoading)
  const address = useAccountStore(s => s.address)

  return (
    <div>
      <Head>
        <title>Squeeth Strategy Auction</title>
      </Head>
      <Nav />
      <Box margin="auto">
        {isLoading ? (
          <CrabLoader />
        ) : (
          <Box mt={4} px={{ xs: 2, sm: 6, md: 10, lg: 20 }}>
            {address ? (
              <Auction />
            ) : (
              <Typography color="error.main" textAlign="center" variant="h6">
                Connect wallet
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </div>
  )
}

export default AuctionPage
