import { Button, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { format } from 'date-fns'
import add from 'date-fns/add'
import shallow from 'zustand/shallow'
import useCrabV2Store from '../../../store/crabV2Store'
import usePriceStore from '../../../store/priceStore'
import useControllerStore from '../../../store/controllerStore'
import { estimateAuction, getAuctionStatus, getEstimatedClearingPrice } from '../../../utils/auction'
import { calculateDollarValue, calculateIV, convertBigNumber, formatBigNumber, formatNumber } from '../../../utils/math'
import AuctionBody from './AuctionBody'
import Approvals from './Approvals'
import { BIG_ZERO, ETHERSCAN, V2_AUCTION_TIME, V2_AUCTION_TIME_MILLIS } from '../../../constants/numbers'
import Countdown, { CountdownRendererFn } from 'react-countdown'
import { AuctionStatus } from '../../../types'
import AuctionInfo from './AuctionInfo'
import Link from 'next/link'
import useInterval from '../../../hooks/useInterval'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AuctionBadge from './AuctionBadge'
import styles from '../../../styles/Auction.module.css'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import HistoryIcon from '@mui/icons-material/History'
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
  const setAuction = useCrabV2Store(s => s.setAuction)
  const auctionStatus = useCrabV2Store(s => s.auctionStatus)
  const isHistoricalView = useCrabV2Store(s => s.isHistoricalView)

  const updateStatus = useCallback(() => {
    setAuctionStatus(getAuctionStatus(auction))
  }, [auction, setAuctionStatus])

  const vault = useCrabV2Store(s => s.vault)
  const oSqthPrice = usePriceStore(s => s.oSqthPrice)
  const isUpcoming = auctionStatus === AuctionStatus.UPCOMING

  const { isSellingAuction, oSqthAmount: oSqthAmountEst } = useMemo(() => {
    if (!isUpcoming || !vault || oSqthPrice.isZero())
      return { isSellingAuction: true, oSqthAmount: BIG_ZERO, ethAmount: BIG_ZERO }

    return estimateAuction(vault.shortAmount, vault.collateral, oSqthPrice)
  }, [isUpcoming, oSqthPrice, vault])

  const [auctionInitialized, setAuctionInitialized] = useState(false)

  useEffect(() => {
    if (auction.oSqthAmount !== '0' || auctionInitialized) return

    setAuction({
      ...auction,
      isSelling: isSellingAuction,
    })
    setAuctionInitialized(true)
  }, [auction, auctionInitialized, isSellingAuction, oSqthAmountEst, setAuction])

  useEffect(() => {
    updateStatus()
  }, [updateStatus])
  useInterval(updateStatus, auction.auctionEnd ? Date.now() - auction.auctionEnd : null)
  useInterval(updateStatus, auction.auctionEnd ? Date.now() - auction.auctionEnd - V2_AUCTION_TIME_MILLIS : null)
  useInterval(updateStatus, auction.auctionEnd ? Date.now() - auction.auctionEnd + V2_AUCTION_TIME_MILLIS : null)

  return (
    <Box>
      <Typography variant="h6" sx={{ textAlign: { xs: 'center', sm: 'left' } }} mb={1}>
        Token Approvals
      </Typography>
      <Approvals />
      <Box
        display="flex"
        gap={1}
        mt={4}
        mb={isHistoricalView ? 1 : 0}
        alignItems="center"
        flexWrap="wrap"
        justifyContent={{ xs: 'center', sm: 'start' }}
      >
        <Typography variant="h6">
          Auction {isHistoricalView ? new Date(auction.auctionEnd).toLocaleDateString() : ''}
        </Typography>
        <AuctionBadge />
      </Box>

      <Box
        display="flex"
        flexWrap="wrap"
        gap={2}
        justifyContent={{ xs: 'center', sm: 'start' }}
        mb={isHistoricalView ? 2 : 0}
      >
        {isHistoricalView ? (
          <Box display="flex" flexWrap="wrap" gap={2} justifyContent={{ xs: 'center', sm: 'start' }}>
            <Link href={`/auctionHistory/${auction.currentAuctionId - 1}`} passHref>
              <Typography variant="button" color="GrayText" className={styles.linkText}>
                <ArrowBackIosNewIcon fontSize="inherit" color="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                Prev
              </Typography>
            </Link>

            <Link href={`/auction`} passHref>
              <Typography variant="button" color="primary.main" className={styles.linkText}>
                Current
              </Typography>
            </Link>
            <Link href={`/auctionHistory/${auction.currentAuctionId + 1}`} passHref>
              <Typography variant="button" color="GrayText" className={styles.linkText}>
                Next
                <ArrowForwardIosIcon fontSize="inherit" color="inherit" sx={{ verticalAlign: 'middle', ml: 0.5 }} />
              </Typography>
            </Link>
          </Box>
        ) : null}
        <Link href={`/auctionHistory/`} passHref>
          <Typography variant="button" color="whitesmoke" className={styles.linkText}>
            <HistoryIcon fontSize="inherit" color="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            History
          </Typography>
        </Link>
      </Box>
      <Box mt={1} border="1px solid grey" borderRadius={2} minHeight={150}>
        {Date.now() > auction.auctionEnd + 30 * 60 * 1000 && !isHistoricalView ? (
          <Typography textAlign="center" mt={3} variant="h6">
            No auctions scheduled yet!
          </Typography>
        ) : (
          <Box>
            <AuctionDetailsHeader
              isAuctionLive={auctionStatus === AuctionStatus.LIVE}
              isSelling={
                auctionStatus === AuctionStatus.UPCOMING && auction.oSqthAmount === '0'
                  ? isSellingAuction
                  : auction.isSelling
              }
            />
            <AuctionHeaderBody
              osqthEstimate={auctionStatus === AuctionStatus.UPCOMING ? oSqthAmountEst.toString() : undefined}
              isUpcoming={isUpcoming}
            />
          </Box>
        )}
      </Box>
      {Date.now() < auction.auctionEnd + V2_AUCTION_TIME_MILLIS || isHistoricalView ? (
        <>
          <Box>
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

const AuctionDetailsHeader: React.FC<{ isAuctionLive: boolean; isSelling: boolean }> = ({
  isAuctionLive,
  isSelling,
}) => {
  const auction = useCrabV2Store(s => s.auction)
  const { ethPriceBN } = usePriceStore(s => ({ ethPriceBN: s.ethPrice }), shallow)
  const { nfBN } = useControllerStore(s => ({ nfBN: s.normFactor }), shallow)

  const ethPrice = convertBigNumber(ethPriceBN, 18)

  const isHistoricalView = useCrabV2Store(s => s.isHistoricalView)
  const nf = convertBigNumber(nfBN, 18)
  const estClearingPrice = useCrabV2Store(s => s.estClearingPrice)

  const action = useMemo(() => {
    if (isSelling) {
      return isHistoricalView ? 'Sold' : 'Selling'
    } else {
      return isHistoricalView ? 'Bought' : 'Buying'
    }
  }, [isHistoricalView, isSelling])

  return (
    <Box
      p={3}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      gap={3}
      flexDirection={{ xs: 'column', sm: 'row' }}
      overflow="auto"
    >
      <Box>
        <Box display="flex" alignItems="center">
          <Typography fontWeight={600} variant="body1">
            Strategy {action} oSQTH
          </Typography>
          {auction.tx ? (
            <Button sx={{ ml: 2 }} href={`${ETHERSCAN.url}/tx/${auction.tx}`} target="_blank" rel="noreferrer">
              tx
            </Button>
          ) : null}
        </Box>
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
      {isHistoricalView ? (
        <Box display="flex" flexDirection="column" justifyContent="center">
          <Typography color="textSecondary">clearing price(per oSQTH)</Typography>
          <Typography textAlign="center" variant="numeric" color="primary">
            {formatBigNumber(auction.clearingPrice || '0', 18, 5)} WETH
            <Typography textAlign="center" variant="numeric" color="textSecondary">
              {' '}
              ${calculateDollarValue(convertBigNumber(auction.clearingPrice, 18), ethPrice).toFixed(2)}{' '}
            </Typography>
            <Typography variant="numeric" color="textSecondary">
              {' '}
              {(calculateIV(convertBigNumber(auction.clearingPrice, 18), nf, ethPrice) * 100).toFixed(2)}%{' '}
            </Typography>
          </Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" justifyContent="center">
          <Typography color="textSecondary">Estimated clearing price(per oSQTH)</Typography>
          <Typography textAlign="center" variant="numeric" color="primary">
            {formatBigNumber(estClearingPrice, 18, 5)} WETH
            <Typography textAlign="center" variant="numeric" color="textSecondary">
              {' '}
              ${calculateDollarValue(convertBigNumber(estClearingPrice, 18), ethPrice).toFixed(2)}{' '}
            </Typography>
            <Typography variant="numeric" color="textSecondary">
              {' '}
              {(calculateIV(convertBigNumber(estClearingPrice, 18), nf, ethPrice) * 100).toFixed(2)}%{' '}
            </Typography>
          </Typography>
        </Box>
      )}
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary">Auction</Typography>
        <Typography textAlign="center" variant="numeric" color="primary">
          {isAuctionLive ? <Countdown date={auction.auctionEnd} renderer={renderer} /> : '--:--'}
        </Typography>
      </Box>
    </Box>
  )
}

const AuctionHeaderBody: React.FC<{ osqthEstimate?: string; isUpcoming: boolean }> = ({
  osqthEstimate,
  isUpcoming,
}) => {
  const auction = useCrabV2Store(s => s.auction)
  const { ethPriceBN, oSqthPriceBN } = usePriceStore(
    s => ({ ethPriceBN: s.ethPrice, oSqthPriceBN: s.oSqthPrice }),
    shallow,
  )
  const { ethDvol } = useCrabV2Store(s => ({ ethDvol: s.ethDvolIndex }), shallow)
  const { indexPrice, markPrice, nfBN } = useControllerStore(
    s => ({ indexPrice: s.indexPrice, markPrice: s.markPrice, nfBN: s.normFactor }),
    shallow,
  )

  const ethPrice = convertBigNumber(ethPriceBN, 18)
  const oSqthPrice = convertBigNumber(oSqthPriceBN, 18)
  const nf = convertBigNumber(nfBN, 18)

  return (
    <Box borderTop="1px solid grey" p={2} px={5} display="flex" overflow="auto" alignItems="center">
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          {isUpcoming && auction.oSqthAmount === '0' ? 'Estimated' : ''} Size
        </Typography>
        <Typography textAlign="center" variant="numeric">
          {formatBigNumber(isUpcoming && auction.oSqthAmount === '0' ? osqthEstimate! : auction.oSqthAmount, 18, 2)}{' '}
          <small>oSQTH</small>
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          {auction.isSelling ? 'Min Price' : 'Max Price'}
        </Typography>
        <Typography textAlign="center" variant="numeric">
          {formatBigNumber(auction.price, 18, 5)}
          <small>
            {' '}
            WETH{' '}
            <Typography textAlign="center" variant="numeric" color="textSecondary">
              {' '}
              ${calculateDollarValue(convertBigNumber(auction.price, 18), ethPrice).toFixed(1)}{' '}
            </Typography>
            <Typography variant="numeric" color="textSecondary">
              {''}
              {(calculateIV(convertBigNumber(auction.price, 18), nf, ethPrice) * 100).toFixed(1)}%{''}
            </Typography>{' '}
          </small>
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          Min Size
        </Typography>
        <Typography textAlign="center" variant="numeric">
          {(auction.minSize || 0).toFixed(1)}
          <small> oSQTH</small>
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption" textAlign="center">
          ETH Price
        </Typography>
        <Typography variant="numeric" textAlign="center">
          ${ethPrice.toFixed(2)}
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption" textAlign="center">
          oSQTH Price
        </Typography>
        <Typography variant="numeric" textAlign="center">
          {oSqthPrice.toFixed(5)}
          <small> ETH</small>
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption" textAlign="center">
          Index Price
        </Typography>
        <Typography variant="numeric" textAlign="center">
          ${formatBigNumber(indexPrice, 18, 0)}
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption" textAlign="center">
          Mark Price
        </Typography>
        <Typography variant="numeric" textAlign="center">
          ${formatBigNumber(markPrice, 18, 0)}
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption" textAlign="center">
          Squeeth IV
        </Typography>
        <Typography variant="numeric" textAlign="center">
          {(calculateIV(oSqthPrice, nf, ethPrice) * 100).toFixed(2)}%
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption" textAlign="center">
          DVOL
        </Typography>
        <Typography variant="numeric" textAlign="center">
          {ethDvol}%
        </Typography>
      </Box>
    </Box>
  )
}

export default Auction
