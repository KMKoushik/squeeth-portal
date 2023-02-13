import { BigNumber } from 'ethers'
import { BIG_ONE } from '../constants/numbers'
import { Vault } from '../types'

type CalculateTotalDepositParams = {
  amount: BigNumber
  ethPrice: BigNumber
  oSqthPrice: BigNumber
  vault: Vault
  bullCrabBalance: BigNumber
  crabSupply: BigNumber
  bullSupply: BigNumber
  eulerEth: BigNumber
  eulerUSD: BigNumber
}

function calculateCrabAmount(
  depositAmount: BigNumber,
  ethUsdPrice: BigNumber,
  oSqthPrice: BigNumber,
  bullSupply: BigNumber,
  crabSupply: BigNumber,
  vault: Vault,
  bullCrabBalance: BigNumber,
  eulerEth: BigNumber,
  eulerUSD: BigNumber,
) {
  const crabUsdPrice = vault.collateral
    .wmul(ethUsdPrice)
    .sub(vault.shortAmount.wmul(oSqthPrice).wmul(ethUsdPrice))
    .wdiv(crabSupply)
  const bullEquityValue = bullCrabBalance.wmul(crabUsdPrice).add(eulerEth.wmul(ethUsdPrice)).sub(eulerUSD.mul(1e12))
  const expectedBullAmount = depositAmount.mul(ethUsdPrice).div(bullEquityValue).wmul(bullSupply)

  const crabAmount = expectedBullAmount.wdiv(bullSupply).wmul(bullCrabBalance)
  console.log('crabAmount', crabAmount.toString(), 'CrabUsdPrice', crabUsdPrice.toString())

  return crabAmount
}

export async function calculateTotalDeposit(params: CalculateTotalDepositParams) {
  const { amount, ethPrice, oSqthPrice, vault, bullCrabBalance, bullSupply, crabSupply, eulerEth, eulerUSD } = params

  const crabAmount = calculateCrabAmount(
    amount,
    ethPrice,
    oSqthPrice,
    bullSupply,
    crabSupply,
    vault,
    bullCrabBalance,
    eulerEth,
    eulerUSD,
  )
  const osqthAmount = crabAmount.mul(vault.shortAmount).div(crabSupply)
  const ethToCrab = crabAmount.mul(vault.collateral).div(crabSupply)
  const share = crabAmount.mul(BIG_ONE).div(bullCrabBalance.add(crabAmount))
  const bullToMint = share.mul(bullSupply).div(BIG_ONE.sub(share))

  return { osqthAmount, crabAmount, bullToMint, ethToCrab }
}
