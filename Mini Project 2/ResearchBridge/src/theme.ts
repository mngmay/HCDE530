import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: '#5B21B6',
      light: '#7C3AED',
      dark: '#3B0F8C',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#D97706',
      light: '#F59E0B',
      dark: '#B45309',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F8F7F4',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1C1917',
      secondary: '#78716C',
    },
    divider: 'rgba(0,0,0,0.08)',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
    overline: { letterSpacing: '0.12em', fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;
