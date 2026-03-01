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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
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
  Upload,
  Download,
  CloudUpload,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { Assessment as AvaliacoesIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

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

  // Estados para importação
  const [openImportModal, setOpenImportModal] = useState(false);
  const [importTabValue, setImportTabValue] = useState(0);
  const [importData, setImportData] = useState([]);
  const [importLoading, setImportLoading] = useState(false);

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
    return ((pc1 + pc2) / 2).toFixed(1);
  };

  const calcularNotaFinal = () => {
    const mediaFinal = parseFloat(calcularMediaFinal());
    const eac = parseFloat(formData.pontosCorte.eac.nota) || 0;
    return Math.max(mediaFinal, eac).toFixed(1);
  };

  const getClassificacao = (nota) => {
    if (!nota || nota === 0) return 'sem-avaliacao';
    if (nota >= 8.0) return 'adequado';
    if (nota >= 6.0) return 'proficiente';
    if (nota >= 4.0) return 'em-alerta';
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

  // Funções de importação
  const downloadTemplate = async (format = 'excel') => {
    if (!filtros.turma || !filtros.disciplina) {
      toast.warning('Selecione uma turma e disciplina para gerar o template');
      return;
    }

    try {
      const response = await api.get(`/avaliacoes/template/${filtros.turma}`, {
        params: {
          disciplinaId: filtros.disciplina,
          trimestre: filtros.trimestre,
          ano: filtros.ano
        }
      });

      const { template, turma, disciplina, habilidadesDisponiveis, instrucoes } = response.data;

      if (format === 'excel') {
        // Criar worksheet com dados
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Avaliações');

        // Adicionar aba com instruções
        const wsInstrucoes = XLSX.utils.aoa_to_sheet([
          ['INSTRUÇÕES PARA IMPORTAÇÃO DE AVALIAÇÕES - SISTEMA DE PONTOS DE CORTE'],
          [''],
          ['Sistema:', instrucoes.sistema],
          [''],
          ['PC1 (Ponto de Corte 1):', instrucoes.pc1],
          ['PC2 (Ponto de Corte 2):', instrucoes.pc2],
          ['EAC (Exame de Aprendizagem Complementar):', instrucoes.eac],
          [''],
          ['Habilidades:', instrucoes.habilidades],
          ['Múltiplas Habilidades:', instrucoes.multiplas_habilidades],
          [''],
          ['Nota Final:', instrucoes.notaFinal],
          ['Trimestre:', instrucoes.trimestre],
          ['Formato de Data:', instrucoes.formato_data],
          [''],
          ['HABILIDADES DISPONÍVEIS PARA ESTA DISCIPLINA:'],
          [''],
          ...habilidadesDisponiveis.map(h => [`${h.codigo}`, h.descricao])
        ]);
        XLSX.utils.book_append_sheet(wb, wsInstrucoes, 'Instruções');

        // Download
        XLSX.writeFile(wb, `avaliacoes_${turma.nome}_${disciplina.nome}_T${filtros.trimestre}_${filtros.ano}.xlsx`);
        toast.success(`Template gerado com ${turma.totalAlunos} alunos!`);
      } else {
        // CSV
        const csv = Papa.unparse(template);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `avaliacoes_${turma.nome}_${disciplina.nome}_T${filtros.trimestre}_${filtros.ano}.csv`;
        link.click();
        toast.success(`Template CSV gerado com ${turma.totalAlunos} alunos!`);
      }
    } catch (error) {
      console.error('Erro ao gerar template:', error);
      toast.error(error.response?.data?.message || 'Erro ao gerar template');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    setImportLoading(true);

    if (isExcel) {
      // Processar Excel
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          const validData = jsonData.filter(row => 
            row.matricula_aluno && row.codigo_disciplina
          );

          setImportData(validData);
          setImportLoading(false);

          if (validData.length > 0) {
            toast.success(`${validData.length} avaliações encontradas no arquivo Excel`);
          } else {
            toast.error('Nenhuma avaliação válida encontrada no arquivo');
          }
        } catch (error) {
          setImportLoading(false);
          toast.error('Erro ao ler arquivo Excel: ' + error.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Processar CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const validData = results.data.filter(row => 
            row.matricula_aluno && row.codigo_disciplina
          );

          setImportData(validData);
          setImportLoading(false);

          if (validData.length > 0) {
            toast.success(`${validData.length} avaliações encontradas no arquivo CSV`);
          } else {
            toast.error('Nenhuma avaliação válida encontrada no arquivo');
          }
        },
        error: (error) => {
          setImportLoading(false);
          toast.error('Erro ao ler arquivo CSV: ' + error.message);
        }
      });
    }
  };

  const handleImportAvaliacoes = async () => {
    if (importData.length === 0) {
      toast.error('Nenhuma avaliação para importar');
      return;
    }

    setImportLoading(true);

    try {
      const response = await api.post('/avaliacoes/importar', {
        avaliacoes: importData
      });

      const { sucesso, criados, atualizados, erros, detalhes } = response.data;

      if (sucesso > 0) {
        toast.success(`✅ Importação concluída! ${criados} criadas, ${atualizados} atualizadas`);
        
        // Mostrar erros se houver
        if (erros > 0) {
          const errosDetalhes = detalhes
            .filter(d => d.erro)
            .slice(0, 5) // Mostrar apenas os primeiros 5 erros
            .map(d => `Linha ${d.linha}: ${d.erro}`)
            .join('\n');
          
          toast.warning(`⚠️ ${erros} avaliações com erro:\n${errosDetalhes}`);
        }

        // Fechar modal e recarregar
        setOpenImportModal(false);
        setImportData([]);
        loadAvaliacoes();
      } else {
        toast.error('Nenhuma avaliação foi importada. Verifique os dados.');
      }
    } catch (error) {
      console.error('Erro ao importar avaliações:', error);
      toast.error(error.response?.data?.message || 'Erro ao importar avaliações');
    } finally {
      setImportLoading(false);
    }
  };

  const handleCloseImportModal = () => {
    setOpenImportModal(false);
    setImportData([]);
    setImportTabValue(0);
  };

  const renderChipClassificacao = (nota) => {
    const classificacao = CLASSIFICACOES[getClassificacao(parseFloat(nota))];
    const IconComponent = classificacao.icon;
    return (
      <Chip
        icon={<IconComponent />}
        label={classificacao.label}
        sx={{
          bgcolor: classificacao.bgcolor,
          color: classificacao.color,
          fontWeight: 600,
          fontSize: '1.1rem',
          py: 2.5,
        }}
      />
    );
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

        {/* Botão de Importar */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setOpenImportModal(true)}
            disabled={!filtros.turma || !filtros.disciplina}
          >
            Importar Avaliações
          </Button>
        </Box>
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
                  inputProps={{ min: 0, max: 10, step: 0.1 }}
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
                  helperText="Nota de 0 a 10 (ex: 8,5)"
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
                  inputProps={{ min: 0, max: 10, step: 0.1 }}
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
                  helperText="Nota de 0 a 10 (ex: 7,5)"
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
                  inputProps={{ min: 0, max: 10, step: 0.1 }}
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
                  helperText="Nota de 0 a 10 (ex: 9,0)"
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
              {calcularNotaFinal()} / 10
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Maior nota entre: Média Final ({calcularMediaFinal()}) e EAC ({formData.pontosCorte.eac.nota})
            </Typography>
            {renderChipClassificacao(calcularNotaFinal())}
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

      {/* Modal de Importação */}
      <Dialog 
        open={openImportModal} 
        onClose={handleCloseImportModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Upload />
            <Typography variant="h6">Importar Avaliações em Lote</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Tabs 
            value={importTabValue} 
            onChange={(e, newValue) => setImportTabValue(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label="Gerar Template" />
            <Tab label="Importar Arquivo" />
          </Tabs>

          {/* Aba 0: Gerar Template */}
          {importTabValue === 0 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <strong>Como funciona:</strong>
                <br />
                1. Selecione a turma e disciplina nos filtros acima
                <br />
                2. Clique para baixar o template com todos os alunos da turma
                <br />
                3. Preencha as notas de PC1, PC2 e EAC (de 0 a 10, ex: 8,5) para cada aluno
                <br />
                4. Você pode adicionar múltiplas habilidades separadas por vírgula em cada ponto de corte
                <br />
                5. Importe o arquivo preenchido na aba "Importar Arquivo"
              </Alert>

              <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
                <Typography variant="h6" gutterBottom>
                  📋 Configurações do Template
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      <strong>Filtros Selecionados:</strong>
                      <br />
                      Turma: {turmas.find(t => t._id === filtros.turma)?.nome || 'Não selecionada'}
                      <br />
                      Disciplina: {disciplinas.find(d => d._id === filtros.disciplina)?.nome || 'Não selecionada'}
                      <br />
                      Trimestre: {filtros.trimestre}º Trimestre
                      <br />
                      Ano: {filtros.ano}
                    </Alert>
                  </Grid>
                </Grid>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  O template incluirá:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="✓ Todos os alunos da turma selecionada" 
                      secondary="Matrícula e nome de cada aluno"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="✓ Colunas para PC1, PC2 e EAC" 
                      secondary="Nota (0-10 com uma casa decimal, ex: 8,5), data e habilidades"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="✓ Lista de habilidades disponíveis" 
                      secondary="Códigos de habilidades da disciplina (em aba separada no Excel)"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="✓ Instruções detalhadas" 
                      secondary="Como preencher múltiplas habilidades: EF06MA01,EF06MA02"
                    />
                  </ListItem>
                </List>

                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Download />}
                    onClick={() => downloadTemplate('excel')}
                    disabled={!filtros.turma || !filtros.disciplina}
                  >
                    Baixar Template Excel (.xlsx)
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => downloadTemplate('csv')}
                    disabled={!filtros.turma || !filtros.disciplina}
                  >
                    Baixar Template CSV
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}

          {/* Aba 1: Importar Arquivo */}
          {importTabValue === 1 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <strong>Formatos aceitos:</strong> Excel (.xlsx, .xls) ou CSV
                <br />
                <strong>Sistema:</strong> Pontos de Corte (PC1, PC2, EAC) - Notas de 0 a 10
                <br />
                <strong>Habilidades:</strong> Separe múltiplas habilidades por vírgula (ex: EF06MA01,EF06MA02)
              </Alert>

              <Paper 
                sx={{ 
                  p: 4, 
                  textAlign: 'center', 
                  bgcolor: 'background.default',
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                component="label"
              >
                <input
                  type="file"
                  hidden
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={importLoading}
                />
                <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Clique para selecionar o arquivo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ou arraste e solte aqui
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Formatos: .xlsx, .xls, .csv
                </Typography>
              </Paper>

              {importLoading && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Processando arquivo...
                  </Typography>
                </Box>
              )}

              {importData.length > 0 && !importLoading && (
                <Box sx={{ mt: 3 }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {importData.length} avaliações prontas para importar
                  </Alert>

                  <Paper sx={{ maxHeight: 300, overflow: 'auto', p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Preview dos dados:
                    </Typography>
                    <List dense>
                      {importData.slice(0, 10).map((item, index) => (
                        <ListItem key={index} divider>
                          <ListItemText
                            primary={`${item.aluno_nome} (${item.matricula_aluno})`}
                            secondary={`PC1: ${item.pc1_nota || 0} | PC2: ${item.pc2_nota || 0} | EAC: ${item.eac_nota || 0} | Nota Final: ${Math.max((parseFloat(item.pc1_nota) || 0) + (parseFloat(item.pc2_nota) || 0), (parseFloat(item.eac_nota) || 0))}`}
                          />
                        </ListItem>
                      ))}
                      {importData.length > 10 && (
                        <ListItem>
                          <ListItemText 
                            secondary={`... e mais ${importData.length - 10} avaliações`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseImportModal} disabled={importLoading}>
            Cancelar
          </Button>
          {importTabValue === 1 && importData.length > 0 && (
            <Button
              variant="contained"
              onClick={handleImportAvaliacoes}
              disabled={importLoading}
              startIcon={<Upload />}
            >
              {importLoading ? 'Importando...' : `Importar ${importData.length} Avaliações`}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Avaliacoes;
