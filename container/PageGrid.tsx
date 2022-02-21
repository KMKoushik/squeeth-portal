import { Grid } from '@mui/material'
import * as React from 'react'

const PageGrid = React.memo(function PageGrid({ children }) {
  return (
    <Grid container>
      <Grid item xs={0} md={2} />
      <Grid item xs={12} md={8}>
        {children}
      </Grid>
      <Grid item xs={0} md={2} />
    </Grid>
  )
})

export default PageGrid
