import { Typography, BoxProps, Alert } from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/router'

import useAccountStore from '../store/accountStore'

const restrictedCountries: Record<string, string> = {
  US: 'the United States',
  BY: 'Belarus',
  CU: 'Cuba',
  IR: 'Iran',
  IQ: 'Iraq',
  CI: `Cote d'Ivoire`,
  LR: 'Liberia',
  KP: 'North Korea',
  SD: 'Sudan',
  SY: 'Syria',
  ZW: 'Zimbabwe',
  CA: 'Canada',
}

const RestrictionInfo: React.FC = () => {
  const router = useRouter()
  const userLocation = router.query?.ct
  const isUserBlocked = useAccountStore(s => s.isBlocked)

  return (
    <Alert severity="warning" sx={{ mt: 2 }}>
      <Typography
        sx={{
          fontWeight: 500,
          fontSize: '15px',
          color: '#fff',
        }}
      >
        {isUserBlocked
          ? 'Your wallet address is blocked for violating our terms of service. '
          : `This app is not available in ${userLocation ? restrictedCountries[String(userLocation)] : 'your country'}.
          More details can be found in our `}
        <Typography component="span" sx={{ textDecoration: 'underline' }}>
          <Link href="/terms-of-service">
            <a target="_blank">Terms of service.</a>
          </Link>
        </Typography>
      </Typography>
    </Alert>
  )
}

export default RestrictionInfo
