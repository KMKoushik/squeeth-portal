import { BigNumber, ethers } from 'ethers'
import { BIG_ONE, FUNDING_PERIOD, INDEX_SCALE, SHUTDOWN_DATE } from '../constants/numbers'

export const { formatUnits, parseUnits, parseEther } = ethers.utils

export const formatBigNumber = (bn: BigNumber | string, decimals = 18, decimalsToShow = 5) => {
  if (BigNumber.from(bn).gte('100000000000000000000000000000')) {
    return convertBigNumber(bn, decimals).toExponential(6)
  }

  return convertBigNumber(bn, decimals).toLocaleString(undefined, {
    maximumFractionDigits: decimalsToShow,
    minimumFractionDigits: decimalsToShow,
  })
}

export const convertBigNumber = (bn: BigNumber | string, decimals = 18) => {
  return parseFloat(ethers.utils.formatUnits(bn, decimals))
}

export const convertBigNumberStr = (bn: BigNumber | string, decimals = 18) => {
  return ethers.utils.formatUnits(bn, decimals)
}

export const toBigNumber = (num: number | string, decimals = 18) => {
  return parseUnits(num.toString(), decimals)
}

export const divideWithPrecision = (dividend: BigNumber, divisor: BigNumber, decimals = 5) => {
  return dividend.mul(BigNumber.from(10).pow(4)).div(divisor).toNumber() / Math.pow(10, decimals)
}

export const wmul = (num1: BigNumber | string, num2: BigNumber | string) => {
  return BigNumber.from(num1).mul(num2).div(BIG_ONE)
}

export const cwmul = (num1: BigNumber | string, num2: BigNumber | string) => {
  return BigNumber.from(num1).mul(num2).add(BIG_ONE.div(2)).div(BIG_ONE)
}

export const wdiv = (dividend: BigNumber | number, divisor: BigNumber | number) => {
  const _dividend = BigNumber.from(dividend)
  const _divisor = BigNumber.from(divisor)
  return _dividend.mul(BIG_ONE).add(_divisor.div(2)).div(_divisor)
}

export const formatNumber = (n: number) => (n > 9 ? n.toString() : `0${n}`)

export const getCurrentSeconds = () => Number((Date.now() / 1000).toFixed(0))

/**
 * Days until shutdown
 * */
export const getDaysToShutdown = () => {
  const now = new Date()
  const shutdownDate = new Date(SHUTDOWN_DATE)
  const millisecondsPerDay = 1000 * 60 * 60 * 24
  return (shutdownDate.getTime() - now.getTime()) / millisecondsPerDay
}

/**
 * IV formula given shutdown
 */

export const calculateIV = (oSqthPrice: number, normFactor: number, ethPrice: number) => {
  if (!oSqthPrice) return 0
  return calculateIVShutdown(ethPrice, normFactor, getDaysToShutdown(), oSqthPrice)
}

type UnivariateFunction = (x: number) => number
/**
 * We need to find a zero for implied volatilty function and fzero is unreliable
 * so using bisection algorithm https://en.wikipedia.org/wiki/Bisection_method
 * */
export const bisection = (fn: UnivariateFunction, a: number, b: number, tolerance: number, maxIterations: number) => {
  let i = 0

  while (i < maxIterations) {
    let c = (a + b) / 2
    let f_c = fn(c)

    if (f_c === 0 || b - a < tolerance) {
      return c
    }

    i++

    if (fn(a) * f_c > 0) {
      a = c
    } else {
      b = c
    }
  }

  return 0 // Did not converge within maxIterations
}

/**
 * Squeeth price in shutdown
 * See development here https://colab.research.google.com/drive/1gNpmXwmYPsWHwaI_pjuq3L5biq7NJVCx#scrollTo=qtjMrP_F_91z
 * */
export const getSqueethPriceShutdown = (
  ethPrice: number,
  normFactor: number,
  daysToShutdown: number,
  ethVol: number,
) => {
  const expiringQuadraticToday = ethPrice * Math.exp((ethVol * ethVol * daysToShutdown) / 365)
  const expiringQuadraticTomorrow = ethPrice * Math.exp((ethVol * ethVol * (daysToShutdown - 1)) / 365)
  // alpha is a value that makes the shutdown squeeth have the same return as expiring squeeth over one day.
  const alpha =
    (expiringQuadraticToday - expiringQuadraticTomorrow) /
    (expiringQuadraticToday - expiringQuadraticTomorrow + (expiringQuadraticToday - ethPrice) / FUNDING_PERIOD)
  return normFactor * ((ethPrice + alpha * (expiringQuadraticToday - ethPrice)) / INDEX_SCALE)
}

/**
 * Squeeth implied volatility in shutdown using bisection to find the zero
 * */
export const calculateIVShutdown = (ethPrice: number, normFactor: number, daysToShutdown: number, price: number) => {
  const fn = (vol: number) => {
    return Number(getSqueethPriceShutdown(ethPrice, normFactor, daysToShutdown, vol)) - price
  }
  // params to find implied vol between 1% and 200% within 100 iterations
  const volLower = 0.01
  const volUpper = 2
  const tolerance = 1e-6
  const maxIterations = 100
  // find implied volatility to match the price
  const root = bisection(fn, volLower, volUpper, tolerance, maxIterations)
  return root
}

export const calculateDollarValue = (ethPrice: number, ethToUSD: number) => {
  return ethToUSD * ethPrice
}

export const calculateCrabUSDCValue = (
  ethPrice: BigNumber,
  oSqthPrice: BigNumber,
  collat: BigNumber,
  debt: BigNumber,
  supply: BigNumber,
) => {
  const ethDebt = wmul(debt, oSqthPrice)
  const ethValue = collat.sub(ethDebt)

  return wdiv(wmul(ethValue, ethPrice), supply)
}

BigNumber.prototype.wmul = function (num) {
  return wmul(this, num)
}

BigNumber.prototype.wdiv = function (divisor) {
  return wdiv(this, divisor)
}
