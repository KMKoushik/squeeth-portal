import { BigNumber } from 'ethers'
import { useEffect, useState } from 'react'
import { useContractReads } from 'wagmi'
import { CRAB_STRATEGY_V2 } from '../constants/address'
import { CRAB_V2_CONTRACT, OSQUEETH_CONTRACT, WETH_CONTRACT } from '../constants/contracts'
import { BIG_ZERO } from '../constants/numbers'
import useCrabV2Store from '../store/crabV2Store'
import { getUniqueTraders, sortBids } from '../utils/auction'

export const useInitCrabV2 = () => {
  const setOwner = useCrabV2Store(s => s.setOwner)
  const setIsContractLoading = useCrabV2Store(s => s.setIsContractLoading)

  const { data, isSuccess, isFetching } = useContractReads({
    contracts: [
      {
        ...CRAB_V2_CONTRACT,
        functionName: 'owner',
      },
    ],
  })

  useEffect(() => {
    if (data?.length) {
      setOwner(data[0] as any as string)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, setOwner])

  setIsContractLoading(isFetching)
}
