import { LoadingButton } from '@mui/lab'
import { Button } from '@mui/material'
import { styled } from '@mui/material/styles'

export const SecondaryButton = styled(LoadingButton)(({ theme }) => ({
  backgroundColor: theme.palette.background.overlayLight,
  color: theme.palette.text.secondary,
  borderRadius: 8,
  '&:hover': {
    opacity: '.5',
    backgroundColor: theme.palette.background.overlayLight,
    color: theme.palette.text.secondary,
  },
}))
