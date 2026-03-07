import { createTheme } from '@mui/material/styles';

// Cores principais
const cyanGreen = {
  main: '#00CED1',      // Verde ciano principal
  light: '#4FD9DC',     // Verde ciano claro
  dark: '#008B8B',      // Verde ciano escuro
  contrastText: '#000', // Texto em contraste
};

const darkColors = {
  primary: '#00CED1',
  secondary: '#00FFFF',
  background: '#0A0E14',
  paper: '#151A23',
  text: '#E6E8EA',
};

const lightColors = {
  primary: '#00CED1',
  secondary: '#4FD9DC',
  background: '#F5F5F0',
  paper: '#B5B5B5',
  text: '#1A1A1A',
};

// Tema Escuro
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: darkColors.primary,
      light: '#4FD9DC',
      dark: '#007B7F',
      contrastText: '#000000',
    },
    secondary: {
      main: darkColors.secondary,
      light: '#66FFFF',
      dark: '#00CCCC',
      contrastText: '#000000',
    },
    background: {
      default: darkColors.background,
      paper: darkColors.paper,
    },
    text: {
      primary: darkColors.text,
      secondary: darkColors.primary,
    },
    divider: 'rgba(0, 206, 209, 0.12)',
    action: {
      active: darkColors.primary,
      hover: 'rgba(0, 206, 209, 0.08)',
      selected: 'rgba(0, 206, 209, 0.16)',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Inter", "Roboto", sans-serif',
    h1: { 
      color: darkColors.primary,
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h2: { 
      color: darkColors.primary,
      fontWeight: 700,
      letterSpacing: '-0.3px',
    },
    h3: { 
      color: darkColors.primary,
      fontWeight: 600,
      letterSpacing: '-0.2px',
    },
    h4: { 
      color: darkColors.primary,
      fontWeight: 600,
    },
    h5: { 
      color: darkColors.primary,
      fontWeight: 600,
    },
    h6: { 
      color: darkColors.primary,
      fontWeight: 600,
    },
    body1: {
      fontFamily: '"Inter", "Roboto", sans-serif',
    },
    body2: {
      fontFamily: '"Inter", "Roboto", sans-serif',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          color: darkColors.primary,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#000000',
          borderRight: `1px solid ${darkColors.primary}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 4px 12px rgba(0, 206, 209, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(0, 206, 209, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid rgba(0, 206, 209, 0.2)`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 206, 209, 0.1)',
          '& .MuiTableCell-head': {
            color: darkColors.primary,
            fontWeight: 700,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 206, 209, 0.05)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderColor: darkColors.primary,
        },
      },
    },
  },
});

// Tema Claro
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: lightColors.primary,
      light: '#4FD9DC',
      dark: '#008B8B',
      contrastText: '#000000',
    },
    secondary: {
      main: lightColors.secondary,
      light: '#66FFFF',
      dark: '#00A8A8',
      contrastText: '#000000',
    },
    background: {
      default: lightColors.background,
      paper: lightColors.paper,
    },
    text: {
      primary: lightColors.text,
      secondary: lightColors.primary,
    },
    divider: 'rgba(0, 139, 139, 0.12)',
    action: {
      active: lightColors.primary,
      hover: 'rgba(0, 139, 139, 0.08)',
      selected: 'rgba(0, 139, 139, 0.16)',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Inter", "Roboto", sans-serif',
    h1: { 
      color: lightColors.primary,
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h2: { 
      color: lightColors.primary,
      fontWeight: 700,
      letterSpacing: '-0.3px',
    },
    h3: { 
      color: lightColors.primary,
      fontWeight: 600,
      letterSpacing: '-0.2px',
    },
    h4: { 
      color: lightColors.primary,
      fontWeight: 600,
    },
    h5: { 
      color: lightColors.primary,
      fontWeight: 600,
    },
    h6: { 
      color: lightColors.primary,
      fontWeight: 600,
    },
    body1: {
      fontFamily: '"Inter", "Roboto", sans-serif',
    },
    body2: {
      fontFamily: '"Inter", "Roboto", sans-serif',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#858585',
          color: lightColors.primary,
          boxShadow: '0 2px 8px rgba(0, 206, 209, 0.3)',
          border: '2px solid #FFFFFF',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#959595',
          borderRight: '2px solid #FFFFFF',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          border: '2px solid #FFFFFF',
          boxShadow: '0 4px 12px rgba(0, 139, 139, 0.2)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(0, 139, 139, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '2px solid #FFFFFF',
          boxShadow: '0 4px 16px rgba(0, 206, 209, 0.5), 0 8px 24px rgba(0, 206, 209, 0.3)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 206, 209, 0.15)',
          borderTop: '2px solid #FFFFFF',
          borderBottom: '2px solid #FFFFFF',
          '& .MuiTableCell-head': {
            color: lightColors.primary,
            fontWeight: 700,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 206, 209, 0.08)',
            boxShadow: '0 2px 8px rgba(0, 206, 209, 0.4)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 16px rgba(0, 206, 209, 0.4), 0 8px 24px rgba(0, 206, 209, 0.2)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          border: '2px solid #FFFFFF',
        },
      },
    },
  },
});
