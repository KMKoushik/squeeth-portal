import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import { NextPage } from 'next'
import Head from 'next/head'
import { Nav } from '../components/navbars/Nav'

const CalmBullReBalancePage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Squeeth Portal - Bull Rebalance</title>
      </Head>
      <Nav />
      <Box px={30} py={5}>
        <Typography variant="h6">Calm bull rebalance</Typography>
      </Box>
    </div>
  )
}

export default CalmBullReBalancePage
