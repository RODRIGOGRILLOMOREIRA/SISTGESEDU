import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  IconButton,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from '@mui/material';
import PageHeader from '../components/PageHeader';
import { Assignment as HabilidadesIcon } from '@mui/icons-material';
import {
  Add,
  Edit,
  Delete,
  Assessment,
  ExpandMore,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import { habilidadeService, disciplinaService, turmaService, alunoService } from '../services';
import { toast } from 'react-toastify';

const NIVEIS_DESENVOLVIMENTO = [
  { value: 'nao-desenvolvido', label: 'Não Desenvolvido', color: 'error', icon: Cancel },
  { value: 'em-desenvolvimento', label: 'Em Desenvolvimento', color: 'warning', icon: HourglassEmpty },
  { value: 'desenvolvido', label: 'Desenvolvido', color: 'info', icon: RadioButtonUnchecked },
  { value: 'plenamente-desenvolvido', label: 'Plenamente Desenvolvido', color: 'success', icon: CheckCircle },
];

const Habilidades = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [habilidades, setHabilidades] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [open, setOpen] = useState(false);
  const [desempenhoOpen, setDesempenhoOpen] = useState(false);
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedHabilidade, setSelectedHabilidade] = useState(null);
  const [alunoData, setAlunoData] = useState(null);
  const [viewMode, setViewMode] = useState('geral'); // 'geral' ou 'aluno'
  
  // Filtros
  const [filters, setFilters] = useState({
    disciplina: '',
    turma: '',
    ano: new Date().getFullYear(),
    trimestre: '',
    aluno: '',
  });

  // Form data
  const [formData, setFormData] = useState({
    codigo: '',
    descricao: '',
    disciplina: '',
    ano: new Date().getFullYear(),
    trimestre: 1,
    turma: '',
  });

  // Desempenho data
  const [desempenhoData, setDesempenhoData] = useState({
    alunoId: '',
    nivel: 'em-desenvolvimento',
    observacao: '',
  });

  useEffect(() => {
    loadDisciplinas();
    loadTurmas();
    loadHabilidades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (filters.turma) {
      loadAlunos(filters.turma);
    } else {
      setAlunos([]);
      setFilters(prev => ({ ...prev, aluno: '' }));
    }
  }, [filters.turma]);

  useEffect(() => {
    if (filters.aluno) {
      loadHabilidadesPorAluno(filters.aluno);
    }
  }, [filters.aluno]);

  const loadHabilidades = async () => {
    try {
      const params = {};
      if (filters.disciplina) params.disciplina = filters.disciplina;
      if (filters.turma) params.turma = filters.turma;
      if (filters.ano) params.ano = filters.ano;
      if (filters.trimestre) params.trimestre = filters.trimestre;

      const data = await habilidadeService.getAll(params);
      setHabilidades(data);
      setViewMode('geral');
      setAlunoData(null);
    } catch (error) {
      toast.error('Erro ao carregar habilidades');
    }
  };

  const loadHabilidadesPorAluno = async (alunoId) => {
    try {
      const params = {};
      if (filters.ano) params.ano = filters.ano;
      if (filters.trimestre) params.trimestre = filters.trimestre;
      if (filters.turma) params.turma = filters.turma;

      const response = await habilidadeService.getPorAluno(alunoId, params);
      setAlunoData(response);
      setViewMode('aluno');
    } catch (error) {
      toast.error('Erro ao carregar habilidades do aluno');
    }
  };

  const loadDisciplinas = async () => {
    try {
      const data = await disciplinaService.getAll();
      setDisciplinas(data);
    } catch (error) {
      console.error('Erro ao carregar disciplinas');
    }
  };

  const loadTurmas = async () => {
    try {
      const data = await turmaService.getAll();
      setTurmas(data);
    } catch (error) {
      console.error('Erro ao carregar turmas');
    }
  };

  const loadAlunos = async (turmaId) => {
    try {
      const data = await alunoService.getAll({ turma: turmaId });
      setAlunos(data);
    } catch (error) {
      console.error('Erro ao carregar alunos');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'aluno') {
      setFilters(prev => ({ ...prev, [name]: value }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
      if (name === 'turma' && !value) {
        setFilters(prev => ({ ...prev, aluno: '' }));
      }
    }
  };

  const handleApplyFilters = () => {
    if (filters.aluno) {
      loadHabilidadesPorAluno(filters.aluno);
    } else {
      loadHabilidades();
    }
  };

  const handleClearFilters = () => {
    setFilters({
      disciplina: '',
      turma: '',
      ano: new Date().getFullYear(),
      trimestre: '',
      aluno: '',
    });
    setAlunoData(null);
    setViewMode('geral');
  };

  const handleOpen = () => {
    setFormData({
      codigo: '',
      descricao: '',
      disciplina: '',
      ano: new Date().getFullYear(),
      trimestre: 1,
      turma: '',
    });
    setEditId(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditId(null);
  };

  const handleDesempenhoOpen = (habilidade) => {
    setSelectedHabilidade(habilidade);
    setDesempenhoData({
      alunoId: '',
      nivel: 'em-desenvolvimento',
      observacao: '',
    });
    if (habilidade.turma?._id) {
      loadAlunos(habilidade.turma._id);
    }
    setDesempenhoOpen(true);
  };

  const handleDesempenhoClose = () => {
    setDesempenhoOpen(false);
    setSelectedHabilidade(null);
  };

  const handleRelatorioOpen = () => {
    setRelatorioOpen(true);
  };

  const handleRelatorioClose = () => {
    setRelatorioOpen(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDesempenhoChange = (e) => {
    setDesempenhoData({ ...desempenhoData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await habilidadeService.update(editId, formData);
        toast.success('Habilidade atualizada com sucesso!');
      } else {
        await habilidadeService.create(formData);
        toast.success('Habilidade criada com sucesso!');
      }
      handleClose();
      loadHabilidades();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar habilidade');
    }
  };

  const handleDesempenhoSubmit = async (e) => {
    e.preventDefault();
    try {
      await habilidadeService.updateDesempenho(selectedHabilidade._id, desempenhoData);
      toast.success('Desempenho atualizado com sucesso!');
      handleDesempenhoClose();
      loadHabilidades();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar desempenho');
    }
  };

  const handleEdit = (habilidade) => {
    setFormData({
      codigo: habilidade.codigo,
      descricao: habilidade.descricao,
      disciplina: habilidade.disciplina?._id || '',
      ano: habilidade.ano,
      trimestre: habilidade.trimestre,
      turma: habilidade.turma?._id || '',
    });
    setEditId(habilidade._id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta habilidade?')) {
      try {
        await habilidadeService.delete(id);
        toast.success('Habilidade excluída com sucesso!');
        loadHabilidades();
      } catch (error) {
        toast.error('Erro ao excluir habilidade');
      }
    }
  };

  const getNivelInfo = (nivel) => {
    return NIVEIS_DESENVOLVIMENTO.find(n => n.value === nivel) || NIVEIS_DESENVOLVIMENTO[1];
  };

  const getDesenvolvimentoPorNivel = () => {
    if (!filters.turma) return null;

    const stats = {
      total: 0,
      'nao-desenvolvido': 0,
      'em-desenvolvimento': 0,
      'desenvolvido': 0,
      'plenamente-desenvolvido': 0,
    };

    habilidades.forEach(hab => {
      hab.alunosDesempenho?.forEach(ad => {
        stats.total++;
        stats[ad.nivel]++;
      });
    });

    return stats;
  };

  const renderRelatorio = () => {
    const stats = getDesenvolvimentoPorNivel();
    
    if (!stats || stats.total === 0) {
      return (
        <Typography color="text.secondary">
          Selecione uma turma e cadastre habilidades para visualizar o relatório.
        </Typography>
      );
    }

    return (
      <Grid container spacing={2}>
        {NIVEIS_DESENVOLVIMENTO.map(nivel => {
          const count = stats[nivel.value];
          const percentage = ((count / stats.total) * 100).toFixed(1);
          const IconComponent = nivel.icon;
          
          return (
            <Grid item xs={12} sm={6} md={3} key={nivel.value}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <IconComponent color={nivel.color} sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      {nivel.label}
                    </Typography>
                  </Box>
                  <Typography variant="h4">{count}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {percentage}% do total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total de Acompanhamentos
              </Typography>
              <Typography variant="h3" color="primary">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
      <PageHeader 
        title="Habilidades BNCC" 
        subtitle="Acompanhamento de habilidades e competências"
        icon={HabilidadesIcon}
      />
      
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="flex-end" alignItems="center">
          <Box>
            <Button
              variant="outlined"
              startIcon={<Assessment />}
              onClick={handleRelatorioOpen}
              sx={{ mr: 1 }}
            >
              Relatório
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpen}
            >
              Nova Habilidade
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtros
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl 
              fullWidth 
              size="small"
              sx={(theme) => ({
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
                '& .MuiSelect-select': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
                '& .MuiSelect-icon': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
              })}
            >
              <InputLabel>Turma</InputLabel>
              <Select
                name="turma"
                value={filters.turma}
                onChange={handleFilterChange}
                label="Turma"
              >
                <MenuItem value="">Todas</MenuItem>
                {turmas.map((turma) => (
                  <MenuItem key={turma._id} value={turma._id}>
                    {turma.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl 
              fullWidth 
              size="small" 
              disabled={!filters.turma}
              sx={(theme) => ({
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
                '& .MuiSelect-select': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
                '& .MuiSelect-icon': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
              })}
            >
              <InputLabel>Aluno</InputLabel>
              <Select
                name="aluno"
                value={filters.aluno}
                onChange={handleFilterChange}
                label="Aluno"
              >
                <MenuItem value="">Todos</MenuItem>
                {alunos.map((aluno) => (
                  <MenuItem key={aluno._id} value={aluno._id}>
                    {aluno.nome} - {aluno.matricula}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl 
              fullWidth 
              size="small" 
              disabled={!!filters.aluno}
              sx={(theme) => ({
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
                '& .MuiSelect-select': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
                '& .MuiSelect-icon': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
              })}
            >
              <InputLabel>Disciplina</InputLabel>
              <Select
                name="disciplina"
                value={filters.disciplina}
                onChange={handleFilterChange}
                label="Disciplina"
              >
                <MenuItem value="">Todas</MenuItem>
                {disciplinas.map((disc) => (
                  <MenuItem key={disc._id} value={disc._id}>
                    {disc.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <TextField
              fullWidth
              size="small"
              label="Ano"
              type="number"
              name="ano"
              value={filters.ano}
              onChange={handleFilterChange}
              sx={(theme) => ({
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
                '& .MuiOutlinedInput-input': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
              })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <FormControl 
              fullWidth 
              size="small"
              sx={(theme) => ({
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
                '& .MuiSelect-select': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
                '& .MuiSelect-icon': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
              })}
            >
              <InputLabel>Trimestre</InputLabel>
              <Select
                name="trimestre"
                value={filters.trimestre}
                onChange={handleFilterChange}
                label="Trimestre"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="1">1º Trimestre</MenuItem>
                <MenuItem value="2">2º Trimestre</MenuItem>
                <MenuItem value="3">3º Trimestre</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={12} md={2}>
            <Box display="flex" gap={1} height="100%">
              <Button
                fullWidth
                variant="contained"
                onClick={handleApplyFilters}
                size="small"
              >
                Filtrar
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClearFilters}
                size="small"
              >
                Limpar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Visualização por Aluno */}
      {viewMode === 'aluno' && alunoData && (
        <Box sx={{ mb: 3 }}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
            <Typography variant="h5" gutterBottom>
              📊 Desenvolvimento de Habilidades - {alunos.find(a => a._id === filters.aluno)?.nome}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visualização detalhada de todas as habilidades acompanhadas
            </Typography>
          </Paper>

          {/* Estatísticas do Aluno */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {NIVEIS_DESENVOLVIMENTO.map(nivel => {
              const count = alunoData.estatisticas?.porNivel[nivel.value] || 0;
              const percentage = alunoData.estatisticas?.total > 0 
                ? ((count / alunoData.estatisticas.total) * 100).toFixed(1)
                : '0.0';
              const IconComponent = nivel.icon;
              
              return (
                <Grid item xs={12} sm={6} md={3} key={nivel.value}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        <IconComponent color={nivel.color} sx={{ mr: 1 }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          {nivel.label}
                        </Typography>
                      </Box>
                      <Typography variant="h4">{count}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {percentage}% do total
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Cards de Habilidades */}
          <Typography variant="h6" gutterBottom>
            Habilidades ({alunoData.habilidades?.length || 0})
          </Typography>
          
          {alunoData.habilidades && alunoData.habilidades.length > 0 ? (
            <Grid container spacing={2}>
              {alunoData.habilidades.map((hab) => {
                const nivelInfo = getNivelInfo(hab.nivel);
                const IconComponent = nivelInfo.icon;
                
                return (
                  <Grid item xs={12} md={6} key={hab._id}>
                    <Card 
                      sx={{ 
                        borderLeft: 6, 
                        borderColor: `${nivelInfo.color}.main`,
                        height: '100%'
                      }}
                    >
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                          <Box flex={1}>
                            <Typography variant="subtitle2" color="text.secondary">
                              {hab.codigo}
                            </Typography>
                            <Typography variant="h6" gutterBottom>
                              {hab.descricao}
                            </Typography>
                          </Box>
                          <Chip
                            icon={<IconComponent />}
                            label={nivelInfo.label}
                            color={nivelInfo.color}
                            size="small"
                          />
                        </Box>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Disciplina
                            </Typography>
                            <Typography variant="body2">
                              {hab.disciplina?.nome || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="caption" color="text.secondary">
                              Ano
                            </Typography>
                            <Typography variant="body2">
                              {hab.ano}
                            </Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="caption" color="text.secondary">
                              Trimestre
                            </Typography>
                            <Typography variant="body2">
                              {hab.trimestre}º
                            </Typography>
                          </Grid>
                        </Grid>
                        
                        {hab.observacao && (
                          <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Observações:
                            </Typography>
                            <Typography variant="body2">
                              {hab.observacao}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Nenhuma habilidade acompanhada para este aluno
              </Typography>
            </Paper>
          )}

          {/* Distribuição por Disciplina */}
          {alunoData.estatisticas?.porDisciplina && 
           Object.keys(alunoData.estatisticas.porDisciplina).length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Distribuição por Disciplina
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(alunoData.estatisticas.porDisciplina).map(([disc, stats]) => (
                  <Grid item xs={12} sm={6} md={4} key={disc}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {disc}
                        </Typography>
                        <Typography variant="h5" color="primary">
                          {stats.total} habilidades
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {NIVEIS_DESENVOLVIMENTO.map(nivel => {
                            const count = stats[nivel.value] || 0;
                            if (count === 0) return null;
                            return (
                              <Chip
                                key={nivel.value}
                                label={`${nivel.label}: ${count}`}
                                size="small"
                                color={nivel.color}
                                sx={{ mr: 0.5, mt: 0.5 }}
                              />
                            );
                          })}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      )}

      {/* Cards de Habilidades - Visualização Geral */}
      {viewMode === 'geral' && (
        habilidades.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <HabilidadesIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhuma habilidade encontrada
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Clique em "Nova Habilidade" para começar
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {habilidades.map((habilidade) => {
              const totalAlunos = habilidade.alunosDesempenho?.length || 0;
              const alunosPorNivel = {
                'nao-desenvolvido': 0,
                'em-desenvolvimento': 0,
                'desenvolvido': 0,
                'plenamente-desenvolvido': 0
              };

              // Contar alunos por nível
              habilidade.alunosDesempenho?.forEach(ad => {
                if (alunosPorNivel.hasOwnProperty(ad.nivel)) {
                  alunosPorNivel[ad.nivel]++;
                }
              });

              const alunosDesenvolvidos = alunosPorNivel['desenvolvido'] + alunosPorNivel['plenamente-desenvolvido'];
              const percentualDesenvolvido = totalAlunos > 0 ? (alunosDesenvolvidos / totalAlunos) * 100 : 0;

              return (
                <Grid item xs={12} sm={6} md={4} key={habilidade._id}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      border: '1px solid',
                      borderColor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: (theme) =>
                          theme.palette.mode === 'dark'
                            ? '0 8px 24px rgba(0,188,212,0.3)'
                            : '0 8px 24px rgba(0,0,0,0.15)',
                      },
                    }}
                  >
                    <CardContent>
                      {/* Cabeçalho */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                            {habilidade.codigo}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.3, mt: 0.5 }}>
                            {habilidade.descricao.length > 80
                              ? `${habilidade.descricao.substring(0, 80)}...`
                              : habilidade.descricao}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Informações */}
                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Disciplina
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {habilidade.disciplina?.nome || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Turma
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {habilidade.turma?.nome || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Ano
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {habilidade.ano}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Trimestre
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {habilidade.trimestre}º
                          </Typography>
                        </Grid>
                      </Grid>

                      {/* Estatísticas de Alunos */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Acompanhamentos
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {alunosDesenvolvidos}/{totalAlunos} desenvolvido
                          </Typography>
                        </Box>
                        <Box sx={{ position: 'relative', height: 8, bgcolor: 'grey.200', borderRadius: 4, overflow: 'hidden' }}>
                          <Box
                            sx={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              height: '100%',
                              width: `${percentualDesenvolvido}%`,
                              bgcolor: percentualDesenvolvido >= 70 ? 'success.main' : percentualDesenvolvido >= 40 ? 'warning.main' : 'error.main',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Distribuição por Níveis */}
                      {totalAlunos > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                          {NIVEIS_DESENVOLVIMENTO.map((nivel) => {
                            const count = alunosPorNivel[nivel.value] || 0;
                            if (count === 0) return null;
                            return (
                              <Chip
                                key={nivel.value}
                                size="small"
                                icon={<nivel.icon />}
                                label={`${count}`}
                                color={nivel.color}
                                variant="outlined"
                              />
                            );
                          })}
                        </Box>
                      )}

                      <Divider sx={{ my: 2 }} />

                      {/* Ações */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Acompanhar Alunos">
                          <Button
                            variant="outlined"
                            size="small"
                            fullWidth
                            startIcon={<Assessment />}
                            onClick={() => handleDesempenhoOpen(habilidade)}
                          >
                            Alunos ({totalAlunos})
                          </Button>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(habilidade)}
                            sx={{ border: 1, borderColor: 'primary.main' }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(habilidade._id)}
                            sx={{ border: 1, borderColor: 'error.main' }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )
      )}

      {/* Dialog - Cadastro/Edição de Habilidade */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editId ? 'Editar Habilidade' : 'Nova Habilidade'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Código"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                required
                fullWidth
              />
              <TextField
                label="Descrição"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                required
                fullWidth
                multiline
                rows={3}
              />
              <FormControl fullWidth required>
                <InputLabel>Disciplina</InputLabel>
                <Select
                  name="disciplina"
                  value={formData.disciplina}
                  onChange={handleChange}
                  label="Disciplina"
                >
                  {disciplinas.map((disc) => (
                    <MenuItem key={disc._id} value={disc._id}>
                      {disc.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Turma</InputLabel>
                <Select
                  name="turma"
                  value={formData.turma}
                  onChange={handleChange}
                  label="Turma"
                >
                  {turmas.map((turma) => (
                    <MenuItem key={turma._id} value={turma._id}>
                      {turma.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Ano"
                name="ano"
                type="number"
                value={formData.ano}
                onChange={handleChange}
                required
                fullWidth
              />
              <FormControl fullWidth required>
                <InputLabel>Trimestre</InputLabel>
                <Select
                  name="trimestre"
                  value={formData.trimestre}
                  onChange={handleChange}
                  label="Trimestre"
                >
                  <MenuItem value={1}>1º Trimestre</MenuItem>
                  <MenuItem value={2}>2º Trimestre</MenuItem>
                  <MenuItem value={3}>3º Trimestre</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {editId ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog - Acompanhamento de Desempenho */}
      <Dialog
        open={desempenhoOpen}
        onClose={handleDesempenhoClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Acompanhamento de Desempenho
          {selectedHabilidade && (
            <Typography variant="subtitle2" color="text.secondary">
              {selectedHabilidade.codigo} - {selectedHabilidade.descricao}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {/* Formulário para adicionar/atualizar desempenho */}
          <form onSubmit={handleDesempenhoSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, mb: 3 }}>
              <FormControl fullWidth required>
                <InputLabel>Aluno</InputLabel>
                <Select
                  name="alunoId"
                  value={desempenhoData.alunoId}
                  onChange={handleDesempenhoChange}
                  label="Aluno"
                >
                  {alunos.map((aluno) => (
                    <MenuItem key={aluno._id} value={aluno._id}>
                      {aluno.nome} - {aluno.matricula}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Nível de Desenvolvimento</InputLabel>
                <Select
                  name="nivel"
                  value={desempenhoData.nivel}
                  onChange={handleDesempenhoChange}
                  label="Nível de Desenvolvimento"
                >
                  {NIVEIS_DESENVOLVIMENTO.map((nivel) => {
                    const IconComponent = nivel.icon;
                    return (
                      <MenuItem key={nivel.value} value={nivel.value}>
                        <Box display="flex" alignItems="center">
                          <IconComponent
                            color={nivel.color}
                            sx={{ mr: 1, fontSize: 20 }}
                          />
                          {nivel.label}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              <TextField
                label="Observação"
                name="observacao"
                value={desempenhoData.observacao}
                onChange={handleDesempenhoChange}
                fullWidth
                multiline
                rows={3}
                placeholder="Adicione observações sobre o desenvolvimento do aluno..."
              />
              <Button type="submit" variant="contained" fullWidth>
                Salvar Desempenho
              </Button>
            </Box>
          </form>

          <Divider sx={{ my: 2 }} />

          {/* Lista de alunos com desempenho registrado */}
          {selectedHabilidade && selectedHabilidade.alunosDesempenho?.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Alunos Acompanhados ({selectedHabilidade.alunosDesempenho.length})
              </Typography>
              <List>
                {selectedHabilidade.alunosDesempenho.map((ad, index) => {
                  const nivelInfo = getNivelInfo(ad.nivel);
                  const IconComponent = nivelInfo.icon;
                  return (
                    <React.Fragment key={ad.aluno?._id || index}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center">
                              <Typography variant="body1" sx={{ mr: 1 }}>
                                {ad.aluno?.nome || 'Aluno não encontrado'}
                              </Typography>
                              <Chip
                                icon={<IconComponent />}
                                label={nivelInfo.label}
                                color={nivelInfo.color}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={ad.observacao || 'Sem observações'}
                        />
                      </ListItem>
                      {index < selectedHabilidade.alunosDesempenho.length - 1 && (
                        <Divider />
                      )}
                    </React.Fragment>
                  );
                })}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDesempenhoClose}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog - Relatório */}
      <Dialog
        open={relatorioOpen}
        onClose={handleRelatorioClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Relatório de Desenvolvimento de Habilidades
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {renderRelatorio()}
          </Box>

          {filters.turma && habilidades.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Detalhamento por Habilidade
              </Typography>
              {habilidades.map((habilidade) => (
                <Accordion key={habilidade._id}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography sx={{ flexGrow: 1 }}>
                        {habilidade.codigo} - {habilidade.descricao}
                      </Typography>
                      <Chip
                        label={`${habilidade.alunosDesempenho?.length || 0} alunos`}
                        size="small"
                        sx={{ mr: 2 }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {habilidade.alunosDesempenho?.length > 0 ? (
                      <List dense>
                        {habilidade.alunosDesempenho.map((ad, idx) => {
                          const nivelInfo = getNivelInfo(ad.nivel);
                          const IconComponent = nivelInfo.icon;
                          return (
                            <ListItem key={idx}>
                              <ListItemText
                                primary={
                                  <Box display="flex" alignItems="center">
                                    <Typography variant="body2" sx={{ mr: 1 }}>
                                      {ad.aluno?.nome}
                                    </Typography>
                                    <Chip
                                      icon={<IconComponent />}
                                      label={nivelInfo.label}
                                      color={nivelInfo.color}
                                      size="small"
                                    />
                                  </Box>
                                }
                                secondary={ad.observacao}
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    ) : (
                      <Typography color="text.secondary" variant="body2">
                        Nenhum aluno acompanhado nesta habilidade
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRelatorioClose}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Habilidades;
