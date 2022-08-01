import { LoadingButton } from '@mui/lab'
import { Button } from '@mui/material'
import { styled } from '@mui/material/styles'

const DangerButton = styled(LoadingButton)(({ theme }) => ({
  border: `0.5px solid ${theme.palette.error.main}`,
  color: theme.palette.error.main,
  boxShadow: 'none',
  borderRadius: 8,
  '&:hover': {
    // opacity: '.1',
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.main,
  },
}))

export default DangerButton
