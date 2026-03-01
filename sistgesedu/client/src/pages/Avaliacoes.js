import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Grid,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Skeleton,
  Autocomplete,
  Divider,
} from '@mui/material';
import {
  Add,
  Assessment,
  Edit,
  CheckCircle,
  Info,
  Warning,
  Error as ErrorIcon,
  HelpOutline,
  School,
  Refresh,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { Assessment as AvaliacoesIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';

// Configurações de classificação
const CLASSIFICACOES = {
  'adequado': { label: 'Adequado', color: '#4caf50', icon: CheckCircle, bgcolor: 'rgba(76, 175, 80, 0.1)' },
  'proficiente': { label: 'Proficiente', color: '#2196f3', icon: Info, bgcolor: 'rgba(33, 150, 243, 0.1)' },
  'em-alerta': { label: 'Em Alerta', color: '#ff9800', icon: Warning, bgcolor: 'rgba(255, 152, 0, 0.1)' },
  'intervencao-imediata': { label: 'Intervenção Imediata', color: '#f44336', icon: ErrorIcon, bgcolor: 'rgba(244, 67, 54, 0.1)' },
  'sem-avaliacao': { label: 'Sem Avaliação', color: '#9e9e9e', icon: HelpOutline, bgcolor: 'rgba(158, 158, 158, 0.1)' }
};

const Avaliacoes = () => {
  const [turmas, setTurmas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [habilidadesDisponiveis, setHabilidadesDisponiveis] = useState([]);
  const [alunosComAvaliacoes, setAlunosComAvaliacoes] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(false);

  const [filtros, setFiltros] = useState({
    turma: '',
    disciplina: '',
    trimestre: 1,
    ano: new Date().getFullYear(),
  });

  const [openModal, setOpenModal] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [avaliacaoAtual, setAvaliacaoAtual] = useState(null);
  const [formData, setFormData] = useState({
    pontosCorte: {
      pc1: { nota: 0, data: '', habilidades: [] },
      pc2: { nota: 0, data: '', habilidades: [] },
      eac: { nota: 0, data: '', habilidades: [] }
    },
    observacoes: ''
  });

  useEffect(() => {
    loadTurmas();
    loadDisciplinas();
  }, []);

  useEffect(() => {
    if (filtros.turma && filtros.disciplina && filtros.trimestre) {
      loadAvaliacoes();
      loadHabilidades();
    }
  }, [filtros]);

  const loadTurmas = async () => {
    try {
      const response = await api.get('/turmas');
      setTurmas(response.data.data || []);
    } catch (error) {
      toast.error('Erro ao carregar turmas');
    }
  };

  const loadDisciplinas = async () => {
    try {
      const response = await api.get('/disciplinas');
      setDisciplinas(response.data.data || []);
    } catch (error) {
      toast.error('Erro ao carregar disciplinas');
    }
  };

  const loadHabilidades = async () => {
    try {
      const response = await api.get('/habilidades', {
        params: {
          disciplina: filtros.disciplina,
          turma: filtros.turma,
          ano: filtros.ano,
          trimestre: filtros.trimestre
        }
      });
      setHabilidadesDisponiveis(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar habilidades:', error);
    }
  };

  const loadAvaliacoes = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/avaliacoes/turma/${filtros.turma}/disciplina/${filtros.disciplina}`,
        { params: { trimestre: filtros.trimestre, ano: filtros.ano } }
      );
      
      setAlunosComAvaliacoes(response.data.alunos || []);
      setEstatisticas(response.data.estatisticas || null);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      toast.error('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (aluno, avaliacao) => {
    setAlunoSelecionado(aluno);
    setAvaliacaoAtual(avaliacao);
    
    if (avaliacao) {
      setFormData({
        pontosCorte: {
          pc1: avaliacao.pontosCorte?.pc1 || { nota: 0, data: '', habilidades: [] },
          pc2: avaliacao.pontosCorte?.pc2 || { nota: 0, data: '', habilidades: [] },
          eac: avaliacao.pontosCorte?.eac || { nota: 0, data: '', habilidades: [] }
        },
        observacoes: avaliacao.observacoes || ''
      });
    } else {
      setFormData({
        pontosCorte: {
          pc1: { nota: 0, data: '', habilidades: [] },
          pc2: { nota: 0, data: '', habilidades: [] },
          eac: { nota: 0, data: '', habilidades: [] }
        },
        observacoes: ''
      });
    }
    
    setOpenModal(true);
  };

  const fecharModal = () => {
    setOpenModal(false);
    setAlunoSelecionado(null);
    setAvaliacaoAtual(null);
  };

  const salvarAvaliacao = async () => {
    try {
      const dados = {
        aluno: alunoSelecionado._id,
        turma: filtros.turma,
        disciplina: filtros.disciplina,
        ano: filtros.ano,
        trimestre: filtros.trimestre,
        pontosCorte: formData.pontosCorte,
        observacoes: formData.observacoes
      };

      if (avaliacaoAtual) {
        await api.put(`/avaliacoes/${avaliacaoAtual._id}/pontos-corte`, dados);
        toast.success('Avaliação atualizada com sucesso!');
      } else {
        await api.post('/avaliacoes', dados);
        toast.success('Avaliação criada com sucesso!');
      }

      fecharModal();
      loadAvaliacoes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar avaliação');
    }
  };

  const calcularMediaFinal = () => {
    const pc1 = parseFloat(formData.pontosCorte.pc1.nota) || 0;
    const pc2 = parseFloat(formData.pontosCorte.pc2.nota) || 0;
    return (pc1 + pc2).toFixed(1);
  };

  const calcularNotaFinal = () => {
    const mediaFinal = parseFloat(calcularMediaFinal());
    const eac = parseFloat(formData.pontosCorte.eac.nota) || 0;
    return Math.max(mediaFinal, eac).toFixed(1);
  };

  const getClassificacao = (nota) => {
    if (!nota || nota === 0) return 'sem-avaliacao';
    if (nota >= 80) return 'adequado';
    if (nota >= 60) return 'proficiente';
    if (nota >= 40) return 'em-alerta';
    return 'intervencao-imediata';
  };

  const getInitials = (nome) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const podeCarregar = filtros.turma && filtros.disciplina && filtros.trimestre;

  return (
    <Container maxWidth="xl">
      <PageHeader
        icon={AvaliacoesIcon}
        title="Avaliações"
        subtitle="Sistema de Avaliação por Pontos de Corte"
      />

      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Turma"
              value={filtros.turma}
              onChange={(e) => setFiltros({ ...filtros, turma: e.target.value })}
            >
              <MenuItem value="">Selecione uma turma</MenuItem>
              {turmas.map((turma) => (
                <MenuItem key={turma._id} value={turma._id}>
                  {turma.nome} - {turma.serie}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Disciplina"
              value={filtros.disciplina}
              onChange={(e) => setFiltros({ ...filtros, disciplina: e.target.value })}
            >
              <MenuItem value="">Selecione uma disciplina</MenuItem>
              {disciplinas.map((disciplina) => (
                <MenuItem key={disciplina._id} value={disciplina._id}>
                  {disciplina.nome}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              label="Trimestre"
              value={filtros.trimestre}
              onChange={(e) => setFiltros({ ...filtros, trimestre: e.target.value })}
            >
              <MenuItem value={1}>1º Trimestre</MenuItem>
              <MenuItem value={2}>2º Trimestre</MenuItem>
              <MenuItem value={3}>3º Trimestre</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Ano"
              type="number"
              value={filtros.ano}
              onChange={(e) => setFiltros({ ...filtros, ano: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Refresh />}
              onClick={loadAvaliacoes}
              disabled={!podeCarregar}
              sx={{ height: '56px' }}
            >
              Atualizar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Estatísticas */}
      {estatisticas && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: CLASSIFICACOES['adequado'].bgcolor, borderLeft: `4px solid ${CLASSIFICACOES['adequado'].color}` }}>
              <CardContent>
                <Typography variant="h4" sx={{ color: CLASSIFICACOES['adequado'].color, fontWeight: 'bold' }}>
                  {estatisticas.adequado}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Adequado ({estatisticas.percentuais.adequado}%)
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: CLASSIFICACOES['proficiente'].bgcolor, borderLeft: `4px solid ${CLASSIFICACOES['proficiente'].color}` }}>
              <CardContent>
                <Typography variant="h4" sx={{ color: CLASSIFICACOES['proficiente'].color, fontWeight: 'bold' }}>
                  {estatisticas.proficiente}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Proficiente ({estatisticas.percentuais.proficiente}%)
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: CLASSIFICACOES['em-alerta'].bgcolor, borderLeft: `4px solid ${CLASSIFICACOES['em-alerta'].color}` }}>
              <CardContent>
                <Typography variant="h4" sx={{ color: CLASSIFICACOES['em-alerta'].color, fontWeight: 'bold' }}>
                  {estatisticas.emAlerta}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Em Alerta ({estatisticas.percentuais.emAlerta}%)
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: CLASSIFICACOES['intervencao-imediata'].bgcolor, borderLeft: `4px solid ${CLASSIFICACOES['intervencao-imediata'].color}` }}>
              <CardContent>
                <Typography variant="h4" sx={{ color: CLASSIFICACOES['intervencao-imediata'].color, fontWeight: 'bold' }}>
                  {estatisticas.intervencaoImediata}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Intervenção ({estatisticas.percentuais.intervencaoImediata}%)
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: 'rgba(156, 39, 176, 0.1)', borderLeft: '4px solid #9c27b0' }}>
              <CardContent>
                <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                  {estatisticas.mediaGeral}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Média Geral
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {!podeCarregar && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Selecione uma turma, disciplina e trimestre para visualizar as avaliações.
        </Alert>
      )}

      {/* Cards de Alunos */}
      <Grid container spacing={3}>
        {loading ? (
          [...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 3 }} />
            </Grid>
          ))
        ) : podeCarregar && alunosComAvaliacoes.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <School sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Nenhum aluno encontrado nesta turma
              </Typography>
            </Paper>
          </Grid>
        ) : (
          alunosComAvaliacoes.map(({ aluno, avaliacao }) => {
            const classificacao = avaliacao?.classificacao || 'sem-avaliacao';
            const config = CLASSIFICACOES[classificacao];
            const IconComponent = config.icon;

            return (
              <Grid item xs={12} sm={6} md={4} key={aluno._id}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    border: `2px solid ${config.color}30`,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${config.color}40`,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: config.color,
                          width: 50,
                          height: 50,
                          mr: 2,
                          fontSize: '1.2rem',
                        }}
                      >
                        {getInitials(aluno.nome)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                          {aluno.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Matrícula: {aluno.matricula}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {avaliacao ?  (
                      <>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            Pontos de Corte:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <Chip
                              size="small"
                              label={`PC1: ${avaliacao.pontosCorte?.pc1?.nota || 0}/50`}
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              size="small"
                              label={`PC2: ${avaliacao.pontosCorte?.pc2?.nota || 0}/50`}
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Média Final (PC1 + PC2):
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={avaliacao.pontosCorte?.mediaFinal || 0}
                            sx={{ height: 8, borderRadius: 4, my: 1 }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {avaliacao.pontosCorte?.mediaFinal || 0} / 100
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={`EAC: ${avaliacao.pontosCorte?.eac?.nota || 0}/100`}
                            color="secondary"
                            size="small"
                          />
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Nota Final do Trimestre:
                          </Typography>
                          <Typography
                            variant="h3"
                            sx={{ fontWeight: 'bold', color: config.color, my: 1 }}
                          >
                            {avaliacao.notaFinalTrimestre || 0}
                          </Typography>
                          <Chip
                            icon={<IconComponent />}
                            label={config.label}
                            sx={{
                              bgcolor: config.bgcolor,
                              color: config.color,
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              py: 2,
                            }}
                          />
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <HelpOutline sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Sem avaliação cadastrada
                        </Typography>
                      </Box>
                    )}

                    <Button
                      fullWidth
                      variant={avaliacao ? 'outlined' : 'contained'}
                      startIcon={avaliacao ? <Edit /> : <Add />}
                      onClick={() => abrirModal(aluno, avaliacao)}
                      sx={{ mt: 2 }}
                    >
                      {avaliacao ? 'Editar Avaliação' : 'Adicionar Avaliação'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      {/* Modal de Avaliação */}
      <Dialog
        open={openModal}
        onClose={fecharModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="h6">
                {avaliacaoAtual ? 'Editar' : 'Adicionar'} Avaliação
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {alunoSelecionado?.nome} | {filtros.trimestre}º Trimestre/{filtros.ano}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {/* PC1 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>📊 Ponto de Corte 1 (PC1)</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Nota PC1"
                  type="number"
                  inputProps={{ min: 0, max: 50, step: 0.5 }}
                  value={formData.pontosCorte.pc1.nota}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pontosCorte: {
                        ...formData.pontosCorte,
                        pc1: { ...formData.pontosCorte.pc1, nota: parseFloat(e.target.value) || 0 },
                      },
                    })
                  }
                  helperText="Máximo: 50 pontos"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Data do PC1"
                  type="date"
                  value={formData.pontosCorte.pc1.data ? formData.pontosCorte.pc1.data.split('T')[0] : ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pontosCorte: {
                        ...formData.pontosCorte,
                        pc1: { ...formData.pontosCorte.pc1, data: e.target.value },
                      },
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Autocomplete
              multiple
              options={habilidadesDisponiveis}
              getOptionLabel={(option) => `${option.codigo} - ${option.descricao}`}
              value={habilidadesDisponiveis.filter(h => formData.pontosCorte.pc1.habilidades.includes(h._id))}
              onChange={(e, newValue) =>
                setFormData({
                  ...formData,
                  pontosCorte: {
                    ...formData.pontosCorte,
                    pc1: { ...formData.pontosCorte.pc1, habilidades: newValue.map(v => v._id) },
                  },
                })
              }
              renderInput={(params) => (
                <TextField {...params} label="Habilidades trabalhadas no PC1" sx={{ mt: 2 }} />
              )}
            />
          </Box>

          {/* PC2 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>📊 Ponto de Corte 2 (PC2)</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Nota PC2"
                  type="number"
                  inputProps={{ min: 0, max: 50, step: 0.5 }}
                  value={formData.pontosCorte.pc2.nota}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pontosCorte: {
                        ...formData.pontosCorte,
                        pc2: { ...formData.pontosCorte.pc2, nota: parseFloat(e.target.value) || 0 },
                      },
                    })
                  }
                  helperText="Máximo: 50 pontos"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Data do PC2"
                  type="date"
                  value={formData.pontosCorte.pc2.data ? formData.pontosCorte.pc2.data.split('T')[0] : ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pontosCorte: {
                        ...formData.pontosCorte,
                        pc2: { ...formData.pontosCorte.pc2, data: e.target.value },
                      },
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Autocomplete
              multiple
              options={habilidadesDisponiveis}
              getOptionLabel={(option) => `${option.codigo} - ${option.descricao}`}
              value={habilidadesDisponiveis.filter(h => formData.pontosCorte.pc2.habilidades.includes(h._id))}
              onChange={(e, newValue) =>
                setFormData({
                  ...formData,
                  pontosCorte: {
                    ...formData.pontosCorte,
                    pc2: { ...formData.pontosCorte.pc2, habilidades: newValue.map(v => v._id) },
                  },
                })
              }
              renderInput={(params) => (
                <TextField {...params} label="Habilidades trabalhadas no PC2" sx={{ mt: 2 }} />
              )}
            />
          </Box>

          {/* Média Final */}
          <Box sx={{ mb: 4, p: 3, bgcolor: 'info.light', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>📈 Média Final (Automática)</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'info.dark' }}>
              {calcularMediaFinal()} / 100
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cálculo: PC1 ({formData.pontosCorte.pc1.nota}) + PC2 ({formData.pontosCorte.pc2.nota})
            </Typography>
          </Box>

          {/* EAC */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>📝 EAC (Ex. Aprendizagem Complementar)</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Nota EAC"
                  type="number"
                  inputProps={{ min: 0, max: 100, step: 0.5 }}
                  value={formData.pontosCorte.eac.nota}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pontosCorte: {
                        ...formData.pontosCorte,
                        eac: { ...formData.pontosCorte.eac, nota: parseFloat(e.target.value) || 0 },
                      },
                    })
                  }
                  helperText="Máximo: 100 pontos"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Data do EAC"
                  type="date"
                  value={formData.pontosCorte.eac.data ? formData.pontosCorte.eac.data.split('T')[0] : ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pontosCorte: {
                        ...formData.pontosCorte,
                        eac: { ...formData.pontosCorte.eac, data: e.target.value },
                      },
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Autocomplete
              multiple
              options={habilidadesDisponiveis}
              getOptionLabel={(option) => `${option.codigo} - ${option.descricao}`}
              value={habilidadesDisponiveis.filter(h => formData.pontosCorte.eac.habilidades.includes(h._id))}
              onChange={(e, newValue) =>
                setFormData({
                  ...formData,
                  pontosCorte: {
                    ...formData.pontosCorte,
                    eac: { ...formData.pontosCorte.eac, habilidades: newValue.map(v => v._id) },
                  },
                })
              }
              renderInput={(params) => (
                <TextField {...params} label="Habilidades trabalhadas no EAC" sx={{ mt: 2 }} />
              )}
            />
          </Box>

          {/* Nota Final */}
          <Box sx={{ p: 3, bgcolor: 'success.light', borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>🏆 Nota Final do Trimestre</Typography>
            <Typography variant="h2" sx={{ fontWeight: 'bold', color: 'success.dark', my: 2 }}>
              {calcularNotaFinal()} / 100
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Maior nota entre: Média Final ({calcularMediaFinal()}) e EAC ({formData.pontosCorte.eac.nota})
            </Typography>
            <Chip
              icon={<CLASSIFICACOES[getClassificacao(parseFloat(calcularNotaFinal()))].icon />}
              label={CLASSIFICACOES[getClassificacao(parseFloat(calcularNotaFinal()))].label}
              sx={{
                bgcolor: CLASSIFICACOES[getClassificacao(parseFloat(calcularNotaFinal()))].bgcolor,
                color: CLASSIFICACOES[getClassificacao(parseFloat(calcularNotaFinal()))].color,
                fontWeight: 600,
                fontSize: '1.1rem',
                py: 2.5,
              }}
            />
          </Box>

          <TextField
            fullWidth
            label="Observações"
            multiline
            rows={3}
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={fecharModal}>Cancelar</Button>
          <Button variant="contained" onClick={salvarAvaliacao} startIcon={<Assessment />}>
            Salvar Avaliação
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Avaliacoes;
