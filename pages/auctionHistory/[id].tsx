import { Box } from '@mui/system'
import { doc, getDoc } from 'firebase/firestore'
import { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'
import CrabLoader from '../../components/loaders/CrabLoader'
import AuctionPage from '../../container/CrabV2/Auction/Auction'
import { Nav } from '../../container/Nav'
import useController from '../../hooks/useController'
import { useInitCrabV2 } from '../../hooks/useCrabV2'
import useCrabV2Store from '../../store/crabV2Store'
import { Auction } from '../../types'
import { db } from '../../utils/firebase'

const AuctionHistory: NextPage = () => {
  useInitCrabV2()
  useController()

  const router = useRouter()
  const { id } = router.query

  const setAuction = useCrabV2Store(s => s.setAuction)
  const setAuctionLoading = useCrabV2Store(s => s.setAuctionLoading)
  const setIsHistoricalView = useCrabV2Store(s => s.setIsHistoricalView)
  const isLoading = useCrabV2Store(s => s.isLoading)

  React.useEffect(() => {
    console.log(id)
    if (id) {
      getDoc(doc(db, 'auction', id as string)).then(d => {
        setAuctionLoading(false)
        console.log(d.exists(), d.data())
        if (d.exists()) {
          const data = d.data() as Auction
          setAuction(data)
        }
      })
    }
  }, [id, setAuction, setAuctionLoading])

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
          <Box mt={4} px={20}>
            <AuctionPage />
          </Box>
        )}
      </Box>
    </div>
  )
}

export default AuctionHistory