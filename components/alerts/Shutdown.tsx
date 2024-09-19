import { Alert, Box, Typography, useMediaQuery, useTheme } from '@mui/material'
import Link from 'next/link'
import { Warning } from '@mui/icons-material'

export const ShutdownAlert = () => {
  const theme = useTheme()
  const isMobileBreakpoint = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Box mx={4}>
      <Alert
        variant="outlined"
        severity="warning"
        sx={{ py: 1, px: 2, borderColor: '#e6c18b' }}
        icon={isMobileBreakpoint ? false : <Warning />}
      >
        <Typography color="#e6c18b">
          Squeeth will be ending its operations on <span style={{ fontWeight: 'bold' }}>16th November, 4PM UTC</span>.
          Your patience and understand are highly appreciated. For more details, please refer to our{' '}
          <Link href="/faq" passHref>
            <a style={{ textDecoration: 'underline' }}>FAQ</a>
          </Link>{' '}
          and our detailed{' '}
          <Link href="" passHref>
            <a style={{ textDecoration: 'underline' }}>blog post</a>
          </Link>{' '}
          on medium.
        </Typography>
      </Alert>
    </Box>
  )
}
