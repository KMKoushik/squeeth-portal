import { Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'

const AuctionBody: React.FC = () => {
  return (
    <Grid container spacing={5}>
      <Grid item xs={12} md={12} lg={8}>
        <AuctionDetails />
      </Grid>
      <Grid item xs={12} md={12} lg={4}>
        <div />
      </Grid>
    </Grid>
  )
}

const AuctionDetails: React.FC = () => {
  return (
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
        <li>The auction will run approximately MWF at 9:30AM PT, but could be discretionarily more or less frequent</li>
        <li>Bids are selected by best price that will clear size</li>
        <li>The auction may be re-run infrequently if needed eg. ETH price moves, not enough bids</li>
      </ul>
    </Box>
  )
}

export default AuctionBody
