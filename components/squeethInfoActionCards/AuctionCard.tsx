import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'

const AuctionCard = styled(Box)(({ theme }) => ({
  flexDirection: 'column',
  display: 'flex',
  borderRadius: theme.spacing(1),
  py: 2,
  px: 4,
  height: '100%',
  cursor: 'pointer',
  backgroundColor: '#21190d90',
  padding: '1rem 2rem 1rem 2rem',
  border: '2px solid transparent',
  '&:hover': {
    boxShadow: '0px 0px 20px 2px rgba(253,170,50,.5)',
    border: '2px solid #FDAA32',
  },
}))

export default AuctionCard
