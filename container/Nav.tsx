import { AppBar, Box, IconButton, Modal, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material'
import * as React from 'react'
import { useAccount } from 'wagmi'
import Davatar from '@davatar/react'
import GitHubIcon from '@mui/icons-material/GitHub'
import ConnectWallet from './ConnectWallet'
import PrimaryButton from '../components/button/PrimaryButton'
import OutlinedPrimaryButton from '../components/button/OutlinePrimaryButton'
import useAccountStore from '../store/accountStore'

export const Nav: React.FC = React.memo(function Nav() {
  const [openModal, setOpenModal] = React.useState(false)

  const [{ data: accountData, loading }, disconnect] = useAccount()
  const setAddress = useAccountStore(state => state.setAddress)
  const theme = useTheme()
  const matches = useMediaQuery(theme.breakpoints.down('sm'))

  const { address } = accountData || {}

  const shortName = React.useMemo(() => {
    return address ? address.slice(0, 7) + '...' + address.slice(address.length - 7, address.length) : ''
  }, [address])

  React.useEffect(() => {
    if (address) {
      setOpenModal(false)
      setAddress(address)
    }
  }, [address, setAddress])

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ backgroundImage: 'none', boxShadow: 'none', p: 1 }}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontSize: 40 }}
            color="primary"
            fontFamily="Cattyla"
          >
            {matches ? 'Squeeth' : 'Squeeth Portal'}
          </Typography>
          <Box display="flex" alignItems="center">
            <IconButton href="https://github.com/KMKoushik/squeeth-portal" target="_blank">
              <GitHubIcon color="primary" />
            </IconButton>
            <Box ml={2}>
              {accountData ? (
                <OutlinedPrimaryButton
                  color="primary"
                  variant="outlined"
                  sx={{ width: 200 }}
                  onClick={disconnect}
                  startIcon={
                    <Davatar
                      size={18}
                      address={accountData.address}
                      generatedAvatarType="jazzicon" // optional, 'jazzicon' or 'blockies'
                    />
                  }
                >
                  <Typography sx={{ ml: 1, fontSize: '1em' }}>{shortName}</Typography>
                </OutlinedPrimaryButton>
              ) : (
                <PrimaryButton color="primary" variant="contained" onClick={() => setOpenModal(true)}>
                  Connect wallet
                </PrimaryButton>
              )}
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        BackdropProps={{ style: { backdropFilter: 'blur(5px)' } }}
        disableEnforceFocus
      >
        <>
          <ConnectWallet />
        </>
      </Modal>
    </Box>
  )
})
