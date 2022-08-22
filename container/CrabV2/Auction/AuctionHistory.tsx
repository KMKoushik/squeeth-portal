import { Button, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import Link from 'next/link'
import React from 'react'
import { useState } from 'react'
import { ETHERSCAN } from '../../../constants/numbers'
import useCrabV2Store from '../../../store/crabV2Store'
import { Auction } from '../../../types'
import { db } from '../../../utils/firebase'
import { formatBigNumber } from '../../../utils/math'

const AuctionHistory: React.FC = () => {
  const [prevAuctions, setPrevAuctions] = useState<Array<Auction>>([])

  React.useEffect(() => {
    const updateData = async () => {
      const auctionRef = collection(db, 'auction')
      const auctionQuery = query(
        auctionRef,
        where('auctionEnd', '<=', Date.now()),
        orderBy('auctionEnd', 'desc'),
        limit(10),
      )
      const querySnapshot = await getDocs(auctionQuery)
      setPrevAuctions(querySnapshot.docs.map(d => d.data() as Auction))
    }

    updateData()
  }, [])

  return (
    <>
      <Typography variant="h6">Previous Auctions</Typography>
      {prevAuctions.map(a => (
        <Box
          display="flex"
          bgcolor="background.overlayDark"
          my={2}
          py={1}
          px={2}
          borderRadius={1}
          justifyContent="space-between"
          style={{ cursor: 'pointer' }}
          key={a.currentAuctionId}
          alignItems="center"
        >
          <Box width="40%">
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
            <Button sx={{ ml: 2 }} href={`/auctionHistory/${a.currentAuctionId}`}>
              View
            </Button>
            <Button sx={{ ml: 2 }} href={`${ETHERSCAN.url}/tx/${a.tx}`} target="_blank" rel="noreferrer">
              tx
            </Button>
          </Box>
        </Box>
      ))}
    </>
  )
}

export default AuctionHistory
