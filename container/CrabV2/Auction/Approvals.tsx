import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit'
import { BigNumber, ethers } from 'ethers'
import { useEffect, useMemo } from 'react'
import { useContractReads, useContractWrite, useWaitForTransaction } from 'wagmi'
import { BoxLoadingButton } from '../../../components/button/PrimaryButton'
import { SecondaryButton } from '../../../components/button/SecondaryButton'
import { CRAB_STRATEGY_V2 } from '../../../constants/address'
import { OSQUEETH_CONTRACT, WETH_CONTRACT } from '../../../constants/contracts'
import { BIG_ZERO } from '../../../constants/numbers'
import useAccountStore from '../../../store/accountStore'
import useCrabV2Store from '../../../store/crabV2Store'
import { formatBigNumber } from '../../../utils/math'

const Approvals: React.FC = () => {
  const address = useAccountStore(s => s.address)
  const setOsqthApproval = useCrabV2Store(s => s.setOsqthApproval)
  const setWethApproval = useCrabV2Store(s => s.setWethApproval)
  const addRecentTransaction = useAddRecentTransaction()

  const { data, isLoading, refetch } = useContractReads({
    contracts: [
      {
        ...OSQUEETH_CONTRACT,
        functionName: 'allowance',
        args: [address, CRAB_STRATEGY_V2],
      },
      {
        ...WETH_CONTRACT,
        functionName: 'allowance',
        args: [address, CRAB_STRATEGY_V2],
      },
    ],
  })

  const { data: sqthApproveTx, writeAsync: approveOsqth } = useContractWrite({
    ...OSQUEETH_CONTRACT,
    functionName: 'approve',
    args: [CRAB_STRATEGY_V2, ethers.constants.MaxUint256],
    onSettled: data => {
      if (data?.hash) {
        addRecentTransaction({
          hash: data?.hash,
          description: 'Approve oSQTH',
        })
      }
    },
  })

  const { data: wethApproveTx, writeAsync: approveWeth } = useContractWrite({
    ...WETH_CONTRACT,
    functionName: 'approve',
    args: [CRAB_STRATEGY_V2, ethers.constants.MaxUint256],
    onSettled: data => {
      if (data?.hash) {
        addRecentTransaction({
          hash: data?.hash,
          description: 'Approve WETH',
        })
      }
    },
  })

  const { isLoading: isOsqthApproveLoading } = useWaitForTransaction({
    hash: sqthApproveTx?.hash,
    onSuccess() {
      refetch()
    },
  })

  const { isLoading: isWethApproveLoading } = useWaitForTransaction({
    hash: wethApproveTx?.hash,
    onSuccess() {
      refetch()
    },
  })

  const [osqthApproval, wethApproval] = useMemo(() => {
    if (!data) return [BIG_ZERO, BIG_ZERO]

    return data as unknown as Array<BigNumber>
  }, [data])

  useEffect(() => {
    setOsqthApproval(osqthApproval)
  }, [osqthApproval, setOsqthApproval])

  useEffect(() => {
    setWethApproval(wethApproval)
  }, [wethApproval, setWethApproval])

  const isOsqthApproved = osqthApproval.eq(ethers.constants.MaxUint256)
  const isWethApproved = wethApproval.eq(ethers.constants.MaxUint256)

  return (
    <Box display="flex">
      <Box mt={1} bgcolor="background.overlayDark" p={2} borderRadius={2}>
        <Box display="flex" alignItems="center">
          <Typography mr={4}>oSQTH</Typography>
          {isOsqthApproved ? (
            <SecondaryButton disabled size="small" sx={{ width: 120 }}>
              Approved
            </SecondaryButton>
          ) : (
            <BoxLoadingButton
              onClick={() => approveOsqth()}
              loading={isOsqthApproveLoading}
              size="small"
              sx={{ width: 120 }}
            >
              Approve
            </BoxLoadingButton>
          )}
        </Box>
        <Box display="flex" alignItems="center" mt={1}>
          <Typography mr={2} color="textSecondary">
            Approved Amt :
          </Typography>
          <Typography variant="numeric">{formatBigNumber(osqthApproval, 18, 6)}</Typography>
        </Box>
      </Box>

      <Box mt={1} bgcolor="background.overlayDark" p={2} borderRadius={2} ml={4}>
        <Box display="flex" alignItems="center">
          <Typography mr={4}>WETH</Typography>
          {isWethApproved ? (
            <SecondaryButton disabled size="small" sx={{ width: 120 }}>
              Approved
            </SecondaryButton>
          ) : (
            <BoxLoadingButton
              onClick={() => approveWeth()}
              loading={isWethApproveLoading}
              size="small"
              sx={{ width: 120 }}
            >
              Approve
            </BoxLoadingButton>
          )}
        </Box>
        <Box display="flex" alignItems="center" mt={1}>
          <Typography mr={2} color="textSecondary">
            Approved Amt :
          </Typography>
          <Typography variant="numeric">{formatBigNumber(osqthApproval, 18, 6)}</Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default Approvals
