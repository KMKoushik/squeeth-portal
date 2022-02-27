import { Box, Grid, Typography } from '@mui/material'
import * as React from 'react'
import shallow from 'zustand/shallow'
import useCrab from '../../hooks/useCrab'
import useCrabStore from '../../store/crabStore'
import { formatBigNumber } from '../../utils/math'
import TimeHedge from './TimeHedge'

type AuctionItemProps = {
  title: string
  value: string | number
}

const AuctionItem = React.memo<AuctionItemProps>(function AuctionItem({ title, value }) {
  return (
    <Grid container spacing={1} mt={0.25}>
      <Grid item xs={5}>
        {title}
      </Grid>
      <Grid item xs={6}>
        <Typography fontFamily='Space Mono'>
          {value}
        </Typography>
      </Grid>
    </Grid>
  )
})

const LiveAuction = React.memo(function LiveAuction() {
  const auctionTriggerTime = useCrabStore(s => s.auctionTriggerTime)
  const auctionDetails = useCrabStore(s => s.auctionDetails, shallow)

  return (
    <Box sx={{ height: '100%' }} bgcolor="background.surface" borderRadius={2} py={2} px={4}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <AuctionItem title="Type :" value="Time Hedge" />
          <AuctionItem title="Is Selling oSQTH :" value={auctionDetails.isSelling ? 'Yes' : 'No'} />
          <AuctionItem title="Start time :" value={auctionTriggerTime} />
          <AuctionItem title="Price :" value={`${formatBigNumber(auctionDetails.auctionPrice, 18, 6)} ETH`} />
          <AuctionItem title="oSQTH Amount :" value={`${formatBigNumber(auctionDetails.oSqthAmount, 18, 6)}`} />
          <AuctionItem title="ETH Value :" value={`${formatBigNumber(auctionDetails.ethProceeds, 18, 6)}`} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TimeHedge />
        </Grid>
      </Grid>
    </Box>
  )
})

export default LiveAuction
