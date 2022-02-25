import '../styles/globals.css'
import { AppProps } from 'next/app'
import { Provider, chain, defaultChains } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { WalletLinkConnector } from 'wagmi/connectors/walletLink'
import theme from '../theme'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { providers } from 'ethers'
import { CHAIN_ID } from '../constants/numbers'
import CatLoader from '../components/loaders/CatLoader'

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

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider autoConnect connectors={connectors} provider={provider}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
        <CatLoader />
      </ThemeProvider>
    </Provider>
  )
}

export default MyApp
