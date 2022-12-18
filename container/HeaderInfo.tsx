import { Typography } from '@mui/material'
import { Box } from '@mui/system'

interface HeaderInfoParamType {
  items: Array<{ title: string; value: string; unit?: string; prefix?: string }>
}

export const HeaderInfo: React.FC<HeaderInfoParamType> = ({ items }) => {
  return (
    <Box
      border="1px solid grey"
      borderRadius={2}
      p={2}
      px={5}
      display="flex"
      overflow="auto"
      alignItems="center"
      width="fit-content"
    >
      {items.map(({ title, value, unit, prefix }, i) => (
        <Box key={title} display="flex">
          <Box display="flex" flexDirection="column" justifyContent="center">
            <Typography color="textSecondary" variant="caption">
              {title}
            </Typography>
            <Typography variant="numeric">
              {prefix}
              {value} <small>{unit}</small>
            </Typography>
          </Box>
          {items.length !== i + 1 ? <Box border=".2px solid grey" height="50px" ml={2} mr={2} /> : null}
        </Box>
      ))}
    </Box>
  )
}
