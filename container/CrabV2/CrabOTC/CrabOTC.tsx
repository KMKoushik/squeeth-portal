import {
  Grid,
  IconButton,
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
import React, { useMemo, useState, useEffect } from 'react'
import { useBalance, useContract, useSigner } from 'wagmi'
import { BoxLoadingButton } from '../../../components/button/PrimaryButton'
import { CRAB_OTC, CRAB_STRATEGY_V2 } from '../../../constants/address'
import { GENERAL } from '../../../constants/message'
import { BIG_ONE, BIG_ZERO } from '../../../constants/numbers'
import useAccountStore from '../../../store/accountStore'
import { useCrabOTCStore } from '../../../store/crabOTCStore'
import useCrabV2Store from '../../../store/crabV2Store'
import usePriceStore from '../../../store/priceStore'
import { CrabOTCBid, CrabOTCData, CrabOtcType, CrabOTCWithData, MessageWithTimeSignature } from '../../../types'
import { CrabOtc, CrabStrategyV2 } from '../../../types/contracts'
import { signMessageWithTime } from '../../../utils/auction'
import { convertBigNumber, formatBigNumber, toBigNumber, wdiv, wmul, cwmul } from '../../../utils/math'
import crabOtc from '../../../abis/crabOtc.json'
import crabV2 from '../../../abis/crabStrategyV2.json'
import shallow from 'zustand/shallow'
import ApprovalsOtc from '../Auction/ApprovalsOtc'
import DangerButton from '../../../components/button/DangerButton'
import useCopyToClipboard from '../../../hooks/useCopyToClipboard'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { Expiry } from '../../CrabOTC/Expiry'
import useToaster from '../../../hooks/useToaster'
import { validateOrder } from '../../../utils/crabotc'
import { OTCInfo } from './OTCInfo'

export const CrabOTCBox: React.FC = () => {
  const { data: signer } = useSigner()
  const crabBalance = useAccountStore(s => s.crabBalance)

  return (
    <Box pb={8}>
      <Typography variant="h6" sx={{ textAlign: { xs: 'center', sm: 'left' } }} mb={1}>
        Token Approvals
      </Typography>
      <Box>
        <ApprovalsOtc />
      </Box>
      <Box mt={2} maxWidth={600}>
        <OTCInfo />
      </Box>
      <Grid container gap={2} mt={2}>
        <Grid item xs={12} md={12} lg={5} bgcolor="background.overlayDark" borderRadius={2}>
          <CreateDeposit />
        </Grid>
        {convertBigNumber(crabBalance) > 0 && (
          <Grid item xs={12} md={12} lg={5} bgcolor="background.overlayDark" px={4} borderRadius={2}>
            <Withdraw />
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

const Withdraw: React.FC = () => {
  const userOtc = useCrabOTCStore(s => s.userOTC)
  const { data: signer } = useSigner()
  const { oSqthPrice } = usePriceStore(s => ({ oSqthPrice: s.oSqthPrice }), shallow)
  const [withdrawAmount, setWithdrawAmount] = useState(userOtc?.data.withdrawAmount || '0')
  const [limitPrice, setLimitPrice] = useState(userOtc?.data.limitPrice || '0')
  const [osqthToBuy, setosqthToBuy] = useState(BIG_ZERO)
  const { address, crabBalance } = useAccountStore(s => ({ address: s.address, crabBalance: s.crabBalance }), shallow)
  const [isLoading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [withdrawLoading, setWithdrawLoading] = useState(0)
  const crabApprovalOtc = useCrabV2Store(s => s.crabApprovalOtc)
  const [withdrawValidationError, setWithdrawValidationError] = useState('')

  const showToast = useToaster()

  const isEdit = !!userOtc && userOtc.data.type === CrabOtcType.WITHDRAW

  const crabV2Contract = useContract<CrabStrategyV2>({
    addressOrName: CRAB_STRATEGY_V2,
    contractInterface: crabV2,
    signerOrProvider: signer,
  })

  useEffect(() => {
    if (!userOtc) {
      setWithdrawAmount('0')
      setLimitPrice('0')
    }
  }, [userOtc])

  useEffect(() => {
    if (signer)
      crabV2Contract.getWsqueethFromCrabAmount(toBigNumber(withdrawAmount || 0)).then(amt => {
        setosqthToBuy(amt)
      })
  }, [crabV2Contract, withdrawAmount])

  const sharesError = useMemo(() => {
    if (convertBigNumber(crabBalance) == 0) {
      return 'You do not have any crab shares'
    } else if (convertBigNumber(crabBalance) < Number(withdrawAmount)) {
      return 'You do not have enough crab shares'
    }
  }, [crabBalance, withdrawAmount])

  const approvalsError = useMemo(() => {
    if (crabApprovalOtc.lt(toBigNumber(withdrawAmount.toString() || 0))) {
      return 'Approve crab token from the top section'
    }
  }, [crabApprovalOtc, withdrawAmount])

  const withdrawError = sharesError || approvalsError

  const createOtcOrder = async () => {
    setLoading(true)
    try {
      const mandate: MessageWithTimeSignature = {
        message: GENERAL,
        time: Date.now(),
      }

      const signature = await signMessageWithTime(signer, mandate)

      const crabOTCData: CrabOTCData = {
        depositAmount: 0,
        withdrawAmount: parseFloat(withdrawAmount.toString()),
        expiry: Date.now() + 1200000,
        limitPrice: parseFloat(limitPrice.toString()),
        quantity: osqthToBuy.toString(),
        type: CrabOtcType.WITHDRAW,
        bids: {},
        createdBy: address!,
        sortedBids: [],
      }

      const crabOTC: CrabOTCWithData = {
        cid: '',
        createdBy: address!,
        data: crabOTCData,
        tx: '',
        id: isEdit ? userOtc.id : '',
      }

      const resp = await fetch('/api/crabotc/createOrUpdateOTC?web=true', {
        method: 'POST',
        body: JSON.stringify({ signature, crabOTC, mandate }),
        headers: { 'Content-Type': 'application/json' },
      })

      showToast(resp)
    } catch (e) {
      console.log(e)
    }
    setWithdrawValidationError('')
    setLoading(false)
  }

  const crabOtcContract = useContract<CrabOtc>({
    addressOrName: CRAB_OTC,
    contractInterface: crabOtc,
    signerOrProvider: signer,
  })

  const withdrawCrab = async (bid: CrabOTCBid, crabOtc: CrabOTCWithData, bidId: number) => {
    setWithdrawLoading(bidId)
    const { isValidOrder, response: error } = await validateOrder(bid, crabOtc, bidId)

    if (!isValidOrder) {
      setWithdrawValidationError(error)
    } else {
      try {
        const mandate: MessageWithTimeSignature = {
          message: GENERAL,
          time: Date.now(),
        }

        const signature = await signMessageWithTime(signer, mandate)
        const _price = toBigNumber(crabOtc.data.limitPrice || 0)

        const { r, s, v } = ethers.utils.splitSignature(bid.signature)

        const order = {
          ...bid.order,
          r,
          s,
          v,
        }

        const estimatedGas = await crabOtcContract.estimateGas.withdraw(
          toBigNumber(crabOtc.data.withdrawAmount),
          _price,
          order,
        )
        const estimatedGasCeil = Math.ceil(estimatedGas.toNumber() * 1.25)

        const tx = await crabOtcContract.withdraw(toBigNumber(crabOtc.data.withdrawAmount), _price, order, {
          gasLimit: estimatedGasCeil,
        })

        await tx.wait()
        const completedOtc: CrabOTCWithData = {
          ...crabOtc,
          tx: tx.hash,
          usedBid: `${bid.order.trader}-${bid.order.nonce}`,
        }

        const resp = await fetch('/api/crabotc/createOrUpdateOTC?web=true', {
          method: 'POST',
          body: JSON.stringify({ signature, crabOTC: completedOtc, mandate }),
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (e) {
        console.log(e)
      }
    }
    setWithdrawLoading(0)
  }

  const deleteOTCOrder = async () => {
    setDeleteLoading(true)
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

    showToast(resp)
    setDeleteLoading(false)
    setWithdrawValidationError('')
  }

  return (
    <Box display="flex" flexDirection="column" mt={4} px={2}>
      <Box display="flex" flexDirection="column" width={300} margin="auto">
        <Typography></Typography>
        <Typography variant="h6" align="center" mt={2}>
          {isEdit ? 'Edit Withdraw' : 'Create Withdraw'}
        </Typography>
        <Typography variant="body2" color="textSecondary" mt={2}>
          Crab Balance: {formatBigNumber(crabBalance)}
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

        <TextField
          value={limitPrice}
          onChange={e => setLimitPrice(e.target.value)}
          type="number"
          id="limit price"
          label="Max Limit Price per oSqth (ETH)"
          variant="outlined"
          size="small"
          sx={{ mt: 2 }}
          onWheel={e => (e.target as any).blur()}
        />
        <Box display="flex" mt={1} justifyContent="space-between">
          <Typography variant="body3">Osqth to Buy</Typography>
          <Typography variant="body2" color="textSecondary">
            <Typography color="textPrimary" component="span" variant="numeric">
              {formatBigNumber(osqthToBuy)}
            </Typography>{' '}
            oSQTH
          </Typography>
        </Box>
        <Box display="flex" mt={1} justifyContent="space-between">
          <Typography variant="body3">Slippage</Typography>
          <Typography variant="body2" color="textSecondary">
            <Typography color="textPrimary" component="span" variant="numeric">
              {oSqthPrice.gt(0) && Number(limitPrice) > 0
                ? formatBigNumber(wdiv(toBigNumber(limitPrice), oSqthPrice).sub(BIG_ONE).mul(100))
                : 0}
            </Typography>{' '}
            %
          </Typography>
        </Box>
        <CopyLink id={userOtc?.id || ''} />
        <Expiry time={userOtc?.data.expiry || 0} />

        <BoxLoadingButton
          onClick={createOtcOrder}
          sx={{ width: 300, mt: 2, mb: 2 }}
          loading={isLoading}
          disabled={!(Number(withdrawAmount) > 0 && Number(limitPrice) > 0 && !withdrawError)}
        >
          {isEdit ? 'Edit' : 'Create'} Withdraw OTC
        </BoxLoadingButton>
        {isEdit ? (
          <DangerButton sx={{ width: 300 }} onClick={deleteOTCOrder} loading={deleteLoading}>
            Cancel Order
          </DangerButton>
        ) : null}
        {withdrawLoading ? (
          <Typography mt={2} textAlign="center">
            Please don&apos;t close the tab
          </Typography>
        ) : null}
        <Typography style={{ whiteSpace: 'pre-line' }} mt={2} mb={2} color="error.main" variant="body3">
          {withdrawAmount ? withdrawError : ''}
        </Typography>
      </Box>
      {isEdit ? (
        <>
          <Typography variant="h6" align="center" mt={2}>
            Bids
          </Typography>
          <Typography
            style={{ whiteSpace: 'pre-line' }}
            align="center"
            mt={2}
            mb={2}
            color="error.main"
            variant="body3"
          >
            {withdrawValidationError ? withdrawValidationError : ''}
          </Typography>
          <TableContainer sx={{ bgcolor: 'background.overlayDark', borderRadius: 2 }}>
            <Table sx={{ minWidth: 500 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Id</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Price (ETH)</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(userOtc?.data.sortedBids).map(bidId => (
                  <TableRow key={Number(bidId)}>
                    <TableCell component="th" scope="row">
                      {Number(bidId) + 1}
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {formatBigNumber(userOtc?.data.sortedBids[Number(bidId)].order.quantity)}
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {formatBigNumber(userOtc?.data.sortedBids[Number(bidId)].order.price, 18, 6)}
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {Date.now() < userOtc?.data.sortedBids[Number(bidId)].order.expiry &&
                        Date.now() < userOtc?.data.expiry ? (
                        <BoxLoadingButton
                          sx={{ width: 100 }}
                          size="small"
                          onClick={() =>
                            withdrawCrab(userOtc?.data.sortedBids[Number(bidId)], userOtc, Number(bidId) + 1)
                          }
                          loading={withdrawLoading === Number(bidId) + 1}
                        >
                          Sign and Execute
                        </BoxLoadingButton>
                      ) : (
                        <Typography mt={2} color="error.main">
                          Expired
                        </Typography>
                      )}
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

const CreateDeposit: React.FC = () => {
  const userOtc = useCrabOTCStore(s => s.userOTC)
  const [ethAmount, setEthAmount] = useState(userOtc?.data.depositAmount.toString() || '0')
  const [limitPrice, setLimitPrice] = useState(userOtc?.data.limitPrice.toString() || '0')
  const vault = useCrabV2Store(s => s.vault)
  const oSqthPrice = usePriceStore(s => s.oSqthPrice)
  const address = useAccountStore(s => s.address)
  const { data: signer } = useSigner()
  const [isLoading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [isDepositCrabLoading, setDepositCrabLoading] = useState(0)
  const [depositValidationError, setDepositValidationError] = useState('')

  const showMessageFromServer = useToaster()

  const { data: ethBalance } = useBalance({
    addressOrName: address,
  })

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
    } else {
      setEthAmount(userOtc?.data.depositAmount.toString())
      setLimitPrice(userOtc?.data.limitPrice.toString())
    }
  }, [userOtc])

  const isEdit = !!userOtc && userOtc.data.type === CrabOtcType.DEPOSIT

  const [sqthToMint, tot_dep] = useMemo(() => {
    if (!vault) return [BIG_ZERO, BIG_ZERO]

    const _ethAmount = toBigNumber(ethAmount || '0', 18)
    const _limitPrice = toBigNumber(limitPrice || '0', 18)
    const debt = vault.shortAmount
    const collat = vault.collateral

    // totalDeposit = userEth / (1-(debt*oSQTHPx / collateral))
    const totalDeposit = wdiv(_ethAmount, BIG_ONE.sub(wdiv(wmul(debt, _limitPrice), collat)))

    if (_limitPrice.gt(0)) {
      const start = totalDeposit

      const mth = (decrease: number) => {
        const tot_dep = start.sub(decrease)
        const to_mint = wdiv(cwmul(tot_dep, debt), collat)
        const from_selling = wmul(to_mint, _limitPrice)
        const trade_value = _ethAmount.add(from_selling)
        return [tot_dep, to_mint, trade_value]
      }
      for (let i = 0; i < 1000; i++) {
        console.log(i)
        const [tot_dep, to_mint, trade_value] = mth(i*100)
        if (trade_value.gte(tot_dep)) {
          console.log(tot_dep.toString(), to_mint.toString(), trade_value.toString(), i)
          return [to_mint, tot_dep]
        }
      }
      throw 'Unable to find oSQTH to mint'
    }
    return [BIG_ZERO, BIG_ZERO]
  }, [ethAmount, limitPrice, vault])

  const balanceError = useMemo(() => {
    if (convertBigNumber(ethBalance?.value || '0') == 0) {
      return 'You do not have any ETH...You need to ETH to mint required oSQTH'
    } else if (convertBigNumber(ethBalance?.value || '0') < Number(ethAmount)) {
      return 'You do not have enough ETH needed to mint required oSQTH to sell'
    }
  }, [ethBalance, ethAmount])

  const depositError = balanceError 

  const createOtcOrder = async () => {
    setLoading(true)
    try {
      const mandate: MessageWithTimeSignature = {
        message: GENERAL,
        time: Date.now(),
      }

      const signature = await signMessageWithTime(signer, mandate)

      const crabOTCData: CrabOTCData = {
        depositAmount: parseFloat(ethAmount),
        withdrawAmount: 0,
        createdBy: address!,
        expiry: Date.now() + 1200000,
        limitPrice: parseFloat(limitPrice),
        quantity: sqthToMint.toString(),
        type: CrabOtcType.DEPOSIT,
        bids: {},
        sortedBids: [],
      }

      const crabOTC: CrabOTCWithData = {
        cid: '',
        createdBy: address!,
        data: crabOTCData,
        tx: '',
        id: isEdit ? userOtc.id : '',
      }

      const resp = await fetch('/api/crabotc/createOrUpdateOTC?web=true', {
        method: 'POST',
        body: JSON.stringify({ signature, crabOTC, mandate }),
        headers: { 'Content-Type': 'application/json' },
      })
      showMessageFromServer(resp)
    } catch (e) {
      console.log(e)
    }
    setDepositValidationError('')
    setLoading(false)
  }

  const deleteOTCOrder = async () => {
    setDeleteLoading(true)
    try {
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
      showMessageFromServer(resp)
    } catch (e) {
      console.log(e)
    }
    setDeleteLoading(false)
  }

  const depositCrab = async (bid: CrabOTCBid, crabOtc: CrabOTCWithData, bidId: number) => {
    setDepositCrabLoading(bidId)
    const { isValidOrder, response: error } = await validateOrder(bid, crabOtc, bidId)

    if (!isValidOrder) {
      setDepositValidationError(error)
    } else {
      try {
        const mandate: MessageWithTimeSignature = {
          message: GENERAL,
          time: Date.now(),
        }

        const signature = await signMessageWithTime(signer, mandate)
        const _qty = crabOtc.data?.quantity ? crabOtc?.data.quantity : '0'
        const _price = toBigNumber(crabOtc.data.limitPrice || 0)

        const { r, s, v } = ethers.utils.splitSignature(bid.signature)

        const order = {
          ...bid.order,
          r,
          s,
          v,
        }

        const total_deposit = tot_dep

        const estimatedGas = await crabOtcContract.estimateGas.deposit(total_deposit, order, {
          value: toBigNumber(crabOtc.data.depositAmount),
        })
        const estimatedGasCeil = Math.ceil(estimatedGas.toNumber() * 1.25)
        const tx = await crabOtcContract.deposit(total_deposit, order, {
          value: toBigNumber(crabOtc.data.depositAmount),
          gasLimit: estimatedGasCeil,
        })

        await tx.wait()

        const completedOtc: CrabOTCWithData = {
          ...crabOtc,
          tx: tx.hash,
          usedBid: `${bid.order.trader}-${bid.order.nonce}`,
        }

        const resp = await fetch('/api/crabotc/createOrUpdateOTC?web=true', {
          method: 'POST',
          body: JSON.stringify({ signature, crabOTC: completedOtc, mandate }),
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (e) {
        console.log(e)
      }
    }
    setDepositValidationError('')
    setDepositCrabLoading(0)
  }

  return (
    <Box display="flex" flexDirection="column" mt={4} px={2}>
      <Box display="flex" flexDirection="column" width={300} margin="auto">
        <Typography variant="h6" align="center" mt={2}>
          {isEdit ? 'Edit Deposit' : 'Create Deposit'}
        </Typography>
        <Typography variant="body2" color="textSecondary" mt={2}>
          Eth Balance: {formatBigNumber(ethBalance?.value || '0')}
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
          label="Min Limit price per oSqth (ETH)"
          variant="outlined"
          size="small"
          sx={{ mt: 2 }}
          onWheel={e => (e.target as any).blur()}
        />
        <Box display="flex" mt={1} justifyContent="space-between">
          <Typography variant="body3">Osqth to Sell</Typography>
          <Typography variant="body2" color="textSecondary">
            <Typography color="textPrimary" component="span" variant="numeric">
              {formatBigNumber(sqthToMint)}
            </Typography>{' '}
            oSQTH
          </Typography>
        </Box>
        <Box display="flex" mt={1} justifyContent="space-between">
          <Typography variant="body3">Slippage</Typography>
          <Typography variant="body2" color="textSecondary">
            <Typography color="textPrimary" component="span" variant="numeric">
              {oSqthPrice.gt(0) && Number(limitPrice) > 0
                ? formatBigNumber(BIG_ONE.sub(wdiv(toBigNumber(limitPrice), oSqthPrice)).mul(100))
                : 0}
            </Typography>{' '}
            %
          </Typography>
        </Box>
        <CopyLink id={userOtc?.id || ''} />
        <Expiry time={userOtc?.data.expiry || 0} />

        <BoxLoadingButton
          onClick={createOtcOrder}
          sx={{ width: 300, mt: 2, mb: 2 }}
          loading={isLoading}
          disabled={!(Number(ethAmount) > 0 && Number(limitPrice) > 0 && !depositError) }
        >
          {isEdit ? 'Edit deposit OTC' : 'Create deposit OTC'}
        </BoxLoadingButton>
        {isEdit ? (
          <DangerButton sx={{ width: 300, mt: 1 }} onClick={deleteOTCOrder} loading={deleteLoading}>
            Cancel Order
          </DangerButton>
        ) : null}
        {isDepositCrabLoading ? (
          <Typography mt={2} textAlign="center">
            Please don&apos;t close the tab
          </Typography>
        ) : null}
        <Typography style={{ whiteSpace: 'pre-line' }} mt={2} mb={2} color="error.main" variant="body3">
          {Number(ethAmount) > 0 ? depositError : ''}
        </Typography>
      </Box>
     

      {isEdit ? (
        <>
          <Typography variant="h6" align="center" mt={2}>
            Bids
          </Typography>
          <Typography
            style={{ whiteSpace: 'pre-line' }}
            align="center"
            mt={2}
            mb={2}
            color="error.main"
            variant="body3"
          >
            {depositValidationError ? depositValidationError : ''}
          </Typography>
          <TableContainer sx={{ bgcolor: 'background.overlayDark', borderRadius: 2 }}>
            <Table sx={{ minWidth: 500 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Id</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Price (ETH)</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(userOtc?.data.sortedBids).map(bidId => (
                  <TableRow key={Number(bidId)}>
                    <TableCell component="th" scope="row">
                      {Number(bidId) + 1}
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {formatBigNumber(userOtc?.data.sortedBids[Number(bidId)].order.quantity)}
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {formatBigNumber(userOtc?.data?.sortedBids[Number(bidId)].order.price, 18, 6)}
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {Date.now() < userOtc?.data?.sortedBids[Number(bidId)].order.expiry &&
                        Date.now() < userOtc?.data.expiry ? (
                        <BoxLoadingButton
                          sx={{ width: 100 }}
                          size="small"
                          onClick={() =>
                            depositCrab(userOtc?.data?.sortedBids[Number(bidId)], userOtc, Number(bidId) + 1)
                          }
                          loading={isDepositCrabLoading === Number(bidId) + 1}
                          disabled={!ethAmount || Number(ethAmount) === 0}
                        >
                          Sign and Execute
                        </BoxLoadingButton>
                      ) : (
                        <Typography mt={2} color="error.main">
                          Expired
                        </Typography>
                      )}
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

const CopyLink: React.FC<{ id: string }> = ({ id }) => {
  const [, copy] = useCopyToClipboard()

  const copyClick = () => {
    copy(`${location.href}/${id}`)
  }

  return (
    <>
      {id && (
        <Box display="flex" mt={1} alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="textSecondary">
            Share link with counter party
          </Typography>
          <Box display="flex" alignItems="center">
            <IconButton aria-label="copy" onClick={copyClick}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}
    </>
  )
}
