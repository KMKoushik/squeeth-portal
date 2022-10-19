import { Box, Typography } from '@mui/material'
import shallow from 'zustand/shallow'
import auction from '../../../pages/auction'
import useControllerStore from '../../../store/controllerStore'
import useCrabV2Store from '../../../store/crabV2Store'
import usePriceStore from '../../../store/priceStore'
import { calculateIV, convertBigNumber, formatBigNumber } from '../../../utils/math'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import { HtmlTooltip } from '../../../components/utilities/HtmlTooltip'
import { Fragment } from 'react'

export const OTCInfo: React.FC = () => {
  const { ethPriceBN, oSqthPriceBN } = usePriceStore(
    s => ({ ethPriceBN: s.ethPrice, oSqthPriceBN: s.oSqthPrice }),
    shallow,
  )

  const { osqthRefvol } = useCrabV2Store(s => ({  osqthRefvol: s.oSqthRefVolIndex }), shallow)

  const { indexPrice, markPrice, nfBN } = useControllerStore(
    s => ({ indexPrice: s.indexPrice, markPrice: s.markPrice, nfBN: s.normFactor }),
    shallow,
  )

  const ethPrice = convertBigNumber(ethPriceBN, 18)
  const oSqthPrice = convertBigNumber(oSqthPriceBN, 18)
  const nf = convertBigNumber(nfBN, 18)

  return (
    <Box p={2} px={5} display="flex" overflow="auto" alignItems="center" border="1px solid gray" borderRadius={2}>
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          ETH Price
        </Typography>
        <Typography variant="numeric">${formatBigNumber(ethPriceBN)}</Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={2} mr={2} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          oSQTH Price
        </Typography>
        <Typography variant="numeric">
          {formatBigNumber(oSqthPriceBN)}
          <small> ETH</small>
        </Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={2} mr={2} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          Squeeth IV
        </Typography>
        <Typography variant="numeric">{(calculateIV(oSqthPrice, nf, ethPrice) * 100).toFixed(2)}%</Typography>
      </Box>
      <Box border=".2px solid grey" height="50px" ml={2} mr={2} />
      <Box display="flex" flexDirection="column" justifyContent="center">
        <Typography color="textSecondary" variant="caption">
          Squeeth Ref Vol
          <HtmlTooltip
            title={
              <Fragment>
                {"Squeeth reference volatility based on deribit options and squeeth replicating portfolio..."}
                <a href=''><b>{'Click here learn more'}</b></a>
              </Fragment>
            }
          >
            <InfoIcon fontSize="inherit" color="inherit" sx={{ verticalAlign: 'middle', ml: 0.5 }} />
          </HtmlTooltip>
        </Typography>
        <Typography variant="numeric">{ osqthRefvol.toFixed(2)}%</Typography>
      </Box>
    </Box>
  )
}
