import { FormControl, InputLabel, MenuItem, Select, Switch, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit'
import { ethers } from 'ethers'
import * as React from 'react'
import { useContractWrite, useFeeData, useSigner, useWaitForTransaction } from 'wagmi'
import DangerButton from '../../../../components/button/DangerButton'
import { PrimaryLoadingButton } from '../../../../components/button/PrimaryButton'
import { CRAB_NETTING_CONTRACT } from '../../../../constants/contracts'
import { KING_CRAB } from '../../../../constants/message'
import { BIG_ZERO } from '../../../../constants/numbers'
import useQuoter from '../../../../hooks/useQuoter'
import useToaster from '../../../../hooks/useToaster'
import useAccountStore from '../../../../store/accountStore'
import { useCrabNettingStore } from '../../../../store/crabNettingStore'
import useCrabV2Store from '../../../../store/crabV2Store'
import usePriceStore from '../../../../store/priceStore'
import { Auction, AuctionType } from '../../../../types'
import { getMinSize } from '../../../../utils/auction'
import { getWsqueethFromCrabAmount } from '../../../../utils/crab'
import { calculateTotalDeposit } from '../../../../utils/crabNetting'
import { convertBigNumber, convertBigNumberStr, toBigNumber, wmul } from '../../../../utils/math'

const CreateAuction: React.FC = React.memo(function CreateAuction() {
  const { data: feeData } = useFeeData()
  const address = useAccountStore(s => s.address)
  const auction = useCrabV2Store(s => s.auction)
  const vault = useCrabV2Store(s => s.vault)
  const totalSupply = useCrabV2Store(s => s.totalSupply)
  const quoter = useQuoter()
  const usdcDeposits = useCrabNettingStore(s => s.depositQueued)
  const crabDeposits = useCrabNettingStore(s => s.withdrawQueued)
  const isNettingAuctionLive = useCrabNettingStore(s => s.isAuctionLive)
  const setIsAuctionLive = useCrabNettingStore(s => s.setAuctionLive)
  const isNew = !auction.currentAuctionId
  const crabUsdcPrice = useCrabV2Store(s => s.crabUsdcValue)

  const [oSqthAmount, setOsqthAmount] = React.useState(convertBigNumberStr(auction.oSqthAmount, 18))
  const [price, setPrice] = React.useState(convertBigNumberStr(auction.price, 18).toString())
  const [endDate, setEndDate] = React.useState<Date>(auction.auctionEnd ? new Date(auction.auctionEnd) : new Date())
  const [isSelling, setIsSelling] = React.useState<boolean>(!!auction.isSelling)
  const [loading, setLoading] = React.useState(false)
  const [minSize, setMinSize] = React.useState(auction.minSize || 0)
  const [clearing, setClearing] = React.useState(false)
  const [auctionType, setAuctionType] = React.useState(auction.type || AuctionType.CRAB_HEDGE)
  // const [wethLimitPrice, setWethLimitPrice] = React.useState(auction.wethLimitPrice || '')

  const { data: signer } = useSigner()
  const showMessageFromServer = useToaster()
  const addRecentTransaction = useAddRecentTransaction()
  const { getBullAuctionDetails } = useBullAuction()

  const { data: toggleAuctionLiveTx, writeAsync: toggleAuction } = useContractWrite({
    ...CRAB_NETTING_CONTRACT,
    functionName: 'toggleAuctionLive',
    args: [],
  })

  const { isLoading: isToggling } = useWaitForTransaction({
    hash: toggleAuctionLiveTx?.hash,
  })

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

  const updateAuction = React.useCallback(
    async (signature: string, auction: Auction) => {
      const resp = await fetch('/api/auction/createOrEditAuction', {
        method: 'POST',
        body: JSON.stringify({ signature, auction: auction, address }),
        headers: { 'Content-Type': 'application/json' },
      })
      showMessageFromServer(resp)
    },
    [address, showMessageFromServer],
  )

  const createOrUpdate = React.useCallback(async () => {
    setLoading(true)
    try {
      const signature = await signer?.signMessage(KING_CRAB)

      const updatedAuction: Auction = {
        ...auction,
        currentAuctionId: isNew ? auction.nextAuctionId : auction.currentAuctionId,
        oSqthAmount: toBigNumber(oSqthAmount).toString(),
        price: toBigNumber(price).toString(),
        auctionEnd: endDate.getTime(),
        minSize: auctionType === AuctionType.CRAB_HEDGE ? minSize : 0,
        isSelling,
        type: auctionType,
        usdAmount: usdcDeposits.toString(),
        crabAmount: crabDeposits.toString(),
      }

      await updateAuction(signature!, updatedAuction)
    } catch (e) {
      console.log(e)
    }
    setLoading(false)
  }, [
    signer,
    auction,
    isNew,
    oSqthAmount,
    price,
    endDate,
    auctionType,
    minSize,
    isSelling,
    usdcDeposits,
    crabDeposits,
    updateAuction,
  ])

  const clearBids = React.useCallback(async () => {
    setClearing(true)
    try {
      const signature = await signer?.signMessage(KING_CRAB)

      const updatedAuction: Auction = {
        ...auction,
        bids: {},
      }

      await updateAuction(signature!, updatedAuction)
    } catch (e) {
      console.log(e)
    }
    setClearing(false)
  }, [auction, signer, updateAuction])

  const isUSDCHigher = convertBigNumber(usdcDeposits, 6) > convertBigNumber(wmul(crabDeposits, crabUsdcPrice), 18)

  console.log(convertBigNumber(usdcDeposits, 6), convertBigNumber(wmul(crabDeposits, crabUsdcPrice), 18), 'prices')

  const updateAuctionType = async (aucType: AuctionType) => {
    setAuctionType(aucType)
    if (aucType === AuctionType.NETTING) {
      updateOsqthAmountForNetting(price)
      setIsSelling(isUSDCHigher ? true : false)
    } else if (aucType === AuctionType.CALM_BULL) {
      const { oSQTHAuctionAmount, isDepositingIntoCrab, wethLimitPrice } = await getBullAuctionDetails()
      console.log(oSQTHAuctionAmount.toString(), isDepositingIntoCrab)
      setOsqthAmount(convertBigNumberStr(oSQTHAuctionAmount, 18))
      setIsSelling(isDepositingIntoCrab)
    } else {
      setOsqthAmount(convertBigNumberStr(auction.oSqthAmount, 18))
    }
  }

  const updateOsqthAmountForNetting = async (_price: string) => {
    if (!vault || auctionType !== AuctionType.NETTING) return null

    if (isUSDCHigher) {
      const { sqthToMint } = await calculateTotalDeposit(quoter, usdcDeposits, toBigNumber(_price, 18), vault)
      console.log(sqthToMint.toString())
      setOsqthAmount(convertBigNumberStr(sqthToMint, 18))
    } else {
      const osqthToBuy = getWsqueethFromCrabAmount(crabDeposits, vault, totalSupply)
      setOsqthAmount(convertBigNumberStr(osqthToBuy, 18))
    }
  }

  const updateLimitPrice = (limitPrice: string) => {
    updateMinAmount(limitPrice)
    updateOsqthAmountForNetting(limitPrice)
  }

  const onToggle = async () => {
    const tx = await toggleAuction()
    try {
      addRecentTransaction({
        hash: tx.hash,
        description: `${isNettingAuctionLive ? 'Stop' : 'Start'} netting auction`,
      })
    } catch (e) {
      console.log(e)
    }

    await tx.wait()
    setIsAuctionLive(!isNettingAuctionLive)
  }

  return (
    <Box width={300} display="flex" flexDirection="column" justifyContent="center" pb={5}>
      <Typography variant="h6" color="primary">
        {isNew ? 'Create' : 'Edit'} Auction
      </Typography>
      <Typography mt={2}>Auction ID: {auction.currentAuctionId || auction.nextAuctionId}</Typography>
      <FormControl sx={{ mt: 2 }}>
        <InputLabel id="auction-type-label">Auction type</InputLabel>
        <Select
          labelId="auction-type-label"
          label="Auction type"
          value={auctionType}
          onChange={e => updateAuctionType(e.target.value as AuctionType)}
        >
          <MenuItem value={AuctionType.CRAB_HEDGE}>Crab Hedge</MenuItem>
          <MenuItem value={AuctionType.NETTING}>Netting</MenuItem>
          <MenuItem value={AuctionType.CALM_BULL}>Bull</MenuItem>
        </Select>
      </FormControl>
      <Box mt={2} display="flex" alignItems="center" justifyContent="space-between">
        <Typography>Is selling oSqth</Typography>
        <Switch
          disabled={auctionType === AuctionType.NETTING}
          checked={isSelling}
          onChange={e => setIsSelling(e.target.checked)}
        />
      </Box>
      <TextField
        disabled={auctionType === AuctionType.NETTING}
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
        onChange={e => updateLimitPrice(e.target.value)}
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
      <DangerButton sx={{ m: 'auto', mt: 2, width: 200 }} onClick={clearBids} loading={clearing}>
        Clear bids
      </DangerButton>
      {auctionType === AuctionType.NETTING ? (
        <Box alignItems="center" display="flex" flexDirection="column" justifyContent="center" mt={2}>
          <PrimaryLoadingButton loading={isToggling} onClick={onToggle}>
            {isNettingAuctionLive ? 'Stop auction' : 'Start auction'}
          </PrimaryLoadingButton>
        </Box>
      ) : null}
    </Box>
  )
})

export default CreateAuction
