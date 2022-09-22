import { TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { ethers } from 'ethersv5'
import { useMemo, useState } from 'react'
import { useContract, useContractWrite, useSigner } from 'wagmi'
import PrimaryButton from '../../../components/button/PrimaryButton'
import { CRAB_OTC, CRAB_STRATEGY_V2 } from '../../../constants/address'
import { CRAB_OTC_CONTRACT} from '../../../constants/contracts'
import { GENERAL } from '../../../constants/message'
import { BIG_ONE, BIG_ZERO } from '../../../constants/numbers'
import useAccountStore from '../../../store/accountStore'
import { useCrabOTCStore } from '../../../store/crabOTCStore'
import useCrabV2Store from '../../../store/crabV2Store'
import usePriceStore from '../../../store/priceStore'
import { CrabOTC, CrabOTCBid, CrabOTCOrder, CrabOtcType, MessageWithTimeSignature } from '../../../types'
import { CrabOtc, CrabStrategyV2 } from '../../../types/contracts'
import { signMessageWithTime } from '../../../utils/auction'
import { convertBigNumber, formatBigNumber, toBigNumber, wdiv, wmul } from '../../../utils/math'
import crabOtc from '../../../abis/crabOtc.json'
import crabV2 from '../../../abis/crabStrategyV2.json'

export const CrabOTCBox: React.FC = () => {
  const userOTCs = useCrabOTCStore(s => s.userOTCs)
  const { data: signer } = useSigner()

  const crabOtcContract = useContract<CrabOtc>({
    addressOrName: CRAB_OTC,
    contractInterface: crabOtc,
    signerOrProvider: signer,
  })

  const crabV2Contract = useContract<CrabStrategyV2>({
    addressOrName: CRAB_STRATEGY_V2,
    contractInterface: crabV2,
    signerOrProvider: signer,
  })

  const { data: hedgeTx, writeAsync: deposit } = useContractWrite({
    ...CRAB_OTC_CONTRACT,
    functionName: 'deposit',
    args: [],
    overrides: {
      value: BIG_ONE,
    },
  })

  const depositCrab = async (bid: CrabOTCBid, crabOtc: CrabOTC) => {
    const _qty = toBigNumber(crabOtc.quantity || 0)
    const _price = toBigNumber(crabOtc.limitPrice || 0)

    const { r, s, v } = ethers.utils.splitSignature(bid.signature)

    const order = {
      ...bid.order,
      r,
      s,
      v,
    }

    const [,,collateral, debt] = await crabV2Contract.getVaultDetails();
    const total_deposit = wdiv(wmul(_qty, collateral), debt); 

    const estimatedGas = await crabOtcContract.estimateGas.deposit(total_deposit, _price, order, { value: toBigNumber(crabOtc.depositAmount) })
    const estimatedGasCeil = Math.ceil(estimatedGas.toNumber() * 1.1)
    await crabOtcContract.deposit(total_deposit, _price, order, { value: toBigNumber(crabOtc.depositAmount), gasLimit: estimatedGasCeil })

    // const tx = await deposit({
    //   args: [_qty, _price, order],
    //   overrides: {
    //     value: BIG_ONE,
    //   },
    // })
  }

  return (
    <Box>
      {userOTCs.map(otc => (
        <Box key={otc.id} mt={1}>
          <Typography>
            ID: {otc.id} --- QTY:{otc.quantity} --- limit price:{otc.limitPrice}
          </Typography>
          <Typography>Bids:</Typography>
          <Box ml={2}>
            {Object.keys(otc.bids).map(bidId => (
              <Box key={bidId}>
                <Typography>
                  Trader: {otc.bids[bidId].order.trader} - Qty: {otc.bids[bidId].order.quantity} - Price:{' '}
                  {otc.bids[bidId].order.price}
                </Typography>
                <PrimaryButton onClick={() => depositCrab(otc.bids[bidId], otc)}>Deposit</PrimaryButton>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
      <CreateDeposit />
      <Withdraw />
    </Box>
  )
}

const Withdraw: React.FC = () => {
  const { data: signer } = useSigner()
  const address = useAccountStore(s => s.address)

  const crabV2Contract = useContract<CrabStrategyV2>({
    addressOrName: CRAB_STRATEGY_V2,
    contractInterface: crabV2,
    signerOrProvider: signer,
  })

  const getBalance = async () => {
    if(address){
      const balance = await crabV2Contract.balanceOf(address);
      console.log(balance);
    }
  }

  return (
    <PrimaryButton>Withdraw</PrimaryButton>
  )
}

const CreateDeposit: React.FC = () => {
  const [ethAmount, setEthAmount] = useState('0')
  const [limitPrice, setLimitPrice] = useState('0')
  const vault = useCrabV2Store(s => s.vault)
  const oSqthPrice = usePriceStore(s => s.oSqthPrice)
  const address = useAccountStore(s => s.address)
  const { data: signer } = useSigner()

  const sqthToMint = useMemo(() => {
    if (!vault) return BIG_ZERO

    const _ethAmount = toBigNumber(ethAmount, 18)
    const _limitPrice = toBigNumber(limitPrice, 18)
    const debt = vault.shortAmount
    const collat = vault.collateral
    const cr0 = wdiv(debt, collat)
    const oSqthToMint = wdiv(
      debt.sub(wmul(cr0, collat)).sub(wmul(cr0, _ethAmount)),
      wmul(cr0, _limitPrice).sub(BIG_ONE),
    )

    return oSqthToMint
  }, [ethAmount, limitPrice, vault])

  const createOtcOrder = async () => {
    const mandate: MessageWithTimeSignature = {
      message: GENERAL,
      time: Date.now(),
    }

    const signature = await signMessageWithTime(signer, mandate)

    const crabOTC: CrabOTC = {
      depositAmount: parseFloat(ethAmount),
      createdBy: address!,
      expiry: Date.now() + 600000,
      limitPrice: parseFloat(limitPrice),
      quantity: convertBigNumber(sqthToMint),
      type: CrabOtcType.DEPOSIT,
      bids: {},
    }

    const resp = await fetch('/api/crabotc/createOrUpdateOTC?web=true', {
      method: 'POST',
      body: JSON.stringify({ signature, crabOTC, mandate }),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return (
    <Box display="flex" flexDirection="column" width={300} mt={4}>
      <Typography>Create deposit</Typography>
      <TextField
        value={ethAmount}
        onChange={e => setEthAmount(e.target.value)}
        type="number"
        id="eth"
        label="ETH Amount"
        variant="outlined"
        size="small"
        sx={{ mt: 4 }}
        onWheel={e => (e.target as any).blur()}
      />
      <TextField
        value={limitPrice}
        onChange={e => setLimitPrice(e.target.value)}
        type="number"
        id="limit price"
        label="Limit price"
        variant="outlined"
        size="small"
        sx={{ mt: 4 }}
        onWheel={e => (e.target as any).blur()}
      />
      <Typography mt={2}>oSqth Price: {formatBigNumber(oSqthPrice)} ETH</Typography>
      <Typography mt={2} mb={2}>
        oSQTH to sell: {formatBigNumber(sqthToMint)}
      </Typography>
      <PrimaryButton onClick={createOtcOrder}>Create Deposit OTC</PrimaryButton>
    </Box>
  )
}
