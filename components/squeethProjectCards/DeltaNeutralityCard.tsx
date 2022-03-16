import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'

const DeltaNeutralityCard = styled(Box)(({ theme }) => ({
  flexDirection: 'column',
  display: 'flex',
  borderRadius: theme.spacing(1),
  py: 2,
  px: 4,
  cursor: 'pointer',
  backgroundColor: '#17101090',
  padding: '1rem 2rem 1rem 2rem',
  border: '2px solid transparent',
  '&:hover': {
    boxShadow: '0px 0px 20px rgb(229,202,105,0.5)',
    border: '2px solid #E5CA69',
  },
}))

export default DeltaNeutralityCard
