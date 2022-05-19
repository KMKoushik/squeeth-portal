import { Box, Button, Grid, Typography } from '@mui/material'
import * as React from 'react'
import shallow from 'zustand/shallow'
import useControllerStore from '../../store/controllerStore'
import useCrabStore from '../../store/crabStore'
import usePriceStore from '../../store/priceStore'
import { convertBigNumber, formatBigNumber, calculateIV, formatNumber, wdiv } from '../../utils/math'
import { bnComparator } from '../../utils'
import TimeHedge from './TimeHedge'
import useController from '../../hooks/useController'
import useCrab from '../../hooks/useCrab'
import Countdown, { CountdownRendererFn } from 'react-countdown'
import { AUCTION_TIME, BIG_ONE } from '../../constants/numbers'
import useInterval from '../../hooks/useInterval'

type AuctionItemProps = {
  title: string
  value: string | number | React.ReactNode
}

const AuctionItem = React.memo<AuctionItemProps>(function AuctionItem({ title, value }) {
  return (
    <Grid container spacing={1} mt={0.25} justifyContent="space-between">
      <Grid item xs={6}>
        <Typography variant="body1" fontSize={16} color="textSecondary">
          {title}
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <Typography variant="numeric">{value}</Typography>
      </Grid>
    </Grid>
  )
})

const renderer: CountdownRendererFn = ({ minutes, seconds }) => {
  // Render a countdown
  return (
    <Box display="flex" gap={0.5} alignItems="baseline">
      <Typography component="span" variant="numeric">
        {formatNumber(minutes)}
      </Typography>
      <Typography component="span" variant="subtitle2" color="textSecondary">
        M
      </Typography>
      <Typography component="span" variant="numeric" ml={1}>
        {formatNumber(seconds)}
      </Typography>
      <Typography component="span" variant="subtitle2" mr={1} color="textSecondary">
        S
      </Typography>
    </Box>
  )
}

type LiveAuctionProps = {
  isContractGivingResult: boolean
  reload: () => void
}

const LiveAuction = React.memo<LiveAuctionProps>(function LiveAuction({ isContractGivingResult, reload }) {
  useController()
  const { getMinAndMaxPrice } = useCrab()
  const auctionTriggerTime = useCrabStore(s => s.auctionTriggerTime)
  const auctionDetails = useCrabStore(s => s.auctionDetails, shallow)
  const normFactor = useControllerStore(s => s.normFactor, bnComparator)
  const ethPrice = usePriceStore(s => s.ethPrice, bnComparator)
  const osqthPrice = usePriceStore(s => s.oSqthPrice, bnComparator)

  const setAuctionDetails = useCrabStore(s => s.setAuctionDetails)
  const { getAuctionDetailsOffChain } = useCrab()

  const iv = React.useMemo(() => {
    if (normFactor.isZero()) return 0

    const oSqthPrice = convertBigNumber(auctionDetails.auctionPrice, 18)
    const nf = convertBigNumber(normFactor, 18)
    const _ethPrice = convertBigNumber(ethPrice, 18)
    const _iv = calculateIV(oSqthPrice, nf, _ethPrice) * 100
    console.log('IV: ', nf.toString(), _ethPrice.toString(), oSqthPrice.toString(), _iv)
    return _iv
  }, [auctionDetails.auctionPrice, ethPrice, normFactor])

  const actualIv = React.useMemo(() => {
    if (normFactor.isZero()) return 0

    const nf = convertBigNumber(normFactor, 18)
    const _ethPrice = convertBigNumber(ethPrice, 18)
    const oSqthPrice = convertBigNumber(osqthPrice, 18)
    const _actIv = calculateIV(oSqthPrice, nf, _ethPrice) * 100
    return _actIv
  }, [ethPrice, normFactor, osqthPrice])

  const ivDiff = React.useMemo(() => {
    return actualIv - iv
  }, [actualIv, iv])

  const { minPrice, maxPrice } = React.useMemo(() => {
    return getMinAndMaxPrice(osqthPrice, auctionDetails.isSelling)
  }, [getMinAndMaxPrice, osqthPrice, auctionDetails.isSelling])

  const refetchAuctionDetails = React.useCallback(() => {
    reload()
    getAuctionDetailsOffChain(auctionTriggerTime).then(d => {
      const { isSellingAuction, oSqthToAuction, ethProceeds, auctionOsqthPrice, isAuctionDirectionChanged } = d

      setAuctionDetails({
        isSelling: isSellingAuction,
        oSqthAmount: oSqthToAuction,
        ethProceeds,
        auctionPrice: auctionOsqthPrice,
        isDirectionChanged: isAuctionDirectionChanged,
      })
    })
  }, [auctionTriggerTime, getAuctionDetailsOffChain, reload, setAuctionDetails])

  const aucPriceVsUniPrice = React.useMemo(() => {
    if (!osqthPrice.gt(0)) return 0
    return Number(formatBigNumber(wdiv(auctionDetails.auctionPrice, osqthPrice).sub(BIG_ONE).mul(100), 18, 6))
  }, [auctionDetails.auctionPrice, osqthPrice])

  useInterval(refetchAuctionDetails, 10000)

  return (
    <Box sx={{ height: '100%' }} bgcolor="background.surface" borderRadius={2} py={2} px={4}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Button onClick={refetchAuctionDetails}>Reload</Button>
          <AuctionItem title="Type :" value="Time Hedge" />
          <AuctionItem title="Is Selling oSQTH :" value={auctionDetails.isSelling ? 'Yes' : 'No'} />
          <AuctionItem
            title="Start / End Price :"
            value={`${formatBigNumber(minPrice, 18, 6)} / ${formatBigNumber(maxPrice, 18, 6)}`}
          />
          <AuctionItem title="Auction Price :" value={`${formatBigNumber(auctionDetails.auctionPrice, 18, 6)} ETH`} />
          <AuctionItem title="oSQTH Amount :" value={`${formatBigNumber(auctionDetails.oSqthAmount, 18, 6)}`} />
          <AuctionItem title="ETH Value :" value={`${formatBigNumber(auctionDetails.ethProceeds, 18, 6)}`} />
          <AuctionItem title="Auction Implied vol :" value={`${(iv || 0).toFixed(2)} %`} />
          <AuctionItem title="Uniswap Implied vol :" value={`${(actualIv || 0).toFixed(2)} %`} />
          <AuctionItem
            title="Auction ends in :"
            value={<Countdown date={(auctionTriggerTime + AUCTION_TIME) * 1000} renderer={renderer} />}
          />
          <Typography variant="body2" mt={2} fontSize={16}>
            - Auction price is {Math.abs(aucPriceVsUniPrice).toFixed(4)}% {aucPriceVsUniPrice > 0 ? 'Higher' : 'Lower'}{' '}
            than uniswap price{' '}
          </Typography>
          <Typography variant="body2" fontSize={16} mt={1}>
            - Auction price vol ({iv.toFixed(2)}%) is {Math.abs(ivDiff).toFixed(1)}% vol{' '}
            {ivDiff > 0 ? 'Lower' : 'Higher'} than uniswap price vol ({actualIv.toFixed(2)})
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          {isContractGivingResult ? (
            <TimeHedge />
          ) : (
            <Box display="flex">
              <Typography textAlign="center" color="warning.main">
                Direction is changing, page will reload every 10s
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  )
})

export default LiveAuction
