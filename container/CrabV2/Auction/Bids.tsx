import * as React from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import useCrabV2Store from '../../../store/crabV2Store'
import { sortBids } from '../../../utils/auction'
import { formatBigNumber, wmul } from '../../../utils/math'
import { BigNumber } from 'ethers'
import useAccountStore from '../../../store/accountStore'
import { Button } from '@mui/material'
import { Bid } from '../../../types'

const Bids: React.FC = () => {
  const auction = useCrabV2Store(s => s.auction)
  const isHistoricalView = useCrabV2Store(s => s.isHistoricalView)

  const bids = sortBids(auction)

  return (
    <TableContainer sx={{ bgcolor: 'background.overlayDark', borderRadius: 2 }}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Rank</TableCell>
            <TableCell align="right">Quantity</TableCell>
            <TableCell align="right">Price per oSQTH</TableCell>
            <TableCell align="right">{auction.isSelling ? 'Total Payable' : 'Total to get'}</TableCell>
            <TableCell align="right">{isHistoricalView ? 'Accepted' : 'Action'}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bids.map((bid, i) => (
            <TableRow
              key={`${bid.bidder}-${bid.order.nonce}`}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <BidRow bid={bid} rank={i + 1} />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

const BidRow: React.FC<{ bid: Bid; rank: number }> = ({ bid, rank }) => {
  const address = useAccountStore(s => s.address)
  const setBidToEdit = useCrabV2Store(s => s.setBidToEdit)
  const isHistoricalView = useCrabV2Store(s => s.isHistoricalView)
  const auction = useCrabV2Store(s => s.auction)

  const qty = BigNumber.from(bid.order.quantity)
  const price = BigNumber.from(bid.order.price)

  return (
    <>
      <TableCell component="th" scope="row">
        {rank}
      </TableCell>
      <TableCell align="right">{formatBigNumber(qty, 18)} oSQTH</TableCell>
      <TableCell align="right">{formatBigNumber(price, 18)} WETH</TableCell>
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