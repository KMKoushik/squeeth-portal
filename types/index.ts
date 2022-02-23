declare module '@mui/material/styles/createPalette' {
  interface TypeBackground {
    base?: string
    surface?: string
    overlayDark?: string
    overlayLight?: string
  }
}

export enum HedgeType {
  TIME_HEDGE = 1,
  PRICE_HEDGE,
  TIME_HEDGE_ON_UNISWAP,
  PRICE_HEDGE_ON_UNISWAP,
}
