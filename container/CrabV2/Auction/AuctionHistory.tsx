import { Button, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import Link from 'next/link'
import React from 'react'
import { useState } from 'react'
import { ETHERSCAN } from '../../../constants/numbers'
import useCrabV2Store from '../../../store/crabV2Store'
import { Auction } from '../../../types'
import { AUCTION_COLLECTION } from '../../../utils/auction'
import { db } from '../../../utils/firebase'
import { formatBigNumber } from '../../../utils/math'

const AuctionHistory: React.FC = () => {
  const [prevAuctions, setPrevAuctions] = useState<Array<Auction>>([])

  React.useEffect(() => {
    const updateData = async () => {
      const auctionRef = collection(db, AUCTION_COLLECTION)
      const auctionQuery = query(
        auctionRef,
        where('auctionEnd', '<=', Date.now()),
        orderBy('auctionEnd', 'desc'),
        limit(10),
      )
      const querySnapshot = await getDocs(auctionQuery)
      if (!querySnapshot.empty) setPrevAuctions(querySnapshot.docs.map(d => d.data() as Auction))
    }

    updateData()
  }, [])

  return (
    <Box px={{ xs: 2, sm: 6, md: 10, lg: 20 }}>
      <Typography variant="h6">Previous Auctions</Typography>
      {prevAuctions.map(a => (
        <Box
          display="flex"
          flexWrap="wrap"
          bgcolor="background.overlayDark"
          my={2}
          p={2}
          borderRadius={2}
          justifyContent={{ xs: 'start', sm: 'space-between' }}
          key={a.currentAuctionId}
          gap={2}
          alignItems="center"
        >
          <Box>
            <Typography variant="body1" fontWeight={600}>
              {a.isSelling ? 'Sold oSQTH' : 'Bought oSQTH'}
            </Typography>
            <Typography variant="numeric" color="textSecondary">
              {new Date(a.auctionEnd).toLocaleDateString()}
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" justifyContent="center" width={150}>
            <Typography color="textSecondary" variant="caption">
              Size
            </Typography>
            <Typography variant="numeric">
              {formatBigNumber(a.oSqthAmount, 18, 0)}
              <small> oSQTH</small>
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" justifyContent="center" width={150}>
            <Typography color="textSecondary" variant="caption">
              Clearing price
            </Typography>
            <Typography variant="numeric">
              {formatBigNumber(a.clearingPrice, 18, 6)}
              <small> WETH</small>
            </Typography>
          </Box>
          <Box>
            <Button href={`/auctionHistory/${a.currentAuctionId}`}>View</Button>
            <Button href={`${ETHERSCAN.url}/tx/${a.tx}`} target="_blank" rel="noreferrer">
              tx
            </Button>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default AuctionHistory
