import { Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit'
import { BigNumber, ethers } from 'ethers'
import { useEffect, useMemo } from 'react'
import { useContractReads, useContractWrite, useWaitForTransaction } from 'wagmi'
import { BoxLoadingButton } from '../../../components/button/PrimaryButton'
import { SecondaryButton } from '../../../components/button/SecondaryButton'
import { CRAB_OTC, CRAB_STRATEGY_V2 } from '../../../constants/address'
import { WETH_CONTRACT, OSQUEETH_CONTRACT, CRAB_V2_CONTRACT } from '../../../constants/contracts'
import { BIG_ZERO } from '../../../constants/numbers'
import useAccountStore from '../../../store/accountStore'
import useCrabV2Store from '../../../store/crabV2Store'
import { formatBigNumber, toBigNumber } from '../../../utils/math'

const ApprovalsOtc: React.FC = () => {
  const address = useAccountStore(s => s.address)
  const setWethApproval = useCrabV2Store(s => s.setWethApprovalOtc)
  const setOsqthApproval = useCrabV2Store(s => s.setOsqthApprovalOtc)
  const setCrabApproval = useCrabV2Store(s => s.setCrabApprovalOtc)
  const addRecentTransaction = useAddRecentTransaction()

  const { data, isLoading, refetch } = useContractReads({
    contracts: [
      {
        ...WETH_CONTRACT,
        functionName: 'allowance',
        args: [address, CRAB_OTC],
      },
      {
        ...OSQUEETH_CONTRACT,
        functionName: 'allowance',
        args: [address, CRAB_OTC],
      },
      {
        ...CRAB_V2_CONTRACT,
        functionName: 'allowance',
        args: [address, CRAB_OTC],
      },
    ],
  })

  const { data: wethApproveTx, writeAsync: approveWeth } = useContractWrite({
    ...WETH_CONTRACT,
    functionName: 'approve',
    args: [CRAB_OTC, ethers.constants.MaxUint256],
    onSettled: data => {
      if (data?.hash) {
        addRecentTransaction({
          hash: data?.hash,
          description: 'Approve WETH',
        })
      }
    },
  })

  const { data: sqthApproveTx, writeAsync: approveOsqth } = useContractWrite({
    ...OSQUEETH_CONTRACT,
    functionName: 'approve',
    args: [CRAB_OTC, ethers.constants.MaxUint256],
    onSettled: data => {
      if (data?.hash) {
        addRecentTransaction({
          hash: data?.hash,
          description: 'Approve oSQTH',
        })
      }
    },
  })

  const { data: crabApproveTx, writeAsync: approveCrab } = useContractWrite({
    ...CRAB_V2_CONTRACT,
    functionName: 'approve',
    args: [CRAB_OTC, ethers.constants.MaxUint256],
    onSettled: data => {
      if (data?.hash) {
        addRecentTransaction({
          hash: data?.hash,
          description: 'Approve Crab Spend',
        })
      }
    },
  })

  const { isLoading: isWethApproveLoading } = useWaitForTransaction({
    hash: wethApproveTx?.hash,
    onSuccess() {
      refetch()
    },
  })

  const { isLoading: isOsqthApproveLoading } = useWaitForTransaction({
    hash: sqthApproveTx?.hash,
    onSuccess() {
      refetch()
    },
  })

  const { isLoading: isCrabApproveLoading } = useWaitForTransaction({
    hash: crabApproveTx?.hash,
    onSuccess() {
      refetch()
    },
  })

  const [wethApproval, osqthApproval, crabApproval] = useMemo(() => {
    if (!data) return [BIG_ZERO, BIG_ZERO]

    return data as unknown as Array<BigNumber>
  }, [data])

  useEffect(() => {
    setWethApproval(wethApproval || BIG_ZERO)
  }, [wethApproval, setWethApproval])

  useEffect(() => {
    setOsqthApproval(osqthApproval || BIG_ZERO)
  }, [osqthApproval, setOsqthApproval])

  useEffect(() => {
    setCrabApproval(crabApproval || BIG_ZERO)
  }, [crabApproval, setCrabApproval])

  const isWethApproved = wethApproval?.gt(toBigNumber(1_000_000))
  const isOsqthApproved = osqthApproval?.gt(toBigNumber(1_000_000))
  const isCrabApproved = crabApproval?.gt(toBigNumber(1_000_000))

  if (!wethApproval || !osqthApproval || !crabApproval) return null

  return (
    <Box display="flex" flexWrap="wrap" gap={2} justifyContent={{ xs: 'center', sm: 'start' }}>
      <Box bgcolor="background.overlayDark" p={2} borderRadius={2}>
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
          <Typography variant="numeric">{isWethApproved ? 'Max' : formatBigNumber(wethApproval, 18, 6)}</Typography>
        </Box>
      </Box>

      <Box bgcolor="background.overlayDark" p={2} borderRadius={2}>
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
          <Typography variant="numeric">{isOsqthApproved ? 'Max' : formatBigNumber(osqthApproval, 18, 6)}</Typography>
        </Box>
      </Box>

      <Box bgcolor="background.overlayDark" p={2} borderRadius={2}>
        <Box display="flex" alignItems="center">
          <Typography mr={4}>Crab Token</Typography>
          {isCrabApproved ? (
            <SecondaryButton disabled size="small" sx={{ width: 120 }}>
              Approved
            </SecondaryButton>
          ) : (
            <BoxLoadingButton
              onClick={() => approveCrab()}
              loading={isCrabApproveLoading}
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
          <Typography variant="numeric">{isCrabApproved ? 'Max' : formatBigNumber(crabApproval, 18, 6)}</Typography>
        </Box>
      </Box>

      <Box bgcolor="background.overlayDark" p={2} borderRadius={2}>
        <Box display="flex" alignItems="center">
          <Typography mr={4}>Utilities</Typography>
          <Typography mr={2} color="textSecondary">
          <ul>
            <li>
              <a href="https://squeeth.opyn.co/mint" target="_blank" rel="noreferrer">
                <Typography color="primary">Mint / burn oSQTH</Typography>
              </a>
            </li>
            <li>
              <a href="https://app.uniswap.org/#/swap" target="_blank" rel="noreferrer">
                <Typography color="primary">Wrap / unwrap WETH</Typography>
              </a>
            </li>
          </ul>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default ApprovalsOtc
