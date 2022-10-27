import { styled, Tooltip, tooltipClasses, TooltipProps } from '@mui/material'

export const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#303030',
    color: '#e3e3e3',
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #444746',
  },
}))
