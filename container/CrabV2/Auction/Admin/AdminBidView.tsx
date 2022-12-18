import * as React from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import useCrabV2Store from '../../../../store/crabV2Store'
import {
  convertArrayToMap,
  categorizeBidsWithReason,
  getBgColor,
  getQtyFromBids,
  getTxBidsAndClearingPrice,
  getUniqueTraders,
  sortBidsForBidArray,
  getBidsWithReasonMap,
  getBidStatus,
  getAuctionContract,
} from '../../../../utils/auction'
import { calculateIV, convertBigNumber, formatBigNumber, wmul } from '../../../../utils/math'
import { BigNumber, ethers } from 'ethers'
import { Auction, AuctionType, Bid, BidStatus } from '../../../../types'
import useApprovals from '../../../../hooks/useApprovals'
import { CRAB_NETTING, OSQUEETH, WETH } from '../../../../constants/address'
import { useBalances } from '../../../../hooks/useBalances'
import { PrimaryLoadingButton } from '../../../../components/button/PrimaryButton'
import { Button, Checkbox, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { SecondaryButton } from '../../../../components/button/SecondaryButton'
import { useBalance, useContract, useContractWrite, useSigner, useWaitForTransaction } from 'wagmi'
import { AUCTION_BULL_CONTRACT, CRAB_NETTING_CONTRACT, CRAB_V2_CONTRACT } from '../../../../constants/contracts'
import { AuctionBull, CrabNetting, CrabStrategyV2 } from '../../../../types/contracts'
import useToaster from '../../../../hooks/useToaster'
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit'
import { BIG_ZERO, ETHERSCAN, ETH_OSQTH_FEE, ETH_USDC_FEE } from '../../../../constants/numbers'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import useControllerStore from '../../../../store/controllerStore'
import usePriceStore from '../../../../store/priceStore'
import shallow from 'zustand/shallow'
import { Fragment } from 'react'
import { HtmlTooltip } from '../../../../components/utilities/HtmlTooltip'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import {
  calculateTotalDeposit,
  getActualDepositAmount,
  getFlashDepositAmount,
  getTotalWithdraws,
} from '../../../../utils/crabNetting'
import useQuoter from '../../../../hooks/useQuoter'
import { getCrabFromSqueethAmount, getWsqueethFromCrabAmount } from '../../../../utils/crab'
import { useBullAuction } from '../../../../hooks/useBullAuction'

const AdminBidView: React.FC = () => {
  const auction = useCrabV2Store(s => s.auction)
  const bids = useCrabV2Store(s => s.sortedBids)
  const oSqthRefVolIndex = useCrabV2Store(s => s.oSqthRefVolIndex)
  const supply = useCrabV2Store(s => s.totalSupply)
  const uniqueTraders = getUniqueTraders(bids)
  const { getApprovals } = useApprovals(
    uniqueTraders,
    auction.isSelling ? WETH : OSQUEETH,
    getAuctionContract(auction.type),
  )
  const { getBalances } = useBalances(uniqueTraders, auction.isSelling ? WETH : OSQUEETH)
  const showMessageFromServer = useToaster()
  const addRecentTransaction = useAddRecentTransaction()
  const { getRebalanceDetails } = useBullAuction()
  const vault = useCrabV2Store(s => s.vault)

  const quoter = useQuoter()

  const [filteredBids, setFilteredBids] = React.useState<Array<Bid & { status?: BidStatus }>>()
  const [filterLoading, setFilterLoading] = React.useState(false)
  const [clearingPrice, setClearingPrice] = React.useState('')

  // Needed for manual hedge
  const [manualBidMap, setManualBidMap] = React.useState<{ [key: string]: Bid & { status?: BidStatus } }>({})
  const [manualQty, setManualQty] = React.useState('0')

  const [manualTx, setManualTx] = React.useState('')
  const [manualTimestamp, setManualTimestamp] = React.useState(0)

  const { ethPriceBN, oSqthPriceBN } = usePriceStore(
    s => ({ ethPriceBN: s.ethPrice, oSqthPriceBN: s.oSqthPrice }),
    shallow,
  )
  const nfBN = useControllerStore(s => s.normFactor)

  const ethPrice = convertBigNumber(ethPriceBN, 18)
  const nf = convertBigNumber(nfBN, 18)

  const { data: hedgeTx, writeAsync: hedge } = useContractWrite({
    ...CRAB_V2_CONTRACT,
    functionName: 'hedgeOTC',
    args: [],
  })

  const { data: depositAuctionTx, writeAsync: depositAuction } = useContractWrite({
    ...CRAB_NETTING_CONTRACT,
    functionName: 'depositAuction',
    args: [],
  })

  const { data: withdrawAuctxTx, writeAsync: withdrawAuction } = useContractWrite({
    ...CRAB_NETTING_CONTRACT,
    functionName: 'withdrawAuction',
    args: [],
  })

  const { data: bullAuctionTx, writeAsync: fullRebalance } = useContractWrite({
    ...AUCTION_BULL_CONTRACT,
    functionName: 'fullRebalance',
    args: [],
  })

  const { data, isFetched: balfetched } = useBalance({
    addressOrName: CRAB_NETTING,
  })

  const nettingBalance = data ? data.value : BIG_ZERO

  const { data: signer } = useSigner()

  const crabV2 = useContract<CrabStrategyV2>({
    ...CRAB_V2_CONTRACT,
    signerOrProvider: signer,
  })

  const crabNetting = useContract<CrabNetting>({
    ...CRAB_NETTING_CONTRACT,
    signerOrProvider: signer,
  })

  const auctionBull = useContract<AuctionBull>({
    ...AUCTION_BULL_CONTRACT,
    signerOrProvider: signer,
  })

  const { isLoading: isHedging } = useWaitForTransaction({
    hash: hedgeTx?.hash,
  })

  const { isLoading: isDepositing } = useWaitForTransaction({
    hash: depositAuctionTx?.hash,
  })

  const { isLoading: isWithdrawing } = useWaitForTransaction({
    hash: withdrawAuctxTx?.hash,
  })

  const { isLoading: isBullExecuting } = useWaitForTransaction({
    hash: bullAuctionTx?.hash,
  })

  const filterBids = React.useCallback(async () => {
    setFilterLoading(true)
    try {
      const { data: approvals } = await getApprovals()
      const { data: balances } = await getBalances()

      const approvalMap = convertArrayToMap<BigNumber>(uniqueTraders, approvals as any as Array<BigNumber>)
      const balanceMap = convertArrayToMap<BigNumber>(uniqueTraders, balances as any as Array<BigNumber>)

      const _filteredBids = categorizeBidsWithReason(bids, auction, approvalMap, balanceMap)
      setFilteredBids(_filteredBids)
      const { clearingPrice: _clPrice } = getTxBidsAndClearingPrice(_filteredBids)
      setClearingPrice(_clPrice)
    } catch (e) {
      console.log(e)
    }
    setFilterLoading(false)
  }, [auction, bids, getApprovals, getBalances, uniqueTraders])

  const getOrders = () => {
    const manualBids = Object.values(manualBidMap)
    const orders = (manualBids.length ? manualBids : filteredBids!)
      .filter(fb => fb.status! <= BidStatus.PARTIALLY_FILLED)
      .map(b => {
        const { r, s, v } = ethers.utils.splitSignature(b.signature)

        return { ...b.order, v, r, s }
      })

    return { orders, manualBids }
  }

  const hedgeCB = async () => {
    try {
      const { orders } = getOrders()

      const gasLimit = await crabV2.estimateGas.hedgeOTC(auction.oSqthAmount, clearingPrice, !auction.isSelling, orders)

      const tx = await hedge({
        args: [auction.oSqthAmount, clearingPrice, !auction.isSelling, orders],
        overrides: {
          gasLimit: gasLimit.mul(125).div(100),
        },
      })
      try {
        addRecentTransaction({
          hash: tx.hash,
          description: 'Hedge OTC',
        })
      } catch (e) {
        console.log(e)
      }
      await tx.wait()
      await submitTx(tx.hash, tx.timestamp || 0)

      clearFilter()
    } catch (e) {
      console.log(e)
    }
  }

  const executeCrabDepositAuction = async () => {
    try {
      const { orders } = getOrders()

      const availableOsqth = orders.reduce((acc, o) => acc.add(o.quantity), BIG_ZERO)
      const auctionSqth = BigNumber.from(auction.oSqthAmount)
      // Calculate neededSqth for full deposit amount
      const { sqthToMint: neededSqth } = await calculateTotalDeposit(
        quoter,
        BigNumber.from(auction.usdAmount),
        BigNumber.from(auction.price),
        vault!,
      )

      let auctionOsqthAmount = neededSqth
      if (availableOsqth.lt(auctionOsqthAmount)) {
        auctionOsqthAmount = availableOsqth
      }
      if (auctionSqth.lt(auctionOsqthAmount)) {
        auctionOsqthAmount = auctionSqth
      }

      // If we have less sqth amount in auction get amount USDC to match the squeeth amount
      const { totalUSDCToDeposit, sqthToMint } = await getActualDepositAmount(
        quoter,
        BigNumber.from(auction.usdAmount!),
        auctionOsqthAmount,
        neededSqth,
        vault!,
        BigNumber.from(auction.price),
      )

      // Re-do the deposit calculation with new amounts. You will have excess ETH if we use less usd amount than original.
      // It's because we will have better pricing so end up with some extra ETH. Can flash deposit the extra ETH
      const { ethToGet, totalDeposit, excessEth } = await calculateTotalDeposit(
        quoter,
        totalUSDCToDeposit,
        BigNumber.from(auction.price),
        vault!,
        auctionOsqthAmount,
      )

      // Calculate ETH to flash deposit for existing contract balance and excess eth
      const ethToFlashDeposit = await getFlashDepositAmount(
        quoter,
        nettingBalance.add(excessEth),
        sqthToMint,
        BigNumber.from(clearingPrice),
        BigNumber.from(auction.price),
        vault!.collateral,
        vault!.shortAmount,
      )

      const gasLimit = await crabNetting.estimateGas.depositAuction({
        depositsQueued: totalUSDCToDeposit,
        minEth: ethToGet,
        totalDeposit,
        orders,
        clearingPrice,
        ethToFlashDeposit,
        ethUSDFee: ETH_USDC_FEE,
        flashDepositFee: ETH_OSQTH_FEE,
      })

      const tx = await depositAuction({
        args: [
          {
            depositsQueued: totalUSDCToDeposit,
            minEth: ethToGet,
            totalDeposit,
            orders,
            clearingPrice,
            ethToFlashDeposit,
            ethUSDFee: ETH_USDC_FEE,
            flashDepositFee: ETH_OSQTH_FEE,
          },
        ],
        overrides: {
          gasLimit: gasLimit.mul(125).div(100),
        },
      })

      try {
        addRecentTransaction({
          hash: tx.hash,
          description: 'Deposit Auction',
        })
      } catch (e) {
        console.log(e)
      }

      await tx.wait()
      await submitTx(tx.hash, tx.timestamp || 0)
      // console.log(gasLimit)
    } catch (e) {
      console.log(e)
    }
  }

  const executeCrabWithdrawAuction = async () => {
    const { orders } = getOrders()
    const _crabAmt = BigNumber.from(auction.crabAmount || 0)

    const availableOsqth = orders.reduce((acc, o) => acc.add(o.quantity), BIG_ZERO)
    const auctionSqth = BigNumber.from(auction.oSqthAmount)
    const neededSqth = getWsqueethFromCrabAmount(_crabAmt, vault!, supply)

    let auctionOsqthAmount = neededSqth
    if (availableOsqth.lt(auctionOsqthAmount)) {
      auctionOsqthAmount = availableOsqth
    }
    if (auctionSqth.lt(auctionOsqthAmount)) {
      auctionOsqthAmount = auctionSqth
    }

    let crabAmount = auctionOsqthAmount.eq(auction.oSqthAmount)
      ? _crabAmt
      : getCrabFromSqueethAmount(auctionOsqthAmount, vault!, supply)

    const sqthForCrab = getWsqueethFromCrabAmount(crabAmount, vault!, supply)

    crabAmount = auctionOsqthAmount.gt(sqthForCrab)
      ? crabAmount
      : getCrabFromSqueethAmount(auctionOsqthAmount.sub(1), vault!, supply)

    console.log(
      'Crab',
      crabAmount.toString(),
      _crabAmt.toString(),
      auctionOsqthAmount.toString(),
      getWsqueethFromCrabAmount(crabAmount, vault!, supply).toString(),
    )

    const { minUSDC } = await getTotalWithdraws(crabAmount, vault!, supply, BigNumber.from(clearingPrice), quoter)

    const gasLimit = await crabNetting.estimateGas.withdrawAuction({
      crabToWithdraw: crabAmount,
      orders,
      clearingPrice,
      minUSDC,
      ethUSDFee: ETH_USDC_FEE,
    })

    // const gasLimit = BigNumber.from(7000000)

    const tx = await withdrawAuction({
      args: [
        {
          crabToWithdraw: crabAmount,
          orders,
          clearingPrice,
          minUSDC,
          ethUSDFee: ETH_USDC_FEE,
        },
      ],
      overrides: {
        gasLimit: gasLimit.mul(125).div(100),
      },
    })
    try {
      addRecentTransaction({
        hash: tx.hash,
        description: 'Withdraw Auction',
      })
    } catch (e) {
      console.log(e)
    }
    await tx.wait()
    await submitTx(tx.hash, tx.timestamp || 0)
  }

  const executeBullAuction = async () => {
    try {
      const { orders } = getOrders()
      const availableOsqth = orders.reduce((acc, o) => acc.add(o.quantity), BIG_ZERO)
      const auctionSqth = BigNumber.from(auction.oSqthAmount)

      let auctionOsqthAmount = auctionSqth
      if (availableOsqth.lt(auctionOsqthAmount)) {
        auctionOsqthAmount = availableOsqth
      }

      const { crabAmount, wethTargetInEuler, wethLimitPrice } = await getRebalanceDetails(
        auctionOsqthAmount,
        auction.isSelling,
        BigNumber.from(clearingPrice),
      )

      console.log('Bull:', crabAmount.toString(), wethTargetInEuler.toString(), wethLimitPrice.toString())

      const gasLimit = await auctionBull.estimateGas.fullRebalance(
        orders,
        crabAmount,
        clearingPrice,
        wethTargetInEuler,
        wethLimitPrice,
        ETH_USDC_FEE,
        auction.isSelling,
      )

      //const gasLimit = BigNumber.from(7000000)

      const tx = await fullRebalance({
        args: [orders, crabAmount, clearingPrice, wethTargetInEuler, wethLimitPrice, ETH_USDC_FEE, auction.isSelling],
        overrides: {
          gasLimit: gasLimit.mul(125).div(100),
        },
      })
      try {
        addRecentTransaction({
          hash: tx.hash,
          description: 'Full rebalance',
        })
      } catch (e) {
        console.log(e)
      }
      await tx.wait()
      await submitTx(tx.hash, tx.timestamp || 0)
    } catch (e) {
      console.log(e)
    }
  }

  const submitTx = async (tx: string, timestamp: number, auctionQty?: BigNumber) => {
    const { orders, manualBids } = getOrders()

    const updatedAuction: Auction = {
      ...auction,
      bids: getBidsWithReasonMap(
        manualBids.length
          ? bids.map(b => ({
            ...b,
            status: !!manualBidMap[`${b.bidder}-${b.order.nonce}`] ? BidStatus.INCLUDED : BidStatus.ALREADY_FILLED,
          }))
          : filteredBids!,
      ),
      tx,
      clearingPrice,
      winningBids: orders.map(o => `${o.trader}-${o.nonce}`),
      ethPrice: ethPriceBN.toString(),
      oSqthPrice: oSqthPriceBN.toString(),
      osqthRefVol: oSqthRefVolIndex,
      normFactor: nfBN.toString(),
      executedTime: (timestamp || 0) * 1000,
      oSqthAmount: auctionQty?.toString() ?? auction.oSqthAmount,
    }

    const resp = await fetch('/api/auction/submitAuction', {
      method: 'POST',
      body: JSON.stringify({ auction: updatedAuction }),
      headers: { 'Content-Type': 'application/json' },
    })
    showMessageFromServer(resp)
  }

  const clearFilter = () => {
    setFilteredBids(undefined)
    setClearingPrice('')
    setManualBidMap({})
    setManualQty('0')
  }

  const onManualCheck = React.useCallback(
    (bidId: string) => {
      const _manualBidMap = { ...manualBidMap }
      const bid = auction.bids[bidId]
      if (manualBidMap[bidId]) {
        delete _manualBidMap[bidId]
      } else {
        _manualBidMap[bidId] = { ...bid, status: BidStatus.INCLUDED }
      }

      const sortedBids = sortBidsForBidArray(Object.values(_manualBidMap), auction.isSelling).map(b => ({
        ...b,
        status: BidStatus.INCLUDED,
      }))

      setManualBidMap(_manualBidMap)
      setManualQty(getQtyFromBids(sortedBids, auction.oSqthAmount))
      if (sortedBids.length) {
        const { clearingPrice: _clPrice } = getTxBidsAndClearingPrice(sortedBids)
        setClearingPrice(_clPrice)
      } else {
        filterBids()
      }
    },
    [auction.bids, auction.isSelling, auction.oSqthAmount, filterBids, manualBidMap],
  )

  const executeAuction = () => {
    if (auction.type === AuctionType.CRAB_HEDGE) {
      hedgeCB()
    }
    if (auction.type === AuctionType.NETTING) {
      if (auction.isSelling) {
        executeCrabDepositAuction()
      } else {
        executeCrabWithdrawAuction()
      }
    }
    if (auction.type === AuctionType.CALM_BULL) {
      executeBullAuction()
    }
  }

  return (
    <>
      <Box mb={1} display="flex">
        <Typography variant="h6" color="primary">
          Bids
        </Typography>
        {filteredBids ? (
          <Button color="error" onClick={clearFilter} sx={{ ml: 2 }}>
            Clear filter
          </Button>
        ) : null}
      </Box>
      <TableContainer sx={{ bgcolor: 'background.overlayDark', borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Select</TableCell>
              <TableCell>Rank</TableCell>
              <TableCell>Trader</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Price per oSQTH</TableCell>
              <TableCell align="right">{auction.isSelling ? 'Total Payable' : 'Total to get'}</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(filteredBids || bids).map((bid: Bid & { status?: BidStatus }, i) => (
              <TableRow
                key={`${bid.bidder}-${bid.order.nonce}`}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  bgcolor: getBgColor((bid as any).status),
                }}
              >
                <BidRow
                  bid={bid}
                  rank={i + 1}
                  checkEnabled={(bid.status || 0) !== 0 && (bid.status || 0) <= BidStatus.ALREADY_FILLED}
                  checked={false}
                  onCheck={() => onManualCheck(`${bid.bidder}-${bid.order.nonce}`)}
                />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box mt={2}>
        <Typography mb={1}>{Number(manualQty) ? 'Using Manual bids' : 'Using Automated algo'}</Typography>
        <Box>
          <Typography variant="body1" component="span" color="textSecondary">
            Clearing price:{' '}
            <Typography fontWeight={600} variant="numeric" component="span" color="textPrimary" ml={2}>
              {formatBigNumber(clearingPrice || '0', 18, 6)}
            </Typography>{' '}
            WETH
            <Typography variant="numeric" color="textSecondary">
              {' ('}
              {(calculateIV(convertBigNumber(clearingPrice || '0', 18), nf, ethPrice) * 100).toFixed(1)}%{')'}
            </Typography>
          </Typography>
        </Box>
        <Typography variant="body1" component="span" color="textSecondary">
          Hedge amount:{' '}
          <Typography fontWeight={600} variant="numeric" component="span" color="textPrimary" ml={2}>
            {formatBigNumber(manualQty === '0' ? auction.oSqthAmount : manualQty, 18, 6)}
          </Typography>{' '}
          oSQTH
        </Typography>
      </Box>
      <Box mt={4}>
        <SecondaryButton loading={filterLoading} onClick={filterBids} sx={{ width: 200 }}>
          Validate bids
        </SecondaryButton>
        {filteredBids ? (
          <PrimaryLoadingButton
            loading={isHedging || isDepositing || isWithdrawing || isBullExecuting}
            onClick={executeAuction}
            sx={{ ml: 4 }}
          >
            Execute auction
          </PrimaryLoadingButton>
        ) : null}
      </Box>
      <Box mt={4} pb={8}>
        <Typography mb={2}>Submit tx manually if the bids are still visible after tx</Typography>
        <Box display="flex" flexDirection="column" width={300}>
          <TextField
            size="small"
            label="tx"
            variant="outlined"
            value={manualTx}
            onChange={e => setManualTx(e.target.value)}
          />
          <TextField
            size="small"
            label="timestamp"
            sx={{ mt: 2 }}
            type="number"
            variant="outlined"
            value={manualTimestamp}
            onChange={e => setManualTimestamp(Number(e.target.value))}
          />
          <PrimaryLoadingButton loading={isHedging} onClick={() => submitTx(manualTx, manualTimestamp)} sx={{ mt: 2 }}>
            submit
          </PrimaryLoadingButton>
        </Box>
      </Box>
    </>
  )
}

type BidRowProp = {
  bid: Bid & { status?: BidStatus }
  rank: number
  checkEnabled: boolean
  checked: boolean
  onCheck: () => void
}

const BidRow: React.FC<BidRowProp> = ({ bid, rank, checkEnabled, onCheck }) => {
  const qty = BigNumber.from(bid.order.quantity)
  const price = BigNumber.from(bid.order.price)
  const ethPriceBN = usePriceStore(s => s.ethPrice)
  const nfBN = useControllerStore(s => s.normFactor)

  const ethPrice = convertBigNumber(ethPriceBN, 18)
  const nf = convertBigNumber(nfBN, 18)
  // For older auction it uses nonce, for auctions that will be created hereafter will use updated time
  const bidTime = new Date(bid.updatedTime || bid.order.nonce).toString()

  return (
    <>
      <TableCell component="th" scope="row">
        <Checkbox onChange={onCheck} color="primary" />
      </TableCell>
      <TableCell component="th" scope="row">
        {rank}
      </TableCell>
      <TableCell>
        <Typography variant="body3">
          {bid.bidder.substring(0, 8)}...{bid.bidder.substring(bid.bidder.length - 5)}
        </Typography>
        <a href={`${ETHERSCAN.url}/address/${bid.bidder}`} target="_blank" rel="noreferrer">
          <OpenInNewIcon
            fontSize="small"
            color="disabled"
            sx={{
              verticalAlign: 'middle',
              ml: 1,
              ':hover': {
                cursor: 'pointer',
              },
            }}
          />
        </a>
      </TableCell>
      <TableCell align="right">{formatBigNumber(qty, 18)} oSQTH</TableCell>
      <TableCell align="right">
        {formatBigNumber(price, 18)} WETH{' '}
        <Typography variant="numeric" color="textSecondary">
          {'('}
          {(calculateIV(convertBigNumber(price, 18), nf, ethPrice) * 100).toFixed(1)}%{')'}
        </Typography>{' '}
      </TableCell>
      <TableCell align="right">{formatBigNumber(wmul(qty, price), 18)} WETH</TableCell>
      <TableCell>
        <Typography variant="body3" color="textSecondary">
          {getBidStatus(bid.status)}
        </Typography>
        <HtmlTooltip title={<Fragment>Bid entered/Last updated time: {bidTime}</Fragment>}>
          <TimerOutlinedIcon fontSize="inherit" color="inherit" sx={{ verticalAlign: 'middle', ml: 0.5 }} />
        </HtmlTooltip>
      </TableCell>
    </>
  )
}

export default AdminBidView
