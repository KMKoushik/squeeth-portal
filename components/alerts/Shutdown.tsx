import { Alert, Box, Typography, useMediaQuery, useTheme } from '@mui/material'
import Link from 'next/link'
import { Warning } from '@mui/icons-material'
import { format } from 'date-fns'

import { SHUTDOWN_DATE } from '../../constants/numbers'

export const ShutdownAlert = () => {
  const theme = useTheme()
  const isMobileBreakpoint = useMediaQuery(theme.breakpoints.down('sm'))

  const shutdownDate = new Date(SHUTDOWN_DATE)

  // Format the date, using UTC methods to ensure UTC time
  const shutdownDateFormatted = format(
    new Date(
      shutdownDate.getUTCFullYear(),
      shutdownDate.getUTCMonth(),
      shutdownDate.getUTCDate(),
      shutdownDate.getUTCHours(),
      shutdownDate.getUTCMinutes(),
    ),
    "MMMM d, yyyy 'at' HH:mm 'UTC'",
  )

  return (
    <Box mx={4}>
      <Alert
        variant="outlined"
        severity="warning"
        sx={{ py: 1, px: 2, borderColor: '#e6c18b' }}
        icon={isMobileBreakpoint ? false : <Warning />}
      >
        <Typography color="#e6c18b" sx={{ fontSize: '16.5px', fontWeight: 600 }}>
          On {shutdownDateFormatted} the Squeeth protocol was shutdown.
        </Typography>

        <Typography color="#e6c18b" sx={{ fontSize: '15px', fontWeight: 500, marginTop: theme.spacing(1) }}>
          Positions can be redeemed with 0 price impact (from the settlement price) by connecting your wallet. For more
          information, please refer to the{' '}
          <Link href="https://opyn.gitbook.io/opyn-hub/squeeth-retirement/squeeth-retirement-faqs" passHref>
            <a target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
              Squeeth Shutdown FAQ
            </a>
          </Link>{' '}
          and{' '}
          <Link
            href="https://opyn.medium.com/our-beloved-squeeth-is-retiring-its-time-for-opyn-markets-to-take-over-1b66aad68f00"
            passHref
          >
            <a target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
              Announcement
            </a>
          </Link>
          .
        </Typography>
        <Typography color="#e6c18b" sx={{ fontSize: '15px', fontWeight: 500, marginTop: theme.spacing(0.5) }}>
          More announcements to come on the launch of Opyn Markets.
        </Typography>
      </Alert>
    </Box>
  )
}
