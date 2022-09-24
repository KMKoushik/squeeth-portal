import * as React from 'react'
import { styled } from '@mui/material/styles'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import { AuctionStatus } from '../../types'
import styles from '../../styles/BottomNav.module.css'

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import { Tooltip, Typography } from '@mui/material'
import PrimaryButton from '../button/PrimaryButton'
import Link from 'next/link'
import useCrabV2Store from '../../store/crabV2Store'


const BottomNav: React.FC = () => {

  const auction = useCrabV2Store(s => s.auction)
  const auctionStatus = useCrabV2Store(s => s.auctionStatus)
  const bidToEdit = useCrabV2Store(s => s.bidToEdit)

  const isAuctionActive = (auctionStatus === AuctionStatus.LIVE || auctionStatus === AuctionStatus.UPCOMING)
  const action = auction.isSelling ? 'Bids' : 'Offers'
  const isEditBid = bidToEdit && !!auction.bids[bidToEdit]

  const getToolTipMessage = () => auctionStatus === AuctionStatus.SETTLED
    ? `Can't Bid , expired auction`
    : 'No Auctions Currently'

  const disabledToolTipMessage = getToolTipMessage()

  const handleAction = (event: any) => {
    const element = document.getElementById("placeBid");
    if (element) {
      element.scrollIntoView()
    }

  }


  return (
    <AppBar position="fixed" color="secondary" sx={{ top: 'auto', bottom: 0 }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>

        <Link href="#bids_offers">
          <Typography variant="button" color="whitesmoke" className={styles.linkText}>
            {action == 'Bids'
              ? <LocalOfferOutlinedIcon fontSize="inherit" color="inherit" sx={{ verticalAlign: 'middle', mr: 1 }} />
              : <MonetizationOnOutlinedIcon fontSize="inherit" color="inherit" sx={{ verticalAlign: 'middle', mr: 1 }} />
            }
            {action}
          </Typography>
        </Link>

        <Link href="#details">
          <Typography variant="button" color="whitesmoke" className={styles.linkText}>
            <InfoOutlinedIcon fontSize="inherit" color="inherit" sx={{ verticalAlign: 'middle', mr: 1 }} />
            Details
          </Typography>
        </Link>
        <Tooltip title={isAuctionActive ? '' : disabledToolTipMessage} enterTouchDelay={0}>
          <span>
            <PrimaryButton onClick={handleAction} variant="outlined" color="primary" disabled={!isAuctionActive}>
              {isEditBid ? 'Edit' : 'Place'} {action.slice(0, -1)}
            </PrimaryButton>
          </span>
        </Tooltip>
      </Toolbar>
    </AppBar>
  )
}

export default BottomNav
