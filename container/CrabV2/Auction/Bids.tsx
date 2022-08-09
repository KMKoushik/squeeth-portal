import * as React from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import useCrabV2Store from '../../../store/crabV2Store'
import { getBgColor, getUserBids, sortBids } from '../../../utils/auction'
import { calculateDollarValue, calculateIV, convertBigNumber, formatBigNumber, wmul } from '../../../utils/math'
import { BigNumber } from 'ethers'
import useAccountStore from '../../../store/accountStore'
import { Button, Typography } from '@mui/material'
import { Auction, Bid, BidStatus } from '../../../types'
import usePriceStore from '../../../store/priceStore'
import shallow from 'zustand/shallow'
import useControllerStore from '../../../store/controllerStore'

const getBidStatus = (auction: Auction, isHistoricalView: boolean, bid: Bid) => {
  if (isHistoricalView) {
    return auction.winningBids.includes(`${bid.bidder}-${bid.order.nonce}`) ? BidStatus.INCLUDED : BidStatus.NO_APPROVAL
  }
  if (
    (auction.isSelling && Number(bid.order.price) < Number(auction.price)) ||
    (!auction.isSelling && Number(bid.order.price) > Number(auction.price))
  ) {
    return BidStatus.STALE_BID
  }
}

const Bids: React.FC<{ seeMyBids: boolean }> = ({ seeMyBids }) => {
  const address = useAccountStore(s => s.address)
  const auction = useCrabV2Store(s => s.auction)
  const isHistoricalView = useCrabV2Store(s => s.isHistoricalView)
  const bids = useCrabV2Store(s => s.sortedBids)
 
  const filteredBids = React.useMemo(() => {
    return seeMyBids ? getUserBids(bids, address!) : bids
  }, [address, bids, seeMyBids])

  return (
    <>
      <TableContainer sx={{ bgcolor: 'background.overlayDark', borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Price per oSQTH</TableCell>
              <TableCell align="right">{auction.isSelling ? 'Total Payable' : 'Total to get'}</TableCell>
              <TableCell align="right">{isHistoricalView ? 'Filled' : 'Action'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBids.map((bid, i) => (
              <TableRow
                key={`${bid.bidder}-${bid.order.nonce}`}
                sx={{
                  '&:last-child td, &:last-child th': {
                    border: 0,
                  },
                  bgcolor: getBgColor(getBidStatus(auction, isHistoricalView, bid)),
                }}
              >
                <BidRow bid={bid} rank={i + 1} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

const BidRow: React.FC<{ bid: Bid; rank: number }> = ({ bid, rank }) => {
  const address = useAccountStore(s => s.address)
  const setBidToEdit = useCrabV2Store(s => s.setBidToEdit)
  const isHistoricalView = useCrabV2Store(s => s.isHistoricalView)
  const auction = useCrabV2Store(s => s.auction)

  const qty = BigNumber.from(bid.order.quantity)
  const price = BigNumber.from(bid.order.price)

  const { ethPriceBN, oSqthPriceBN } = usePriceStore(
    s => ({ ethPriceBN: s.ethPrice, oSqthPriceBN: s.oSqthPrice  }),
    shallow,
  )

  const { nfBN } = useControllerStore(
    s => ({ nfBN: s.normFactor }),
    shallow,
  )


  const ethPrice = convertBigNumber(ethPriceBN, 18)
  const oSqthPrice = convertBigNumber(oSqthPriceBN, 18)
  const nf = convertBigNumber(nfBN, 18)

  return (
    <>
      <TableCell component="th" scope="row">
        {rank}
      </TableCell>
      <TableCell align="right">{formatBigNumber(qty, 18)} oSQTH</TableCell>
      <TableCell align="right">{formatBigNumber(price, 18)} WETH
      <small>   <Typography textAlign="center" variant="numeric"  color="textSecondary">${(calculateDollarValue(convertBigNumber(price, 18), ethPrice)).toFixed(2)} </Typography> 
          <Typography  variant="numeric"  color="textSecondary">  {(calculateIV(convertBigNumber(price, 18), nf, ethPrice) * 100).toFixed(2)}% </Typography> </small> 
      </TableCell>
      <TableCell align="right">{formatBigNumber(wmul(qty, price), 18)} WETH</TableCell>
      {isHistoricalView ? (
        <TableCell align="right">
          {auction.winningBids!.includes(`${bid.bidder}-${bid.order.nonce}`) ? 'Yes' : 'No'}
        </TableCell>
      ) : (
        <TableCell align="right">
          {address === bid.bidder ? (
            <Button variant="text" onClick={() => setBidToEdit(`${bid.bidder}-${bid.order.nonce}`)}>
              Edit
            </Button>
          ) : null}
        </TableCell>
      )}
    </>
  )
}

export default Bids
