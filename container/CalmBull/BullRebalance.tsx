import { Box, TextField, Typography } from '@mui/material'
import React from 'react'
import { PrimaryLoadingButton } from '../../components/button/PrimaryButton'
import { DEFAULT_SLIPPAGE } from '../../constants/numbers'
import { useCalmBullStore } from '../../store/calmBullStore'
import useCrabV2Store from '../../store/crabV2Store'
import usePriceStore from '../../store/priceStore'
import { bnComparator } from '../../utils'
import { formatBigNumber } from '../../utils/math'
import { HeaderInfo } from '../HeaderInfo'

export const BullRebalance: React.FC = () => {
  const crabUsdcValue = useCrabV2Store(s => s.crabUsdcValue)
  const { ethPrice, oSqthPrice } = usePriceStore(s => ({ ethPrice: s.ethPrice, oSqthPrice: s.oSqthPrice }))

  const auctionManager = useCalmBullStore(s => s.auctionManager)
  const crUpper = useCalmBullStore(s => s.crUpper, bnComparator)
  const crLower = useCalmBullStore(s => s.crLower, bnComparator)
  const deltaUpper = useCalmBullStore(s => s.deltaUpper, bnComparator)
  const deltaLower = useCalmBullStore(s => s.deltaLower, bnComparator)

  const [slippage, setSlippage] = React.useState(DEFAULT_SLIPPAGE)

  console.log(auctionManager, crUpper.toString())

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Calm bull rebalance
      </Typography>

      <HeaderInfo
        items={[
          { title: 'Crab / USDC', value: formatBigNumber(crabUsdcValue, 18, 6), prefix: '$' },
          { title: 'ETH Price', value: formatBigNumber(ethPrice, 18, 2), prefix: '$' },
          { title: 'oSQTH Price', value: formatBigNumber(oSqthPrice, 18, 6), unit: 'WETH' },
          { title: 'Delta', value: '1' },
          { title: 'CR', value: '1.4' },
          { title: 'Delta lower', value: formatBigNumber(deltaLower, 18, 2) },
          { title: 'Delta upper', value: formatBigNumber(deltaUpper, 18, 2) },
          { title: 'CR lower', value: formatBigNumber(crLower, 18, 2) },
          { title: 'CR upper', value: formatBigNumber(crUpper, 18, 2) },
        ]}
      />

      <TextField
        size="small"
        sx={{ mt: 4 }}
        label="slippage"
        value={slippage}
        onChange={e => setSlippage(Number(e.target.value))}
      />
      <Box display="flex" mt={2} gap={1}>
        <Typography color="textSecondary">Rebalance possible: </Typography>
        <Typography variant="numeric">Yes</Typography>
      </Box>
      <Box display="flex" mt={1} gap={1}>
        <Typography color="textSecondary">USDC to trade: </Typography>
        <Typography variant="numeric"> 4000</Typography>
      </Box>
      <Box display="flex" mt={1} gap={1}>
        <Typography color="textSecondary">New Delta: </Typography>
        <Typography variant="numeric">1</Typography>
      </Box>
      <Box display="flex" mt={1} gap={1}>
        <Typography color="textSecondary">New CR: </Typography>
        <Typography variant="numeric">1.65</Typography>
      </Box>
      <PrimaryLoadingButton sx={{ mt: 2 }}>Leverage Rebalance</PrimaryLoadingButton>
    </Box>
  )
}
