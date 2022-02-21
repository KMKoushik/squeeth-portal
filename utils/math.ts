import { BigNumber, ethers } from 'ethers'

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
