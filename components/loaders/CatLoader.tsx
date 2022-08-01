import * as React from 'react'
import { Box } from '@mui/system'
import { motion } from 'framer-motion'
import Image from 'next/image'
import useAppStore from '../../store/appStore'

const CatLoader = React.memo(function CatLoader() {
  const isLoading = useAppStore(s => s.openCat)
  return (
    <>
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1 } }}
        >
          <Box position="fixed" bottom={0} left={10} zIndex={2} display="flex" alignItems="center">
            <Image src="/images/cat_loader.gif" width={100} height={100} alt="Cat loader" />
          </Box>
        </motion.div>
      ) : null}
    </>
  )
})

export default CatLoader
