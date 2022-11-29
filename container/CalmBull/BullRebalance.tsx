import { Box, TextField, Typography } from '@mui/material'
import React from 'react'
import { PrimaryLoadingButton } from '../../components/button/PrimaryButton'
import { DEFAULT_SLIPPAGE } from '../../constants/numbers'
import useCrabV2Store from '../../store/crabV2Store'
import usePriceStore from '../../store/priceStore'
import { formatBigNumber } from '../../utils/math'
import { HeaderInfo } from '../HeaderInfo'

export const BullRebalance: React.FC = () => {
  const crabUsdcValue = useCrabV2Store(s => s.crabUsdcValue)
  const { ethPrice, oSqthPrice } = usePriceStore(s => ({ ethPrice: s.ethPrice, oSqthPrice: s.oSqthPrice }))

  const [slippage, setSlippage] = React.useState(DEFAULT_SLIPPAGE)

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Calm bull rebalance
      </Typography>

      <HeaderInfo
        items={[
          { title: 'Rebalance possible', value: 'true' },
          { title: 'Crab / USDC', value: formatBigNumber(crabUsdcValue, 18, 6), prefix: '$' },
          { title: 'ETH Price', value: formatBigNumber(ethPrice, 18, 2), prefix: '$' },
          { title: 'oSQTH Price', value: formatBigNumber(oSqthPrice, 18, 6), unit: 'WETH' },
          { title: 'Delta', value: '1' },
          { title: 'CR', value: '1.4' },
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
