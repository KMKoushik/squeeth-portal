import { Switch, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import * as React from 'react'
import { useFeeData, useSigner } from 'wagmi'
import { PrimaryLoadingButton } from '../../../../components/button/PrimaryButton'
import { KING_CRAB } from '../../../../constants/message'
import { BIG_ZERO } from '../../../../constants/numbers'
import useToaster from '../../../../hooks/useToaster'
import useCrabV2Store from '../../../../store/crabV2Store'
import { Auction } from '../../../../types'
import { getMinSize } from '../../../../utils/auction'
import { convertBigNumber, toBigNumber } from '../../../../utils/math'

const CreateAuction: React.FC = React.memo(function CreateAuction() {
  const { data: feeData } = useFeeData()
  const auction = useCrabV2Store(s => s.auction)
  const isNew = !auction.currentAuctionId

  const [oSqthAmount, setOsqthAmount] = React.useState(convertBigNumber(auction.oSqthAmount, 18).toString())
  const [price, setPrice] = React.useState(convertBigNumber(auction.price, 18).toString())
  const [endDate, setEndDate] = React.useState<Date>(auction.auctionEnd ? new Date(auction.auctionEnd) : new Date())
  const [isSelling, setIsSelling] = React.useState<boolean>(!!auction.isSelling)
  const [loading, setLoading] = React.useState(false)
  const [minSize, setMinSize] = React.useState(auction.minSize || 0)

  const { data: signer } = useSigner()
  const showMessageFromServer = useToaster()

  const updateSqthAmount = React.useCallback(
    (v: string) => {
      setOsqthAmount(v)
    },
    [setOsqthAmount],
  )

  const updateMinAmount = React.useCallback(
    (v: string) => {
      setPrice(v)
      if (feeData) {
        setMinSize(getMinSize(feeData.maxFeePerGas || BIG_ZERO, Number(v)))
      }
    },
    [setPrice, setMinSize, feeData],
  )

  const createOrUpdate = React.useCallback(async () => {
    setLoading(true)
    try {
      const signature = await signer?.signMessage(KING_CRAB)

      const updatedAuction: Auction = {
        ...auction,
        currentAuctionId: isNew ? auction.nextAuctionId : auction.currentAuctionId,
        oSqthAmount: toBigNumber((Number(oSqthAmount))).toString(),
        price: toBigNumber((Number(price))).toString(),
        auctionEnd: endDate.getTime(),
        minSize,
        isSelling,
      }

      const resp = await fetch('/api/auction/createOrEditAuction', {
        method: 'POST',
        body: JSON.stringify({ signature, auction: updatedAuction }),
        headers: { 'Content-Type': 'application/json' },
      })
      showMessageFromServer(resp)
    } catch (e) {
      console.log(e)
    }
    setLoading(false)
  }, [signer, auction, isNew, oSqthAmount, price, endDate, minSize, isSelling, showMessageFromServer])

  return (
    <Box width={300} display="flex" flexDirection="column" justifyContent="center">
      <Typography variant="h6" color="primary">
        {isNew ? 'Create' : 'Edit'} Auction
      </Typography>
      <Typography mt={2}>Auction ID: {auction.currentAuctionId || auction.nextAuctionId}</Typography>
      <Box mt={2} display="flex" alignItems="center" justifyContent="space-between">
        <Typography>Is selling oSqth</Typography>
        <Switch checked={isSelling} onChange={e => setIsSelling(e.target.checked)} />
      </Box>
      <TextField
        type="number"
        variant="outlined"
        sx={{ mt: 2 }}
        label="oSqth size"
        value={oSqthAmount}
        onChange={e => updateSqthAmount(e.target.value)}
      />
      <TextField
        type="number"
        variant="outlined"
        sx={{ mt: 2, mb: 2 }}
        label={isSelling ? 'Min Price' : 'Max Price'}
        value={price}
        onChange={e => updateMinAmount(e.target.value)}
      />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateTimePicker
          label="Auction ends at"
          value={endDate}
          onChange={d => setEndDate(d || new Date())}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
      <Box mt={2} display="flex" alignItems="center" justifyContent="space-between">
        <Typography color="textSecondary">Min size: </Typography>
        <Typography>{minSize} oSQTH</Typography>
      </Box>
      <PrimaryLoadingButton sx={{ m: 'auto', mt: 2 }} onClick={createOrUpdate} loading={loading}>
        {isNew ? 'Create' : 'update'}
      </PrimaryLoadingButton>
    </Box>
  )
})

export default CreateAuction
