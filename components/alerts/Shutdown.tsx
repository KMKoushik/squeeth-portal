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
          Squeeth will be shutting down on {shutdownDateFormatted} as{' '}
          <Link href="https://markets.opyn.co" passHref>
            <a style={{ textDecoration: 'underline' }}>Opyn Markets</a>
          </Link>{' '}
          gears up for launch
        </Typography>
        <Typography color="#e6c18b" sx={{ fontSize: '15px', fontWeight: 500, marginTop: theme.spacing(1) }}>
          The protocol will function normally until shutdown, meaning positions can be opened and closed at users&apos;
          discretion and Squeeth will continue to track ETH^2.
        </Typography>
        <Typography color="#e6c18b" sx={{ fontSize: '15px', fontWeight: 500, marginTop: theme.spacing(0.5) }}>
          At shutdown, positions will be closed with 0 fees and 0 price impact. For more details, please refer to our{' '}
          <Link href="https://opyn.gitbook.io/opyn-strategies/strategies-faq/faq" passHref>
            <a style={{ textDecoration: 'underline' }}>FAQ</a>
          </Link>{' '}
          and{' '}
          <Link href="https://opyn.gitbook.io/opyn-strategies/strategies-faq/faq" passHref>
            <a style={{ textDecoration: 'underline' }}>Announcement</a>
          </Link>
          .
        </Typography>
      </Alert>
    </Box>
  )
}
