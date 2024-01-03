import { Box, Typography } from '@mui/material'
import { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import * as React from 'react'

const Blocked: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Squeeth Portal</title>
      </Head>
      <Box margin="auto" mt={15} display="flex" justifyContent="center" flexDirection="column">
        <Box margin="auto">
          <Image src="/images/blocked_cat.gif" width={200} height={200} alt="Cat loader" />
        </Box>
        <Typography align="center" variant="h6" color={t => t.palette.error.main} width="75%" marginX="auto">
          Seems you are using a VPN service or accessing our website from a blocked country, which is a violation of our
          terms of service. Please disconnect from your VPN and refresh the page to continue using our service.
        </Typography>
      </Box>
    </div>
  )
}

export default Blocked
