import { BigNumber } from 'ethers'
import { OSQUEETH, USDC, WETH } from '../constants/address'
import { BIG_ONE, BIG_ZERO, DEFAULT_SLIPPAGE, ETH_OSQTH_FEE, ETH_USDC_FEE } from '../constants/numbers'
import { Vault } from '../types'
import { Quoter } from '../types/contracts'
import { getWsqueethFromCrabAmount } from './crab'
import { wmul } from './math'

export async function calculateTotalDeposit(
  quoter: Quoter,
  usdcAmount: BigNumber,
  oSqthPrice: BigNumber,
  vault: Vault,
  osqthAmt?: BigNumber,
) {
  const depositsQdInETH = await convertUSDToEth(quoter, usdcAmount)
  console.log(depositsQdInETH.toString())
  const { shortAmount, collateral } = vault

  let totalDeposit = BIG_ZERO
  let sqthToMint = BIG_ZERO
  let excessEth = BIG_ZERO

  const _actualTotalDeposit = depositsQdInETH.mul(BIG_ONE).div(BIG_ONE.sub(shortAmount.mul(oSqthPrice).div(collateral)))
  if (!osqthAmt) {
    totalDeposit = _actualTotalDeposit
    console.log('Total deposit', totalDeposit.toString())
    sqthToMint = totalDeposit.mul(shortAmount).div(collateral)
  } else {
    sqthToMint = osqthAmt
    totalDeposit = osqthAmt.mul(collateral).div(shortAmount)
    excessEth = totalDeposit.lt(_actualTotalDeposit) ? _actualTotalDeposit.sub(totalDeposit) : BIG_ZERO
  }

  return { sqthToMint, totalDeposit, ethToGet: depositsQdInETH, excessEth }
}

export async function convertUSDToEth(quoter: Quoter, usdcAmount: BigNumber, slippage = DEFAULT_SLIPPAGE) {
  const { amountOut } = await quoter.callStatic.quoteExactInputSingle({
    tokenIn: USDC,
    tokenOut: WETH,
    amountIn: usdcAmount,
    fee: ETH_USDC_FEE,
    sqrtPriceLimitX96: 0,
  })

  return amountOut.mul(100 * (100 - slippage)).div(10000) // Include slippage
}

export async function convertWETHToEth(quoter: Quoter, wethAmount: BigNumber, slippage = DEFAULT_SLIPPAGE) {
  const { amountOut } = await quoter.callStatic.quoteExactInputSingle({
    tokenIn: WETH,
    tokenOut: USDC,
    amountIn: wethAmount,
    fee: ETH_USDC_FEE,
    sqrtPriceLimitX96: 0,
  })

  return amountOut.mul(100 * (100 - slippage)).div(10000) // Include slippage
}

export async function getUSDCinForEth(quoter: Quoter, ethOut: BigNumber, slippage = DEFAULT_SLIPPAGE) {
  const { amountIn } = await quoter.callStatic.quoteExactOutputSingle({
    tokenIn: USDC,
    tokenOut: WETH,
    amount: ethOut,
    fee: ETH_USDC_FEE,
    sqrtPriceLimitX96: 0,
  })

  return amountIn.mul(100 * (100 + slippage)).div(10000) // Include slippage
}

export async function convertSqthToEth(quoter: Quoter, sqthAmount: BigNumber, slippage = DEFAULT_SLIPPAGE) {
  const { amountOut } = await quoter.callStatic.quoteExactInputSingle({
    tokenIn: OSQUEETH,
    tokenOut: WETH,
    amountIn: sqthAmount,
    fee: ETH_OSQTH_FEE,
    sqrtPriceLimitX96: 0,
  })

  return amountOut.mul(100 * (100 - slippage)).div(10000) // Include slippage
}

export async function getFlashDepositAmount(
  quoter: Quoter,
  ethFromContract: BigNumber,
  sqthToMint: BigNumber,
  clearingPrice: BigNumber,
  limitPrice: BigNumber,
  collat: BigNumber,
  debt: BigNumber,
) {
  console.log('Queue: ', 'Flash deposit amount: ', sqthToMint.toString())
  const excessEth = ethFromContract.add(sqthToMint.mul(clearingPrice.sub(limitPrice)).div(BIG_ONE))
  if (excessEth.lt(BigNumber.from(5 * 1e14))) return BIG_ZERO

  const ethToBorrow = await getETHToBorrow(quoter, excessEth, collat, debt)
  console.log('Queue: ', 'Excess ETH', excessEth.toString(), ' Eth to borrow', ethToBorrow.toString())

  return ethToBorrow.add(excessEth)
}

async function getETHToBorrow(quoter: Quoter, ethToDeposit: BigNumber, collat: BigNumber, debt: BigNumber) {
  let ethToBorrow = BIG_ZERO

  let start = BigNumber.from(250) // .25
  let end = BigNumber.from(3000) // 3
  const deviationExpected = BigNumber.from(1) // .01 %

  while (start.lte(end)) {
    const middle = start.add(end).div(2)
    const ethBorrow = ethToDeposit.mul(middle).div(1000)
    if (ethToBorrow.eq(ethBorrow)) {
      break
    } else {
      ethToBorrow = ethBorrow
    }
    console.log(start.toString(), end.toString(), ethBorrow.toString())
    const osqthDebt = ethToDeposit.add(ethToBorrow).mul(debt).div(collat)
    const _amountOut = await convertSqthToEth(quoter, osqthDebt, DEFAULT_SLIPPAGE)
    if (ethToBorrow.gt(_amountOut)) {
      end = middle
    } else {
      const deviationActual = BigNumber.from(10000).sub(_amountOut.mul(10000).div(ethToBorrow))
      if (deviationActual.isZero() || deviationActual.eq(deviationExpected)) {
        break
      } else {
        start = middle
      }
    }
  }

  return ethToBorrow
}

export async function getActualDepositAmount(
  quoter: Quoter,
  totalUSDCToDeposit: BigNumber,
  auctionOsqthAmt: BigNumber,
  neededOsqthAmt: BigNumber,
  vault: Vault,
  oSqthPrice: BigNumber,
) {
  if (auctionOsqthAmt.gte(neededOsqthAmt)) {
    return { totalUSDCToDeposit, sqthToMint: neededOsqthAmt }
  } else {
    const totalDeposit = auctionOsqthAmt.mul(vault.collateral).div(vault.shortAmount)
    const depositsQdInETH = totalDeposit
      .mul(BIG_ONE.sub(vault.shortAmount.mul(oSqthPrice).div(vault.collateral)))
      .div(BIG_ONE)
    const _usdAmount = await getUSDCinForEth(quoter, depositsQdInETH)
    console.log('In auctual deposit func', depositsQdInETH.toString())
    // const _usdAmount = totalUSDCToDeposit.mul(auctionOsqthAmt).div(neededOsqthAmt)
    return { totalUSDCToDeposit: _usdAmount, sqthToMint: auctionOsqthAmt }
  }
}

export async function getTotalWithdraws(
  crabAmount: BigNumber,
  vault: Vault,
  supply: BigNumber,
  clearingPrice: BigNumber,
  quoter: Quoter,
) {
  const debt = getWsqueethFromCrabAmount(crabAmount, vault, supply)
  const collat = crabAmount.mul(vault.collateral).div(supply)

  const equityInEth = collat.sub(wmul(debt, clearingPrice))
  const minUSDC = await convertWETHToEth(quoter, equityInEth)

  return { equityInEth, minUSDC }
}
