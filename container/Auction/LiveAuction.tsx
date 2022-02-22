import { Box } from '@mui/material'
import * as React from 'react'

const LiveAuction = React.memo(function LiveAuction() {
  return (
    <Box sx={{ height: '100%' }} bgcolor="background.surface" borderRadius={2} py={2} px={4}>
      <>Hello world</>
    </Box>
  )
})

export default LiveAuction
