import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Box } from '@mui/system'
import { ethers } from 'ethersv5'
import { useMemo, useState, useEffect } from 'react'
import { useContract, useContractWrite, useSigner } from 'wagmi'
import PrimaryButton from '../../../components/button/PrimaryButton'
import { CRAB_OTC, CRAB_STRATEGY_V2 } from '../../../constants/address'
import { CRAB_OTC_CONTRACT } from '../../../constants/contracts'
import { GENERAL } from '../../../constants/message'
import { BIG_ONE, BIG_ZERO, ZERO } from '../../../constants/numbers'
import useAccountStore from '../../../store/accountStore'
import { useCrabOTCStore } from '../../../store/crabOTCStore'
import useCrabV2Store from '../../../store/crabV2Store'
import usePriceStore from '../../../store/priceStore'
import { CrabOTCBid, CrabOTCData, CrabOtcType, CrabOTCWithData, MessageWithTimeSignature } from '../../../types'
import { CrabOtc, CrabStrategyV2 } from '../../../types/contracts'
import { signMessageWithTime } from '../../../utils/auction'
import { convertBigNumber, formatBigNumber, toBigNumber, wdiv, wmul } from '../../../utils/math'
import crabOtc from '../../../abis/crabOtc.json'
import crabV2 from '../../../abis/crabStrategyV2.json'
import shallow from 'zustand/shallow'
import ApprovalsOtc from '../Auction/ApprovalsOtc'
import DangerButton from '../../../components/button/DangerButton'

export const CrabOTCBox: React.FC = () => {
  const { data: signer } = useSigner()

  const { data: hedgeTx, writeAsync: deposit } = useContractWrite({
    ...CRAB_OTC_CONTRACT,
    functionName: 'deposit',
    args: [],
    overrides: {
      value: BIG_ONE,
    },
  })

  return (
    <Box pb={8}>
      <Typography variant="h6" sx={{ textAlign: { xs: 'center', sm: 'left' } }} mb={1}>
        Token Approvals
      </Typography>
      <Box>
        <ApprovalsOtc />
      </Box>

      {/* {userOTCs.map(otc => (
        <Box key={otc.id} mt={5}>
          <Typography>
            ID: {otc.id} --- QTY:{otc.data.quantity} --- limit price:{otc.data.limitPrice}
          </Typography>
          <Typography>Bids:</Typography>
          <Box ml={2}>
            {Object.keys(otc.data.bids).map(bidId => (
              <Box key={bidId}>
                <Typography>
                  Trader: {otc.data.bids[bidId].order.trader} - Qty: {otc.data.bids[bidId].order.quantity} - Price:{' '}
                  {otc.data.bids[bidId].order.price}
                </Typography>
                {otc.data.type == CrabOtcType.DEPOSIT ? (
                  <PrimaryButton onClick={() => depositCrab(otc.data.bids[bidId], otc)}>Deposit</PrimaryButton>
                ) : (
                  <PrimaryButton onClick={() => withdrawCrab(otc.data.bids[bidId], otc)}>Withdraw</PrimaryButton>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      ))} */}
      <Grid container gap={2} mt={2}>
        <Grid item xs={12} md={12} lg={5} bgcolor="background.overlayDark" borderRadius={2}>
          <CreateDeposit />
        </Grid>
        <Grid item xs={12} md={12} lg={5} bgcolor="background.overlayDark" px={4} borderRadius={2}>
          <Withdraw />
        </Grid>
      </Grid>
    </Box>
  )
}

const Withdraw: React.FC = () => {
  const { data: signer } = useSigner()
  const address = useAccountStore(s => s.address)
  const { ethPrice } = usePriceStore(s => ({ ethPrice: s.ethPrice }), shallow)
  const [withdrawAmount, setWithdrawAmount] = useState('0.0')
  const [limitPrice, setLimitPrice] = useState('0.0')
  const [osqthToBuy, setosqthToBuy] = useState(BIG_ZERO)
  const [crabBalance, setcrabBalance] = useState(BIG_ZERO)

  const crabV2Contract = useContract<CrabStrategyV2>({
    addressOrName: CRAB_STRATEGY_V2,
    contractInterface: crabV2,
    signerOrProvider: signer,
  })

  const getUserCrabBalance = async (userAddress: string) => {
    if (!userAddress || !signer) return BIG_ZERO
    const amount = await crabV2Contract.balanceOf(userAddress)
    return amount
  }

  const getOsqthToBuy = async (shares: string) => {
    const amount = await crabV2Contract.getWsqueethFromCrabAmount(toBigNumber(shares))
    return amount
  }

  useMemo(() => {
    let active = true
    load()
    return () => {
      active = false
    }

    async function load() {
      if (withdrawAmount != '0.0') {
        const amount = await getOsqthToBuy(withdrawAmount)
        if (!active) {
          return
        }
        setosqthToBuy(amount)
      }

      if (address) {
        const amount = await getUserCrabBalance(address)
        if (!active) {
          return
        }
        setcrabBalance(amount)
      }
    }
  }, [withdrawAmount, address])

  const sharesError = useMemo(() => {
    if (convertBigNumber(crabBalance) == 0) {
      return 'You do not have any crab shares'
    } else if (convertBigNumber(crabBalance) < Number(withdrawAmount)) {
      return 'You do not have enough crab shares'
    }
  }, [crabBalance, withdrawAmount])

  const withdrawError = sharesError

  const createOtcOrder = async () => {
    const mandate: MessageWithTimeSignature = {
      message: GENERAL,
      time: Date.now(),
    }

    const signature = await signMessageWithTime(signer, mandate)

    const crabOTCData: CrabOTCData = {
      depositAmount: 0,
      withdrawAmount: parseFloat(withdrawAmount),
      expiry: Date.now() + 600000,
      limitPrice: parseFloat(limitPrice),
      quantity: osqthToBuy.toString(),
      type: CrabOtcType.WITHDRAW,
      bids: {},
      createdBy: address!,
    }

    const crabOTC: CrabOTCWithData = {
      cid: '',
      createdBy: address!,
      data: crabOTCData,
    }

    const resp = await fetch('/api/crabotc/createOrUpdateOTC?web=true', {
      method: 'POST',
      body: JSON.stringify({ signature, crabOTC, mandate }),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const crabOtcContract = useContract<CrabOtc>({
    addressOrName: CRAB_OTC,
    contractInterface: crabOtc,
    signerOrProvider: signer,
  })

  const withdrawCrab = async (bid: CrabOTCBid, crabOtc: CrabOTCWithData) => {
    const _price = toBigNumber(crabOtc.data.limitPrice || 0)

    const { r, s, v } = ethers.utils.splitSignature(bid.signature)

    const order = {
      ...bid.order,
      r,
      s,
      v,
    }
    await crabOtcContract.withdraw(toBigNumber(crabOtc.data.withdrawAmount), _price, order, { gasLimit: 514958 })
  }

  return (
    <Box display="flex" flexDirection="column" width={300} mt={4}>
      <Typography>Withdraw</Typography>
      <Typography variant="body2" color="textSecondary" mt={2}>
        Crab Balance: {convertBigNumber(crabBalance)}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Eth/Usd Price: {convertBigNumber(ethPrice)}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        USD Value: {convertBigNumber(ethPrice) * convertBigNumber(crabBalance)}
      </Typography>

      <TextField
        value={withdrawAmount}
        onChange={e => setWithdrawAmount(e.target.value)}
        type="number"
        id="crab"
        label="Crab Amount to Withdraw"
        variant="outlined"
        size="small"
        sx={{ mt: 4 }}
        onWheel={e => (e.target as any).blur()}
      />

      <Box display="flex" mt={1} justifyContent="space-between">
        <Typography variant="body2" color="textSecondary">
          Osqth to Buy: {convertBigNumber(osqthToBuy)}
        </Typography>
      </Box>

      <TextField
        value={limitPrice}
        onChange={e => setLimitPrice(e.target.value)}
        type="number"
        id="limit price"
        label="Max Limit Price (Eth)"
        variant="outlined"
        size="small"
        sx={{ mt: 4, mb: 2 }}
        onWheel={e => (e.target as any).blur()}
      />

      <Typography style={{ whiteSpace: 'pre-line' }} mt={2} mb={2} color="error.main" variant="body3">
        {withdrawAmount ? withdrawError : ''}
      </Typography>
      <br />

      <PrimaryButton onClick={createOtcOrder}>Create Withdraw OTC</PrimaryButton>
    </Box>
  )
}

const CreateDeposit: React.FC = () => {
  const userOtc = useCrabOTCStore(s => s.userOTC)
  const [ethAmount, setEthAmount] = useState(userOtc?.data.depositAmount.toString() || '0')
  const [limitPrice, setLimitPrice] = useState(userOtc?.data.limitPrice.toString() || '0')
  const vault = useCrabV2Store(s => s.vault)
  const oSqthPrice = usePriceStore(s => s.oSqthPrice)
  const address = useAccountStore(s => s.address)
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

  useEffect(() => {
    if (!userOtc) {
      setEthAmount('0')
      setLimitPrice('0')
    }
  }, [userOtc])

  const isEdit = !!userOtc

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

    const crabOTCData: CrabOTCData = {
      depositAmount: parseFloat(ethAmount),
      withdrawAmount: 0,
      createdBy: address!,
      expiry: Date.now() + 600000,
      limitPrice: parseFloat(limitPrice),
      quantity: sqthToMint.toString(),
      type: CrabOtcType.DEPOSIT,
      bids: {},
    }

    const crabOTC: CrabOTCWithData = {
      cid: '',
      createdBy: address!,
      data: crabOTCData,
      tx: '',
    }

    const resp = await fetch('/api/crabotc/createOrUpdateOTC?web=true', {
      method: 'POST',
      body: JSON.stringify({ signature, crabOTC, mandate }),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const deleteOTCOrder = async () => {
    const mandate: MessageWithTimeSignature = {
      message: GENERAL,
      time: Date.now(),
    }

    const signature = await signMessageWithTime(signer, mandate)

    const resp = await fetch('/api/crabotc/deleteOTC?web=true', {
      method: 'DELETE',
      body: JSON.stringify({ signature, id: userOtc?.id, mandate }),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const depositCrab = async (bid: CrabOTCBid, crabOtc: CrabOTCWithData) => {
    const _qty = crabOtc.data?.quantity ? crabOtc?.data.quantity : '0'
    const _price = toBigNumber(crabOtc.data.limitPrice || 0)

    const { r, s, v } = ethers.utils.splitSignature(bid.signature)

    const order = {
      ...bid.order,
      r,
      s,
      v,
    }

    const [, , collateral, debt] = await crabV2Contract.getVaultDetails()
    const total_deposit = wdiv(wmul(_qty, collateral), debt)

    console.log(total_deposit.toString(), _price.toString())

    const estimatedGas = await crabOtcContract.estimateGas.deposit(total_deposit, _price, order, {
      value: toBigNumber(crabOtc.data.depositAmount),
    })
    const estimatedGasCeil = Math.ceil(estimatedGas.toNumber() * 1.1)
    await crabOtcContract.deposit(total_deposit, _price, order, {
      value: toBigNumber(crabOtc.data.depositAmount),
      gasLimit: estimatedGasCeil,
    })
  }

  return (
    <Box display="flex" flexDirection="column" mt={4} px={2}>
      <Box display="flex" flexDirection="column" width={300} margin="auto">
        <Typography variant="h6" align="center" mt={2}>
          {isEdit ? 'Edit deposit' : 'Create deposit'}
        </Typography>
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
          label="Min Limit price (ETH)"
          variant="outlined"
          size="small"
          sx={{ mt: 2 }}
          onWheel={e => (e.target as any).blur()}
        />
        <Typography mt={2}>oSqth Price: {formatBigNumber(oSqthPrice)} ETH</Typography>
        <Typography mt={2} mb={2}>
          oSQTH to sell: {formatBigNumber(sqthToMint)}
        </Typography>
        <Typography>ID: {userOtc?.id}</Typography>
        <PrimaryButton sx={{ width: 300, mt: 2 }} onClick={createOtcOrder}>
          {isEdit ? 'Edit deposit OTC' : 'Create deposit OTC'}
        </PrimaryButton>
        {isEdit ? (
          <DangerButton sx={{ width: 300, mt: 2 }} onClick={deleteOTCOrder}>
            Cancel Order
          </DangerButton>
        ) : null}
      </Box>

      {userOtc ? (
        <>
          <Typography mt={4} textAlign="center">
            Bids
          </Typography>
          <TableContainer sx={{ bgcolor: 'background.overlayDark', borderRadius: 2 }}>
            <Table sx={{ minWidth: 500 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Price (ETH)</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(userOtc?.data.bids).map(bidId => (
                  <TableRow key={bidId}>
                    <TableCell component="th" scope="row">
                      {formatBigNumber(userOtc?.data.bids[bidId].order.quantity)}
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {formatBigNumber(userOtc?.data.bids[bidId].order.price, 18, 6)}
                    </TableCell>
                    <TableCell component="th" scope="row">
                      <PrimaryButton
                        sx={{ width: 100 }}
                        size="small"
                        onClick={() => depositCrab(userOtc?.data.bids[bidId], userOtc)}
                      >
                        Execute
                      </PrimaryButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box></Box>
        </>
      ) : null}
    </Box>
  )
}
