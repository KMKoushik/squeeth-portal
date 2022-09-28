import { Box, Typography } from '@mui/material'
import Countdown, { CountdownRendererFn } from 'react-countdown'
import { formatNumber } from '../../utils/math'

const renderer: CountdownRendererFn = ({ minutes, seconds }) => {
  // Render a countdown
  return (
    <Box display="flex" gap={0.5} alignItems="baseline">
      <Typography component="span" variant="numeric">
        {formatNumber(minutes)}:{formatNumber(seconds)}
      </Typography>
    </Box>
  )
}

export const Expiry: React.FC<{ time: number }> = ({ time }) => {
  return (
    <Box display="flex" mt={1} justifyContent="space-between">
      <Typography variant="body3">Expiry in:</Typography>
      <Countdown date={time} renderer={renderer} />
    </Box>
  )
}
