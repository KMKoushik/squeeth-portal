import { Box } from '@mui/system'
import { NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import { Nav } from '../components/navbars/Nav'
import { NettingAdmin } from '../container/CrabV2/Netting/NettingAdmin'
import { useInitCrabNetting } from '../hooks/init/useInitCrabNetting'
import { useInitCrabV2 } from '../hooks/useCrabV2'

const NettingAdminPage: NextPage = () => {
  useInitCrabV2()
  useInitCrabNetting()

  return (
    <div>
      <Head>
        <title>Squeeth Portal - Netting admin</title>
      </Head>
      <Nav />
      <Box px={30} py={5}>
        <NettingAdmin />
      </Box>
    </div>
  )
}

export default NettingAdminPage
