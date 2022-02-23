import { BigNumber, ethers } from 'ethers'
import { BIG_ONE } from '../constants/numbers'

export const { formatUnits, parseUnits } = ethers.utils

export const formatBigNumber = (bn: BigNumber, decimals = 18, decimalsToShow = 4) => {
  return convertBigNumber(bn, decimals).toLocaleString(undefined, {
    maximumFractionDigits: decimalsToShow,
  })
}

export const convertBigNumber = (bn: BigNumber, decimals = 18) => {
  return parseFloat(ethers.utils.formatUnits(bn, decimals))
}

export const divideWithPrecision = (dividend: BigNumber, divisor: BigNumber, decimals = 4) => {
  return dividend.mul(BigNumber.from(10).pow(4)).div(divisor).toNumber() / Math.pow(10, decimals)
}

export const wmul = (num1: BigNumber, num2: BigNumber) => {
  return num1.mul(num2).div(BIG_ONE)
}

export const formatNumber = (n: number) => (n > 9 ? n.toString() : `0${n}`)
