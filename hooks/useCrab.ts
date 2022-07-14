import * as React from 'react'
import { CONTROLLER, CRAB_STRATEGY, OSQUEETH, SQUEETH_UNI_POOL, WETH } from '../constants/address'
import useCrabStore from '../store/crabStore'
import { Controller, CrabStrategy } from '../types/contracts'
import crabAbi from '../abis/crabStrategy.json'
import controllerAbi from '../abis/controller.json'
import { useContract, useProvider, useSigner } from 'wagmi'
import useOracle from './useOracle'
import { BigNumber } from 'ethers'
import { getCurrentSeconds, wdiv, wmul } from '../utils/math'
import { AUCTION_TIME, BIG_ONE } from '../constants/numbers'

const MAX_PRICE_MULTIPLIER = BigNumber.from('1050000000000000000') // 1.05 - Need to be taken from contract in future
const MIN_PRICE_MULTIPLIER = BigNumber.from('950000000000000000') // .95 - Need to be taken from contract in future

export const getSqthEthTarget = (debt: BigNumber, ethDelta: BigNumber, sqthPrice: BigNumber) => {
  const oSqthDelta = wmul(wmul(debt, BigNumber.from(BIG_ONE).mul(2)), sqthPrice)

  const getAuctionTypeAndTargetHedge = () => {
    if (oSqthDelta.gt(ethDelta)) {
      return { isSellingAuction: false, target: wdiv(oSqthDelta.sub(ethDelta), sqthPrice) }
    }
    return { isSellingAuction: true, target: wdiv(ethDelta.sub(oSqthDelta), sqthPrice) }
  }

  const { isSellingAuction, target } = getAuctionTypeAndTargetHedge()
  const ethProceeds = wmul(target, sqthPrice)
  console.log(
    ethProceeds.toString(),
    target.toString(),
    sqthPrice.toString(),
    oSqthDelta.toString(),
    'Is Selling',
    !oSqthDelta.gt(ethDelta),
    ethDelta.toString(),
    oSqthDelta.sub(ethDelta).toString(),
  )

  return { isSellingAuction, oSqthAmount: target, ethAmount: ethProceeds }
}

const useCrab = () => {
  const [{ data: signer }] = useSigner()
  const provider = useProvider()

  const {
    vaultId,
    setVaultId,
    auctionTriggerTime,
    loaded: crabLoaded,
    deltaHedgeThreshold,
    setLoaded,
    setTimeAtLastHedge,
    setPriceAtLastHedge,
    setHedgeTimeThreshold,
    setHedgePriceThreshold,
    setIsTimeHedgeAvailable,
    setAuctionTriggerTime,
    setAuctionDetails,
    setDeltaHedgeThreshold,
    setCrabVault,
    setTotalSupply,
  } = useCrabStore()

  const [loading, setLoading] = React.useState(false)

  const crabContract = useContract<CrabStrategy>({
    addressOrName: CRAB_STRATEGY,
    contractInterface: crabAbi,
    signerOrProvider: signer || provider,
  })

  const controller = useContract<Controller>({
    addressOrName: CONTROLLER,
    contractInterface: controllerAbi,
    signerOrProvider: provider,
  })

  const oracleContract = useOracle()

  const updateCrabData = React.useCallback(async () => {
    const p1 = crabContract.timeAtLastHedge()
    const p2 = crabContract.priceAtLastHedge()
    const p3 = crabContract.hedgeTimeThreshold()
    const p4 = crabContract.hedgePriceThreshold()
    const p5 = crabContract.checkTimeHedge()
    const p6 = crabContract.deltaHedgeThreshold()
    const p7 = crabContract.vaultId()
    const p8 = crabContract.totalSupply()

    setLoading(!crabLoaded && true) // Only set true for 1st time
    console.log('Update auction data')
    const [
      _time,
      _price,
      _timeThreshold,
      _priceThreshold,
      [_isTimeHedge, _aucTime],
      _deltaThreshold,
      _vaultId,
      _totalSupply,
    ] = await Promise.all([p1, p2, p3, p4, p5, p6, p7, p8])

    const { operator, shortAmount, collateralAmount } = await controller.vaults(_vaultId)
    setCrabVault({ operator, shortAmount, collateralAmount })
    setTimeAtLastHedge(_time.toNumber())
    setPriceAtLastHedge(_price)
    setHedgePriceThreshold(_priceThreshold)
    setHedgeTimeThreshold(_timeThreshold.toNumber())
    setIsTimeHedgeAvailable((_time.toNumber() + _timeThreshold.toNumber()) * 1000 < Date.now())
    setVaultId(_vaultId.toNumber())
    setDeltaHedgeThreshold(_deltaThreshold)
    setAuctionTriggerTime(_aucTime.toNumber())
    setLoaded(true)
    setLoading(false)
    setTotalSupply(_totalSupply)
  }, [
    controller,
    crabContract,
    crabLoaded,
    setAuctionTriggerTime,
    setCrabVault,
    setDeltaHedgeThreshold,
    setHedgePriceThreshold,
    setHedgeTimeThreshold,
    setIsTimeHedgeAvailable,
    setLoaded,
    setPriceAtLastHedge,
    setTimeAtLastHedge,
    setTotalSupply,
    setVaultId,
  ])

  const checkAuctionTypeOffChain = React.useCallback(
    (debt: BigNumber, ethDelta: BigNumber, sqthPrice: BigNumber) => {
      const oSqthDelta = wmul(wmul(debt, BigNumber.from(BIG_ONE).mul(2)), sqthPrice)

      const getAuctionTypeAndTargetHedge = () => {
        if (oSqthDelta.gt(ethDelta)) {
          return { isSellingAuction: false, target: wdiv(oSqthDelta.sub(ethDelta), sqthPrice) }
        }
        return { isSellingAuction: true, target: wdiv(ethDelta.sub(oSqthDelta), sqthPrice) }
      }

      const { isSellingAuction, target } = getAuctionTypeAndTargetHedge()

      if (wdiv(wmul(target, sqthPrice), ethDelta).lte(deltaHedgeThreshold)) {
        throw new Error('strategy is delta neutral')
      }

      return { isSellingAuction, target }
    },
    [deltaHedgeThreshold],
  )

  /**
   * This function uses the same code as crab contract to get auction details without even calling the view function
   * Reason behind this is view function uses the old block's timestamp for calculation and does not give accurate values.
   */
  const getAuctionDetailsOffChain = React.useCallback(
    async (auctionTriggerTime: number) => {
      const currentOSqueethPrice = await oracleContract.getTwap(SQUEETH_UNI_POOL, OSQUEETH, WETH, 420, true)
      // todo: Include FEE rate from the controller

      const { collateralAmount: ethDelta, shortAmount: debt } = await controller.vaults(vaultId)
      const { isSellingAuction } = checkAuctionTypeOffChain(debt, ethDelta, currentOSqueethPrice)
      const auctionOsqthPrice = getAuctionPriceOffChain(auctionTriggerTime, currentOSqueethPrice, isSellingAuction)
      const { isSellingAuction: isStillSelling, target: oSqthToAuction } = checkAuctionTypeOffChain(
        debt,
        ethDelta,
        auctionOsqthPrice,
      )

      const isAuctionDirectionChanged = isSellingAuction != isStillSelling
      const ethProceeds = wmul(oSqthToAuction, auctionOsqthPrice)

      return {
        isSellingAuction,
        oSqthToAuction,
        ethProceeds,
        auctionOsqthPrice,
        isAuctionDirectionChanged,
      }
    },
    [checkAuctionTypeOffChain, controller, oracleContract, vaultId],
  )

  const getAuctionPriceOffChain = (auctionTriggerTime: number, oSqthPrice: BigNumber, isSelling: boolean) => {
    const currentTime = getCurrentSeconds()
    const completionRatio =
      currentTime - auctionTriggerTime >= AUCTION_TIME ? BIG_ONE : wdiv(currentTime - auctionTriggerTime, AUCTION_TIME)
    let priceMultiplier

    if (isSelling) {
      priceMultiplier = MAX_PRICE_MULTIPLIER.sub(wmul(completionRatio, MAX_PRICE_MULTIPLIER.sub(MIN_PRICE_MULTIPLIER)))
    } else {
      priceMultiplier = MIN_PRICE_MULTIPLIER.add(wmul(completionRatio, MAX_PRICE_MULTIPLIER.sub(MIN_PRICE_MULTIPLIER)))
    }

    return wmul(oSqthPrice, priceMultiplier)
  }

  const getMinAndMaxPrice = React.useCallback((oSqthPrice: BigNumber, isSelling: boolean) => {
    const upperPrice = wmul(
      MAX_PRICE_MULTIPLIER.sub(wmul(BIG_ONE, MAX_PRICE_MULTIPLIER.sub(MIN_PRICE_MULTIPLIER))),
      oSqthPrice,
    )
    const lowerPrice = wmul(
      MIN_PRICE_MULTIPLIER.add(wmul(BIG_ONE, MAX_PRICE_MULTIPLIER.sub(MIN_PRICE_MULTIPLIER))),
      oSqthPrice,
    )

    const minPrice = isSelling ? lowerPrice : upperPrice
    const maxPrice = isSelling ? upperPrice : lowerPrice

    return {
      minPrice,
      maxPrice,
    }
  }, [])

  React.useEffect(() => {
    if (!crabLoaded && !loading) updateCrabData()
  }, [crabLoaded, updateCrabData, loading])

  React.useEffect(() => {
    if (auctionTriggerTime === 0 || auctionTriggerTime * 1000 > Date.now() || deltaHedgeThreshold.isZero()) return

    getAuctionDetailsOffChain(auctionTriggerTime).then(d => {
      const { isSellingAuction, oSqthToAuction, ethProceeds, auctionOsqthPrice, isAuctionDirectionChanged } = d

      setAuctionDetails({
        isSelling: isSellingAuction,
        oSqthAmount: oSqthToAuction,
        ethProceeds,
        auctionPrice: auctionOsqthPrice,
        isDirectionChanged: isAuctionDirectionChanged,
      })
    })
  }, [auctionTriggerTime, crabContract, deltaHedgeThreshold, getAuctionDetailsOffChain, setAuctionDetails])

  return {
    crabContract,
    crabLoaded,
    updateCrabData,
    getAuctionDetailsOffChain,
    getMinAndMaxPrice,
    checkAuctionTypeOffChain,
  }
}

export default useCrab
