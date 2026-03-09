import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * Componente de loading para React.lazy() Suspense
 * Exibe um spinner elegante durante o carregamento de páginas
 */
const LoadingFallback = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        gap: 2,
      }}
    >
      <CircularProgress 
        size={60}
        thickness={4}
        sx={{ 
          color: theme.palette.primary.main,
        }}
      />
      <Typography 
        variant="h6" 
        sx={{ 
          color: theme.palette.text.secondary,
          fontWeight: 500,
        }}
      >
        Carregando...
      </Typography>
    </Box>
  );
};

export default LoadingFallback;
