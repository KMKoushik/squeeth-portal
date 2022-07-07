import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import { format } from 'date-fns'
import add from 'date-fns/add'
import { useSigner } from 'wagmi'
import shallow from 'zustand/shallow'
import PrimaryButton from '../../../components/button/PrimaryButton'
import useAccountStore from '../../../store/accountStore'
import useCrabV2Store from '../../../store/crabV2Store'
import usePriceStore from '../../../store/priceStore'
import useControllerStore from '../../../store/controllerStore'
import { signOrder } from '../../../utils/auction'
import { calculateIV, convertBigNumber, formatBigNumber } from '../../../utils/math'
import AuctionBody from './AuctionBody'
import Approvals from './Approvals'

const Auction: React.FC = () => {
  const auction = useCrabV2Store(s => s.auction)
  const isAuctionAvailable = !!auction.currentAuctionId

  return (
    <Box>
      <Typography variant="h6">Token approvals</Typography>
      <Box mt={1}>
        <Approvals />
      </Box>
      <Typography variant="h6" mt={4}>
        Auction
      </Typography>
      <Box mt={1} border="1px solid grey" borderRadius={2} minHeight={150}>
        {!isAuctionAvailable ? (
          <Typography textAlign="center" mt={3} variant="h6">
            No auctions scheduled yet!
          </Typography>
        ) : (
          <Box>
            <AuctionDetailsHeader />
            <AuctionHeaderBody />
          </Box>
        )}
      </Box>
      <Typography variant="h6" mt={4}>
        Bids
      </Typography>
      <Box display="flex" mt={1}>
        <AuctionBody />
      </Box>
    </Box>
  )
}

const AuctionDetailsHeader: React.FC = () => {
  const auction = useCrabV2Store(s => s.auction)

  return (
    <Box p={3} px={5} display="flex" alignItems="center" justifyContent="space-between">
      <Box>
        <Typography fontWeight={600} variant="body1">
          {auction.isSelling ? 'Selling ' : 'Buying '}oSqth
        </Typography>
        <Box display="flex" mt={0.5} alignItems="center" justifyContent="space-between" width={180}>
          <Typography variant="body3">Auction start</Typography>
          <Typography variant="body2">
            {format(add(new Date(auction.auctionEnd || 0), { minutes: -10 }), 'hh:mm aa')}
          </Typography>
        </Box>
        <Box display="flex" mt={0.5} alignItems="center" justifyContent="space-between" width={180}>
          <Typography variant="body3">Auction end</Typography>
          <Typography variant="body2">{format(new Date(auction.auctionEnd || 0), 'hh:mm aa')}</Typography>
        </Box>
        <Box display="flex" mt={0.5} alignItems="center" justifyContent="space-between" width={180}>
          <Typography variant="body3">Settlement</Typography>
          <Typography variant="body2">
            {format(add(new Date(auction.auctionEnd || 0), { minutes: 10 }), 'hh:mm aa')}
          </Typography>
        </Box>
      </Box>
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary">Clearing price(per oSqth)</Typography>
        <Typography textAlign="center" variant="numeric" color="primary">
          .2 WETH
        </Typography>
      </Box>
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary">Filled</Typography>
        <Typography textAlign="center" variant="numeric" color="primary">
          30%
        </Typography>
      </Box>
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary">Auction</Typography>
        <Typography textAlign="center" variant="numeric" color="primary">
          09:30
        </Typography>
      </Box>
    </Box>
  )
}

const AuctionHeaderBody: React.FC = () => {
  const auction = useCrabV2Store(s => s.auction)
  const { ethPriceBN, oSqthPriceBN } = usePriceStore(
    s => ({ ethPriceBN: s.ethPrice, oSqthPriceBN: s.oSqthPrice }),
    shallow,
  )
  const { indexPrice, markPrice, nfBN } = useControllerStore(
    s => ({ indexPrice: s.indexPrice, markPrice: s.markPrice, nfBN: s.normFactor }),
    shallow,
  )

  const ethPrice = convertBigNumber(ethPriceBN, 18)
  const oSqthPrice = convertBigNumber(oSqthPriceBN, 18)
  const nf = convertBigNumber(nfBN, 18)

  return (
    <Box borderTop="1px solid grey" p={2} px={5} display="flex" alignItems="center">
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          Size
        </Typography>
        <Typography textAlign="center" variant="numeric">
          {formatBigNumber(auction.oSqthAmount, 18, 2)} oSQTH
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          Min price
        </Typography>
        <Typography textAlign="center" variant="numeric">
          {formatBigNumber(auction.minPrice, 18, 6)} WETH
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption" textAlign="center">
          ETH price
        </Typography>
        <Typography variant="numeric" textAlign="center">
          ${ethPrice.toFixed(2)}
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption" textAlign="center">
          oSqth price
        </Typography>
        <Typography variant="numeric" textAlign="center">
          {oSqthPrice.toFixed(6)} ETH
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption" textAlign="center">
          index price
        </Typography>
        <Typography variant="numeric" textAlign="center">
          ${formatBigNumber(indexPrice, 18, 0)}
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption" textAlign="center">
          mark price
        </Typography>
        <Typography variant="numeric" textAlign="center">
          ${formatBigNumber(markPrice, 18, 0)}
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption" textAlign="center">
          IV
        </Typography>
        <Typography variant="numeric" textAlign="center">
          {(calculateIV(oSqthPrice, nf, ethPrice) * 100).toFixed(2)}%
        </Typography>
      </Box>
    </Box>
  )
}

export default Auction
