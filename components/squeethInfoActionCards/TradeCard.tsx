import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'

const TradeCard = styled(Box)(({ theme }) => ({
  flexDirection: 'column',
  display: 'flex',
  borderRadius: theme.spacing(1),
  py: 2,
  px: 4,
  cursor: 'pointer',
  backgroundColor: '#25191d',
  padding: '1rem 2rem 1rem 2rem',
}))

export default TradeCard
