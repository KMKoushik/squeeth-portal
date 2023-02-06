import { BigNumber } from 'ethers'
import React from 'react'
import { useContractReads } from 'wagmi'
import { ZEN_BULL_NETTING_CONTRACT } from '../../constants/contracts'
import { useCalmBullActions } from '../../store/calmBullStore'

export const useInitBullNetting = () => {
  const { setBullDepositQueued, setBullWithdrawQueued, setNettingOwner, setIsAuctionLive } = useCalmBullActions()

  const { data, isSuccess } = useContractReads({
    contracts: [
      {
        ...ZEN_BULL_NETTING_CONTRACT,
        functionName: 'depositsQueued',
      },
      {
        ...ZEN_BULL_NETTING_CONTRACT,
        functionName: 'withdrawsQueued',
      },
      {
        ...ZEN_BULL_NETTING_CONTRACT,
        functionName: 'owner',
      },
      {
        ...ZEN_BULL_NETTING_CONTRACT,
        functionName: 'isAuctionLive',
      },
    ],
  })

  React.useEffect(() => {
    if (isSuccess && data) {
      setBullDepositQueued(data[0] as any as BigNumber)
      setBullWithdrawQueued(data[1] as any as BigNumber)
      setNettingOwner(data[2] as any as string)
      setIsAuctionLive(data[3] as any as boolean)
    }
  }, [data, isSuccess, setBullDepositQueued, setBullWithdrawQueued, setIsAuctionLive, setNettingOwner])
}
