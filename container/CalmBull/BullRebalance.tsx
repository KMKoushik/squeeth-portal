import { Box, TextField, Typography } from '@mui/material'
import React from 'react'
import { PrimaryLoadingButton } from '../../components/button/PrimaryButton'
import { BIG_ZERO, DEFAULT_SLIPPAGE, ETH_USDC_FEE, WETH_DECIMALS_DIFF } from '../../constants/numbers'
import { useCalmBullStore } from '../../store/calmBullStore'
import useCrabV2Store from '../../store/crabV2Store'
import usePriceStore from '../../store/priceStore'
import { bnComparator } from '../../utils'
import { getLeverageRebalanceDetails } from '../../utils/calmBull'
import { formatBigNumber } from '../../utils/math'
import { HeaderInfo } from '../HeaderInfo'
import { useQuoter } from '../../hooks/useQuoter'
import { useContractWrite, useWaitForTransaction } from 'wagmi'
import { AUCTION_BULL_CONTRACT } from '../../constants/contracts'
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit'

export const BullRebalance: React.FC = () => {
  const crabUsdcValue = useCrabV2Store(s => s.crabUsdcValue)
  const { ethPrice, oSqthPrice } = usePriceStore(s => ({ ethPrice: s.ethPrice, oSqthPrice: s.oSqthPrice }))

  const auctionManager = useCalmBullStore(s => s.auctionManager)
  const crUpper = useCalmBullStore(s => s.crUpper, bnComparator)
  const crLower = useCalmBullStore(s => s.crLower, bnComparator)
  const deltaUpper = useCalmBullStore(s => s.deltaUpper, bnComparator)
  const deltaLower = useCalmBullStore(s => s.deltaLower, bnComparator)
  const delta = useCalmBullStore(s => s.delta, bnComparator)
  const cr = useCalmBullStore(s => s.cr, bnComparator)
  const loanCollat = useCalmBullStore(s => s.loanCollat, bnComparator)
  const loanDebt = useCalmBullStore(s => s.loanDebt, bnComparator)
  const crabBalance = useCalmBullStore(s => s.crabBalance, bnComparator)
  const isReady = useCalmBullStore(s => s.isReady)

  const quoter = useQuoter()

  const [slippage, setSlippage] = React.useState(DEFAULT_SLIPPAGE.toString())
  const [isRebalanceAvailable, setIsRebanaceAvailable] = React.useState(false)
  const [usdcToTrade, setUsdcToTrade] = React.useState(BIG_ZERO)
  const [newDelta, setNewDelta] = React.useState(BIG_ZERO)
  const [newCr, setNewCr] = React.useState(BIG_ZERO)
  const [limitPrice, setLimitPrice] = React.useState(BIG_ZERO)
  const [isSellingUSDC, setIsSellingUSDC] = React.useState(true)

  const { data: levTx, writeAsync: leverageRebalance } = useContractWrite({
    ...AUCTION_BULL_CONTRACT,
    functionName: 'leverageRebalance',
    args: [],
  })

  const { isLoading: isExecuting } = useWaitForTransaction({
    hash: levTx?.hash,
  })

  const addRecentTransaction = useAddRecentTransaction()

  async function fetchLeverageBalanceDetails(_slippage: number) {
    const {
      limitPrice: _limitPrice,
      usdcAmount,
      isRebalPossible,
      delta: _newDelta,
      cr: _newCr,
      isSellingUsdc: _isSelling,
    } = await getLeverageRebalanceDetails({
      quoter,
      crabUsdPrice: crabUsdcValue,
      loanCollat,
      loanDebt,
      crabBalance,
      ethUsdPrice: ethPrice,
      deltaUpper,
      deltaLower,
      crUpper,
      crLower,
      slippage: _slippage,
    })

    setUsdcToTrade(usdcAmount)
    setIsRebanaceAvailable(isRebalPossible)
    setNewDelta(_newDelta)
    setNewCr(_newCr)
    setLimitPrice(_limitPrice)
    setIsSellingUSDC(_isSelling)

    console.log('Rebalance details', usdcAmount.toString(), isRebalPossible)
  }

  React.useEffect(() => {
    if (isReady) {
      fetchLeverageBalanceDetails(Number(slippage))
    }
  }, [isReady])

  async function onSlippageUpdate(_slippage: string) {
    setSlippage(_slippage)
    fetchLeverageBalanceDetails(Number(_slippage))
  }

  async function executeLeverageRebalance() {
    const tx = await leverageRebalance({
      args: [isSellingUSDC, usdcToTrade, limitPrice, ETH_USDC_FEE],
      overrides: {
        gasLimit: 5000000,
      },
    })

    try {
      addRecentTransaction({
        hash: tx.hash,
        description: 'Net at price',
      })
    } catch (e) {
      console.log(e)
    }

    await tx.wait()
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Calm bull rebalance
      </Typography>

      <HeaderInfo
        items={[
          { title: 'Crab / USDC', value: formatBigNumber(crabUsdcValue, 18, 6), prefix: '$' },
          { title: 'ETH Price', value: formatBigNumber(ethPrice, 18, 2), prefix: '$' },
          { title: 'oSQTH Price', value: formatBigNumber(oSqthPrice, 18, 6), unit: 'WETH' },
          { title: 'Delta', value: formatBigNumber(delta, 18, 2) },
          { title: 'CR', value: formatBigNumber(cr, 18, 2) },
          { title: 'Delta lower', value: formatBigNumber(deltaLower, 18, 2) },
          { title: 'Delta upper', value: formatBigNumber(deltaUpper, 18, 2) },
          { title: 'CR lower', value: formatBigNumber(crLower, 18, 2) },
          { title: 'CR upper', value: formatBigNumber(crUpper, 18, 2) },
          { title: 'Loan collat', value: formatBigNumber(loanCollat, 18, 5) },
          { title: 'Loan debt', value: formatBigNumber(loanDebt, 6, 5) },
        ]}
      />

      <TextField
        size="small"
        sx={{ mt: 4 }}
        label="slippage"
        value={slippage}
        onChange={e => onSlippageUpdate(e.target.value)}
      />
      <Box display="flex" mt={2} gap={1}>
        <Typography color="textSecondary">Rebalance possible: </Typography>
        <Typography variant="numeric">{isRebalanceAvailable ? 'Yes' : 'No'}</Typography>
      </Box>
      <Box display="flex" mt={2} gap={1}>
        <Typography color="textSecondary">Is Selling USDC: </Typography>
        <Typography variant="numeric">{isSellingUSDC ? 'Yes' : 'No'}</Typography>
      </Box>
      <Box display="flex" mt={1} gap={1}>
        <Typography color="textSecondary">USDC to trade: </Typography>
        <Typography variant="numeric">{formatBigNumber(usdcToTrade, 6, 6)}</Typography>
      </Box>
      <Box display="flex" mt={1} gap={1}>
        <Typography color="textSecondary">New Delta: </Typography>
        <Typography variant="numeric">{formatBigNumber(newDelta, 18, 2)}</Typography>
      </Box>
      <Box display="flex" mt={1} gap={1}>
        <Typography color="textSecondary">New CR: </Typography>
        <Typography variant="numeric">{formatBigNumber(newCr, 18, 2)}</Typography>
      </Box>
      <Box display="flex" mt={1} gap={1}>
        <Typography color="textSecondary">Limit price: </Typography>
        <Typography variant="numeric">{formatBigNumber(limitPrice, 18, 6)}</Typography>
      </Box>
      <PrimaryLoadingButton sx={{ mt: 2 }} onClick={executeLeverageRebalance} loading={isExecuting}>
        Leverage Rebalance
      </PrimaryLoadingButton>
    </Box>
  )
}
