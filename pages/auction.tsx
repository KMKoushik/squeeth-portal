import { Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { NextPage } from 'next'
import Head from 'next/head'
import * as React from 'react'
import { formatDistance, format } from 'date-fns'
import { Nav } from '../container/Nav'
import PageGrid from '../container/PageGrid'
import useCrab, { getSqthEthTarget } from '../hooks/useCrab'
import useCrabStore from '../store/crabStore'
import { divideWithPrecision, formatBigNumber, parseUnits, wdiv, wmul } from '../utils/math'
import useOracle from '../hooks/useOracle'
import { OSQUEETH, SQUEETH_UNI_POOL, WETH } from '../constants/address'
import { BIG_ONE, BIG_ZERO } from '../constants/numbers'
import { bnComparator } from '../utils'
import { useBlockNumber, useNetwork, useProvider } from 'wagmi'
import LiveAuction from '../container/Auction/LiveAuction'
import NoAuction from '../container/Auction/NoAuction'
import useCatLoaderStore from '../store/catLoaderStore'
import { Pages } from '../constants/analytics'

const Auction: NextPage = () => {
  const { crabLoaded } = useCrab()
  const setLoading = useCatLoaderStore(s => s.setOpen)

  React.useEffect(() => {
    fetch(`/api/views/${Pages.auction}`, {
      method: 'POST',
    })
  }, [])

  !crabLoaded ? setLoading(true) : setLoading(false)

  return (
    <div>
      <Head>
        <title>Squeeth Strategy Auction</title>
      </Head>
      <Nav />
      <Box flexGrow={1} px={4} pt={4}>
        {!crabLoaded ? (
          <Typography variant="h3" color="primary" fontFamily="Cattyla" align="center">
            Loading...
          </Typography>
        ) : (
          <CrabAuction />
        )}
      </Box>
    </div>
  )
}

const CrabAuction = React.memo(function CrabAuction() {
  const oracle = useOracle()
  const { crabContract, getMinAndMaxPrice } = useCrab()
  const timeAtLastHedge = useCrabStore(s => s.timeAtLastHedge)
  const priceAtLastHedge = useCrabStore(s => s.priceAtLastHedge, bnComparator)
  const timeHedgeThreshold = useCrabStore(s => s.hedgeTimeThreshold)
  const priceHedgeThreshold = useCrabStore(s => s.hedgePriceThreshold, bnComparator)
  const isTimeHedgeAvailable = useCrabStore(s => s.isTimeHedgeAvailable)
  const triggerTime = useCrabStore(s => s.auctionTriggerTime)
  const vault = useCrabStore(s => s.vault)

  const [priceDeviation, setPriceDeviation] = React.useState(0)
  const [squeethPrice, setSqueethPrice] = React.useState(BIG_ZERO)
  const [isContractGivingResult, setIsContractGivingResult] = React.useState(false)

  React.useEffect(() => {
    oracle.getTwap(SQUEETH_UNI_POOL, OSQUEETH, WETH, 1, true).then(_squeethPrice => {
      const _deviation = ((divideWithPrecision(_squeethPrice, priceAtLastHedge, 4) - 1) * 100).toFixed(2)
      setSqueethPrice(_squeethPrice)
      setPriceDeviation(Number(_deviation))
    })
  }, [oracle, priceAtLastHedge])

  const reloadContractData = React.useCallback(() => {
    crabContract
      .getAuctionDetails(triggerTime)
      .then(d => setIsContractGivingResult(!d[4]))
      .catch(console.log)
  }, [crabContract, triggerTime])

  React.useEffect(() => {
    reloadContractData()
  }, [reloadContractData])

  const priceAuctionStart = React.useMemo(() => {
    return squeethPrice.add(squeethPrice.mul(priceHedgeThreshold).div(BIG_ONE))
  }, [squeethPrice, priceHedgeThreshold])

  const priceAuctionEnd = React.useMemo(() => {
    return squeethPrice.sub(squeethPrice.mul(priceHedgeThreshold).div(BIG_ONE))
  }, [squeethPrice, priceHedgeThreshold])

  const { minPrice, maxPrice } = React.useMemo(() => {
    if (!vault) return { minPrice: BIG_ZERO, maxPrice: BIG_ZERO }
    const sqthEthDelta = wmul(vault.shortAmount, squeethPrice).mul(2)

    return getMinAndMaxPrice(squeethPrice, !sqthEthDelta.gt(vault.collateralAmount))
  }, [getMinAndMaxPrice, squeethPrice, vault])

  const { start, end, isSellingAuction } = React.useMemo(() => {
    if (!vault || squeethPrice.isZero())
      return {
        start: { ethAmount: BIG_ZERO, oSqthAmount: BIG_ZERO },
        end: { ethAmount: BIG_ZERO, oSqthAmount: BIG_ZERO },
        isSellingAuction: false,
      }

    console.log(minPrice.toString(), maxPrice.toString())

    const { oSqthAmount: defaultSqth, ethAmount: defaultEth } = getSqthEthTarget(
      vault.shortAmount,
      vault.collateralAmount,
      squeethPrice,
    )

    const { oSqthAmount: startLikelySqthTrade, ethAmount: startLikelyEthTrade } = getSqthEthTarget(
      vault.shortAmount,
      vault.collateralAmount,
      minPrice,
    )

    const {
      oSqthAmount: endLikelySqthTrade,
      ethAmount: endLikelyEthTrade,
      isSellingAuction,
    } = getSqthEthTarget(vault.shortAmount, vault.collateralAmount, maxPrice)

    return {
      start: {
        ethAmount: startLikelyEthTrade.isZero() ? defaultEth : startLikelyEthTrade,
        oSqthAmount: startLikelySqthTrade.isZero() ? defaultSqth : startLikelySqthTrade,
      },
      end: {
        ethAmount: endLikelyEthTrade.isZero() ? defaultEth : endLikelyEthTrade,
        oSqthAmount: endLikelySqthTrade.isZero() ? defaultSqth : endLikelySqthTrade,
      },
      isSellingAuction,
    }
  }, [maxPrice, minPrice, squeethPrice, vault])

  return (
    <PageGrid>
      <Typography variant="h5" color="primary" mb={2}>
        Crab Strategy auction
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Box sx={{ height: '100%' }} bgcolor="background.surface" borderRadius={2} py={2} px={4}>
            <Typography textAlign="center" variant="h6" mb={2}>
              Previous auction
            </Typography>
            <Typography>
              Hedged time: {formatDistance(timeAtLastHedge * 1000, Date.now(), { addSuffix: true })}
            </Typography>
            <Typography>
              oSQTH Price: &nbsp;
              <Typography variant="numeric">{formatBigNumber(priceAtLastHedge, 18, 6)} ETH</Typography>
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ height: '100%' }} bgcolor="background.surface" borderRadius={2} py={2} px={4}>
            <Typography textAlign="center" variant="h6" mb={2}>
              Upcoming auction
            </Typography>
            <Typography>
              Next auction time:
              <Typography variant="numeric" component="span">
                {' ' + format((timeAtLastHedge + timeHedgeThreshold) * 1000, 'dd-MMM-yyy hh:mm aa')}
              </Typography>
            </Typography>
            <Typography>
              Current oSQTH price:
              <Typography variant="numeric" component="span">
                {' ' + formatBigNumber(squeethPrice, 18, 6)} ({priceDeviation}%)
              </Typography>
            </Typography>
            <Typography>
              {' '}
              price to trigger Price auction:
              <Typography variant="numeric">
                {' ' + formatBigNumber(priceAuctionStart, 18, 6) + '/' + formatBigNumber(priceAuctionEnd, 18, 6)}
              </Typography>
            </Typography>
            <Typography mt={2}>
              Strategy will {isSellingAuction ? 'Sell' : 'Buy'}
              <Typography variant="numeric" component="span" fontWeight={600}>
                &nbsp;{formatBigNumber(start.oSqthAmount, 18, 0)}-
              </Typography>
              <Typography variant="numeric" component="span" fontWeight={600}>
                {formatBigNumber(end.oSqthAmount, 18, 0)}&nbsp;
              </Typography>
              oSQTH for
              <Typography variant="numeric" component="span" fontWeight={600}>
                &nbsp;{formatBigNumber(start.ethAmount, 18, 0)}
              </Typography>
              <Typography variant="numeric" component="span" fontWeight={600}>
                -{formatBigNumber(end.ethAmount, 18, 0)}
              </Typography>
              &nbsp;ETH
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={12}>
          {isTimeHedgeAvailable ? (
            <LiveAuction isContractGivingResult={isContractGivingResult} reload={reloadContractData} />
          ) : (
            <NoAuction time={(timeAtLastHedge + timeHedgeThreshold) * 1000} />
          )}
        </Grid>
      </Grid>
    </PageGrid>
  )
})

export default Auction
