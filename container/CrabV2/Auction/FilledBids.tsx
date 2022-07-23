import { Box, Typography } from '@mui/material'
import useAccountStore from '../../../store/accountStore'
import useCrabV2Store from '../../../store/crabV2Store'
import { getWinningBidsForUser } from '../../../utils/auction'
import { formatBigNumber } from '../../../utils/math'

const FilledBids: React.FC = () => {
  const auction = useCrabV2Store(s => s.auction)
  const address = useAccountStore(s => s.address)

  if (!address) return null

  const userWinningBids = getWinningBidsForUser(auction, address)

  if (!userWinningBids.length) return null

  return (
    <Box
      boxShadow={1}
      py={2}
      px={8}
      borderRadius={2}
      bgcolor="background.overlayDark"
      display="flex"
      flexDirection="column"
    >
      <Typography align="center" color="primary" mb={1}>
        Your filled bids
      </Typography>
      {userWinningBids.map(b => (
        <Typography key={`${b.bidder}-${b.order.nonce}`} mt={1}>
          <Typography variant="numeric">{formatBigNumber(b.filledAmount, 18)}</Typography>
          <Typography variant="body3"> oSQTH for </Typography>
          <Typography variant="numeric">{formatBigNumber(auction.clearingPrice)}</Typography>
          <Typography variant="body3"> WETH per oSQTH</Typography>
        </Typography>
      ))}
    </Box>
  )
}

export default FilledBids
