import { BigNumber } from 'ethers'
import { useEffect } from 'react'
import { useContractReads } from 'wagmi'
import { CRAB_V2_CONTRACT } from '../constants/contracts'
import useCrabV2Store from '../store/crabV2Store'
import usePriceStore from '../store/priceStore'
import { bnComparator } from '../utils'
import { calculateCrabUSDCValue } from '../utils/math'

export const useInitCrabV2 = () => {
  const setOwner = useCrabV2Store(s => s.setOwner)
  const setIsContractLoading = useCrabV2Store(s => s.setIsContractLoading)
  const setVault = useCrabV2Store(s => s.setVault)
  const setTotalSupply = useCrabV2Store(s => s.setTotalSupply)
  const setCrabUsdcValue = useCrabV2Store(s => s.setCrabUsdcValue)

  const ethPrice = usePriceStore(s => s.ethPrice, bnComparator)
  const oSqthPrice = usePriceStore(s => s.oSqthPrice, bnComparator)

  const { data, isSuccess, isFetching } = useContractReads({
    contracts: [
      {
        ...CRAB_V2_CONTRACT,
        functionName: 'owner',
      },
      {
        ...CRAB_V2_CONTRACT,
        functionName: 'getVaultDetails',
      },
      {
        ...CRAB_V2_CONTRACT,
        functionName: 'totalSupply',
      },
    ],
  })

  useEffect(() => {
    if (data?.length) {
      setOwner(data[0] as any as string)
      const [address, , collateral, shortAmount] = data[1] as [string, BigNumber, BigNumber, BigNumber]
      setVault({ address, collateral, shortAmount })
      setTotalSupply(data[2] as any as BigNumber)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, setOwner])

  useEffect(() => {
    if (data?.length) {
      const [, , collateral, shortAmount] = data[1] as [string, BigNumber, BigNumber, BigNumber]
      const supply = data[2] as any as BigNumber
      const crabUsdcValue = calculateCrabUSDCValue(ethPrice, oSqthPrice, collateral, shortAmount, supply)
      setCrabUsdcValue(crabUsdcValue)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, ethPrice, oSqthPrice])

  setIsContractLoading(isFetching)
}
