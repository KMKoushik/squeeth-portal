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
import { BIG_ONE } from '../../constants/numbers'
import { useCalmBullActions } from '../../store/calmBullStore'
import { useCrabNettingStore } from '../../store/crabNettingStore'
import useCrabV2Store from '../../store/crabV2Store'
import usePriceStore from '../../store/priceStore'

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
    setBullEthValue,
  } = useCalmBullActions()

  const crabV2Vault = useCrabV2Store(s => s.vault)
  const crabTotalSupply = useCrabV2Store(s => s.totalSupply)
  const oSqthPrice = usePriceStore(s => s.oSqthPrice)
  const ethPrice = usePriceStore(s => s.ethPrice)

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
    if (isSuccess && data && crabV2Vault && !ethPrice.isZero()) {
      const _crabBalance = data[0] as any as BigNumber
      const _eulerWeth = data[9] as any as BigNumber
      const _eulerUsdc = data[8] as any as BigNumber
      const _bullSupply = data[1] as any as BigNumber

      setCrabBalance(_crabBalance)
      setBullSupply(_bullSupply)
      setAuctionManager(data[2] as any as string)
      setCrUpper(data[3] as any as BigNumber)
      setCrLower(data[4] as any as BigNumber)
      setDeltaLower(data[5] as any as BigNumber)
      setDeltaUpper(data[6] as any as BigNumber)
      if (data[7]) {
        setDelta(data[7][0] as any as BigNumber)
        setCR(data[7][1] as any as BigNumber)
      }
      setLoanDebt(_eulerUsdc)
      setLoanCollat(_eulerWeth)

      const _crabCollat = _crabBalance.mul(crabV2Vault.collateral).div(crabTotalSupply)
      const _crabDebt = _crabBalance.mul(crabV2Vault.shortAmount).div(crabTotalSupply).wmul(oSqthPrice)
      const _crabComponent = _crabCollat.sub(_crabDebt).wdiv(_bullSupply)

      const _leverageComponent = _eulerWeth
        .sub(_eulerUsdc.mul(BigNumber.from(1e12).mul(BIG_ONE)).div(ethPrice))
        .wdiv(_bullSupply)

      setBullEthValue(_crabComponent.add(_leverageComponent))
      setIsReady(true)
    }
  }, [data, isSuccess, crabV2Vault, oSqthPrice, ethPrice])
}
