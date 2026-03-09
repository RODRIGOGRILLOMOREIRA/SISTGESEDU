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
  primary: '#8B4513',
  secondary: '#A0522D',
  background: '#F5DEB3',
  paper: '#E6BE8A',
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
    MuiCssBaseline: {
      styleOverrides: {
        '*::-webkit-scrollbar': {
          width: '18px', // 50% mais larga para modo escuro
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: '#151A23', // Cor do paper no tema escuro
          borderLeft: '1px solid rgba(0, 206, 209, 0.2)',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: '#00CED1', // Ciano
          borderRadius: '10px',
          border: '4px solid #151A23',
          '&:hover': {
            backgroundColor: '#00FFFF', // Ciano mais claro no hover
          },
          '&:active': {
            backgroundColor: '#008B8B', // Ciano escuro no click
          },
        },
        '*': {
          scrollbarWidth: 'auto', // Para Firefox
          scrollbarColor: '#00CED1 #151A23', // thumb track (Firefox)
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          // Cores definidas inline no Layout.js via sx prop
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
      light: '#A0522D',
      dark: '#654321',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: lightColors.secondary,
      light: '#D2691E',
      dark: '#704214',
      contrastText: '#FFFFFF',
    },
    background: {
      default: lightColors.background,
      paper: lightColors.paper,
    },
    text: {
      primary: lightColors.text,
      secondary: lightColors.primary,
    },
    divider: 'rgba(139, 69, 19, 0.12)',
    action: {
      active: lightColors.primary,
      hover: 'rgba(139, 69, 19, 0.08)',
      selected: 'rgba(139, 69, 19, 0.16)',
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
    MuiCssBaseline: {
      styleOverrides: {
        '*::-webkit-scrollbar': {
          width: '12px', // Largura padrão para modo claro
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: '#F5DEB3', // Cor mel do background no tema claro
          borderLeft: '1px solid rgba(139, 69, 19, 0.2)',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: '#8B4513', // Marrom
          borderRadius: '10px',
          border: '3px solid #F5DEB3',
          '&:hover': {
            backgroundColor: '#A0522D', // Marrom claro no hover
          },
          '&:active': {
            backgroundColor: '#654321', // Marrom escuro no click
          },
        },
        '*': {
          scrollbarWidth: 'auto', // Para Firefox
          scrollbarColor: '#8B4513 #F5DEB3', // thumb track (Firefox)
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          // Cores, sombra e borda definidas inline no Layout.js via sx prop
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#D2B48C',
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
          boxShadow: '0 4px 12px rgba(139, 69, 19, 0.2)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(139, 69, 19, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '2px solid #FFFFFF',
          boxShadow: '0 4px 16px rgba(139, 69, 19, 0.5), 0 8px 24px rgba(139, 69, 19, 0.3)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(139, 69, 19, 0.15)',
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
            backgroundColor: 'rgba(139, 69, 19, 0.08)',
            boxShadow: '0 2px 8px rgba(139, 69, 19, 0.4)',
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
