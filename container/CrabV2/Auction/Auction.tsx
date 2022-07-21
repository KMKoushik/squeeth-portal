import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import { format } from 'date-fns'
import add from 'date-fns/add'
import shallow from 'zustand/shallow'
import useCrabV2Store from '../../../store/crabV2Store'
import usePriceStore from '../../../store/priceStore'
import useControllerStore from '../../../store/controllerStore'
import { getAuctionStatus } from '../../../utils/auction'
import { calculateIV, convertBigNumber, formatBigNumber, formatNumber } from '../../../utils/math'
import AuctionBody from './AuctionBody'
import Approvals from './Approvals'
import { V2_AUCTION_TIME, V2_AUCTION_TIME_MILLIS } from '../../../constants/numbers'
import Countdown, { CountdownRendererFn } from 'react-countdown'
import { AuctionStatus } from '../../../types'
import AuctionInfo from './AuctionInfo'
import Link from 'next/link'
import useInterval from '../../../hooks/useInterval'
import { useCallback, useEffect } from 'react'

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

const Auction: React.FC = () => {
  const auction = useCrabV2Store(s => s.auction)
  const setAuctionStatus = useCrabV2Store(s => s.setAuctionStatus)
  const auctionStatus = useCrabV2Store(s => s.auctionStatus)
  const isHistoricalView = useCrabV2Store(s => s.isHistoricalView)

  const updateStatus = useCallback(() => {
    setAuctionStatus(getAuctionStatus(auction))
  }, [auction, setAuctionStatus])

  useEffect(() => {
    updateStatus()
  }, [updateStatus])
  useInterval(updateStatus, auction.auctionEnd ? Date.now() - auction.auctionEnd : null)
  useInterval(updateStatus, auction.auctionEnd ? Date.now() - auction.auctionEnd - V2_AUCTION_TIME_MILLIS : null)
  useInterval(updateStatus, auction.auctionEnd ? Date.now() - auction.auctionEnd + V2_AUCTION_TIME_MILLIS : null)

  return (
    <Box>
      <Typography variant="h6">Token approvals</Typography>
      <Box mt={1}>
        <Approvals />
      </Box>
      <Box display="flex" mt={4} alignItems="center">
        <Typography variant="h6">Auction</Typography>
        {auctionStatus === AuctionStatus.LIVE ? (
          <Typography variant="caption" ml={4} color="success.main" bgcolor="success.light" px={2} borderRadius={1}>
            Live Auction
          </Typography>
        ) : auctionStatus === AuctionStatus.SETTLEMENT ? (
          <Typography variant="caption" ml={4} color="warning.main" bgcolor="warning.light" px={2} borderRadius={1}>
            Settlement
          </Typography>
        ) : null}
        <Link href={`/auctionHistory/${auction.currentAuctionId - 1}`} passHref>
          <Typography
            variant="body3"
            ml={4}
            color="primary.main"
            px={2}
            borderRadius={1}
            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            Previous auction
          </Typography>
        </Link>
      </Box>
      <Box mt={1} border="1px solid grey" borderRadius={2} minHeight={150}>
        {Date.now() > auction.auctionEnd + V2_AUCTION_TIME_MILLIS && !isHistoricalView ? (
          <Typography textAlign="center" mt={3} variant="h6">
            No auctions scheduled yet!
          </Typography>
        ) : (
          <Box>
            <AuctionDetailsHeader isAuctionLive={auctionStatus === AuctionStatus.LIVE} />
            <AuctionHeaderBody />
          </Box>
        )}
      </Box>
      {Date.now() < auction.auctionEnd + V2_AUCTION_TIME_MILLIS || isHistoricalView ? (
        <>
          <Typography variant="h6" mt={4}>
            Bids
          </Typography>
          <Box display="flex" mt={1}>
            <AuctionBody />
          </Box>
          <Box display="flex" mt={1}>
            <AuctionInfo />
          </Box>
        </>
      ) : null}
    </Box>
  )
}

const AuctionDetailsHeader: React.FC<{ isAuctionLive: boolean }> = ({ isAuctionLive }) => {
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
            {format(add(new Date(auction.auctionEnd || 0), { minutes: V2_AUCTION_TIME * -1 }), 'hh:mm aa')}
          </Typography>
        </Box>
        <Box display="flex" mt={0.5} alignItems="center" justifyContent="space-between" width={180}>
          <Typography variant="body3">Auction end</Typography>
          <Typography variant="body2">{format(new Date(auction.auctionEnd || 0), 'hh:mm aa')}</Typography>
        </Box>
        <Box display="flex" mt={0.5} alignItems="center" justifyContent="space-between" width={180}>
          <Typography variant="body3">Settlement</Typography>
          <Typography variant="body2">
            {format(add(new Date(auction.auctionEnd || 0), { minutes: V2_AUCTION_TIME }), 'hh:mm aa')}
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
        <Typography color="textSecondary">Auction</Typography>
        <Typography textAlign="center" variant="numeric" color="primary">
          {isAuctionLive ? <Countdown date={auction.auctionEnd} renderer={renderer} /> : '--:--'}
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
          {auction.isSelling ? 'Min price' : 'Max price'}
        </Typography>
        <Typography textAlign="center" variant="numeric">
          {formatBigNumber(auction.price, 18, 6)} WETH
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
