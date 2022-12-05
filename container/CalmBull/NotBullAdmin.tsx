import { Box, Typography } from '@mui/material'
import Image from 'next/image'

const NotBullAdmin: React.FC = () => {
  return (
    <Box margin="auto" mt={20}>
      <Typography align="center" variant="h6">
        You are not the king bull. Connect to the proper account!
      </Typography>
      <Box display="flex" justifyContent="center">
        <Image src="/images/crab-butt.gif" width={200} height={200} alt="Crab loader" />
      </Box>
    </Box>
  )
}

export default NotBullAdmin
