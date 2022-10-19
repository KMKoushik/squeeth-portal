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
  sortBids,
  sortBidsForBidArray,
  getBidsWithReasonMap,
  getBidStatus,
} from '../../../../utils/auction'
import { calculateIV, convertBigNumber, formatBigNumber, wmul } from '../../../../utils/math'
import { BigNumber, ethers } from 'ethers'
import { Auction, Bid, BidStatus } from '../../../../types'
import useApprovals from '../../../../hooks/useApprovals'
import { CRAB_STRATEGY_V2, OSQUEETH, WETH } from '../../../../constants/address'
import { useBalances } from '../../../../hooks/useBalances'
import { PrimaryLoadingButton } from '../../../../components/button/PrimaryButton'
import { Button, Checkbox, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { SecondaryButton } from '../../../../components/button/SecondaryButton'
import { useContract, useContractWrite, useSigner, useWaitForTransaction } from 'wagmi'
import { CRAB_V2_CONTRACT } from '../../../../constants/contracts'
import { CrabStrategyV2 } from '../../../../types/contracts'
import { KING_CRAB } from '../../../../constants/message'
import useToaster from '../../../../hooks/useToaster'
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit'
import { ETHERSCAN } from '../../../../constants/numbers'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import useControllerStore from '../../../../store/controllerStore'
import usePriceStore from '../../../../store/priceStore'
import shallow from 'zustand/shallow'

const AdminBidView: React.FC = () => {
  const [filteredBids, setFilteredBids] = React.useState<Array<Bid & { status?: BidStatus }>>()
  const [filterLoading, setFilterLoading] = React.useState(false)
  const [clearingPrice, setClearingPrice] = React.useState('')
  const auction = useCrabV2Store(s => s.auction)
  const bids = useCrabV2Store(s => s.sortedBids)
  const oSqthRefVolIndex = useCrabV2Store(s => s.oSqthRefVolIndex)
  const uniqueTraders = getUniqueTraders(bids)
  const { getApprovals } = useApprovals(uniqueTraders, auction.isSelling ? WETH : OSQUEETH, CRAB_STRATEGY_V2)
  const { getBalances } = useBalances(uniqueTraders, auction.isSelling ? WETH : OSQUEETH)
  const showMessageFromServer = useToaster()
  const addRecentTransaction = useAddRecentTransaction()

  // Needed for manual hedge
  const [manualBidMap, setManualBidMap] = React.useState<{ [key: string]: Bid & { status?: BidStatus } }>({})
  const [manualQty, setManualQty] = React.useState('0')

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

  const { data: signer } = useSigner()

  const crabV2 = useContract<CrabStrategyV2>({
    ...CRAB_V2_CONTRACT,
    signerOrProvider: signer,
  })

  const { isLoading: isHedging } = useWaitForTransaction({
    hash: hedgeTx?.hash,
    onSuccess() {
      console.log('Successfully hedged')
    },
    onError(err) {
      console.log(err)
    },
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

  const hedgeCB = async () => {
    try {
      const manualBids = Object.values(manualBidMap)
      const orders = (manualBids.length ? manualBids : filteredBids!)
        .filter(fb => fb.status! <= BidStatus.PARTIALLY_FILLED)
        .map(b => {
          const { r, s, v } = ethers.utils.splitSignature(b.signature)

          return { ...b.order, v, r, s }
        })

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
        tx: tx.hash,
        clearingPrice,
        winningBids: orders.map(o => `${o.trader}-${o.nonce}`),
        ethPrice: ethPriceBN.toString(),
        oSqthPrice: oSqthPriceBN.toString(),
        osqthRefvol:oSqthRefVolIndex,
        normFactor: nfBN.toString(),
        executedTime: (tx.timestamp || 0) * 1000,
      }

      const resp = await fetch('/api/auction/submitAuction', {
        method: 'POST',
        body: JSON.stringify({ auction: updatedAuction }),
        headers: { 'Content-Type': 'application/json' },
      })
      showMessageFromServer(resp)
      clearFilter()
    } catch (e) {
      console.log(e)
    }
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
          <PrimaryLoadingButton loading={isHedging} onClick={() => hedgeCB()} sx={{ ml: 4 }}>
            Hedge
          </PrimaryLoadingButton>
        ) : null}
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

  return (
    <>
      <TableCell component="th" scope="row">
        <Checkbox onChange={onCheck} disabled={!checkEnabled} color="primary" />
      </TableCell>
      <TableCell component="th" scope="row">
        {rank}
      </TableCell>
      <TableCell>
        <Typography variant="body3">
          {bid.bidder.substring(0, 5)}...{bid.bidder.substring(bid.bidder.length - 5)}
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
      </TableCell>
    </>
  )
}

export default AdminBidView
