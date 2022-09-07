import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useMemo } from 'react'
import shallow from 'zustand/shallow'
import { BIG_ZERO } from '../../../../constants/numbers'
import useControllerStore from '../../../../store/controllerStore'
import useCrabV2Store from '../../../../store/crabV2Store'
import usePriceStore from '../../../../store/priceStore'
import { estimateAuction } from '../../../../utils/auction'
import { calculateIV, convertBigNumber, formatBigNumber } from '../../../../utils/math'
import AuctionBadge from '../AuctionBadge'

const AuctionDetails: React.FC = () => {
  const { vault, ethDvolIndex } = useCrabV2Store(s => ({ vault: s.vault, ethDvolIndex: s.ethDvolIndex }), shallow)
  const { oSqthPrice, ethPrice } = usePriceStore(s => ({ oSqthPrice: s.oSqthPrice, ethPrice: s.ethPrice }), shallow)

  const { nfBN } = useControllerStore(
    s => ({ indexPrice: s.indexPrice, markPrice: s.markPrice, nfBN: s.normFactor }),
    shallow,
  )

  const ethPriceSN = convertBigNumber(ethPrice, 18)
  const oSqthPriceSN = convertBigNumber(oSqthPrice, 18)
  const nf = convertBigNumber(nfBN, 18)

  const {
    isSellingAuction,
    oSqthAmount: oSqthAmountEst,
    delta,
  } = useMemo(() => {
    if (!vault) return { isSellingAuction: true, oSqthAmount: BIG_ZERO, ethAmount: BIG_ZERO, delta: BIG_ZERO }

    return estimateAuction(vault.shortAmount, vault.collateral, oSqthPrice)
  }, [oSqthPrice, vault])

  return (
    <Box display="flex" border="1px solid gray" borderRadius={2} p={2}>
      <Box display="flex" flexDirection="column">
        <Typography color="textSecondary" variant="caption">
          Auction Status
        </Typography>
        <AuctionBadge />
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          Delta
        </Typography>
        <Typography textAlign="center" variant="numeric">
          {formatBigNumber(delta, 18, 2)} ETH
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          Is Selling
        </Typography>
        <Typography textAlign="center" variant="numeric">
          {isSellingAuction ? 'Yes' : 'No'}
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          Est. oSQTH Amount
        </Typography>
        <Typography textAlign="center" variant="numeric">
          {formatBigNumber(oSqthAmountEst, 18, 2)} oSQTH
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          ETH Price
        </Typography>
        <Typography textAlign="center" variant="numeric">
          ${formatBigNumber(ethPrice, 18, 2)}
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          oSQTH Price
        </Typography>
        <Typography textAlign="center" variant="numeric">
          {formatBigNumber(oSqthPrice, 18, 6)} WETH
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption" textAlign="center">
          Squeeth IV
        </Typography>
        <Typography variant="numeric" textAlign="center">
          {(calculateIV(oSqthPriceSN, nf, ethPriceSN) * 100).toFixed(2)}%
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption" textAlign="center">
          DVOL
        </Typography>
        <Typography variant="numeric" textAlign="center">
          {ethDvolIndex}%
        </Typography>
      </Box>
    </Box>
  )
}

export default AuctionDetails
