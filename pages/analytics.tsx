import React from 'react'
import useSWR from 'swr'
import { NextPage } from 'next'

import { Box, CircularProgress, Grid, Typography } from '@mui/material'
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined'
import MouseOutlinedIcon from '@mui/icons-material/MouseOutlined'

import PieChart from '../components/charts/pieChart'
import { Nav } from '../container/Nav'

const Analytics: NextPage = () => {
  return (
    <>
      <Nav />
      <Grid container spacing={2} justifyContent="space-around" padding={3}>
        <Grid item xs={12} sm={6} md={3} mb={4}>
          <Typography textAlign="center" variant="h6" mb={1}>
            <MouseOutlinedIcon color="disabled" sx={{ verticalAlign: 'middle' }} /> Page Actions
          </Typography>
          <ActionAnalytics />
        </Grid>
        <Grid item xs={12} sm={6} md={3} mb={4}>
          <Typography textAlign="center" variant="h6" mb={1}>
            <RemoveRedEyeOutlinedIcon color="disabled" sx={{ verticalAlign: 'middle' }} /> Page Views
          </Typography>
          <ViewsAnalytics />
        </Grid>
      </Grid>
    </>
  )
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

const ViewsAnalytics = React.memo(function ViewsAnalytics() {
  const { data, error } = useSWR('/api/views/slug', fetcher)

  if (error)
    return (
      <Box>
        <Typography color="error">An error has occurred while getting views analytics - {error?.message}</Typography>
      </Box>
    )
  if (!data)
    return (
      <Box sx={{ display: 'flex', height: '30vh', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress color="primary" />
      </Box>
    )

  const labels = data.map((each: any) => each.slug as string)
  const values = data.map((each: any) => each.view_count as number)

  return <PieChart labels={labels} values={values} />
})

const ActionAnalytics = React.memo(function ActionAnalytics() {
  const { data, error } = useSWR('/api/actions/activity', fetcher)

  if (error)
    return (
      <Box>
        <Typography color="error">An error has occurred while getting Action analytics - {error?.message}</Typography>
      </Box>
    )
  if (!data)
    return (
      <Box sx={{ display: 'flex', height: '30vh', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress color="primary" />
      </Box>
    )

  const labels = data.map((each: any) => each.activity as string)
  const values = data.map((each: any) => each.activity_count as number)

  return (
    <>
      <PieChart labels={labels} values={values} />
    </>
  )
})

export default Analytics
