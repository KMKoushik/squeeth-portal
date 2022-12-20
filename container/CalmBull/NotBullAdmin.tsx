import { Box, Typography } from '@mui/material'
import Image from 'next/image'

const NotBullAdmin: React.FC = () => {
  return (
    <Box margin="auto" mt={20}>
      <Typography align="center" variant="h6">
        You are not the zen bull. Only a zen mind handle a pressure like this.
      </Typography>
      <Box display="flex" justifyContent="center" mt={4} borderRadius={4}>
        <Image className="rounded" src="/images/buddha-bull.png" width={200} height={200} alt="Crab loader" />
      </Box>
    </Box>
  )
}

export default NotBullAdmin
