import { Box, Grid, Typography } from '@mui/material'
import * as React from 'react'
import shallow from 'zustand/shallow'
import useControllerStore from '../../store/controllerStore'
import useCrabStore from '../../store/crabStore'
import usePriceStore from '../../store/priceStore'
import { convertBigNumber, formatBigNumber, calculateIV } from '../../utils/math'
import { bnComparator } from '../../utils'
import TimeHedge from './TimeHedge'
import useController from '../../hooks/useController'

type AuctionItemProps = {
  title: string
  value: string | number
}

const AuctionItem = React.memo<AuctionItemProps>(function AuctionItem({ title, value }) {
  return (
    <Grid container spacing={1} mt={0.25} justifyContent="space-between">
      <Grid item xs={6}>
        {title}
      </Grid>
      <Grid item xs={6}>
        <Typography variant="numeric">{value}</Typography>
      </Grid>
    </Grid>
  )
})

const LiveAuction = React.memo(function LiveAuction() {
  useController()
  const auctionTriggerTime = useCrabStore(s => s.auctionTriggerTime)
  const auctionDetails = useCrabStore(s => s.auctionDetails, shallow)
  const normFactor = useControllerStore(s => s.normFactor, bnComparator)
  const ethPrice = usePriceStore(s => s.ethPrice, bnComparator)

  const iv = React.useMemo(() => {
    if (normFactor.isZero()) return 0

    const oSqthPrice = convertBigNumber(auctionDetails.auctionPrice, 18)
    const nf = convertBigNumber(normFactor, 18)
    const _ethPrice = convertBigNumber(ethPrice, 18)
    return calculateIV(oSqthPrice, nf, _ethPrice) * 100
  }, [auctionDetails.auctionPrice, ethPrice, normFactor])

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
          <AuctionItem title="Implied vol :" value={`${(iv || 0).toFixed(2)} %`} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TimeHedge />
        </Grid>
      </Grid>
    </Box>
  )
})

export default LiveAuction
