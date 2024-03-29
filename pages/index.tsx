import type { NextPage } from 'next'
import { Box, Grid, Typography } from '@mui/material'
import Image from 'next/image'
import { Nav } from '../components/navbars/Nav'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Head from 'next/head'
import SqueethInfo from '../container/SqueethInfo'
import AuctionCard from '../components/squeethInfoActionCards/AuctionCard'
import TradeCard from '../components/squeethInfoActionCards/TradeCard'
import VaultsCard from '../components/squeethInfoActionCards/VaultsCard'
import SqueethProjects from '../container/SqueethProjects'
import React from 'react'
import ConstructionIcon from '@mui/icons-material/Construction'
import OutlineChip from '../components/utilities/Chips'

import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined'
import HourglassBottomOutlinedIcon from '@mui/icons-material/HourglassBottomOutlined'
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import useCrabV2Store from '../store/crabV2Store'
import AuctionAdminCard from '../components/squeethInfoActionCards/AuctionAdminCard'

const initialAnimation = {
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: i * 0.2,
      when: 'afterChildren',
    },
  }),
  hidden: { y: '5%', opacity: 0.5 },
  hover: { scale: 1.03 },
}

const auctionStatusForChips = {
  1: { label: 'Live', color: 'primary', icon: <HourglassBottomOutlinedIcon sx={{ fontSize: '16px' }} /> },
  2: { label: 'Settling', color: 'warning', icon: <AutorenewOutlinedIcon sx={{ fontSize: '16px' }} /> },
  3: { label: 'Settled', color: 'success', icon: <CheckCircleOutlinedIcon sx={{ fontSize: '16px' }} /> },
  4: { label: 'Upcoming', color: 'warning', icon: <HourglassEmptyOutlinedIcon sx={{ fontSize: '16px' }} /> },
}

const Home: NextPage = () => {
  const auctionStatus = useCrabV2Store(s => s.auctionStatus)
  const asChips = auctionStatusForChips[auctionStatus]

  return (
    <div>
      <Head>
        <title>Squeeth Portal</title>
        <meta property="og:title" content="Squeeth Portal" />
        <meta property="og:description" content="A single place for your squeeth" />
        <meta property="og:image" content="https://i.ibb.co/zRcf8YC/space-cat.jpg" />
      </Head>
      <Nav />
      <Box flexGrow={1} px={4} pt={4}>
        <Grid container>
          <Grid item xs={0} md={0} lg={2} />
          <Grid item xs={12} md={12} lg={8}>
            <SqueethInfo />
          </Grid>
          <Grid item xs={0} md={0} lg={2} />
          <Grid item xs={0} md={0} lg={2} />
          <Grid item xs={12} md={12} lg={8}>
            <Grid container spacing={4} alignItems="stretch">
              <Grid item xs={12} sm={6} md={4}>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  style={{ height: '100%' }}
                  variants={initialAnimation}
                  custom={0}
                >
                  <TradeCard>
                    <Typography textAlign="center" variant="h5" mb={4}>
                      Trade
                      <OutlineChip label="Coming soon" icon={<ConstructionIcon sx={{ fontSize: '16px' }} />} />
                    </Typography>
                    <Box mx="auto">
                      <Image src="/images/uniswap-logo.svg" alt="Picture of uniswap logo" height={64} width={64} />
                    </Box>
                    <Typography align="center" mt={4} color="textSecondary">
                      Trade oSQTH / ETH on uniswap.
                    </Typography>
                  </TradeCard>
                </motion.div>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  style={{ height: '100%' }}
                  variants={initialAnimation}
                  custom={1}
                >
                  <Link href="/auction" passHref>
                    <AuctionCard>
                      <Typography textAlign="center" variant="h5" mb={4}>
                        Auctions
                        <OutlineChip label={asChips.label} icon={asChips.icon} color={asChips.color} />
                      </Typography>
                      <Box mx="auto">
                        <Image src="/images/bidding.png" alt="Picture of vault" layout="fixed" height={70} width={70} />
                      </Box>
                      <Typography align="center" mt={4} color="textSecondary">
                        Participate on auctions by automated strategies!
                      </Typography>
                    </AuctionCard>
                  </Link>
                </motion.div>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  style={{ height: '100%' }}
                  variants={initialAnimation}
                  custom={2}
                >
                  <Link href="/auction-admin" passHref>
                    <AuctionAdminCard>
                      <Typography textAlign="center" variant="h5" mb={4}>
                        Auctioneer
                      </Typography>
                      <Box mx="auto">
                        <Box mt={6} />
                        <Image src="/images/auction.png" alt="Picture" layout="fixed" height={64} width={64} />
                      </Box>
                      <Typography align="center" mt={4} color="textSecondary">
                        Manage auctions!
                      </Typography>
                    </AuctionAdminCard>
                  </Link>
                </motion.div>
              </Grid>
              {/* <Grid item xs={12} md={4} sx={{ marginBottom: { xs: 2, sm: 0 } }}>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  variants={initialAnimation}
                  custom={2}
                >
                  <VaultsCard>
                    <Typography textAlign="center" variant="h5" mb={4}>
                      Vaults
                      <OutlineChip label="Coming soon" icon={<ConstructionIcon sx={{ fontSize: '16px' }} />} />
                    </Typography>
                    <Box mx="auto">
                      <Image src="/images/vault.png" alt="Picture of vault" layout="fixed" height={64} width={64} />
                    </Box>
                    <Typography align="center" mt={4} color="textSecondary">
                      Manage your vaults.
                    </Typography>
                  </VaultsCard>
                </motion.div>
              </Grid> */}
            </Grid>
          </Grid>
          <Grid item xs={0} md={0} lg={2} />
        </Grid>
      </Box>
      <SqueethProjects />
      <Box flexGrow={1} px={4} pt={4} pb={12}>
        <Grid container>
          <Grid item xs={0} md={0} lg={2} />
          <Grid item xs={12} md={12} lg={8}>
            <Typography variant="h5" color="primary">
              Admin links
            </Typography>
            <Box mt={2}>
              <Typography color="primary" sx={{ textDecoration: 'underline' }}>
                <Link href="/netting-admin">Netting Admin</Link>
              </Typography>
              <Typography color="primary" sx={{ textDecoration: 'underline' }}>
                <Link href="/auction-admin">Auction admin</Link>
              </Typography>
              <Typography color="primary" sx={{ textDecoration: 'underline' }}>
                <Link href="/calm-bull-rebalance">Cal bull rebalance</Link>
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={0} md={0} lg={2} />
        </Grid>
      </Box>
    </div>
  )
}

export default Home
