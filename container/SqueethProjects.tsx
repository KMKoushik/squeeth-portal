import { Grid, Typography } from "@mui/material"
import { Box } from "@mui/system"
import React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from 'framer-motion'
import TradeCard from "../components/squeethInfoActionCards/TradeCard"
import SqueethInfo from "./SqueethInfo"
import AuctionCard from "../components/squeethInfoActionCards/AuctionCard"
import VaultsCard from "../components/squeethInfoActionCards/VaultsCard"
import SqueethScanCard from "../components/squeethProjectCards/SqueethScanCard"
import CrabLabCard from "../components/squeethProjectCards/CrabLabCard"
import SqueethLabCard from "../components/squeethProjectCards/SqueethLabCard"
import DeltaNeutralityCard from "../components/squeethProjectCards/DeltaNeutralityCard"


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

const projectLinks = {
  squeethScan: 'https://squeethscan.com/',
  deltaNeutrality: 'https://docs.google.com/spreadsheets/d/14JsWaQOBVD5VPoMtosThTLqTeVIJcknUpkB_u4aRM2c/edit?usp=sharing',
  crabLab: 'https://docs.google.com/spreadsheets/d/1EOofU20IZFtPKlFsg1spaUrtTefLXYDKRtJ9vhMJVGE/edit#gid=46994367',
  squeethLab: 'https://docs.google.com/spreadsheets/d/1iy5N3qy6g2xd2_BcsY_Hv0pKdyceC1h7y269KssOG8s/edit#gid=1267496112'
}

const SqueethProjects = React.memo(function SqueethProjects() {

  return (
    <Box flexGrow={1} px={4} pt={4} mb={2}>

      <Grid container>

        <Grid item xs={0} md={0} lg={2} />
        <Grid item xs={12} md={12} lg={8} >
          <Typography  my={3} color='primary' borderColor='ActiveBorder' borderLeft={4}>
            <Typography variant="h5" component="span" ml={2}  color='primary' > Squeeth Projects </Typography>
          </Typography>
          <Grid container spacing={4}>

            <Grid item xs={12} sm={6} md={4} height="100%">
              <motion.div
                initial="hidden"
                animate="visible"
                whileHover="hover"
                variants={initialAnimation}
                custom={0}
              >
                <SqueethScanCard onClick={(e) => window.open(projectLinks.squeethScan)}>
                  <Typography textAlign="center" variant="h5" mb={4}>
                    Squeeth Scan
                  </Typography>
                  <Box mx="auto">
                    <Image src="/images/squeeth_scan.png" alt="Picture of squeeth scan logo" height={64} width={64} />
                  </Box>
                  <Typography align="center" mt={4} color="textSecondary">
                    Get squeeth current stats and historical funding data
                  </Typography>
                </SqueethScanCard>
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <motion.div
                initial="hidden"
                animate="visible"
                whileHover="hover"
                variants={initialAnimation}
                custom={1}
              >
                <DeltaNeutralityCard onClick={(e) => window.open(projectLinks.deltaNeutrality)}>
                  <Typography textAlign="center" variant="h5" mb={4}>
                    𝝙 Calculator
                  </Typography>
                  <Box mx="auto">
                    <Image src="/images/delta_calculator.png" alt="Picture of vault" layout="fixed" height={64} width={64} />
                  </Box>
                  <Typography align="center" mt={4} color="textSecondary">
                    Calculate PnL from a delta hedged position.
                  </Typography>
                </DeltaNeutralityCard>
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6} md={4} sx={{ marginBottom: { xs: 2, sm: 0 } }}>
              <motion.div
                initial="hidden"
                animate="visible"
                whileHover="hover"
                variants={initialAnimation}
                custom={2}
              >
                <SqueethLabCard onClick={(e) => window.open(projectLinks.squeethLab)}>
                  <Typography textAlign="center" variant="h5" mb={4}>
                    Squeeth Lab
                  </Typography>
                  <Box mx="auto">
                    <Image src="/images/squeeth_lab.png" alt="Picture of vault" layout="fixed" height={64} width={64} />
                  </Box>
                  <Typography align="center" mt={4} color="textSecondary">
                    Portfolio sensitivities and greeks
                  </Typography>
                </SqueethLabCard>
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6} md={4} sx={{ marginBottom: { xs: 2, sm: 0 } }}>
              <motion.div
                initial="hidden"
                animate="visible"
                whileHover="hover"
                variants={initialAnimation}
                custom={1}
              >
                <CrabLabCard onClick={(e) => window.open(projectLinks.crabLab)}>
                  <Typography textAlign="center" variant="h5" mb={4}>
                    Crab Lab
                  </Typography>
                  <Box mx="auto">
                    <Image src="/images/crab_lab.png" alt="Picture of vault" layout="fixed" height={84} width={84} />
                  </Box>
                  <Typography align="center" mt={4} color="textSecondary">
                    Returns to a crab postion between hedging periods
                  </Typography>
                </CrabLabCard>
              </motion.div>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={0} md={0} lg={2} />
      </Grid>
    </Box>
  )

})

export default SqueethProjects
