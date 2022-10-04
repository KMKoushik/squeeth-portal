import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import { NextPage } from 'next'
import Head from 'next/head'
import CrabLoader from '../components/loaders/CrabLoader'
import { CrabOTCBox } from '../container/CrabV2/CrabOTC/CrabOTC'
import { Nav } from '../components/navbars/Nav'
import { useInitCrabOTC } from '../hooks/init/useInitCrabOTC'
import useController from '../hooks/useController'
import { useInitCrabV2 } from '../hooks/useCrabV2'
import useAccountStore from '../store/accountStore'
import { useCrabOTCStore } from '../store/crabOTCStore'

const CrabOTCPage: NextPage = () => {
  useInitCrabOTC()
  useController()
  useInitCrabV2()
  const isLoading = useCrabOTCStore(s => s.otcLoading)
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
              <div>
                <CrabOTCBox />
              </div>
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

export default CrabOTCPage
