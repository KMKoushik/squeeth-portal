import { ReactJSXElement } from '@emotion/react/types/jsx-namespace'
import { Chip, Typography } from '@mui/material'
import * as React from 'react'

type OutLineChipsProps = {
  icon: ReactJSXElement
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | undefined | any
  label: string
}

const OutlineChip = React.memo(function OutlineChip({ icon, color = 'default', label }: OutLineChipsProps) {
  return (
    <Typography mt={1}>
      <Chip color={color} variant="outlined" icon={icon} label={label}></Chip>
    </Typography>
  )
})
export default OutlineChip
