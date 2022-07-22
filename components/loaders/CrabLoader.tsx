import * as React from 'react'
import { Box } from '@mui/system'
import Image from 'next/image'

const CrabLoader = React.memo(function CatLoader() {
  return (
    <Box display="flex">
      <Box margin="auto">
        <Image src="/images/crab-loader.gif" width={200} height={200} alt="Crab loader" />
      </Box>
    </Box>
  )
})

export default CrabLoader
