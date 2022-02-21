import * as React from 'react'
import { CRAB_STRATEGY } from '../constants/address'
import useCrabStore from '../store/crabStore'
import { CrabStrategy } from '../types/contracts'
import crabAbi from '../abis/crabStrategy.json'
import { useContract, useProvider } from 'wagmi'

const useCrab = () => {
  const provider = useProvider()
  const crabLoaded = useCrabStore(s => s.loaded)
  const setLoaded = useCrabStore(s => s.setLoaded)
  const setTimeAtLastHedge = useCrabStore(s => s.setTimeAtLastHedge)
  const setPriceAtLastHedge = useCrabStore(s => s.setPriceAtLastHedge)
  const setHedgeTimeThreshold = useCrabStore(s => s.setHedgeTimeThreshold)
  const setHedgePriceThreshold = useCrabStore(s => s.setHedgePriceThreshold)
  const setIsTimeHedgeAvailable = useCrabStore(s => s.setIsTimeHedgeAvailable)
  const setAuctionTriggerTime = useCrabStore(s => s.setAuctionTriggerTime)

  const [loading, setLoading] = React.useState(false)

  const crabContract = useContract<CrabStrategy>({
    addressOrName: CRAB_STRATEGY,
    contractInterface: crabAbi,
    signerOrProvider: provider,
  })

  const updateAuctionData = React.useCallback(async () => {
    const p1 = crabContract.timeAtLastHedge()
    const p2 = crabContract.priceAtLastHedge()
    const p3 = crabContract.hedgeTimeThreshold()
    const p4 = crabContract.hedgePriceThreshold()
    const p5 = crabContract.checkTimeHedge()

    setLoading(true)
    const [_time, _price, _timeThreshold, _priceThreshold, [_isTimeHedge, _aucTime]] = await Promise.all([
      p1,
      p2,
      p3,
      p4,
      p5,
    ])
    setTimeAtLastHedge(_time.toNumber())
    setPriceAtLastHedge(_price)
    setHedgePriceThreshold(_priceThreshold)
    setHedgeTimeThreshold(_timeThreshold.toNumber())
    setIsTimeHedgeAvailable(_isTimeHedge)
    setAuctionTriggerTime(_aucTime.toNumber())
    setLoaded(true)
    setLoading(false)
  }, [
    crabContract,
    setAuctionTriggerTime,
    setHedgePriceThreshold,
    setHedgeTimeThreshold,
    setIsTimeHedgeAvailable,
    setLoaded,
    setPriceAtLastHedge,
    setTimeAtLastHedge,
  ])

  React.useEffect(() => {
    if (!crabLoaded && !loading) updateAuctionData()
  }, [crabLoaded, updateAuctionData, loading])

  return {
    crabContract,
    crabLoaded,
  }
}

export default useCrab
