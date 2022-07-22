import { AppBar, Box, IconButton, Modal, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material'
import * as React from 'react'
import { useAccount } from 'wagmi'
import GitHubIcon from '@mui/icons-material/GitHub'
import ConnectWallet from './ConnectWallet'
import useAccountStore from '../store/accountStore'
import Link from 'next/link'

export const Nav: React.FC = React.memo(function Nav() {
  const { address } = useAccount()
  const setAddress = useAccountStore(state => state.setAddress)
  const theme = useTheme()
  const matches = useMediaQuery(theme.breakpoints.down('sm'))

  React.useEffect(() => {
    if (address) {
      setAddress(address)
    }
  }, [address, setAddress])

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ backgroundImage: 'none', boxShadow: 'none', p: 1 }}>
        <Toolbar>
          <Link href="/">
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, fontSize: 40, cursor: 'pointer' }}
              color="primary"
              fontFamily="Cattyla"
            >
              {matches ? 'Squeeth' : 'Squeeth Portal'}
            </Typography>
          </Link>
          <Box display="flex" alignItems="center">
            <IconButton href="https://github.com/KMKoushik/squeeth-portal" target="_blank">
              <GitHubIcon color="primary" />
            </IconButton>
            <Box ml={2}>
              <ConnectWallet />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  )
})
