import { BigNumber } from 'ethers'
import React from 'react'
import { useContractReads } from 'wagmi'
import { CRAB_NETTING_CONTRACT } from '../../constants/contracts'
import { useCrabNettingStore } from '../../store/crabNettingStore'

export const useInitCrabNetting = () => {
  const { setDepositQueued, setWithdrawQueued, setOwner, setAuctionLive } = useCrabNettingStore()

  const { data, isSuccess } = useContractReads({
    contracts: [
      {
        ...CRAB_NETTING_CONTRACT,
        functionName: 'depositsQueued',
      },
      {
        ...CRAB_NETTING_CONTRACT,
        functionName: 'withdrawsQueued',
      },
      {
        ...CRAB_NETTING_CONTRACT,
        functionName: 'owner',
      },
      {
        ...CRAB_NETTING_CONTRACT,
        functionName: 'isAuctionLive',
      },
    ],
  })

  React.useEffect(() => {
    if (isSuccess && data) {
      setDepositQueued(data[0] as any as BigNumber)
      setWithdrawQueued(data[1] as any as BigNumber)
      setOwner(data[2] as any as string)
      setAuctionLive(data[3] as any as boolean)
    }
  }, [data, isSuccess, setAuctionLive, setDepositQueued, setOwner, setWithdrawQueued])
}
