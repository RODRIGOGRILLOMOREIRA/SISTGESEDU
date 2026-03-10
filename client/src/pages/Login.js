import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  School,
  LockOutlined,
  PersonOutline,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { toast } from 'react-toastify';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
    tipoUsuario: 'admin'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schoolSettings, setSchoolSettings] = useState(null);

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    loadSchoolSettings();
  }, []);

  const loadSchoolSettings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/settings');
      setSchoolSettings(response.data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.senha);
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao fazer login';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/configuracoes?tab=senha');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDarkMode
          ? 'linear-gradient(135deg, #0A0E14 0%, #151A23 100%)'
          : 'linear-gradient(160deg, #FFF8E7 0%, #F5DEB3 30%, #E8C27A 65%, #D2A060 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Botão de Tema */}
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
        <Tooltip title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}>
          <IconButton 
            onClick={toggleTheme} 
            sx={{
              color: isDarkMode ? 'white' : '#8B4513',
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(139,69,19,0.12)',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(139,69,19,0.22)',
              }
            }}
          >
            {isDarkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Padrão de fundo: pontos (escuro) / crosshatch diagonal (claro) ── */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: isDarkMode
            ? 'radial-gradient(circle, rgba(0,206,209,0.22) 1.5px, transparent 1.5px)'
            : [
                'repeating-linear-gradient(45deg,  rgba(139,69,19,0.09) 0px, rgba(139,69,19,0.09) 1px, transparent 1px, transparent 22px)',
                'repeating-linear-gradient(-45deg, rgba(139,69,19,0.06) 0px, rgba(139,69,19,0.06) 1px, transparent 1px, transparent 22px)',
              ].join(', '),
          backgroundSize: isDarkMode ? '30px 30px' : 'auto',
        }}
      />

      {/* ── Círculo grande – canto superior direito ── */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 320,
          height: 320,
          borderRadius: '50%',
          pointerEvents: 'none',
          filter: isDarkMode ? 'none' : 'blur(45px)',
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(0,206,209,0.18) 0%, rgba(0,139,139,0.06) 70%, transparent 100%)'
            : 'rgba(180, 90, 20, 0.35)',
        }}
      />

      {/* ── Círculo grande – canto inferior esquerdo ── */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 420,
          height: 420,
          borderRadius: '50%',
          pointerEvents: 'none',
          filter: isDarkMode ? 'none' : 'blur(55px)',
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(0,206,209,0.12) 0%, rgba(0,139,139,0.04) 70%, transparent 100%)'
            : 'rgba(139, 69, 19, 0.3)',
        }}
      />

      {/* ── Forma média – canto superior esquerdo (círculo escuro / diamante claro) ── */}
      <Box
        sx={{
          position: 'absolute',
          top: isDarkMode ? -70 : -55,
          left: isDarkMode ? -70 : -55,
          width: isDarkMode ? 240 : 200,
          height: isDarkMode ? 240 : 200,
          borderRadius: isDarkMode ? '50%' : '18%',
          transform: isDarkMode ? 'none' : 'rotate(45deg)',
          pointerEvents: 'none',
          background: isDarkMode
            ? 'rgba(0, 206, 209, 0.07)'
            : 'rgba(139, 69, 19, 0.12)',
        }}
      />

      {/* ── Forma pequena – canto inferior direito (círculo escuro / diamante claro) ── */}
      <Box
        sx={{
          position: 'absolute',
          bottom: isDarkMode ? 60 : 50,
          right: isDarkMode ? -50 : -45,
          width: isDarkMode ? 180 : 150,
          height: isDarkMode ? 180 : 150,
          borderRadius: isDarkMode ? '50%' : '18%',
          transform: isDarkMode ? 'none' : 'rotate(45deg)',
          pointerEvents: 'none',
          background: isDarkMode
            ? 'rgba(0, 206, 209, 0.1)'
            : 'rgba(160, 82, 45, 0.15)',
        }}
      />

      {/* ── Acento flutuante – lateral esquerda (anel circular escuro / diamante claro) ── */}
      <Box
        sx={{
          position: 'absolute',
          top: '38%',
          left: '6%',
          width: isDarkMode ? 72 : 58,
          height: isDarkMode ? 72 : 58,
          borderRadius: isDarkMode ? '50%' : '14%',
          transform: isDarkMode ? 'none' : 'rotate(45deg)',
          pointerEvents: 'none',
          border: isDarkMode
            ? '2px solid rgba(0,206,209,0.35)'
            : '2.5px solid rgba(139,69,19,0.4)',
          background: isDarkMode ? 'transparent' : 'rgba(139,69,19,0.06)',
        }}
      />

      {/* ── Ponto de destaque – área superior central ── */}
      <Box
        sx={{
          position: 'absolute',
          top: '12%',
          right: '18%',
          width: 44,
          height: 44,
          borderRadius: isDarkMode ? '50%' : '14%',
          transform: isDarkMode ? 'none' : 'rotate(45deg)',
          pointerEvents: 'none',
          background: isDarkMode
            ? 'rgba(0, 206, 209, 0.25)'
            : 'rgba(160, 82, 45, 0.28)',
        }}
      />

      {/* ── Ponto de destaque – lateral direita ── */}
      <Box
        sx={{
          position: 'absolute',
          top: '62%',
          right: '7%',
          width: 28,
          height: 28,
          borderRadius: '50%',
          pointerEvents: 'none',
          background: isDarkMode
            ? 'rgba(0, 206, 209, 0.3)'
            : 'rgba(139, 69, 19, 0.32)',
        }}
      />

      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 4,
            backgroundColor: isDarkMode
              ? 'rgba(21, 26, 35, 0.97)'
              : 'rgba(230, 190, 138, 0.97)',
            backdropFilter: 'blur(10px)',
            border: isDarkMode
              ? '1px solid rgba(0,206,209,0.18)'
              : '1px solid rgba(139,69,19,0.22)',
            boxShadow: isDarkMode
              ? '0 6px 18px rgba(0,206,209,0.35), 0 12px 36px rgba(0,206,209,0.18)'
              : '0 6px 24px rgba(139,69,19,0.35), 0 12px 36px rgba(139,69,19,0.18)',
          }}
        >
          {/* Logo e Nome da Escola */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            {schoolSettings?.logo ? (
              <Avatar
                key={schoolSettings.logo}
                src={schoolSettings.logo}
                alt="Logo da Escola"
                imgProps={{ 
                  onError: (e) => {
                    console.error('Erro ao carregar logo no login');
                    e.target.style.display = 'none';
                  }
                }}
                sx={{ width: 80, height: 80, mb: 2 }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mb: 2,
                  bgcolor: 'primary.main',
                }}
              >
                <School sx={{ fontSize: 50 }} />
              </Avatar>
            )}
            
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                background: isDarkMode
                  ? 'linear-gradient(45deg, #00CED1 30%, #4FD9DC 90%)'
                  : 'linear-gradient(45deg, #8B4513 30%, #A0522D 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
              }}
            >
              {schoolSettings?.nomeEscola || 'Sistema de Gestão Escolar'}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Faça login para acessar o sistema
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Tipo de Usuário */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tipo de Usuário</InputLabel>
              <Select
                value={formData.tipoUsuario}
                label="Tipo de Usuário"
                onChange={(e) => setFormData({ ...formData, tipoUsuario: e.target.value })}
              >
                <MenuItem value="admin">Administrador</MenuItem>
                <MenuItem value="coordenador">Coordenador</MenuItem>
                <MenuItem value="professor">Professor</MenuItem>
                <MenuItem value="aluno">Aluno</MenuItem>
                <MenuItem value="responsavel">Responsável</MenuItem>
              </Select>
            </FormControl>

            {/* Email */}
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutline />
                  </InputAdornment>
                ),
              }}
            />

            {/* Senha */}
            <TextField
              fullWidth
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Link Esqueci a Senha */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={handleForgotPassword}
                sx={{ textDecoration: 'none' }}
              >
                Esqueceu a senha?
              </Link>
            </Box>

            {/* Botão de Login */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                background: isDarkMode
                  ? 'linear-gradient(45deg, #00CED1 30%, #4FD9DC 90%)'
                  : 'linear-gradient(45deg, #8B4513 30%, #A0522D 90%)',
                '&:hover': {
                  background: isDarkMode
                    ? 'linear-gradient(45deg, #008B8B 30%, #00CED1 90%)'
                    : 'linear-gradient(45deg, #654321 30%, #8B4513 90%)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
            </Button>
          </form>

          {/* Link de Cadastro */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Não tem uma conta?{' '}
              <Link
                component={RouterLink}
                to="/register"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Cadastre-se
              </Link>
            </Typography>
          </Box>

          {/* Informações Adicionais */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} {schoolSettings?.nomeEscola || 'Sistema de Gestão Escolar'}. Todos os direitos reservados.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
