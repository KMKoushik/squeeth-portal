import { BigNumber } from 'ethers'
import React from 'react'
import { useContractReads } from 'wagmi'
import { AUCTION_BULL, BULL_STRATEGY } from '../../constants/address'
import {
  AUCTION_BULL_CONTRACT,
  BULL_CONTRACT,
  CRAB_NETTING_CONTRACT,
  USDC_D_TOKEN_CONTRACT,
  WETH_E_TOKEN_CONTRACT,
} from '../../constants/contracts'
import { useCalmBullActions } from '../../store/calmBullStore'
import { useCrabNettingStore } from '../../store/crabNettingStore'

export const useInitBull = () => {
  const {
    setAuctionManager,
    setBullSupply,
    setCR,
    setDelta,
    setCrLower,
    setCrUpper,
    setCrabBalance,
    setDeltaLower,
    setDeltaUpper,
    setLoanCollat,
    setLoanDebt,
    setIsReady,
  } = useCalmBullActions()

  const { data, isSuccess } = useContractReads({
    contracts: [
      {
        ...BULL_CONTRACT,
        functionName: 'getCrabBalance',
      },
      {
        ...BULL_CONTRACT,
        functionName: 'totalSupply',
      },
      {
        ...AUCTION_BULL_CONTRACT,
        functionName: 'auctionManager',
      },
      {
        ...AUCTION_BULL_CONTRACT,
        functionName: 'crUpper',
      },
      {
        ...AUCTION_BULL_CONTRACT,
        functionName: 'crLower',
      },
      {
        ...AUCTION_BULL_CONTRACT,
        functionName: 'deltaLower',
      },
      {
        ...AUCTION_BULL_CONTRACT,
        functionName: 'deltaUpper',
      },
      {
        ...AUCTION_BULL_CONTRACT,
        functionName: 'getCurrentDeltaAndCollatRatio',
      },
      {
        ...USDC_D_TOKEN_CONTRACT,
        functionName: 'balanceOf',
        args: [BULL_STRATEGY],
      },
      {
        ...WETH_E_TOKEN_CONTRACT,
        functionName: 'balanceOfUnderlying',
        args: [BULL_STRATEGY],
      },
    ],
  })

  React.useEffect(() => {
    if (isSuccess && data) {
      setCrabBalance(data[0] as any as BigNumber)
      setBullSupply(data[1] as any as BigNumber)
      setAuctionManager(data[2] as any as string)
      setCrUpper(data[3] as any as BigNumber)
      setCrLower(data[4] as any as BigNumber)
      setDeltaLower(data[5] as any as BigNumber)
      setDeltaUpper(data[6] as any as BigNumber)
      if (data[7]) {
        setDelta(data[7][0] as any as BigNumber)
        setCR(data[7][1] as any as BigNumber)
      }
      setLoanDebt(data[8] as any as BigNumber)
      console.log((data[9] as any as BigNumber).toString())
      setLoanCollat(data[9] as any as BigNumber)

      setIsReady(true)
    }
  }, [data, isSuccess])
}
