import { createTheme } from '@mui/material'

declare module '@mui/material/styles' {
  interface TypographyVariants {
    numeric: React.CSSProperties
  }

  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    numeric?: React.CSSProperties
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    numeric: true
  }
}

const darkTheme = createTheme({
  typography: {
    fontFamily: ['Inter', 'Roboto', '"Helvetic Neue"'].join(','),
    h6: {
      fontFamily: ['Space Mono', 'Michroma', 'Roboto'].join(','),
      fontWeight: 600,
      letterSpacing: 1.5,
    },
    h5: {
      fontFamily: ['Space Mono', 'Michroma', 'Roboto'].join(','),
      fontWeight: 600,
      letterSpacing: 1.5,
    },
    body2: {
      fontFamily: ['Space Mono'].join(','),
    },
    numeric: {
      fontFamily: ['Space Mono', 'Michroma', 'Roboto'].join(','),
    },
  },
  palette: {
    mode: 'dark',
    primary: {
      main: 'rgba(26, 232, 255)',
      contrastText: '#FFFFFF',
      light: 'rgba(26, 232, 255, 0.08)',
    },
    secondary: {
      main: '#ff2e17',
    },
    error: {
      main: '#ff1f62',
    },
    warning: {
      light: '#F5B07326',
      main: '#F5B073',
    },
    success: {
      main: '#17ffa2',
      light: '#B2F0C5',
    },
    background: {
      base: '#1F2023',
      surface: '#27292D',
      overlayDark: '#2D2F34',
      overlayLight: '#383B40',
      default: '#1F2023',
      paper: '#1F2023',
    },
    text: {
      primary: 'rgb(255 255 255 / 90%)',
      secondary: 'rgb(255 255 255 / 65%)',
    },
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true, // No more ripple!
      },
    },
  },
})

export default darkTheme
