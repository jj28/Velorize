import { createTheme } from '@mui/material/styles';

// Velorize brand colors - Updated for Priority Expiration Dashboard
const theme = createTheme({
  palette: {
    primary: {
      main: '#3B82F6', // Blue 500
      light: '#60A5FA',
      dark: '#2563EB',
      contrastText: '#fff',
    },
    secondary: {
      main: '#64748B', // Slate 500
      light: '#94A3B8',
      dark: '#475569',
      contrastText: '#fff',
    },
    success: {
      main: '#10B981', // Emerald 500
      light: '#6EE7B7',
      dark: '#059669',
    },
    warning: {
      main: '#F59E0B', // Amber 500
      light: '#FCD34D',
      dark: '#D97706',
    },
    error: {
      main: '#DC2626', // Red 600 - Critical emphasis
      light: '#FCA5A5',
      dark: '#B91C1C',
    },
    background: {
      default: '#F8FAFC', // Slate 50
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A', // Slate 900
      secondary: '#64748B', // Slate 500
      disabled: '#CBD5E1', // Slate 300
    },
    divider: '#E2E8F0', // Slate 200
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12, // Softer corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '8px',
          boxShadow: 'none',
          padding: '8px 16px',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#2563EB',
          },
        },
        containedError: {
          background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)',
          },
        },
        outlined: {
          borderColor: '#E2E8F0',
          '&:hover': {
            borderColor: '#CBD5E1',
            backgroundColor: '#F8FAFC',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          border: '1px solid #E2E8F0',
          backgroundImage: 'none',
          borderRadius: '12px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          border: '1px solid #E2E8F0',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.75rem',
        },
        filledSuccess: {
          backgroundColor: '#D1FAE5',
          color: '#065F46',
        },
        filledWarning: {
          backgroundColor: '#FFFBEB',
          color: '#92400E',
        },
        filledError: {
          backgroundColor: '#FEF2F2',
          color: '#991B1B',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        filledError: {
          backgroundColor: '#FEF2F2',
          color: '#991B1B',
          border: '1px solid #FCA5A5',
        },
        filledWarning: {
          backgroundColor: '#FFFBEB',
          color: '#92400E',
          border: '1px solid #FCD34D',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#191f2d',
          color: '#FFFFFF',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          backgroundColor: '#191f2d',
        },
      },
    },
  },
});

export default theme;
