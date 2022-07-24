import '../styles/globals.css'
import * as React from 'react'
import { AppProps } from 'next/app'
import Head from 'next/head'
import theme from '../theme'
import { CssBaseline, ThemeProvider } from '@mui/material'
import CatLoader from '../components/loaders/CatLoader'
import useOracle from '../hooks/useOracle'
import { OSQUEETH, SQUEETH_UNI_POOL, USDC, WETH, WETH_USDC_POOL } from '../constants/address'
import usePriceStore from '../store/priceStore'
import shallow from 'zustand/shallow'
import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultWallets, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { chain, configureChains, createClient, WagmiConfig } from 'wagmi'
import { infuraProvider } from 'wagmi/providers/infura'
import { publicProvider } from 'wagmi/providers/public'
import { CHAIN_ID } from '../constants/numbers'
import useInitAccount from '../hooks/init/useInitAccount'
import ToastMessage from '../container/Toast'

// API key for Ethereum node
// Two popular services are Infura (infura.io) and Alchemy (alchemy.com)
const infuraId = process.env.NEXT_PUBLIC_INFURA_API_KEY

const appChain = CHAIN_ID === 1 ? chain.mainnet : chain.ropsten

// Chains for connectors to support
const { chains, provider } = configureChains([appChain], [infuraProvider({ infuraId }), publicProvider()])

// Set up connectors
const { connectors } = getDefaultWallets({
  appName: 'Squeeth Portal',
  chains,
})

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
})

const InitializePrice = React.memo(function InitializePrice() {
  useInitAccount()
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

        <meta name="theme-color" content="#1AE8FF" />
        <meta name="title" content="Squeeth Portal" />
        <meta name="description" content="A single place for your squeeth" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="Squeeth Portal" />
        <meta property="og:description" content="A single place for your squeeth" />
        <meta property="og:image" content="https://i.ibb.co/Yc4pfKD/og-image.png" />
        <meta property="og:url" content="https://www.squeethportal.xyz/" />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.squeethportal.xyz/" />
        <meta property="twitter:title" content="Squeeth Portal" />
        <meta property="twitter:description" content="A single place for your squeeth" />
        <meta property="twitter:image" content="https://i.ibb.co/Yc4pfKD/og-image.png" />
      </Head>
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider
          coolMode
          chains={chains}
          theme={darkTheme({
            accentColor: 'rgba(26, 232, 255)',
            accentColorForeground: 'black',
          })}
          appInfo={{
            appName: 'Squeeth Portal',
          }}
        >
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <InitializePrice />
            <ToastMessage />
            <Component {...pageProps} />
            <CatLoader />
          </ThemeProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </>
  )
}

export default MyApp
