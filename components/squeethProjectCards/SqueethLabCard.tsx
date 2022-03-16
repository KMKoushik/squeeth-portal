import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'

const SqueethLabCard = styled(Box)(({ theme }) => ({
  flexDirection: 'column',
  display: 'flex',
  borderRadius: theme.spacing(1),
  py: 2,
  px: 4,
  cursor: 'pointer',
  backgroundColor: '#151D3B90',
  padding: '1rem 2rem 1rem 2rem',
  border: '2px solid transparent',
  '&:hover': {
    boxShadow: '0px 0px 20px 2px rgb(94, 230, 235, 0.5)',
    border: '2px solid rgb(94, 230, 235)',
  },
}))

export default SqueethLabCard
