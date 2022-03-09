import { Box, TextField, Typography } from '@mui/material'
import { BigNumber } from 'ethers'
import * as React from 'react'
import { useBalance, useBlockNumber, useSigner } from 'wagmi'
import shallow from 'zustand/shallow'
import { PrimaryLoadingButton } from '../../components/button/PrimaryButton'
import { CRAB_STRATEGY, OSQUEETH } from '../../constants/address'
import { BIG_ZERO, MAX_UINT } from '../../constants/numbers'
import useCrab from '../../hooks/useCrab'
import useERC20 from '../../hooks/useERC20'
import useAccountStore from '../../store/accountStore'
import useCrabStore from '../../store/crabStore'
import useHedgeStore from '../../store/hedgeStore'
import { formatBigNumber, formatUnits, parseUnits, wmul } from '../../utils/math'

const TimeHedge = React.memo(function TimeHedge() {
  const owner = useAccountStore(s => s.address)
  const { isSelling, oSqthAmount } = useCrabStore(s => s.auctionDetails, shallow)
  const { erc20: squeethContract, erc20Loading } = useERC20(OSQUEETH)
  const { isApprovalNeeded, setIsApprovalNeeded, isApproved, setIsApproved, setTxLoading, txLoading } = useHedgeStore()
  const [{ data: oSqthBalData, loading: balanceLoading }] = useBalance({ addressOrName: owner, token: OSQUEETH })

  const checkApproval = React.useCallback(async () => {
    if (!owner || oSqthAmount.isZero()) return

    const allowance = await squeethContract.allowance(owner, CRAB_STRATEGY)
    if (allowance.gte(oSqthAmount)) {
      setIsApproved(true)
    } else {
      setIsApproved(false)
    }
  }, [oSqthAmount, owner, setIsApproved, squeethContract])

  // Check if oSQTH approval is needed or not. Need only if strategy is buying oSQTH
  React.useEffect(() => {
    if (!owner) return
    if (isSelling) {
      setIsApprovalNeeded(false)
      return
    }
    setIsApprovalNeeded(true)
    checkApproval()
  }, [owner, isSelling, setIsApprovalNeeded, checkApproval])

  const approveOSQTH = React.useCallback(async () => {
    if (!owner) return

    setTxLoading(true)
    try {
      const tx = await squeethContract.approve(CRAB_STRATEGY, MAX_UINT)
      await tx.wait()
      checkApproval()
    } catch (e) {
      console.log(e)
    }
    setTxLoading(false)
  }, [checkApproval, owner, setTxLoading, squeethContract])

  const { isError, errorMessage } = React.useMemo(() => {
    if (balanceLoading) return { isError: false, errorMessage: '' }

    if (!isSelling && !oSqthBalData?.value.gte(oSqthAmount))
      return {
        isError: true,
        errorMessage: `You need ${formatBigNumber(
          oSqthAmount,
          18,
          6,
        )} oSQTH to participate.\n Your balance: ${formatBigNumber(oSqthBalData?.value || BIG_ZERO, 18, 6)}`,
      }

    return { isError: false, errorMessage: '' }
  }, [balanceLoading, oSqthAmount, oSqthBalData?.value, isSelling])

  if (erc20Loading || balanceLoading) {
    return (
      <Box>
        <Typography align="center" color="textSecondary">
          Loading...
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography align="center" variant="h6">
        {isSelling ? 'Buy oSQTH from strategy' : 'Sell oSQTH to strategy'}
      </Typography>
      <Box mt={2} px={4} display="flex" justifyContent="center" flexDirection="column" width="100%">
        {isApprovalNeeded && !isApproved ? (
          <>
            <Typography align="center" mt={4} color="textSecondary">
              You need to approve oSQTH
            </Typography>
            <PrimaryLoadingButton loading={txLoading} sx={{ margin: 'auto', mt: 2, width: 250 }} onClick={approveOSQTH}>
              Approve
            </PrimaryLoadingButton>
          </>
        ) : isError ? (
          <Typography align="center" sx={{ color: 'error.main' }}>
            {errorMessage}
          </Typography>
        ) : (
          <TimeHedgeForm />
        )}
      </Box>
    </Box>
  )
})

const TimeHedgeForm = React.memo(function TimeHedgeForm() {
  const { crabContract, updateCrabData, getAuctionDetailsOffChain } = useCrab()
  const { isSelling, auctionPrice } = useCrabStore(s => s.auctionDetails, shallow)
  const auctionTriggerTime = useCrabStore(s => s.auctionTriggerTime)
  const [txLoading, setTxLoading] = useHedgeStore(s => [s.txLoading, s.setTxLoading])

  const safeAuctionPrice = auctionPrice.add(
    auctionPrice
      .mul(2)
      .div(100)
      .mul(isSelling ? 1 : -1),
  )
  const [limitPrice, setLimitPrice] = React.useState(formatUnits(safeAuctionPrice))

  const hedge = React.useCallback(async () => {
    const {
      isSellingAuction: isSelling,
      oSqthToAuction: oSqthAmount,
      ethProceeds,
      auctionOsqthPrice: auctionPrice,
      isAuctionDirectionChanged: dirChanged,
    } = await getAuctionDetailsOffChain(auctionTriggerTime)

    const isAuctionLive = Date.now() / 1000 - auctionTriggerTime < 1200
    const _safeAuctionPrice = auctionPrice.add(
      auctionPrice
        .mul(!isAuctionLive ? 1 : 2)
        .div(100)
        .mul(isSelling ? 1 : -1),
    )
    console.log(isAuctionLive)
    setLimitPrice(formatUnits(_safeAuctionPrice))
    const potentialOsqth = isAuctionLive ? oSqthAmount.mul(105).div(100) : oSqthAmount
    const ethToAttach = isSelling ? wmul(potentialOsqth, _safeAuctionPrice) : BIG_ZERO

    console.log(
      'Attached eth',
      ethToAttach.toString(),
      'ETH proceed: ',
      ethProceeds.toString(),
      'Auc price',
      auctionPrice.toString(),
      'osq amount',
      potentialOsqth.toString(),
      dirChanged,
    )
    setTxLoading(true)
    try {
      const tx = await crabContract.timeHedge(isSelling, _safeAuctionPrice, { value: ethToAttach })
      await tx.wait()
    } catch (e) {
      console.log(e)
    }
    setTxLoading(false)
    updateCrabData()
  }, [getAuctionDetailsOffChain, auctionTriggerTime, setTxLoading, updateCrabData, crabContract])

  return (
    <>
      <TextField
        variant="outlined"
        sx={{ margin: 'auto', width: 250, mt: 2 }}
        value={limitPrice}
        onChange={v => setLimitPrice(v.target.value)}
        placeholder="Safe Limit Price"
        label="Safe Limit Price"
      />
      <PrimaryLoadingButton loading={txLoading} sx={{ margin: 'auto', mt: 2, width: 250 }} onClick={hedge}>
        Hedge
      </PrimaryLoadingButton>
      <Typography mt={2} fontSize="small" align="center" color="textSecondary">
        Note: We will be attaching extra 5% ETH for selling auction, which will returned if not used
      </Typography>
    </>
  )
})

export default TimeHedge
