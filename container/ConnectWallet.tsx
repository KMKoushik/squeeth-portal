import { Box, Button, Typography } from '@mui/material'
import { styled } from '@mui/system'
import * as React from 'react'
import { useConnect } from 'wagmi'
import OutlinedPrimaryButton from '../components/button/OutlinePrimaryButton'
import { useIsMounted } from '../hooks/useIsMounted'
import { MetamaskIcon, WalletConnectIcon, WalletLinkIcon } from '../icons/wallets'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 300,
  bgcolor: 'background.paper',
  borderRadius: 4,
  boxShadow: 24,
  py: 4,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  textAlign: 'center',
}

const getName = (id: string) => {
  if (id === 'WalletConnect') return 'Wallet Connect'
  else return id
}

const StyledWalletLinkIcon = styled(WalletLinkIcon)`
  path.outerBackground {
    fill: #0000;
  }
`

const ConnectWallet = React.memo(function ConnectWallet() {
  const [{ data, error }, connect] = useConnect()
  const isMountedCb = useIsMounted()
  const isMounted = isMountedCb()
  console.log(data.connector)

  return (
    <Box sx={style}>
      <Typography id="modal-modal-title" variant="h6" component="h2">
        Connect Wallet
      </Typography>
      {isMounted &&
        data.connectors.map(x => (
          <Box key={x.id} sx={{ marginTop: 2 }}>
            <OutlinedPrimaryButton
              disabled={isMounted ? !x.ready : false}
              onClick={() => connect(x)}
              sx={{ width: 250 }}
              startIcon={<WalletIcon wallet={x.id} />}
            >
              {isMounted ? getName(x.name) : x.id === 'injected' ? x.id : x.name}
              {isMounted ? !x.ready && ' (unsupported)' : ''}
            </OutlinedPrimaryButton>
          </Box>
        ))}
    </Box>
  )
})

const WalletIcon = React.memo(function WalletIcon(props: { wallet: string }) {
  const { wallet } = props

  if (wallet === 'injected') return <MetamaskIcon height={20} width={20} />
  if (wallet === 'walletConnect') return <WalletConnectIcon height={20} width={20} />
  if (wallet === 'walletLink')
    return (
      <>
        <StyledWalletLinkIcon height={20} width={20} />
      </>
    )

  return <></>
})

export default ConnectWallet
