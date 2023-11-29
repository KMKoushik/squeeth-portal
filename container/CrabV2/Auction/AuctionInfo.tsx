import { Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'

const AuctionBody: React.FC = () => {
  return (
    <Grid container spacing={5} mt={1} mb={5}>
      <Grid item xs={12} md={12} lg={8}>
        <AuctionDetails />
      </Grid>
      <Grid item xs={12} md={12} lg={4}>
        <AuctionUtils />
      </Grid>
    </Grid>
  )
}

const AuctionDetails: React.FC = () => {
  return (
    <section id="details">

    <Box
      boxShadow={1}
      py={2}
      px={4}
      borderRadius={2}
      bgcolor="background.overlayDark"
      display="flex"
      flexDirection="column"
    >
      <Typography variant="h6" mt={1}>
        Auction Details
      </Typography>
      <ul>
        <li>
          <Typography variant="body3">
            The crab hedge auction will generally run MWF at 16:30 UTC, but could be more or less frequent
          </Typography>
        </li>
        <li>
          <Typography variant="body3">
            The crab OTC auction (trading net deposits/withdrawals from crab) will run Tuesday at 16:30 UTC
          </Typography>
        </li>

        <li>
          <Typography variant="body3">Bids are selected by best price that will clear size</Typography>
        </li>
        <li>
          <Typography variant="body3">
            The auction may be re-run infrequently if needed eg. ETH price moves, not enough bids
          </Typography>
        </li>
      </ul>
    </Box>
    </section>

  )
}

const AuctionUtils: React.FC = () => {
  return (
    <Box
      boxShadow={1}
      py={3}
      mb={{ xs: 8, sm: 0 }}
      px={4}
      borderRadius={2}
      bgcolor="background.overlayDark"
      display="flex"
      flexDirection="column"
    >
      <Typography variant="h6" mt={1} mb={1}>
        Utilities
      </Typography>
      <ul>
        <li>
          <a href="https://squeeth.opyn.co/mint" target="_blank" rel="noreferrer">
            <Typography color="primary">Mint / burn oSQTH</Typography>
          </a>
        </li>
        <li>
          <a href="https://app.uniswap.org/#/swap" target="_blank" rel="noreferrer">
            <Typography color="primary">Wrap / unwrap WETH</Typography>
          </a>
        </li>
      </ul>
    </Box>
  )
}

export default AuctionBody
