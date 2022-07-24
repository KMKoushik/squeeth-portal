import { BigNumber } from 'ethers'
import React from 'react'
import { useFeeData } from 'wagmi'
import { BIG_ONE } from '../../constants/numbers'
import useAppStore from '../../store/appStore'
import useCrabV2Store from '../../store/crabV2Store'
import usePriceStore from '../../store/priceStore'
import { convertBigNumber, divideWithPrecision, wmul } from '../../utils/math'

const useInitFeeData = () => {
  const { data, isLoading } = useFeeData()
  const setGasFee = useAppStore(s => s.setGasFee)
  const oSqthPrice = usePriceStore(s => s.oSqthPrice)
  const setMinOrder = useCrabV2Store(s => s.setMinOrder)

  React.useEffect(() => {
    if (isLoading || !data?.maxFeePerGas) return

    console.log('Max gas', data?.maxFeePerGas?.toString())

    setGasFee(Number(data.maxFeePerGas.toString()))
    const minEth = (Number(data.maxFeePerGas.toString()) * 125_000) / 1e18 / 0.005
    const minSqth = minEth / convertBigNumber(oSqthPrice, 18)
    setMinOrder(Math.ceil(minSqth * 10) / 10)
  }, [data?.maxFeePerGas, isLoading, oSqthPrice, setGasFee, setMinOrder])
}

export default useInitFeeData
