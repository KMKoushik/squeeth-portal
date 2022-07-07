import { Box } from '@mui/system'
import { NextPage } from 'next'
import Head from 'next/head'
import CrabLoader from '../components/loaders/CrabLoader'
import Auction from '../container/CrabV2/Auction/Auction'
import { Nav } from '../container/Nav'
import useInitAuction from '../hooks/init/useInitAuction'
import useController from '../hooks/useController'
import { useInitCrabV2 } from '../hooks/useCrabV2'
import useCrabV2Store from '../store/crabV2Store'

const AuctionPage: NextPage = () => {
  useInitCrabV2()
  useInitAuction()
  useController()
  const isLoading = useCrabV2Store(s => s.isLoading)

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
          <Box mt={4} px={20}>
            <Auction />
          </Box>
        )}
      </Box>
    </div>
  )
}

export default AuctionPage
