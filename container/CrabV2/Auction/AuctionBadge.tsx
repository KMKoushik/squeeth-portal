import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import Countdown, { CountdownRendererFn } from 'react-countdown'
import { V2_AUCTION_TIME_MILLIS } from '../../../constants/numbers'
import useCrabV2Store from '../../../store/crabV2Store'
import { AuctionStatus } from '../../../types'
import { formatNumber } from '../../../utils/math'

const renderer: CountdownRendererFn = ({ minutes, seconds, days, hours }) => {
  // Render a countdown
  return (
    <Typography component="span" variant="numeric">
      {formatNumber(days)}D {formatNumber(hours)}H {formatNumber(minutes)}M {formatNumber(seconds)}S
    </Typography>
  )
}

const AuctionBadge: React.FC = () => {
  const auctionStatus = useCrabV2Store(s => s.auctionStatus)
  const auction = useCrabV2Store(s => s.auction)

  return (
    <Box ml={4}>
      {auctionStatus === AuctionStatus.LIVE ? (
        <Typography variant="caption" color="success.main" bgcolor="success.light" px={2} py={0.5} borderRadius={1}>
          Live Auction
        </Typography>
      ) : auctionStatus === AuctionStatus.SETTLEMENT ? (
        <Typography variant="caption" color="warning.main" bgcolor="warning.light" px={2} py={0.5} borderRadius={1}>
          Settlement
        </Typography>
      ) : auctionStatus === AuctionStatus.UPCOMING ? (
        <Typography variant="caption" color="warning.main" bgcolor="warning.light" px={2} py={0.5} borderRadius={1}>
          Upcoming <Countdown date={auction.auctionEnd - V2_AUCTION_TIME_MILLIS} renderer={renderer} />
        </Typography>
      ) : null}
    </Box>
  )
}

export default AuctionBadge
