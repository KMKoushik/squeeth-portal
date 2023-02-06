import { Button, InputAdornment, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit'
import { useMemo, useState } from 'react'
import { useContractWrite, useWaitForTransaction } from 'wagmi'
import { PrimaryLoadingButton } from '../../../components/button/PrimaryButton'
import { ZEN_BULL_NETTING_CONTRACT } from '../../../constants/contracts'
import { BIG_ZERO } from '../../../constants/numbers'
import { useCalmBullStore } from '../../../store/calmBullStore'
import usePriceStore from '../../../store/priceStore'
import { bnComparator } from '../../../utils'
import { convertBigNumber, convertBigNumberStr, formatBigNumber, toBigNumber } from '../../../utils/math'
import { HeaderInfo } from '../../HeaderInfo'

export const BullNetting: React.FC = () => {
  const [price, setPrice] = useState('0')
  const [ethAmount, setEthAmount] = useState('0')

  const { oSqthPrice, ethPrice } = usePriceStore(s => ({ oSqthPrice: s.oSqthPrice, ethPrice: s.ethPrice }))
  const bullEthValue = useCalmBullStore(s => s.bullEthValue, bnComparator)
  const bullDepositQueued = useCalmBullStore(s => s.bullDepositQueued, bnComparator)
  const bullWithdrawQueued = useCalmBullStore(s => s.bullWithdrawQueued, bnComparator)

  const onMaxClick = () => {
    const _bullAmount = bullDepositQueued.wdiv(toBigNumber(price === '0' ? '1' : price))

    if (bullWithdrawQueued.lte(_bullAmount)) {
      setEthAmount(convertBigNumberStr(bullWithdrawQueued.wmul(toBigNumber(price)), 18))
    } else {
      setEthAmount(convertBigNumberStr(bullDepositQueued, 18))
    }
  }

  const { data: netTx, writeAsync: netAtPrice } = useContractWrite({
    ...ZEN_BULL_NETTING_CONTRACT,
    functionName: 'netAtPrice',
    args: [],
  })

  const { isLoading: isNetting } = useWaitForTransaction({
    hash: netTx?.hash,
  })

  const addRecentTransaction = useAddRecentTransaction()

  const remainingBull = useMemo(() => {
    if (price === '0') return BIG_ZERO

    const _bullAmt = toBigNumber(ethAmount).wdiv(toBigNumber(price))

    return bullWithdrawQueued.sub(_bullAmt)
  }, [bullWithdrawQueued, ethAmount, price])

  const remainingEth = useMemo(() => {
    return bullDepositQueued.sub(toBigNumber(ethAmount))
  }, [bullDepositQueued, ethAmount])

  const error = useMemo(() => {
    if (remainingBull.isNegative()) return 'Not enough BULL available'
    if (remainingEth.isNegative()) return 'Not enough ETH available'

    return null
  }, [remainingBull, remainingEth])

  const executeNetting = async () => {
    const tx = await netAtPrice({
      args: [toBigNumber(price), toBigNumber(ethAmount)],
    })

    try {
      addRecentTransaction({
        hash: tx.hash,
        description: 'Bull Net at price',
      })

      await tx.wait()
      if (location) {
        location.reload()
      }
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <Box>
      <Typography variant="h6">Bull Netting Admin</Typography>
      <Box mt={2} mb={2}>
        <HeaderInfo
          items={[
            { title: 'Bull / Eth', value: formatBigNumber(bullEthValue, 18, 6), unit: 'WETH' },
            { title: 'ETH Price', value: formatBigNumber(ethPrice, 18, 2), prefix: '$' },
            { title: 'oSQTH Price', value: formatBigNumber(oSqthPrice, 18, 6), unit: 'WETH' },
          ]}
        />
      </Box>
      <Box mt={5}>
        <Typography color="textSecondary">
          Total to deposit:{' '}
          <Typography component="span" color="primary" variant="numeric">
            {formatBigNumber(bullDepositQueued, 18, 6)} WETH
          </Typography>
        </Typography>
        <Typography mt={3} mb={3} color="textSecondary">
          Total Bull to withdraw:{' '}
          <Typography component="span" color="primary" variant="numeric">
            {' '}
            {formatBigNumber(bullWithdrawQueued, 18, 6)} BULL
          </Typography>
        </Typography>
      </Box>
      <Box>
        <TextField
          sx={{ width: 250 }}
          size="small"
          label="price"
          value={price}
          onChange={e => setPrice(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Button variant="text" onClick={() => setPrice(convertBigNumber(bullEthValue, 18).toString())}>
                  Fill
                </Button>
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Box mt={3} mb={3}>
        <TextField
          sx={{ width: 250 }}
          size="small"
          label="USDC Amount"
          value={ethAmount}
          onChange={e => setEthAmount(e.target.value)}
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
          {formatBigNumber(remainingBull, 18, 18)} BULL
        </Typography>
        <Typography color="textPrimary" variant="numeric" component="p">
          {formatBigNumber(remainingEth, 18, 18)} ETH
        </Typography>
      </Box>
      <Typography color="error">{error}</Typography>
      <PrimaryLoadingButton disabled={!!error} onClick={executeNetting} loading={isNetting}>
        Execute netting
      </PrimaryLoadingButton>
    </Box>
  )
}
