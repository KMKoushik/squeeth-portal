import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import { doc, onSnapshot } from 'firebase/firestore'
import { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { useContractWrite, useSigner } from 'wagmi'
import PrimaryButton from '../../components/button/PrimaryButton'
import { CRAB_OTC_CONTRACT } from '../../constants/contracts'
import { Nav } from '../../container/Nav'
import useToaster from '../../hooks/useToaster'
import useAccountStore from '../../store/accountStore'
import { CrabOTC, CrabOTCOrder } from '../../types'
import { signOTCOrder } from '../../utils/crabotc'
import { db } from '../../utils/firebase'
import { toBigNumber } from '../../utils/math'

const OTCBidPage: NextPage = () => {
  const router = useRouter()
  const { id } = router.query

  const [otc, setOtc] = useState<CrabOTC | null>(null)
  const [loading, setLoading] = useState(true)
  const showMessageFromServer = useToaster()
  const address = useAccountStore(s => s.address)
  const { data: signer } = useSigner()

  React.useEffect(() => {
    if (!id) return
    const unSubscribe = onSnapshot(doc(db, 'crabotc', id?.toString()), d => {
      setLoading(false)
      if (d.exists()) {
        setOtc({ ...d.data(), id } as CrabOTC)
      }
    })

    return unSubscribe
  }, [id])

  const createBid = async () => {
    const _qty = toBigNumber(otc?.quantity || 0)
    const _price = toBigNumber(otc?.limitPrice || 0)

    const order: CrabOTCOrder = {
      trader: address!,
      quantity: _qty.toString(),
      price: _price.toString(),
      isBuying: true,
      expiry: Date.now() + 30 * 60 * 1000,
      nonce: Date.now(),
    }
    const { signature } = await signOTCOrder(signer, order)

    const resp = await fetch('/api/crabotc/createOrEditBid?web=true', {
      method: 'POST',
      body: JSON.stringify({ signature, order, otcId: id }),
      headers: { 'Content-Type': 'application/json' },
    })

    showMessageFromServer(resp)
  }

  if (loading) return <Typography>Loading...</Typography>

  if (!otc)
    return (
      <div>
        <Head>
          <title>Squeeth Strategy Auction</title>
        </Head>
        <Nav />
        <Box margin="auto" px={10}>
          Invalid ID
        </Box>
      </div>
    )

  return (
    <div>
      <Head>
        <title>Squeeth Strategy Auction</title>
      </Head>
      <Nav />
      <Box margin="auto" px={10}>
        Submit bid: {id}
        <Typography mt={4}>Qty: {otc?.quantity}</Typography>
        <Typography>limitPrice: {otc?.limitPrice}</Typography>
        <PrimaryButton onClick={createBid}>Submit order</PrimaryButton>
      </Box>
    </div>
  )
}

export default OTCBidPage
