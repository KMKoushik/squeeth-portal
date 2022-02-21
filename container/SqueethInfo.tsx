import { Box, Typography } from '@mui/material'
import * as React from 'react'
import { FUNDING_PERIOD, INDEX_SCALE } from '../constants/numbers'
import useTvl from '../hooks/useTvl'

import useControllerStore from '../store/controllerStore'
import { bnComparator } from '../utils'
import { formatBigNumber } from '../utils/math'

const SqueethInfo = React.memo(function SqueethInfo() {
  const tvl = useTvl()
  const nf = useControllerStore(s => s.normFactor, bnComparator)
  const indexPrice = useControllerStore(s => s.indexPrice, bnComparator)
  const markPrice = useControllerStore(s => s.markPrice, bnComparator)

  const impliedFunding = React.useMemo(() => {
    if (indexPrice.isZero()) return 0

    return (Math.log(markPrice.mul(INDEX_SCALE).div(indexPrice).toNumber() / INDEX_SCALE) / FUNDING_PERIOD) * 100
  }, [indexPrice, markPrice])

  return (
    <Box bgcolor="background.surface" borderRadius={4} minHeight={200} mb={4} p={3}>
      <Typography>Controller ETH: {tvl.toFixed(2)}</Typography>
      <Typography>NF: {formatBigNumber(nf, 18, 6)}</Typography>
      <Typography>Index Price: ${formatBigNumber(indexPrice, 18, 0)}</Typography>
      <Typography>Mark Price: ${formatBigNumber(markPrice, 18, 0)}</Typography>
      <Typography>Current Funding: {impliedFunding.toFixed(2)}%</Typography>
    </Box>
  )
})

export default SqueethInfo
