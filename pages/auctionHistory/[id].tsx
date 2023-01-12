import { Box } from '@mui/system'
import { doc, getDoc } from 'firebase/firestore'
import { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'
import CrabLoader from '../../components/loaders/CrabLoader'
import AuctionPage from '../../container/CrabV2/Auction/Auction'
import { Nav } from '../../components/navbars/Nav'
import useController from '../../hooks/useController'
import { useInitCrabV2 } from '../../hooks/useCrabV2'
import useCrabV2Store from '../../store/crabV2Store'
import { Auction } from '../../types'
import { AUCTION_COLLECTION, sortBids } from '../../utils/auction'
import { db } from '../../utils/firebase'
import { getTxFromSafeTxHash } from '../../utils/safeUtil'

const AuctionHistory: NextPage = () => {
  useInitCrabV2()
  useController()

  const router = useRouter()
  const { id } = router.query

  const setAuction = useCrabV2Store(s => s.setAuction)
  const setSortedBids = useCrabV2Store(s => s.setSortedBids)
  const setAuctionLoading = useCrabV2Store(s => s.setAuctionLoading)
  const setIsHistoricalView = useCrabV2Store(s => s.setIsHistoricalView)
  const isLoading = useCrabV2Store(s => s.isLoading)

  React.useEffect(() => {
    if (id) {
      getDoc(doc(db, AUCTION_COLLECTION, id as string)).then(d => {
        setAuctionLoading(false)
        if (d.exists()) {
          const data = d.data() as Auction
          if (data.tx) {
            getTxFromSafeTxHash(data.tx).then(tx => setAuction({ ...data, tx: tx ?? data.tx }))
          } else {
            setAuction(data)
          }
          setSortedBids(sortBids(data))
        }
      })
    }
  }, [id, setAuction, setAuctionLoading, setSortedBids])

  React.useEffect(() => {
    setIsHistoricalView(true)
  }, [setIsHistoricalView])

  return (
    <div>
      <Head>
        <title>Squeeth Strategy Auction History</title>
      </Head>
      <Nav />
      <Box margin="auto">
        {isLoading ? (
          <CrabLoader />
        ) : (
          <Box mt={4} px={{ xs: 2, sm: 6, md: 10, lg: 20 }}>
            <AuctionPage />
          </Box>
        )}
      </Box>
    </div>
  )
}

export default AuctionHistory
