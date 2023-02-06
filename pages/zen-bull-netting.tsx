import { Box } from '@mui/system'
import { NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import { Nav } from '../components/navbars/Nav'
import { BullNetting } from '../container/CalmBull/Netting/BullNetting'
import { useInitBull } from '../hooks/init/useInitBull'
import { useInitBullNetting } from '../hooks/init/useInitBullNetting'
import { useInitCrabV2 } from '../hooks/useCrabV2'

const NettingAdminPage: NextPage = () => {
  useInitCrabV2()
  useInitBull()
  useInitBullNetting()

  return (
    <div>
      <Head>
        <title>Squeeth Portal - Zen bull admin</title>
      </Head>
      <Nav />
      <Box px={30} py={5}>
        <BullNetting />
      </Box>
    </div>
  )
}

export default NettingAdminPage
