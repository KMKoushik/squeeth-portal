import { Button } from '@mui/material'
import { styled } from '@mui/material/styles'

const OutlinedPrimaryButton = styled(Button)(({ theme }) => ({
  border: `1px solid ${theme.palette.primary.main}`,
  color: theme.palette.primary.main,
  boxShadow: 'none',
  borderRadius: 30,
  width: 200,
}))

export default OutlinedPrimaryButton
