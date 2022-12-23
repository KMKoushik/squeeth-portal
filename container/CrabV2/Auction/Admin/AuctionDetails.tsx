import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import { Fragment, useMemo } from 'react'
import shallow from 'zustand/shallow'
import { BIG_ZERO } from '../../../../constants/numbers'
import useControllerStore from '../../../../store/controllerStore'
import useCrabV2Store from '../../../../store/crabV2Store'
import usePriceStore from '../../../../store/priceStore'
import { estimateAuction, getAuctionTypeText } from '../../../../utils/auction'
import { calculateIV, convertBigNumber, formatBigNumber } from '../../../../utils/math'
import AuctionBadge from '../AuctionBadge'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import { HtmlTooltip } from '../../../../components/utilities/HtmlTooltip'
import { squeethRefVolDocLink } from '../../../../utils/external'
import { SQUEETH_REF_VOL_MESSAGE } from '../../../../constants/message'
import { useAuctionEstimate } from '../../../../hooks/useAuctionEstimate'
import { AuctionType } from '../../../../types'
import { useCalmBullStore } from '../../../../store/calmBullStore'
import { bnComparator } from '../../../../utils'

const AuctionDetails: React.FC = () => {
  const auction = useCrabV2Store(s => s.auction, shallow)
  const osqthRefVol = useCrabV2Store(s => s.oSqthRefVolIndex, shallow)
  const { oSqthPrice, ethPrice } = usePriceStore(s => ({ oSqthPrice: s.oSqthPrice, ethPrice: s.ethPrice }), shallow)

  const { nfBN } = useControllerStore(
    s => ({ indexPrice: s.indexPrice, markPrice: s.markPrice, nfBN: s.normFactor }),
    shallow,
  )

  const ethPriceSN = convertBigNumber(ethPrice, 18)
  const oSqthPriceSN = convertBigNumber(oSqthPrice, 18)
  const nf = convertBigNumber(nfBN, 18)

  const { osqthEstimate, isSelling, delta } = useAuctionEstimate()

  const bullDelta = useCalmBullStore(s => s.delta, bnComparator)

  const cr = useCalmBullStore(s => s.cr, bnComparator)

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
          Type
        </Typography>
        <Typography textAlign="center" variant="numeric">
          {getAuctionTypeText(auction.type)}
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          Delta
        </Typography>
        <Typography textAlign="center" variant="numeric">
          {formatBigNumber(auction.type === AuctionType.CALM_BULL ? bullDelta : delta, 18, 2)}{' '}
          {auction.type === AuctionType.CRAB_HEDGE ? 'ETH' : ''}
        </Typography>
      </Box>
      {auction.type === AuctionType.CALM_BULL ? (
        <>
          <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
          <Box display="flex" flexDirection="column" justifyContent="center">
            <Typography color="textSecondary" variant="caption">
              CR
            </Typography>
            <Typography textAlign="center" variant="numeric">
              {formatBigNumber(cr, 18, 2)}
            </Typography>
          </Box>
        </>
      ) : null}
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          Is Selling
        </Typography>
        <Typography textAlign="center" variant="numeric">
          {isSelling ? 'Yes' : 'No'}
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={3} mr={3} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          Est. oSQTH Amount
        </Typography>
        <Typography textAlign="center" variant="numeric">
          {formatBigNumber(osqthEstimate, 18, 2)} oSQTH
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
          {formatBigNumber(oSqthPrice, 18, 5)} WETH
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
        <Typography color="textSecondary" variant="caption">
          Squeeth Ref Vol
          <HtmlTooltip
            title={
              <Fragment>
                {SQUEETH_REF_VOL_MESSAGE}
                <a href={squeethRefVolDocLink} target="_blank" rel="noreferrer">
                  <b>{'Learn more.'}</b>
                </a>
              </Fragment>
            }
          >
            <InfoIcon fontSize="inherit" color="inherit" sx={{ verticalAlign: 'middle', ml: 0.5 }} />
          </HtmlTooltip>
        </Typography>
        <Typography variant="numeric">{osqthRefVol.toFixed(2)}%</Typography>
      </Box>
    </Box>
  )
}

export default AuctionDetails
