import { Box, Typography } from '@mui/material'
import * as React from 'react'
import Countdown, { CountdownRendererFn } from 'react-countdown'
import useCrab from '../../hooks/useCrab'
import { formatNumber } from '../../utils/math'

type NoAuctionProps = {
  time: number
}

const renderer: CountdownRendererFn = ({ days, hours, minutes, seconds, completed }) => {
  if (completed) {
    return <Typography align="center">Hurray</Typography>
  } else {
    // Render a countdown
    return (
      <Box display="flex" justifyContent="center" gap={0.5} alignItems="baseline">
        <Typography component="span" variant="h4">
          {formatNumber(days)}
        </Typography>
        <Typography component="span" variant="subtitle2" mr={1} color="textSecondary">
          {days === 1 ? 'Day' : 'Days'}
        </Typography>
        <Typography component="span" variant="h4">
          {formatNumber(hours)}
        </Typography>
        <Typography component="span" variant="subtitle2" mr={1} color="textSecondary">
          {hours === 1 ? 'Hours' : 'Hour'}
        </Typography>
        <Typography component="span" variant="h4">
          {formatNumber(minutes)}
        </Typography>
        <Typography component="span" variant="subtitle2" mr={1} color="textSecondary">
          {minutes === 1 ? 'Minute' : 'Minutes'}
        </Typography>
        <Typography component="span" variant="h4">
          {formatNumber(seconds)}
        </Typography>
        <Typography component="span" variant="subtitle2" mr={1} color="textSecondary">
          {seconds === 1 ? 'Second' : 'Seconds'}
        </Typography>
      </Box>
    )
  }
}

const NoAuction = React.memo<NoAuctionProps>(function NoAuction({ time }) {
  const { updateAuctionData } = useCrab()

  return (
    <Box sx={{ height: '100%' }} bgcolor="background.surface" borderRadius={2} py={2} px={4}>
      <Typography align="center" variant="h6" color="textSecondary" mb={2}>
        No live Auctions. Next in
      </Typography>
      <Countdown date={time} onComplete={updateAuctionData} renderer={renderer} />
    </Box>
  )
})

export default NoAuction
