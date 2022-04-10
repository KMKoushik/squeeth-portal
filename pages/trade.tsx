import { NextPage } from 'next'
import { darkTheme, Theme, SwapWidget } from '@uniswap/widgets'

import { defaultChains, useProvider, chain } from 'wagmi'

import '@uniswap/widgets/fonts.css'
import { CHAIN_ID } from '../constants/numbers'
import { Nav } from '../container/Nav'
import { Box, Typography } from '@mui/material'

const theme: Theme = {
  ...darkTheme,
  borderRadius: 8,
  fontFamily: 'Space Mono',
  container: '#27292D',
  secondary: '#D9E2EC',
  accent: '#1AE8FF90',
  error: '#ff1f62',
  success: '#17ffa2',
}

const chains = defaultChains

const infuraId = process.env.NEXT_PUBLIC_INFURA_API
const rpcUrl = chains.find(x => x.id === CHAIN_ID)?.rpcUrls?.[0] ?? chain.mainnet.rpcUrls[0]
const jsonRpcEndpoint = `${rpcUrl}<${infuraId}>`

const Trade: NextPage = () => {
  // have to change this provider to rcpjsonprovider
  const provider = useProvider()

  return (
    <>
      <Nav />
      <Box
        sx={{ display: 'flex', flexDirection: 'column', placeContent: 'center', placeItems: 'center', height: '80vh' }}
      >
        <Typography variant="h5" color="primary" mb={2}>
          Trade
        </Typography>
        <div className="Uniswap">
          <SwapWidget provider={provider} jsonRpcEndpoint={jsonRpcEndpoint} theme={theme} />
        </div>
      </Box>
    </>
  )
}

export default Trade
