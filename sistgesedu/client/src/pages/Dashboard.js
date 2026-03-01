import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Fade,
  Zoom,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Badge,
} from '@mui/material';
import {
  AssessmentOutlined,
  SchoolOutlined,
  CheckCircleOutlined,
  TrendingUpOutlined,
  PeopleOutlined,
  EventAvailableOutlined,
  WarningAmberOutlined,
  EventBusyOutlined,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as TooltipChart,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { dashboardService, turmaService, disciplinaService, alunoService, frequenciaService } from '../services';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import { Dashboard as DashboardIcon } from '@mui/icons-material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  TooltipChart,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Dashboard = () => {
  const [turmas, setTurmas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [filters, setFilters] = useState({
    turma: '',
    aluno: '',
    disciplina: '',
    ano: new Date().getFullYear(),
    trimestre: '',
    dataInicio: '',
    dataFim: '',
    pontoCorte: 6.0,
  });

  const [estatisticas, setEstatisticas] = useState(null);
  const [desempenhoDisciplina, setDesempenhoDisciplina] = useState([]);
  const [evolucaoTrimestral, setEvolucaoTrimestral] = useState([]);
  const [evolucaoHabilidades, setEvolucaoHabilidades] = useState(null);
  const [distribuicaoHabilidades, setDistribuicaoHabilidades] = useState(null);
  const [dashboardFrequencia, setDashboardFrequencia] = useState(null);
  const [frequenciaFiltros, setFrequenciaFiltros] = useState(['todos']);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (filters.turma) {
      loadAlunos();
    } else {
      setAlunos([]);
      setFilters(prev => ({ ...prev, aluno: '' }));
    }
  }, [filters.turma]);

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadDashboardData();
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, filters]);

  const loadInitialData = async () => {
    try {
      const [turmasData, disciplinasData] = await Promise.all([
        turmaService.getAll(),
        disciplinaService.getAll(),
      ]);
      setTurmas(turmasData);
      setDisciplinas(disciplinasData);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    }
  };

  const loadAlunos = async () => {
    try {
      const alunosData = await alunoService.getAll({ turma: filters.turma });
      setAlunos(alunosData);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      setAlunos([]);
    }
  };

  const loadDashboardData = async () => {
    try {
      const params = {};
      if (filters.turma) params.turma = filters.turma;
      if (filters.aluno) params.aluno = filters.aluno;
      if (filters.disciplina) params.disciplina = filters.disciplina;
      if (filters.ano) params.ano = filters.ano;
      if (filters.trimestre) params.trimestre = filters.trimestre;
      if (filters.dataInicio) params.dataInicio = filters.dataInicio;
      if (filters.dataFim) params.dataFim = filters.dataFim;
      if (filters.pontoCorte) params.pontoCorte = filters.pontoCorte;

      const [stats, desempenho, evolucao, evolHab, distHab, dashFreq] = await Promise.all([
        dashboardService.getEstatisticas(params),
        dashboardService.getDesempenhoDisciplina(params),
        dashboardService.getEvolucaoTrimestral(params),
        dashboardService.getEvolucaoHabilidades(params),
        dashboardService.getDistribuicaoNiveisHabilidades(params),
        frequenciaService.getDashboard(params),
      ]);

      setEstatisticas(stats);
      setDesempenhoDisciplina(desempenho);
      setEvolucaoTrimestral(evolucao);
      setEvolucaoHabilidades(evolHab);
      setDistribuicaoHabilidades(distHab);
      setDashboardFrequencia(dashFreq);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  };

  const chartDataDesempenho = {
    labels: desempenhoDisciplina.map((d) => d.disciplina),
    datasets: [
      {
        label: 'Média por Disciplina',
        data: desempenhoDisciplina.map((d) => d.media),
        backgroundColor: 'rgba(25, 118, 210, 0.6)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartDataEvolucao = {
    labels: evolucaoTrimestral.map((e) => `${e.trimestre}º Trimestre`),
    datasets: [
      {
        label: 'Evolução da Média',
        data: evolucaoTrimestral.map((e) => e.media),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const chartDataAprovacao = estatisticas ? {
    labels: ['Aprovados', 'Reprovados'],
    datasets: [
      {
        data: [estatisticas.aprovados, estatisticas.reprovados],
        backgroundColor: ['rgba(76, 175, 80, 0.6)', 'rgba(244, 67, 54, 0.6)'],
        borderColor: ['rgba(76, 175, 80, 1)', 'rgba(244, 67, 54, 1)'],
        borderWidth: 1,
      },
    ],
  } : null;

  // Gráficos de Habilidades
  const chartDataEvolucaoHabilidades = evolucaoHabilidades ? {
    labels: ['1º Trimestre', '2º Trimestre', '3º Trimestre'],
    datasets: [
      {
        label: 'Evolução de Habilidades (%)',
        data: [
          parseFloat(evolucaoHabilidades[1]?.percentual || 0),
          parseFloat(evolucaoHabilidades[2]?.percentual || 0),
          parseFloat(evolucaoHabilidades[3]?.percentual || 0)
        ],
        borderColor: 'rgb(156, 39, 176)',
        backgroundColor: 'rgba(156, 39, 176, 0.2)',
        tension: 0.1,
      },
    ],
  } : null;

  const chartDataDistribuicaoHabilidades = distribuicaoHabilidades ? {
    labels: ['Não Desenvolvido', 'Em Desenvolvimento', 'Desenvolvido', 'Plenamente Desenvolvido'],
    datasets: [
      {
        data: [
          distribuicaoHabilidades.distribuicao?.['nao-desenvolvido']?.quantidade || 0,
          distribuicaoHabilidades.distribuicao?.['em-desenvolvimento']?.quantidade || 0,
          distribuicaoHabilidades.distribuicao?.['desenvolvido']?.quantidade || 0,
          distribuicaoHabilidades.distribuicao?.['plenamente-desenvolvido']?.quantidade || 0,
        ],
        backgroundColor: [
          'rgba(244, 67, 54, 0.6)',
          'rgba(255, 152, 0, 0.6)',
          'rgba(33, 150, 243, 0.6)',
          'rgba(76, 175, 80, 0.6)',
        ],
        borderColor: [
          'rgba(244, 67, 54, 1)',
          'rgba(255, 152, 0, 1)',
          'rgba(33, 150, 243, 1)',
          'rgba(76, 175, 80, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  return (
    <Container maxWidth="xl">
      <PageHeader 
        title="Dashboard Analítico"
        subtitle="Visualize métricas e indicadores de desempenho acadêmico"
        icon={DashboardIcon}
      />

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          {/* LINHA 1: Turma, Aluno, Disciplina */}
          <Grid item xs={12} sm={4} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Turma</InputLabel>
              <Select
                value={filters.turma}
                label="Turma"
                onChange={(e) => setFilters({ ...filters, turma: e.target.value, aluno: '' })}
              >
                <MenuItem value="">Todas</MenuItem>
                {turmas.map((t) => (
                  <MenuItem key={t._id} value={t._id}>
                    {t.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={4}>
            <FormControl fullWidth size="small" disabled={!filters.turma}>
              <InputLabel>Aluno</InputLabel>
              <Select
                value={filters.aluno}
                label="Aluno"
                onChange={(e) => setFilters({ ...filters, aluno: e.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                {alunos.map((a) => (
                  <MenuItem key={a._id} value={a._id}>
                    {a.nome} - {a.matricula}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Disciplina</InputLabel>
              <Select
                value={filters.disciplina}
                label="Disciplina"
                onChange={(e) => setFilters({ ...filters, disciplina: e.target.value })}
              >
                <MenuItem value="">Todas</MenuItem>
                {disciplinas.map((d) => (
                  <MenuItem key={d._id} value={d._id}>
                    {d.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* LINHA 2: Ano, Trimestre, Data Início, Data Fim, Ponto de Corte */}
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel>Ano</InputLabel>
              <Select
                value={filters.ano}
                label="Ano"
                onChange={(e) => setFilters({ ...filters, ano: e.target.value })}
              >
                <MenuItem value={2024}>2024</MenuItem>
                <MenuItem value={2025}>2025</MenuItem>
                <MenuItem value={2026}>2026</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel>Trimestre</InputLabel>
              <Select
                value={filters.trimestre}
                label="Trimestre"
                onChange={(e) => setFilters({ ...filters, trimestre: e.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value={1}>1º Trimestre</MenuItem>
                <MenuItem value={2}>2º Trimestre</MenuItem>
                <MenuItem value={3}>3º Trimestre</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Data Início"
              value={filters.dataInicio}
              onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Data Fim"
              value={filters.dataFim}
              onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: filters.dataInicio }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel>Ponto de Corte</InputLabel>
              <Select
                value={filters.pontoCorte}
                label="Ponto de Corte"
                onChange={(e) => setFilters({ ...filters, pontoCorte: e.target.value })}
              >
                <MenuItem value={5.0}>5.0</MenuItem>
                <MenuItem value={6.0}>6.0</MenuItem>
                <MenuItem value={7.0}>7.0</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Cards de Estatísticas */}
      {estatisticas && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} timeout={300}>
              <Card 
                sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(102, 126, 234, 0.4)',
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography sx={{ opacity: 0.9, fontSize: '0.875rem' }} gutterBottom>
                        Total de Avaliações
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">{estatisticas.totalAvaliacoes}</Typography>
                    </Box>
                    <AssessmentOutlined sx={{ fontSize: 48, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} timeout={400}>
              <Card 
                sx={{ 
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(79, 172, 254, 0.4)',
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography sx={{ opacity: 0.9, fontSize: '0.875rem' }} gutterBottom>
                        Média Geral
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">{estatisticas.mediaGeral.toFixed(2)}</Typography>
                    </Box>
                    <TrendingUpOutlined sx={{ fontSize: 48, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} timeout={500}>
              <Card 
                sx={{ 
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  color: 'white',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(67, 233, 123, 0.4)',
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography sx={{ opacity: 0.9, fontSize: '0.875rem' }} gutterBottom>
                        Aprovados
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">{estatisticas.aprovados}</Typography>
                    </Box>
                    <CheckCircleOutlined sx={{ fontSize: 48, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} timeout={600}>
              <Card 
                sx={{ 
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  color: 'white',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(250, 112, 154, 0.4)',
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography sx={{ opacity: 0.9, fontSize: '0.875rem' }} gutterBottom>
                        % Aprovação
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">{estatisticas.percentualAprovacao}%</Typography>
                    </Box>
                    <SchoolOutlined sx={{ fontSize: 48, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>
      )}

      {/* Gráficos */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Fade in={true} timeout={800}>
            <Paper 
              sx={{ 
                p: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="600">
                Desempenho por Disciplina
              </Typography>
              <Box sx={{ height: 300 }}>
              <Bar data={chartDataDesempenho} options={{ maintainAspectRatio: false }} />
            </Box>
          </Paper>
          </Fade>
        </Grid>
        <Grid item xs={12} md={6}>
          <Fade in={true} timeout={900}>
            <Paper 
              sx={{ 
                p: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="600">
                Aprovação x Reprovação
              </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              {chartDataAprovacao && (
                <Pie data={chartDataAprovacao} options={{ maintainAspectRatio: false }} />
              )}
            </Box>
          </Paper>
          </Fade>
        </Grid>
        <Grid item xs={12}>
          <Fade in={true} timeout={1000}>
            <Paper 
              sx={{ 
                p: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="600">
                Evolução Trimestral
              </Typography>
            <Box sx={{ height: 300 }}>
              <Line data={chartDataEvolucao} options={{ maintainAspectRatio: false }} />
            </Box>
          </Paper>
          </Fade>
        </Grid>

        {/* Gráficos de Habilidades */}
        <Grid item xs={12} md={6}>
          <Fade in={true} timeout={1100}>
            <Paper 
              sx={{ 
                p: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="600">
                📚 Evolução de Habilidades por Trimestre
              </Typography>
            <Box sx={{ height: 300 }}>
              {chartDataEvolucaoHabilidades ? (
                <Line 
                  data={chartDataEvolucaoHabilidades} 
                  options={{ 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: function(value) {
                            return value + '%';
                          }
                        }
                      }
                    }
                  }} 
                />
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 10 }}>
                  Nenhum dado de habilidades disponível
                </Typography>
              )}
            </Box>
          </Paper>
          </Fade>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Fade in={true} timeout={1200}>
            <Paper 
              sx={{ 
                p: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="600">
                🎯 Distribuição de Níveis de Habilidades
              </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              {chartDataDistribuicaoHabilidades && distribuicaoHabilidades?.total > 0 ? (
                <Pie 
                  data={chartDataDistribuicaoHabilidades} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const nivel = label.toLowerCase().replace(' ', '-');
                            const percentual = distribuicaoHabilidades.distribuicao?.[nivel]?.percentual || 0;
                            return `${label}: ${value} (${percentual}%)`;
                          }
                        }
                      }
                    }
                  }} 
                />
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 10 }}>
                  Nenhuma habilidade avaliada
                </Typography>
              )}
            </Box>
          </Paper>
          </Fade>
        </Grid>

        {distribuicaoHabilidades && distribuicaoHabilidades.total > 0 && (
          <Grid item xs={12}>
            <Fade in={true} timeout={1300}>
              <Paper 
                sx={{ 
                  p: 3,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                <Typography variant="h6" gutterBottom fontWeight="600">
                  📊 Estatísticas de Habilidades
                </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'error.light' }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Não Desenvolvido
                      </Typography>
                      <Typography variant="h4">
                        {distribuicaoHabilidades.distribuicao?.['nao-desenvolvido']?.quantidade || 0}
                      </Typography>
                      <Typography variant="caption">
                        {distribuicaoHabilidades.distribuicao?.['nao-desenvolvido']?.percentual || 0}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'warning.light' }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Em Desenvolvimento
                      </Typography>
                      <Typography variant="h4">
                        {distribuicaoHabilidades.distribuicao?.['em-desenvolvimento']?.quantidade || 0}
                      </Typography>
                      <Typography variant="caption">
                        {distribuicaoHabilidades.distribuicao?.['em-desenvolvimento']?.percentual || 0}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'info.light' }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Desenvolvido
                      </Typography>
                      <Typography variant="h4">
                        {distribuicaoHabilidades.distribuicao?.['desenvolvido']?.quantidade || 0}
                      </Typography>
                      <Typography variant="caption">
                        {distribuicaoHabilidades.distribuicao?.['desenvolvido']?.percentual || 0}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'success.light' }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Plenamente Desenvolvido
                      </Typography>
                      <Typography variant="h4">
                        {distribuicaoHabilidades.distribuicao?.['plenamente-desenvolvido']?.quantidade || 0}
                      </Typography>
                      <Typography variant="caption">
                        {distribuicaoHabilidades.distribuicao?.['plenamente-desenvolvido']?.percentual || 0}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
            </Fade>
          </Grid>
        )}

        {/* Seção de Frequências em Tempo Real */}
        {dashboardFrequencia && (
          <>
            <Grid item xs={12}>
              <Fade in={true} timeout={1400}>
                <Paper 
                  sx={{ 
                    p: 3,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="h6" fontWeight="600">
                      📅 Dashboard de Frequência em Tempo Real
                    </Typography>
                    
                    {/* Badge de Contexto */}
                    <Chip
                      icon={<AssessmentOutlined />}
                      label={
                        filters.disciplina 
                          ? `Disciplina: ${disciplinas.find(d => d._id === filters.disciplina)?.nome || 'Selecionada'}` 
                          : filters.aluno
                          ? `Aluno: ${alunos.find(a => a._id === filters.aluno)?.nome || 'Selecionado'}`
                          : 'Visão Geral - Todas as Disciplinas'
                      }
                      color={filters.disciplina || filters.aluno ? 'primary' : 'default'}
                      variant={filters.disciplina || filters.aluno ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                
                {/* Cards de Estatísticas de Frequência */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                      <CardContent>
                        <Typography variant="caption">Total de Registros</Typography>
                        <Typography variant="h4">{dashboardFrequencia.totalRegistros}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                      <CardContent>
                        <Typography variant="caption">Presentes</Typography>
                        <Typography variant="h4">{dashboardFrequencia.presentes}</Typography>
                        <Typography variant="caption">
                          ({dashboardFrequencia.percentualPresenca || 0}%)
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
                      <CardContent>
                        <Typography variant="caption">Faltas</Typography>
                        <Typography variant="h4">{dashboardFrequencia.faltas}</Typography>
                        <Typography variant="caption">
                          ({dashboardFrequencia.percentualFaltas || 0}%)
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
                      <CardContent>
                        <Typography variant="caption">Justificadas</Typography>
                        <Typography variant="h4">{dashboardFrequencia.faltasJustificadas}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Filtros de Frequência */}
                <Box sx={{ my: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterListIcon color="primary" />
                    <Typography variant="body1" fontWeight="600">
                      Filtrar por Status:
                    </Typography>
                  </Box>
                  <ToggleButtonGroup
                    value={frequenciaFiltros}
                    onChange={(event, newFiltros) => {
                      if (newFiltros.length === 0) return; // Não permitir desmarcar todos
                      
                      // Se selecionou "todos", desmarcar outros
                      if (newFiltros.includes('todos') && !frequenciaFiltros.includes('todos')) {
                        setFrequenciaFiltros(['todos']);
                      }
                      // Se tinha "todos" e selecionou outro, remover "todos"
                      else if (frequenciaFiltros.includes('todos') && newFiltros.length > 1) {
                        setFrequenciaFiltros(newFiltros.filter(f => f !== 'todos'));
                      }
                      // Seleção normal
                      else {
                        setFrequenciaFiltros(newFiltros);
                      }
                    }}
                    aria-label="filtros de frequência"
                    size="small"
                    sx={{
                      flexWrap: 'wrap',
                      '& .MuiToggleButton-root': {
                        px: 2,
                        py: 1,
                        border: '2px solid',
                        fontWeight: 600,
                        textTransform: 'none',
                      }
                    }}
                  >
                    <ToggleButton 
                      value="todos" 
                      sx={{ 
                        borderColor: 'primary.main',
                        '&.Mui-selected': { 
                          bgcolor: 'primary.main', 
                          color: 'white',
                          '&:hover': { bgcolor: 'primary.dark' }
                        }
                      }}
                    >
                      <Badge 
                        badgeContent={dashboardFrequencia.contadores?.total || 0} 
                        color="primary"
                        sx={{ '& .MuiBadge-badge': { bgcolor: 'white', color: 'primary.main' } }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
                          🔵 TODOS
                        </Box>
                      </Badge>
                    </ToggleButton>
                    
                    <ToggleButton 
                      value="adequado"
                      sx={{ 
                        borderColor: 'success.main',
                        '&.Mui-selected': { 
                          bgcolor: 'success.main', 
                          color: 'white',
                          '&:hover': { bgcolor: 'success.dark' }
                        }
                      }}
                    >
                      <Badge 
                        badgeContent={dashboardFrequencia.contadores?.adequado || 0} 
                        color="success"
                        sx={{ '& .MuiBadge-badge': { bgcolor: 'white', color: 'success.main' } }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
                          ✅ ADEQUADO (&ge;85%)
                        </Box>
                      </Badge>
                    </ToggleButton>
                    
                    <ToggleButton 
                      value="atencao"
                      sx={{ 
                        borderColor: 'warning.main',
                        '&.Mui-selected': { 
                          bgcolor: 'warning.main', 
                          color: 'white',
                          '&:hover': { bgcolor: 'warning.dark' }
                        }
                      }}
                    >
                      <Badge 
                        badgeContent={dashboardFrequencia.contadores?.atencao || 0} 
                        color="warning"
                        sx={{ '& .MuiBadge-badge': { bgcolor: 'white', color: 'warning.main' } }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
                          ⚠️ ATENÇÃO (75-84%)
                        </Box>
                      </Badge>
                    </ToggleButton>
                    
                    <ToggleButton 
                      value="critico"
                      sx={{ 
                        borderColor: 'error.main',
                        '&.Mui-selected': { 
                          bgcolor: 'error.main', 
                          color: 'white',
                          '&:hover': { bgcolor: 'error.dark' }
                        }
                      }}
                    >
                      <Badge 
                        badgeContent={dashboardFrequencia.contadores?.critico || 0} 
                        color="error"
                        sx={{ '& .MuiBadge-badge': { bgcolor: 'white', color: 'error.main' } }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
                          🚨 CRÍTICO (&lt;75%)
                        </Box>
                      </Badge>
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {/* Tabela de Alunos Filtrados */}
                {dashboardFrequencia.todosAlunos && dashboardFrequencia.todosAlunos.length > 0 && (() => {
                  // Aplicar filtros
                  const alunosFiltrados = dashboardFrequencia.todosAlunos.filter(aluno => {
                    if (frequenciaFiltros.includes('todos')) return true;
                    return frequenciaFiltros.includes(aluno.classificacao);
                  });
                  
                  return (
                    <Box sx={{ mt: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Exibindo <strong>{alunosFiltrados.length}</strong> de <strong>{dashboardFrequencia.todosAlunos.length}</strong> alunos
                        </Typography>
                        
                        {dashboardFrequencia.contadores?.critico > 0 && (
                          <Alert severity="error" sx={{ py: 0.5, px: 2 }}>
                            <strong>⚠️</strong> {dashboardFrequencia.contadores.critico} aluno(s) com frequência crítica
                          </Alert>
                        )}
                      </Box>
                      
                      {alunosFiltrados.length > 0 ? (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Aluno</TableCell>
                                <TableCell align="center">Total Aulas</TableCell>
                                <TableCell align="center">Presentes</TableCell>
                                <TableCell align="center">Faltas</TableCell>
                                <TableCell align="center">Frequência</TableCell>
                                <TableCell align="center">Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {alunosFiltrados.map((aluno) => {
                                const percentual = aluno.percentualPresenca;
                                let statusColor = 'success';
                                let statusLabel = 'Adequado';
                                let statusIcon = '✅';
                                
                                if (aluno.classificacao === 'critico') {
                                  statusColor = 'error';
                                  statusLabel = 'Crítico';
                                  statusIcon = '🚨';
                                } else if (aluno.classificacao === 'atencao') {
                                  statusColor = 'warning';
                                  statusLabel = 'Atenção';
                                  statusIcon = '⚠️';
                                }
                                
                                return (
                                  <TableRow 
                                    key={aluno.aluno._id}
                                    sx={{
                                      '&:hover': { bgcolor: 'action.hover' },
                                      bgcolor: aluno.classificacao === 'critico' ? 'rgba(211, 47, 47, 0.08)' : 'inherit'
                                    }}
                                  >
                                    <TableCell>
                                      <Typography variant="body2" fontWeight="600">
                                        {aluno.aluno.nome}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Mat: {aluno.aluno.matricula}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                      <Typography variant="body2" fontWeight="600">
                                        {aluno.total}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip 
                                        label={aluno.presentes} 
                                        color="success" 
                                        size="small"
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip 
                                        label={aluno.faltas} 
                                        color="error" 
                                        size="small"
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell align="center">
                                      <Typography variant="body2" fontWeight="700" color={statusColor + '.main'}>
                                        {percentual}%
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip 
                                        label={`${statusIcon} ${statusLabel}`}
                                        color={statusColor} 
                                        size="small"
                                      />
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Alert severity="info">
                          Nenhum aluno encontrado com os filtros selecionados.
                        </Alert>
                      )}
                    </Box>
                  );
                })()}
                
                {(!dashboardFrequencia.todosAlunos || dashboardFrequencia.todosAlunos.length === 0) && (
                  <Alert severity="info" sx={{ mt: 3 }}>
                    📊 Nenhum registro de frequência encontrado para o período selecionado.
                  </Alert>
                )}
              </Paper>
              </Fade>
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard;
