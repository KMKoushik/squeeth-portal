import { Button } from '@mui/material'
import { styled } from '@mui/material/styles'
import LoadingButton from '@mui/lab/LoadingButton'

const PrimaryButton = styled(Button)(({ theme }) => ({
  border: `0.5px solid ${theme.palette.primary.main}`,
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.main,
  boxShadow: 'none',
  borderRadius: 8,
  width: 200,
  '&:hover': {
    opacity: '.5',
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main,
  },
}))

export const PrimaryLoadingButton = styled(LoadingButton)(({ theme }) => ({
  border: `0.5px solid ${theme.palette.primary.main}`,
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.main,
  boxShadow: 'none',
  borderRadius: 8,
  width: 200,
  '&:hover': {
    opacity: '.5',
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main,
  },
}))

export const BoxLoadingButton = styled(LoadingButton)(({ theme }) => ({
  border: `0.5px solid ${theme.palette.primary.main}`,
  px: 4,
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.main,
  boxShadow: 'none',
  borderRadius: 8,
  '&:hover': {
    opacity: '.5',
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main,
  },
}))

export default PrimaryButton
