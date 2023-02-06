import { Typography, TextField, InputAdornment, Button } from '@mui/material'
import { Box } from '@mui/system'
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import React, { useMemo, useState } from 'react'
import { useContractWrite, useWaitForTransaction } from 'wagmi'
import { PrimaryLoadingButton } from '../../../components/button/PrimaryButton'
import { CRAB_COUNCIL_MEMBERS } from '../../../constants/address'
import { CRAB_NETTING_CONTRACT } from '../../../constants/contracts'
import { BIG_ONE, BIG_ZERO } from '../../../constants/numbers'
import useAccountStore from '../../../store/accountStore'
import { useCrabNettingStore } from '../../../store/crabNettingStore'
import useCrabV2Store from '../../../store/crabV2Store'
import usePriceStore from '../../../store/priceStore'
import { bnComparator } from '../../../utils'
import { calculateCrabUSDCValue, convertBigNumber, formatBigNumber, toBigNumber } from '../../../utils/math'
import { HeaderInfo } from '../../HeaderInfo'

export const NettingAdmin: React.FC = () => {
  const [price, setPrice] = useState('0')
  const [usdAmount, setUsdAmount] = useState('0')

  const { oSqthPrice, ethPrice } = usePriceStore(s => ({ oSqthPrice: s.oSqthPrice, ethPrice: s.ethPrice }))
  const usdcDeposits = useCrabNettingStore(s => s.depositQueued)
  const crabWithdraws = useCrabNettingStore(s => s.withdrawQueued)
  const owner = useCrabNettingStore(s => s.owner)
  const address = useAccountStore(s => s.address)
  const crabUsdcValue = useCrabV2Store(s => s.crabUsdcValue, bnComparator)

  const { data: netTx, writeAsync: netAtPrice } = useContractWrite({
    ...CRAB_NETTING_CONTRACT,
    functionName: 'netAtPrice',
    args: [],
  })

  const { isLoading: isNetting } = useWaitForTransaction({
    hash: netTx?.hash,
  })

  const addRecentTransaction = useAddRecentTransaction()

  const remainingCrab = useMemo(() => {
    if (price === '0') return BIG_ZERO

    const _crabAmount = parseFloat(usdAmount) / parseFloat(price || '1') || 0
    const crabAmount = toBigNumber(_crabAmount.toFixed(18), 18)

    return crabWithdraws.sub(crabAmount)
  }, [crabWithdraws, price, usdAmount])

  const remainingUSDC = useMemo(() => {
    const _usdAmount = toBigNumber((Number(usdAmount) || 0).toFixed(6), 6)

    return usdcDeposits.sub(_usdAmount)
  }, [usdAmount, usdcDeposits])

  const error = useMemo(() => {
    if (remainingCrab.isNegative()) return 'Not enough CRAB available'
    if (remainingUSDC.isNegative()) return 'Not enough USDC available'

    return null
  }, [remainingCrab, remainingUSDC])

  const onMaxClick = () => {
    const _price = parseFloat(price || '1')
    const _crabAmount = toBigNumber(convertBigNumber(usdcDeposits, 6) / _price, 18)

    if (crabWithdraws.lte(_crabAmount)) {
      setUsdAmount((Math.floor(convertBigNumber(crabWithdraws) * _price * 1000_000) / 1000_000).toString())
    } else {
      setUsdAmount(convertBigNumber(usdcDeposits, 6).toFixed(6))
    }
  }

  const executeNetting = async () => {
    const tx = await netAtPrice({
      args: [toBigNumber(price, 6), toBigNumber(usdAmount, 6)],
      // overrides: {
      //   gasLimit: 5000000,
      // },
    })

    try {
      addRecentTransaction({
        hash: tx.hash,
        description: 'Net at price',
      })

      await tx.wait()
      if (location) {
        location.reload()
      }
    } catch (e) {
      console.log(e)
    }
  }

  const isOwner = React.useMemo(
    () => address?.toLowerCase() === owner?.toLowerCase() || CRAB_COUNCIL_MEMBERS?.includes(address || ''),
    [address, owner],
  )

  if (!isOwner) {
    return <NotOwner />
  }

  return (
    <Box>
      <Typography variant="h6">Crab Netting admin</Typography>
      <Box mt={2} mb={2}>
        <HeaderInfo
          items={[
            { title: 'Crab / USDC', value: formatBigNumber(crabUsdcValue, 18, 6), prefix: '$' },
            { title: 'ETH Price', value: formatBigNumber(ethPrice, 18, 2), prefix: '$' },
            { title: 'oSQTH Price', value: formatBigNumber(oSqthPrice, 18, 6), unit: 'WETH' },
          ]}
        />
      </Box>
      <Box mt={5}>
        <Typography color="textSecondary">
          Total to deposit:{' '}
          <Typography component="span" color="primary" variant="numeric">
            {formatBigNumber(usdcDeposits, 6, 6)} USDC
          </Typography>
        </Typography>
        <Typography mt={3} mb={3} color="textSecondary">
          Total CRAB to withdraw:{' '}
          <Typography component="span" color="primary" variant="numeric">
            {' '}
            {formatBigNumber(crabWithdraws, 18, 6)} CRAB
          </Typography>
        </Typography>
        <Box>
          <TextField
            sx={{ width: 250 }}
            size="small"
            label="price"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />
        </Box>
        <Box mt={3} mb={3}>
          <TextField
            sx={{ width: 250 }}
            size="small"
            label="USDC Amount"
            value={usdAmount}
            onChange={e => setUsdAmount(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button variant="text" onClick={onMaxClick}>
                    MAX
                  </Button>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Box mb={3}>
          <Typography color="textSecondary">After execution you will still have </Typography>
          <Typography color="textPrimary" variant="numeric" component="p">
            {formatBigNumber(remainingCrab, 18, 18)} CRAB
          </Typography>
          <Typography color="textPrimary" variant="numeric" component="p">
            {formatBigNumber(remainingUSDC, 6, 18)} USDC
          </Typography>
        </Box>
        <Typography color="error">{error}</Typography>
        <PrimaryLoadingButton disabled={!!error} onClick={executeNetting} loading={isNetting}>
          Execute netting
        </PrimaryLoadingButton>
      </Box>
    </Box>
  )
}

const NotOwner: React.FC = () => {
  return (
    <Box margin="auto" mt={20}>
      <Typography align="center" variant="h6">
        You are not the king crab. Connect to the proper account!
      </Typography>
      <Box display="flex" justifyContent="center">
        <Image src="/images/crab-butt.gif" width={200} height={200} alt="Crab loader" />
      </Box>
    </Box>
  )
}
