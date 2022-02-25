import type { NextPage } from 'next'
import { Box, Grid, Typography } from '@mui/material'
import Image from 'next/image'
import { Nav } from '../container/Nav'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Head from 'next/head'
import SqueethInfo from '../container/SqueethInfo'
import AuctionCard from '../components/squeethInfoActionCards/AuctionCard'
import TradeCard from '../components/squeethInfoActionCards/TradeCard'
import VaultsCard from '../components/squeethInfoActionCards/VaultsCard'

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

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Squeeth Portal</title>
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
            <Grid container spacing={4}>
              <Grid item xs={12} md={4} height="100%">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  variants={initialAnimation}
                  custom={0}
                >
                  <TradeCard>
                    <Typography textAlign="center" variant="h5" mb={4}>
                      Trade
                    </Typography>
                    <Box mx="auto">
                      <Image src="/images/uniswap-logo.svg" alt="Picture of uniswap log" height={64} width={64} />
                    </Box>
                    <Typography align="center" mt={4} color="textSecondary">
                      Trade oSQTH / ETH on uniswap.
                    </Typography>
                  </TradeCard>
                </motion.div>
              </Grid>
              <Grid item xs={12} md={4}>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  variants={initialAnimation}
                  custom={1}
                >
                  <Link href="/auction" passHref>
                    <AuctionCard>
                      <Typography textAlign="center" variant="h5" mb={4}>
                        Auction
                      </Typography>
                      <Box mx="auto">
                        <Image src="/images/auction.png" alt="Picture of vault" layout="fixed" height={64} width={64} />
                      </Box>
                      <Typography align="center" mt={4} color="textSecondary">
                        Participate on auctions by automated strategies!
                      </Typography>
                    </AuctionCard>
                  </Link>
                </motion.div>
              </Grid>
              <Grid item xs={12} md={4} sx={{ marginBottom: { xs: 2, sm: 0 } }}>
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
                    </Typography>
                    <Box mx="auto">
                      <Image src="/images/vault.png" alt="Picture of vault" layout="fixed" height={64} width={64} />
                    </Box>
                    <Typography align="center" mt={4} color="textSecondary">
                      Manage your vaults. Coming soon!
                    </Typography>
                  </VaultsCard>
                </motion.div>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={0} md={0} lg={2} />
        </Grid>
      </Box>
    </div>
  )
}

export default Home
