import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import { NextPage } from 'next'
import Head from 'next/head'
import { Nav } from '../components/navbars/Nav'
import { BullRebalance } from '../container/CalmBull/BullRebalance'
import { useInitBull } from '../hooks/init/useInitBull'
import { useInitCrabV2 } from '../hooks/useCrabV2'

const CalmBullReBalancePage: NextPage = () => {
  useInitCrabV2()
  useInitBull()

  return (
    <div>
      <Head>
        <title>Squeeth Portal - Bull Rebalance</title>
      </Head>
      <Nav />
      <Box px={30} py={5}>
        <BullRebalance />
      </Box>
    </div>
  )
}

export default CalmBullReBalancePage
