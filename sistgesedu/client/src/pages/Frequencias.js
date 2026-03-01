import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Alert,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Save,
  Refresh,
  Assessment,
  EventNote,
  Warning,
  Upload,
  Download,
  Delete,
} from '@mui/icons-material';
import { frequenciaService, turmaService, disciplinaService, alunoService } from '../services';
import { toast } from 'react-toastify';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import PageHeader from '../components/PageHeader';

// Ícone para o cabeçalho da página
const FrequenciasIcon = EventNote;

const STATUS_COLORS = {
  presente: { color: 'success', icon: CheckCircle, label: 'Presente' },
  falta: { color: 'error', icon: Cancel, label: 'Falta' },
  'falta-justificada': { color: 'warning', icon: EventNote, label: 'Justificada' },
};

const FREQUENCIA_STATUS = {
  bom: { color: 'success', label: 'Boa Frequência', min: 85 },
  atencao: { color: 'warning', label: 'Atenção', min: 75 },
  critico: { color: 'error', label: 'Crítico', min: 0 },
};

const Frequencias = () => {
  const [turmas, setTurmas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [frequencias, setFrequencias] = useState({});
  
  // Filtros (removido disciplina - agora é visão geral)
  const [filtros, setFiltros] = useState({
    turma: '',
    data: new Date().toISOString().split('T')[0],
  });

  // Estado de presença dos alunos
  const [presencas, setPresencas] = useState({});
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Filtro por card (para filtrar alunos visualmente)
  const [filtroCard, setFiltroCard] = useState('todos'); // todos, presentes, faltas, justificadas

  // Estatísticas reais do backend
  const [estatisticas, setEstatisticas] = useState(null);

  // Dialog de justificativa
  const [dialogJustificativa, setDialogJustificativa] = useState(false);
  const [alunoJustificar, setAlunoJustificar] = useState(null);
  const [justificativa, setJustificativa] = useState('');

  // Importação
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [importData, setImportData] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  
  // Template personalizado por turma
  const [turmaSelecionadaTemplate, setTurmaSelecionadaTemplate] = useState('');
  const [disciplinaSelecionadaTemplate, setDisciplinaSelecionadaTemplate] = useState('');

  // Estatísticas locais (calculadas do estado)
  const [stats, setStats] = useState({
    total: 0,
    presentes: 0,
    faltas: 0,
    percentual: 100,
  });

  useEffect(() => {
    loadTurmas();
    loadDisciplinas();
  }, []);

  useEffect(() => {
    if (filtros.turma && filtros.data) {
      loadAlunos();
      loadEstatisticas();
    }
  }, [filtros.turma, filtros.data]);

  useEffect(() => {
    calcularStats();
  }, [presencas, alunos]);

  const loadTurmas = async () => {
    try {
      const data = await turmaService.getAll();
      setTurmas(data);
    } catch (error) {
      toast.error('Erro ao carregar turmas');
    }
  };

  const loadDisciplinas = async () => {
    try {
      const data = await disciplinaService.getAll();
      setDisciplinas(data);
    } catch (error) {
      toast.error('Erro ao carregar disciplinas');
    }
  };

  const loadAlunos = async () => {
    try {
      setLoading(true);
      const data = await alunoService.getAll({ turma: filtros.turma });
      setAlunos(data);
      
      // Inicializar presenças como presente para todos
      const presencasInicial = {};
      data.forEach(aluno => {
        presencasInicial[aluno._id] = 'presente';
      });
      setPresencas(presencasInicial);
    } catch (error) {
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  const loadEstatisticas = async () => {
    try {
      if (!filtros.turma || !filtros.data) return;
      
      const data = await frequenciaService.getEstatisticasTurma(filtros.turma, {
        data: filtros.data,
        ano: new Date(filtros.data).getFullYear()
      });
      
      setEstatisticas(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setEstatisticas(null);
    }
  };

  const loadFrequencia = async () => {
    try {
      setLoading(true);
      const response = await frequenciaService.getFrequenciaTurmaDia(
        filtros.turma,
        filtros.data,
        { disciplina: filtros.disciplina }
      );
      
      // Converter para objeto { alunoId: status }
      const presencasCarregadas = {};
      response.frequencias.forEach(freq => {
        presencasCarregadas[freq.aluno._id] = freq.status;
      });
      
      setPresencas(presencasCarregadas);
      setFrequencias(response.frequencias.reduce((acc, f) => {
        acc[f.aluno._id] = f;
        return acc;
      }, {}));
    } catch (error) {
      console.error('Erro ao carregar frequência:', error);
      // Se não houver frequência registrada, inicializar todos como presente
      const presencasInicial = {};
      alunos.forEach(aluno => {
        presencasInicial[aluno._id] = 'presente';
      });
      setPresencas(presencasInicial);
    } finally {
      setLoading(false);
    }
  };

  const calcularStats = () => {
    const total = alunos.length;
    const presentes = Object.values(presencas).filter(p => p === 'presente').length;
    const faltas = Object.values(presencas).filter(p => p === 'falta' || p === 'falta-justificada').length;
    const percentual = total > 0 ? ((presentes / total) * 100).toFixed(1) : 100;

    setStats({ total, presentes, faltas, percentual });
  };

  const handlePresencaChange = (alunoId, status) => {
    setPresencas(prev => ({
      ...prev,
      [alunoId]: status
    }));
  };

  const handleSalvarChamada = async () => {
    try {
      setSalvando(true);
      
      const turma = turmas.find(t => t._id === filtros.turma);
      
      // Usar a nova função que salva em TODAS as disciplinas
      await frequenciaService.registrarChamadaGeral(filtros.turma, {
        data: filtros.data,
        periodo: turma?.turno || 'matutino',
        presencas
      });
      
      toast.success('Frequência salva com sucesso em todas as disciplinas!');
      loadEstatisticas(); // Recarregar estatísticas
    } catch (error) {
      toast.error('Erro ao salvar frequência: ' + (error.response?.data?.message || error.message));
    } finally {
      setSalvando(false);
    }
  };

  const handleResetRegistros = async () => {
    const confirmacao = window.confirm(
      `⚠️ ATENÇÃO!\n\nDeseja DELETAR todos os registros de frequência desta turma para o dia ${new Date(filtros.data).toLocaleDateString('pt-BR')}?\n\nEsta ação NÃO pode ser desfeita!`
    );
    
    if (!confirmacao) return;
    
    try {
      setLoading(true);
      await frequenciaService.resetarDia(filtros.turma, filtros.data);
      toast.success('Registros resetados com sucesso!');
      
      // Reinicializar presenças
      const presencasInicial = {};
      alunos.forEach(aluno => {
        presencasInicial[aluno._id] = 'presente';
      });
      setPresencas(presencasInicial);
      
      loadEstatisticas();
    } catch (error) {
      toast.error('Erro ao resetar registros: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleJustificarFalta = async () => {
    try {
      if (!justificativa.trim()) {
        toast.error('Digite a justificativa');
        return;      }
      
      const freq = frequencias[alunoJustificar];
      if (freq) {
        await frequenciaService.justificarFalta(freq._id, {
          descricao: justificativa
        });
      }
      
      setPresencas(prev => ({
        ...prev,
        [alunoJustificar]: 'falta-justificada'
      }));
      
      toast.success('Falta justificada!');
      setDialogJustificativa(false);
      setJustificativa('');
      setAlunoJustificar(null);
      loadFrequencia();
    } catch (error) {
      toast.error('Erro ao justificar falta');
    }
  };

  const getFrequenciaStatus = (percentual) => {
    if (percentual >= FREQUENCIA_STATUS.bom.min) return FREQUENCIA_STATUS.bom;
    if (percentual >= FREQUENCIA_STATUS.atencao.min) return FREQUENCIA_STATUS.atencao;
    return FREQUENCIA_STATUS.critico;
  };

  // Funções de importação
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          const validData = jsonData.filter(row => 
            (row.matricula_aluno || row.aluno_nome) && 
            (row.codigo_disciplina || row.disciplina_nome) &&
            row.turma_nome && row.data
          );
          setImportData(validData);
          if (validData.length > 0) {
            toast.success(`${validData.length} frequências encontradas no arquivo Excel`);
          } else {
            toast.error('Nenhuma frequência válida encontrada no arquivo');
          }
        } catch (error) {
          toast.error('Erro ao ler arquivo Excel: ' + error.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const validData = results.data.filter(row => 
            (row.matricula_aluno || row.aluno_nome) && 
            (row.codigo_disciplina || row.disciplina_nome) &&
            row.turma_nome && row.data
          );
          setImportData(validData);
          if (validData.length > 0) {
            toast.success(`${validData.length} frequências encontradas no arquivo CSV`);
          } else {
            toast.error('Nenhuma frequência válida encontrada no arquivo');
          }
        },
        error: (error) => {
          toast.error('Erro ao ler arquivo CSV: ' + error.message);
        }
      });
    }
  };

  const handleImport = async () => {
    if (importData.length === 0) {
      toast.error('Nenhuma frequência para importar');
      return;
    }

    try {
      setLoading(true);
      const response = await frequenciaService.importar(importData);
      
      toast.success(`${response.criados} frequências criadas, ${response.atualizados} atualizadas!`);
      if (response.erros > 0) {
        toast.warning(`${response.erros} registros com erro. Verifique os dados.`);
        console.log('Detalhes dos erros:', response.detalhes);
      }
      
      setOpenImportDialog(false);
      setImportData([]);
      loadFrequencia();
    } catch (error) {
      toast.error('Erro ao importar frequências: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async (format = 'csv') => {
    try {
      // Se há turma selecionada, baixar template personalizado
      if (turmaSelecionadaTemplate) {
        const params = {};
        if (disciplinaSelecionadaTemplate) {
          params.disciplinaId = disciplinaSelecionadaTemplate;
        }
        if (filtros.data) {
          params.data = filtros.data;
        }

        const response = await frequenciaService.getTemplatePorTurma(turmaSelecionadaTemplate, params);
        const { turma, disciplina, template, instrucoes, codigos_status } = response;

        if (format === 'excel') {
          const ws = XLSX.utils.json_to_sheet(template);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Frequências');
          
          // Adicionar instruções em outra aba
          const wsInstrucoes = XLSX.utils.aoa_to_sheet([
            ['INSTRUÇÕES PARA PREENCHIMENTO DE FREQUÊNCIAS'],
            [''],
            ['CÓDIGOS DE STATUS RÁPIDOS (coluna status_codigo):'],
            ['P = Presente'],
            ['F = Falta'],
            ['FJ = Falta Justificada'],
            ['A = Atestado'],
            ['VAZIO = Presente (padrão)'],
            [''],
            ['INSTRUÇÕES:'],
            [instrucoes.status],
            [instrucoes.status_codigo],
            [instrucoes.dica],
            [''],
            ['IMPORTANTE:'],
            ['- Não altere as colunas matricula_aluno, aluno_nome, turma_nome'],
            ['- Não remova cabeçalhos'],
            ['- Use a coluna status_codigo (P, F, FJ, A) para rapidez'],
            ['- Ou use a coluna status (presente, falta, falta-justificada, atestado)'],
            ['- Se ambas estiverem vazias, será considerado "presente"'],
          ]);
          XLSX.utils.book_append_sheet(wb, wsInstrucoes, 'Instruções');
          
          const fileName = disciplina 
            ? `frequencia_${turma.nome}_${disciplina.nome}.xlsx`
            : `frequencia_${turma.nome}_todas_disciplinas.xlsx`;
          XLSX.writeFile(wb, fileName);
        } else {
          const csv = Papa.unparse(template);
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          const fileName = disciplina 
            ? `frequencia_${turma.nome}_${disciplina.nome}.csv`
            : `frequencia_${turma.nome}_todas_disciplinas.csv`;
          link.download = fileName;
          link.click();
        }

        toast.success('Template personalizado baixado com sucesso!');
        return;
      }

      // Template genérico (comportamento anterior)
      const dataExemplo = new Date().toISOString().split('T')[0];
      
      if (format === 'excel') {
        const ws = XLSX.utils.json_to_sheet([
          {
            matricula_aluno: '2026001',
            aluno_nome: 'João Silva',
            codigo_disciplina: 'MAT',
            disciplina_nome: 'Matemática',
            turma_nome: '1º Ano A',
            data: dataExemplo,
            status: '',
            status_codigo: 'P',
            periodo: 'matutino',
            observacao: ''
          },
          {
            matricula_aluno: '2026002',
            aluno_nome: 'Ana Santos',
            codigo_disciplina: 'POR',
            disciplina_nome: 'Português',
            turma_nome: '2º Ano B',
            data: dataExemplo,
            status: '',
            status_codigo: 'F',
            periodo: 'vespertino',
            observacao: 'Aluna avisou'
          },
          {
            matricula_aluno: '2026003',
            aluno_nome: 'Pedro Costa',
            codigo_disciplina: 'MAT',
            disciplina_nome: 'Matemática',
            turma_nome: '3º Ano C',
            data: dataExemplo,
            status: '',
            status_codigo: 'FJ',
            periodo: 'matutino',
            observacao: 'Atestado médico'
          }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Frequências');
        
        // Adicionar instruções
        const wsInstrucoes = XLSX.utils.aoa_to_sheet([
          ['CÓDIGOS DE STATUS'],
          ['P = Presente'],
          ['F = Falta'],
          ['FJ = Falta Justificada'],
          ['A = Atestado'],
          [''],
          ['Use a coluna status_codigo para mais rapidez!'],
        ]);
        XLSX.utils.book_append_sheet(wb, wsInstrucoes, 'Códigos');
        
        XLSX.writeFile(wb, 'template_frequencias.xlsx');
      } else {
        const csv = 'matricula_aluno,aluno_nome,codigo_disciplina,disciplina_nome,turma_nome,data,status,status_codigo,periodo,observacao\n' +
                    `2026001,João Silva,MAT,Matemática,1º Ano A,${dataExemplo},,P,matutino,\n` +
                    `2026002,Ana Santos,POR,Português,2º Ano B,${dataExemplo},,F,vespertino,Aluna avisou\n` +
                    `2026003,Pedro Costa,MAT,Matemática,3º Ano C,${dataExemplo},,FJ,matutino,Atestado médico`;
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'template_frequencias.csv';
        link.click();
      }
    } catch (error) {
      console.error('Erro ao baixar template:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detalhes || 
                          error.message || 
                          'Erro desconhecido ao baixar template';
      toast.error(errorMessage);
    }
  };

  const statusGeral = getFrequenciaStatus(parseFloat(stats.percentual));

  return (
    <Container maxWidth="xl">
      <PageHeader 
        title="Controle de Frequência" 
        subtitle="Registre e acompanhe a presença dos alunos"
        icon={FrequenciasIcon}
      />
      
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Upload />}
            onClick={() => setOpenImportDialog(true)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Importar
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Turma"
              value={filtros.turma}
              onChange={(e) => setFiltros({ ...filtros, turma: e.target.value })}
            >
              <MenuItem value="">Selecione uma turma</MenuItem>
              {turmas.map(turma => (
                <MenuItem key={turma._id} value={turma._id}>
                  {turma.nome} - {turma.turno}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Data"
              value={filtros.data}
              onChange={(e) => setFiltros({ ...filtros, data: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Estatísticas - Cards Clicáveis */}
      {filtros.turma && alunos.length > 0 && estatisticas && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Card 1 - Total de Alunos */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              sx={{ 
                bgcolor: '#0D47A1', // Azul marinho forte
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: filtroCard === 'todos' ? '3px solid #FFD700' : 'none',
                '&:hover': { 
                  transform: 'scale(1.05)',
                  boxShadow: 6
                }
              }}
              onClick={() => setFiltroCard('todos')}
            >
              <CardContent>
                <Typography variant="h2" sx={{ color: '#FFF', fontWeight: 700 }} align="center">
                  {estatisticas.totalAlunos}
                </Typography>
                <Typography variant="body1" align="center">Total de Alunos</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 2 - Presentes */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              sx={{ 
                bgcolor: 'success.main',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: filtroCard === 'presentes' ? '3px solid #FFD700' : 'none',
                '&:hover': { 
                  transform: 'scale(1.05)',
                  boxShadow: 6
                }
              }}
              onClick={() => setFiltroCard('presentes')}
            >
              <CardContent>
                <Typography variant="h2" align="center" fontWeight="700">
                  {stats.presentes}
                </Typography>
                <Typography variant="body1" align="center">Presentes Hoje</Typography>
                <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
                <Typography variant="caption" align="center" display="block">
                  Acum: {estatisticas.acumulado.presentes} ({estatisticas.acumulado.percentualPresenca}%)
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 3 - Faltas */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              sx={{ 
                bgcolor: 'error.main',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: filtroCard === 'faltas' ? '3px solid #FFD700' : 'none',
                '&:hover': { 
                  transform: 'scale(1.05)',
                  boxShadow: 6
                }
              }}
              onClick={() => setFiltroCard('faltas')}
            >
              <CardContent>
                <Typography variant="h2" align="center" fontWeight="700">
                  {Object.values(presencas).filter(p => p === 'falta').length}
                </Typography>
                <Typography variant="body1" align="center">Faltas Hoje</Typography>
                <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
                <Typography variant="caption" align="center" display="block">
                  Acum: {estatisticas.acumulado.faltas}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 4 - Justificadas - NOVO */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              sx={{ 
                bgcolor: 'warning.main',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: filtroCard === 'justificadas' ? '3px solid #FFD700' : 'none',
                '&:hover': { 
                  transform: 'scale(1.05)',
                  boxShadow: 6
                }
              }}
              onClick={() => setFiltroCard('justificadas')}
            >
              <CardContent>
                <Typography variant="h2" align="center" fontWeight="700">
                  {Object.values(presencas).filter(p => p === 'falta-justificada').length}
                </Typography>
                <Typography variant="body1" align="center">Justificadas Hoje</Typography>
                <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
                <Typography variant="caption" align="center" display="block">
                  Acum: {estatisticas.acumulado.justificadas}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 5 - Percentual Geral com Cor Dinâmica */}
          <Grid item xs={12} sm={12} md={2.4}>
            <Card 
              sx={{ 
                bgcolor: 
                  estatisticas.percentualGeral >= 85 ? 'success.main' :
                  estatisticas.percentualGeral >= 75 ? 'warning.main' :
                  'error.main',
                color: 'white',
              }}
            >
              <CardContent>
                <Typography variant="h2" align="center" fontWeight="700">
                  {estatisticas.percentualGeral}%
                </Typography>
                <Typography variant="body1" align="center">
                  {estatisticas.classificacao === 'adequado' ? '✅ Adequado' : 
                   estatisticas.classificacao === 'atencao' ? '⚠️ Atenção' : 
                   '🚨 Crítico'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabela de Alunos com Filtro */}
      {filtros.turma && alunos.length > 0 && (
        <>
          {loading && <LinearProgress sx={{ mb: 2 }} />}
          
          <Paper>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6">
                  Lista de Presença - {new Date(filtros.data).toLocaleDateString('pt-BR')}
                </Typography>
                {filtroCard !== 'todos' && (
                  <Chip 
                    label={`Filtro: ${
                      filtroCard === 'presentes' ? 'Presentes' :
                      filtroCard === 'faltas' ? 'Faltas' :
                      'Justificadas'
                    }`}
                    color="primary"
                    size="small"
                    onDelete={() => setFiltroCard('todos')}
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleResetRegistros}
                  disabled={!filtros.turma || !filtros.data || salvando}
                >
                  Resetar
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  onClick={handleSalvarChamada}
                  disabled={salvando}
                >
                  {salvando ? 'Salvando...' : 'Salvar Chamada'}
                </Button>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Matrícula</TableCell>
                    <TableCell>Nome do Aluno</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alunos
                    .filter(aluno => {
                      if (filtroCard === 'todos') return true;
                      const status = presencas[aluno._id] || 'presente';
                      if (filtroCard === 'presentes') return status === 'presente';
                      if (filtroCard === 'faltas') return status === 'falta';
                      if (filtroCard === 'justificadas') return status === 'falta-justificada';
                      return true;
                    })
                    .map(aluno => {
                    const status = presencas[aluno._id] || 'presente';
                    const statusConfig = STATUS_COLORS[status];
                    const IconeStatus = statusConfig.icon;

                    return (
                      <TableRow key={aluno._id}>
                        <TableCell>
                          <Chip label={aluno.matricula} size="small" />
                        </TableCell>
                        <TableCell>{aluno.nome}</TableCell>
                        <TableCell align="center">
                          <ToggleButtonGroup
                            value={status}
                            exclusive
                            onChange={(e, newStatus) => {
                              if (newStatus) handlePresencaChange(aluno._id, newStatus);
                            }}
                            size="small"
                          >
                            <ToggleButton value="presente" color="success">
                              <Tooltip title="Presente">
                                <CheckCircle />
                              </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="falta" color="error">
                              <Tooltip title="Falta">
                                <Cancel />
                              </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="falta-justificada" color="warning">
                              <Tooltip title="Justificada">
                                <EventNote />
                              </Tooltip>
                            </ToggleButton>
                          </ToggleButtonGroup>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={<IconeStatus />}
                            label={statusConfig.label}
                            color={statusConfig.color}
                            size="small"
                          />
                          {(status === 'falta' || status === 'falta-justificada') && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setAlunoJustificar(aluno._id);
                                setDialogJustificativa(true);
                              }}
                            >
                              <EventNote />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {!filtros.turma && (
        <Alert severity="info">
          Selecione uma turma, disciplina e data para iniciar o registro de frequência
        </Alert>
      )}

      {/* Dialog de Justificativa */}
      <Dialog 
        open={dialogJustificativa} 
        onClose={() => setDialogJustificativa(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Justificar Falta</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Justificativa"
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Digite o motivo da falta..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogJustificativa(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleJustificarFalta}
          >
            Salvar Justificativa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Importação */}
      <Dialog 
        open={openImportDialog} 
        onClose={() => setOpenImportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Upload color="primary" />
            <Typography variant="h6">Importar Frequências</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
            <Tab label="Upload" />
            <Tab label="Instruções" />
          </Tabs>

          {tabValue === 0 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Faça upload de um arquivo CSV ou Excel (.xlsx) com as frequências.
                Use códigos rápidos: <strong>P</strong> (Presente), <strong>F</strong> (Falta), <strong>FJ</strong> (Falta Justificada), <strong>A</strong> (Atestado).
              </Alert>

              {/* Seletores para template personalizado */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  Template Personalizado por Turma
                </Typography>
                <Typography variant="caption" display="block" sx={{ mb: 2, color: 'text.secondary' }}>
                  Baixe um template com todos os alunos da turma já preenchidos
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Selecione a Turma"
                      value={turmaSelecionadaTemplate}
                      onChange={(e) => {
                        setTurmaSelecionadaTemplate(e.target.value);
                        setDisciplinaSelecionadaTemplate('');
                      }}
                      size="small"
                    >
                      <MenuItem value="">
                        <em>Template genérico</em>
                      </MenuItem>
                      {turmas.map((turma) => (
                        <MenuItem key={turma._id} value={turma._id}>
                          {turma.nome}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Disciplina (opcional)"
                      value={disciplinaSelecionadaTemplate}
                      onChange={(e) => setDisciplinaSelecionadaTemplate(e.target.value)}
                      disabled={!turmaSelecionadaTemplate}
                      size="small"
                    >
                      <MenuItem value="">
                        <em>Todas as disciplinas</em>
                      </MenuItem>
                      {disciplinas.map((disciplina) => (
                        <MenuItem key={disciplina._id} value={disciplina._id}>
                          {disciplina.nome}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => downloadTemplate('csv')}
                  fullWidth
                >
                  Baixar Template CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => downloadTemplate('excel')}
                  fullWidth
                >
                  Baixar Template Excel
                </Button>
              </Box>

              <Button
                variant="contained"
                component="label"
                fullWidth
                startIcon={<Upload />}
                sx={{ mb: 3 }}
              >
                Selecionar Arquivo
                <input
                  type="file"
                  hidden
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </Button>

              {importData.length > 0 && (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {importData.length} registros prontos para importar
                  </Alert>
                  <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
                    <List dense>
                      {importData.slice(0, 10).map((item, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={`${item.aluno_nome || item.matricula_aluno} - ${item.data}`}
                            secondary={`${item.disciplina_nome || item.codigo_disciplina} | Status: ${item.status || 'presente'}`}
                          />
                        </ListItem>
                      ))}
                      {importData.length > 10 && (
                        <ListItem>
                          <ListItemText secondary={`... e mais ${importData.length - 10} registros`} />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                </Box>
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                📋 Formato do Arquivo
              </Typography>
              <Typography variant="body2" paragraph>
                O arquivo deve conter as seguintes colunas:
              </Typography>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace' }}>
                  <strong>Obrigatórios:</strong><br />
                  • matricula_aluno ou aluno_nome<br />
                  • codigo_disciplina ou disciplina_nome<br />
                  • turma_nome<br />
                  • data (formato: AAAA-MM-DD)<br />
                  <br />
                  <strong>Opcionais:</strong><br />
                  • professor_nome<br />
                  • status (presente, falta, falta-justificada, atestado - padrão: presente)<br />
                  • periodo (matutino, vespertino, noturno, integral)<br />
                  • observacao
                </Typography>
              </Paper>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Importante:</strong> O sistema buscará alunos pela matrícula ou nome,
                  disciplinas pelo código ou nome, e turmas pelo nome. Para a mesma data/aluno/disciplina,
                  o registro existente será atualizado.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenImportDialog(false);
            setImportData([]);
            setTabValue(0);
          }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={importData.length === 0 || loading}
            startIcon={<Upload />}
          >
            {loading ? 'Importando...' : 'Importar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Frequencias;
