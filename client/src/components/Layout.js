import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  School,
  Class,
  People,
  Person,
  Assessment,
  Assignment,
  Logout,
  Home as HomeIcon,
  Brightness4,
  Brightness7,
  Summarize,
  EventNote,
  Settings,
  GitHub,
  LinkedIn,
  Instagram,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { useSchool } from '../context/SchoolContext';

const drawerWidth = 240;
const drawerWidthCollapsed = 80;

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { schoolSettings, refreshKey } = useSchool();

  // Debug: Log quando schoolSettings mudar
  React.useEffect(() => {
    console.log('Layout - SchoolSettings atualizadas:', schoolSettings);
    console.log('RefreshKey:', refreshKey);
  }, [schoolSettings, refreshKey]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerCollapse = () => {
    setDrawerCollapsed(!drawerCollapsed);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Início', icon: <HomeIcon />, path: '/' },
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Professores', icon: <School />, path: '/professores' },
    { text: 'Disciplinas', icon: <Class />, path: '/disciplinas' },
    { text: 'Turmas', icon: <People />, path: '/turmas' },
    { text: 'Alunos', icon: <Person />, path: '/alunos' },
    { text: 'Avaliações', icon: <Assessment />, path: '/avaliacoes' },
    { text: 'Habilidades', icon: <Assignment />, path: '/habilidades' },
    { text: 'Frequências', icon: <EventNote />, path: '/frequencias' },
    { text: 'Relatórios', icon: <Summarize />, path: '/relatorios' },
    { text: 'Configurações', icon: <Settings />, path: '/configuracoes' },
  ];

  const drawer = (
    <div>
      <Toolbar />
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
        <IconButton 
          onClick={handleDrawerCollapse}
          sx={{
            color: (theme) => theme.palette.mode === 'light' ? '#8B4513' : 'inherit',
          }}
        >
          <MenuIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Tooltip title={drawerCollapsed ? item.text : ''} placement="right">
              <ListItemButton onClick={() => navigate(item.path)}>
                <ListItemIcon sx={{ 
                  minWidth: drawerCollapsed ? 'auto' : 56, 
                  justifyContent: 'center',
                  color: (theme) => theme.palette.mode === 'light' ? '#8B4513' : undefined,
                }}>
                  {item.icon}
                </ListItemIcon>
                {!drawerCollapsed && (
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      sx: {
                        color: (theme) => theme.palette.mode === 'light' ? '#8B4513' : undefined,
                        fontWeight: (theme) => theme.palette.mode === 'light' ? 700 : undefined,
                      }
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <Tooltip title={drawerCollapsed ? 'Sair' : ''} placement="right">
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon sx={{ 
                minWidth: drawerCollapsed ? 'auto' : 56, 
                justifyContent: 'center',
                color: (theme) => theme.palette.mode === 'light' ? '#8B4513' : undefined,
              }}>
                <Logout />
              </ListItemIcon>
              {!drawerCollapsed && (
                <ListItemText 
                  primary="Sair"
                  primaryTypographyProps={{
                    sx: {
                      color: (theme) => theme.palette.mode === 'light' ? '#8B4513' : undefined,
                      fontWeight: (theme) => theme.palette.mode === 'light' ? 700 : undefined,
                    }
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
      <Divider />
      
      {/* Redes Sociais */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: drawerCollapsed ? 0 : 2,
        flexDirection: drawerCollapsed ? 'column' : 'row',
        py: 2,
        px: 1
      }}>
        <Tooltip title="GitHub">
          <IconButton
            component="a"
            href="https://github.com/RODRIGOGRILLOMOREIRA"
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              color: (theme) => theme.palette.mode === 'dark' ? '#00CED1' : '#8B4513',
              '&:hover': {
                color: (theme) => theme.palette.mode === 'dark' ? '#00FFFF' : '#D2691E',
                transform: 'scale(1.2)',
              },
            }}
          >
            <GitHub />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="LinkedIn">
          <IconButton
            component="a"
            href="https://www.linkedin.com/in/rodrigogrillomoreira"
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              color: (theme) => theme.palette.mode === 'dark' ? '#00CED1' : '#8B4513',
              '&:hover': {
                color: (theme) => theme.palette.mode === 'dark' ? '#00FFFF' : '#D2691E',
                transform: 'scale(1.2)',
              },
            }}
          >
            <LinkedIn />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Instagram">
          <IconButton
            component="a"
            href="https://www.instagram.com/rodrigogrillomoreira"
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              color: (theme) => theme.palette.mode === 'dark' ? '#00CED1' : '#8B4513',
              '&:hover': {
                color: (theme) => theme.palette.mode === 'dark' ? '#00FFFF' : '#D2691E',
                transform: 'scale(1.2)',
              },
            }}
          >
            <Instagram />
          </IconButton>
        </Tooltip>
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0A0E14 0%, #1a2332 100%)'
            : 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            ml: { xs: 0, sm: 2 }
          }}>
            {schoolSettings?.logo && (
              <Avatar
                key={`appbar-logo-${refreshKey}`}
                src={schoolSettings.logo}
                alt="Logo da Escola"
                imgProps={{ 
                  onError: (e) => {
                    console.error('Erro ao carregar logo no appbar');
                    e.target.style.display = 'none';
                  }
                }}
                sx={{ width: 40, height: 40, mr: 2 }}
              />
            )}
            <Typography 
              variant="h5" 
              component="div" 
              sx={{ 
                fontFamily: '"Poppins", "Roboto", sans-serif',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textShadow: '1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8), 1px -1px 2px rgba(255,255,255,0.8), -1px 1px 2px rgba(255,255,255,0.8)',
              }}
            >
              {schoolSettings?.nomeEscola || 'Sistema de Gerenciamento Escolar'}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Typography 
            variant="h5" 
            sx={{ 
              mr: 2,
              fontFamily: '"Poppins", "Roboto", sans-serif',
              fontWeight: 700,
              letterSpacing: '0.5px',
              textShadow: '1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8), 1px -1px 2px rgba(255,255,255,0.8), -1px 1px 2px rgba(255,255,255,0.8)',
            }}
          >
            {user?.nome} ({user?.tipo})
          </Typography>
          <Tooltip title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}>
            <IconButton onClick={toggleTheme} color="inherit">
              {isDarkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerCollapsed ? drawerWidthCollapsed : drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerCollapsed ? drawerWidthCollapsed : drawerWidth,
              transition: 'width 0.3s ease',
              overflowX: 'hidden'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerCollapsed ? drawerWidthCollapsed : drawerWidth}px)` },
          transition: 'width 0.3s ease',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
