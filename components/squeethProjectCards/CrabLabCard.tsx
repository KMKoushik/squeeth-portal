import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'

const CrabLabCard = styled(Box)(({ theme }) => ({
  flexDirection: 'column',
  display: 'flex',
  borderRadius: theme.spacing(1),
  py: 2,
  px: 4,
  cursor: 'pointer',
  backgroundColor: '#1f0c0c90',
  padding: '1rem 2rem 1rem 2rem',
  border: '2px solid transparent',
  '&:hover': {
    boxShadow: '0px 0px 20px 2px RGB(219, 88, 88, 0.5)',
    border: '2px solid RGB(219, 88, 88)',
  },
}))

export default CrabLabCard
