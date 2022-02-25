import { Box, Grid, Snackbar, Typography } from '@mui/material'
import * as React from 'react'
import { FUNDING_PERIOD, INDEX_SCALE } from '../constants/numbers'
import useTvl from '../hooks/useTvl'

import useControllerStore from '../store/controllerStore'
import { bnComparator } from '../utils'
import { formatBigNumber } from '../utils/math'

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';

import * as address from '../constants/address'

const SqueethInfo = React.memo(function SqueethInfo() {
  const tvl = useTvl()
  const nf = useControllerStore(s => s.normFactor, bnComparator)
  const indexPrice = useControllerStore(s => s.indexPrice, bnComparator)
  const markPrice = useControllerStore(s => s.markPrice, bnComparator)

  const impliedFunding = React.useMemo(() => {
    if (indexPrice.isZero()) return 0

    return (Math.log(markPrice.mul(INDEX_SCALE).div(indexPrice).toNumber() / INDEX_SCALE) / FUNDING_PERIOD) * 100
  }, [indexPrice, markPrice])

  return (
    <Grid container mb={4} justifyContent='space-between'>
      <Grid item xs={12} sm={4} border={1} borderColor='#2D2F34' borderRadius={2} p={2} sx={{ marginBottom: { xs: 2, sm: 0 }, marginRight: { sm: 2 }, justifyContent: { xs: 'center' } }}>
        <TVL name='TVL' value={tvl.toFixed(2)} />
        <Box mb={2}>
          <LabelValue name='Index Price' value={formatBigNumber(indexPrice, 18, 0)} />
          <LabelValue name='Mark Price' value={formatBigNumber(markPrice, 18, 0)} />
        </Box>
        <LabelValue name='Current Funding' value={impliedFunding.toFixed(2) + ' %'} />
        <LabelValue name='NF' value={formatBigNumber(nf, 18, 6)} />
      </Grid>

      <Grid item xs={12} sm={6} justifyContent='center' textAlign='center'>
        <Addressbar address={address.CONTROLLER} name='💰 Controller' margin />
        <Addressbar address={address.OSQUEETH} name='🐱 OSqueeth' margin />
        <Addressbar address={address.CRAB_STRATEGY} name='🦀 Strategy' margin={false} />

      </Grid>
    </Grid >
  )
})

export default SqueethInfo


type PropsKeyValue = {
  name: string,
  value: string,

}
function TVL({ name, value }: PropsKeyValue) {
  return (
    <Grid container spacing={2} alignItems='center' mb={2}>
      <Grid item>
        <LocalAtmIcon color='disabled' fontSize='large' />
      </Grid>
      <Grid item>
        <Typography color='GrayText'> {name}</Typography>
        <Typography color='primary' fontWeight={600} fontSize='x-large'>
          {value}
          <Typography component='span' color='white' fontSize='small' ml={0.5}> ETH</Typography>
        </Typography>
      </Grid>
    </Grid >
  )
}

function LabelValue({ name, value }: PropsKeyValue) {
  return (
    <Box display='flex' alignItems='center' alignContent='center'>
      <Typography color='GrayText' component='span' mr={1}> {name} </Typography>
      <Typography color='whitesmoke' fontSize='large' component='span' >  {value}﹩ </Typography>
    </Box>
  )
}


function Addressbar({ address, name, margin }: { address: string, name: string, margin: boolean }) {

  const [open, setOpen] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(address)
    setOpen(true)
  }
  return (
    <Box
      borderRadius={2}
      maxWidth='xs'
      border={1}
      borderColor='#2D2F34'
      p={0.5}
      mb={margin ? 2 : 0}
    >
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h6' component='span' ml={1}>
          {name}
          <a target='_blank' href={`https://etherscan.io/address/${address}`}>
            <OpenInNewIcon fontSize='small' color='disabled' sx={{
              verticalAlign: 'middle',
              ml: 1,
              ":hover": {
                cursor: 'pointer',
                transform: 'scale(1.2)'
              }
            }} />
          </a>
        </Typography>
        <ContentCopyIcon fontSize='small' color='disabled' onClick={handleCopy} sx={{
          verticalAlign: 'middle',

          ":hover": {
            cursor: 'copy',
            transform: 'scale(1.2)'
          }
        }} />
      </Box>
      <Typography textAlign='left' color='GrayText' overflow='hidden' textOverflow='ellipsis' mx={1}>{address}

      </Typography>

      <Snackbar
        open={open}
        autoHideDuration={10000}
        message="Copied to clipboard"
        onClose={() => setOpen(false)}
      />
    </Box>
  )
} 