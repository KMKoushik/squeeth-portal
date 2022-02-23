import { Button } from '@mui/material'
import { styled } from '@mui/material/styles'
import LoadingButton from '@mui/lab/LoadingButton'

const PrimaryButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.main,
  boxShadow: 'none',
  borderRadius: 30,
  width: 200,
  '&:hover': {
    opacity: '.5',
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main,
  },
}))

export const PrimaryLoadingButton = styled(LoadingButton)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.main,
  boxShadow: 'none',
  borderRadius: 30,
  width: 200,
  '&:hover': {
    opacity: '.5',
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main,
  },
}))

export default PrimaryButton
