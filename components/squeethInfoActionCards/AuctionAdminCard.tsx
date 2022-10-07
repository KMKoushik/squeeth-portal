import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'

const AuctionAdminCard = styled(Box)(({ theme }) => ({
  flexDirection: 'column',
  display: 'flex',
  borderRadius: theme.spacing(1),
  py: 2,
  px: 4,
  height: '100%',
  cursor: 'pointer',
  backgroundColor: '#121d2690',
  padding: '1rem 2rem 1rem 2rem',
  border: '2px solid transparent',
  '&:hover': {
    boxShadow: '0px 0px 20px 2px rgba(8,142,252,.5)',
    border: '2px solid #088efc',
  },
}))

export default AuctionAdminCard
