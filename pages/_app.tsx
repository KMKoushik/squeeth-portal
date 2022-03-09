import '../styles/globals.css'
import * as React from 'react'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { Provider, chain, defaultChains } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { WalletLinkConnector } from 'wagmi/connectors/walletLink'
import theme from '../theme'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { providers } from 'ethers'
import { CHAIN_ID } from '../constants/numbers'
import CatLoader from '../components/loaders/CatLoader'
import useOracle from '../hooks/useOracle'
import { OSQUEETH, SQUEETH_UNI_POOL, USDC, WETH, WETH_USDC_POOL } from '../constants/address'
import usePriceStore from '../store/priceStore'
import shallow from 'zustand/shallow'

// API key for Ethereum node
// Two popular services are Infura (infura.io) and Alchemy (alchemy.com)
const infuraId = process.env.NEXT_PUBLIC_INFURA_API_KEY
const poktKey = process.env.NEXT_PUBLIC_PORTAL_API_KEY

// Chains for connectors to support
const chains = defaultChains

// Set up connectors
const connectors = () => {
  const rpcUrl = chains.find(x => x.id === CHAIN_ID)?.rpcUrls?.[0] ?? chain.mainnet.rpcUrls[0]
  return [
    new InjectedConnector({ chains }),
    new WalletConnectConnector({
      options: {
        infuraId,
        qrcode: true,
      },
    }),
    new WalletLinkConnector({
      options: {
        appName: 'Squeeth Portal',
        jsonRpcUrl: `${rpcUrl}/${infuraId}`,
      },
    }),
  ]
}

const provider = new providers.InfuraProvider(CHAIN_ID, infuraId)

const InitializePrice = React.memo(function InitializePrice() {
  const oracle = useOracle()
  const { setOsqthPrice, setEthPrice } = usePriceStore(
    s => ({ setEthPrice: s.setEthPrice, setOsqthPrice: s.setOsqthPrice }),
    shallow,
  )

  React.useEffect(() => {
    const p1 = oracle.getTwap(SQUEETH_UNI_POOL, OSQUEETH, WETH, 1, true)
    const p2 = oracle.getTwap(WETH_USDC_POOL, WETH, USDC, 1, true)

    Promise.all([p1, p2]).then(prices => {
      const [_sqthPrice, _ethPrice] = prices
      setOsqthPrice(_sqthPrice)
      setEthPrice(_ethPrice)
    })
  }, [oracle, setEthPrice, setOsqthPrice])

  return <></>
})

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Squeeth Portal</title>
        <meta property="og:title" content="Squeeth Portal" />
        <meta property="og:description" content="A single place for your squeeth" />
        <meta property="og:image" content="https://i.ibb.co/zRcf8YC/space-cat.jpg" />
      </Head>
      <Provider autoConnect connectors={connectors} provider={provider}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <InitializePrice />
          <Component {...pageProps} />
          <CatLoader />
        </ThemeProvider>
      </Provider>
    </>
  )
}

export default MyApp
