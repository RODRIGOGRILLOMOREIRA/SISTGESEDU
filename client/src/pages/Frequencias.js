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
  Badge,
  useTheme,
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
  bom: { color: 'success', label: 'Boa Frequência', min: 80 },
  atencao: { color: 'warning', label: 'Atenção', min: 60 },
  critico: { color: 'error', label: 'Crítico', min: 0 },
};

const Frequencias = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Função helper para formatar data sem problemas de timezone
  const formatarDataLocal = (dataString) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // Função helper para obter a data de hoje no formato YYYY-MM-DD sem timezone
  const getDataHoje = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const [turmas, setTurmas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [frequencias, setFrequencias] = useState({});
  
  // Filtros (removido disciplina - agora é visão geral)
  const [filtros, setFiltros] = useState({
    turma: '',
    data: getDataHoje(),
    dataInicio: '', // Novo: filtro de período
    dataFim: '',    // Novo: filtro de período
    tipoPeriodo: 'diario', // diario, semanal, mensal, trimestral
  });

  // Estado de presença dos alunos
  const [presencas, setPresencas] = useState({});
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Filtro por card (para filtrar alunos visualmente)
  const [filtroCard, setFiltroCard] = useState('todos'); // todos, presentes, faltas, justificadas

  // Estatísticas reais do backend
  const [estatisticas, setEstatisticas] = useState(null);
  
  // Estatísticas por período (novo)
  const [estatisticasPeriodo, setEstatisticasPeriodo] = useState(null);
  
  // Modal de frequência individual (novo)
  const [openModalFrequenciaIndividual, setOpenModalFrequenciaIndividual] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [frequenciaAcumuladaAluno, setFrequenciaAcumuladaAluno] = useState(null);

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
    faltasSemJustificativa: 0,
    faltasJustificadas: 0,
    percentual: 100,
  });

  useEffect(() => {
    loadTurmas();
    loadDisciplinas();
  }, []);

  useEffect(() => {
    if (filtros.turma && filtros.data) {
      loadDadosTurma();
    }
  }, [filtros.turma, filtros.data]);
  
  // Novo useEffect para carregar estatísticas quando mudar o período
  useEffect(() => {
    if (filtros.turma) {
      loadEstatisticas();
    }
  }, [filtros.dataInicio, filtros.dataFim, filtros.tipoPeriodo]);

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
      const data = await alunoService.getAll({ turma: filtros.turma });
      setAlunos(data);
      return data;
    } catch (error) {
      toast.error('Erro ao carregar alunos');
      return [];
    }
  };

  const loadEstatisticas = async () => {
    try {
      if (!filtros.turma) return;
      
      const params = {};
      
      // Se houver período definido, usa ele
      if (filtros.dataInicio && filtros.dataFim) {
        params.dataInicio = filtros.dataInicio;
        params.dataFim = filtros.dataFim;
      } else if (filtros.data) {
        // Senão, usa apenas a data atual
        params.data = filtros.data;
        const ano = filtros.data.split('-')[0];
        params.ano = parseInt(ano);
      }
      
      const data = await frequenciaService.getEstatisticasTurma(filtros.turma, params);
      setEstatisticas(data);
      
      // Se houver filtro de período, carrega também as estatísticas detalhadas por período
      if (filtros.dataInicio && filtros.dataFim) {
        const dataPeriodo = await frequenciaService.getEstatisticasPorPeriodo(filtros.turma, {
          dataInicio: filtros.dataInicio,
          dataFim: filtros.dataFim,
          tipo: filtros.tipoPeriodo
        });
        setEstatisticasPeriodo(dataPeriodo);
      } else {
        setEstatisticasPeriodo(null);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setEstatisticas(null);
      setEstatisticasPeriodo(null);
    }
  };

  // Nova função coordenadora para carregar todos os dados da turma
  const loadDadosTurma = async () => {
    try {
      setLoading(true);
      
      // 1. Carregar alunos da turma
      const alunosDaTurma = await loadAlunos();
      
      // 2. Carregar frequências já salvas do dia
      await loadFrequencia(alunosDaTurma);
      
      // 3. Carregar estatísticas acumuladas
      await loadEstatisticas();
    } catch (error) {
      console.error('Erro ao carregar dados da turma:', error);
      toast.error('Erro ao carregar dados da turma');
    } finally {
      setLoading(false);
    }
  };

  const loadFrequencia = async (alunosDaTurma) => {
    try {
      console.log('📖 Frontend - Carregando frequências (visão geral):', {
        turma: filtros.turma,
        data: filtros.data,
        totalAlunos: alunosDaTurma.length
      });
      
      const response = await frequenciaService.getFrequenciaTurmaDia(
        filtros.turma,
        filtros.data
      );
      
      console.log('✅ Frontend - Resposta recebida:', {
        totalRegistros: response.frequencias?.length || 0,
        resumo: response.resumo
      });
      
      // Converter para objeto { alunoId: status }
      // Agora é simples: 1 registro por aluno
      const presencasCarregadas = {};
      const frequenciasMap = {};
      
      response.frequencias.forEach(freq => {
        const alunoId = freq.aluno._id;
        presencasCarregadas[alunoId] = freq.status;
        frequenciasMap[alunoId] = freq;
      });
      
      console.log('📊 Frontend - Dados carregados do banco:', {
        alunosComRegistro: Object.keys(presencasCarregadas).length,
        totalRegistros: response.frequencias?.length || 0,
        statusDistribuição: {
          presentes: Object.values(presencasCarregadas).filter(s => s === 'presente').length,
          faltas: Object.values(presencasCarregadas).filter(s => s === 'falta').length,
          justificadas: Object.values(presencasCarregadas).filter(s => s === 'falta-justificada').length
        }
      });
      
      // Inicializar como 'presente' apenas alunos sem registro
      alunosDaTurma.forEach(aluno => {
        if (!presencasCarregadas[aluno._id]) {
          presencasCarregadas[aluno._id] = 'presente';
        }
      });
      
      console.log('💾 Frontend - Definindo estados:', {
        totalPresenças: Object.keys(presencasCarregadas).length,
        totalFrequenciasSalvas: Object.keys(frequenciasMap).length
      });
      
      setPresencas(presencasCarregadas);
      setFrequencias(frequenciasMap);
    } catch (error) {
      console.error('❌ Frontend - Erro ao carregar frequência:', error);
      // Se não houver frequência registrada, inicializar todos como presente
      const presencasInicial = {};
      alunosDaTurma.forEach(aluno => {
        presencasInicial[aluno._id] = 'presente';
      });
      console.log('⚠️ Frontend - Inicializando com valores padrão (todos presentes)');
      setPresencas(presencasInicial);
      setFrequencias({});
    }
  };

  const calcularStats = () => {
    const total = alunos.length;
    
    // Contar apenas os alunos ATUAIS da turma (evitar IDs antigos no objeto presencas)
    const alunosIds = alunos.map(a => a._id);
    const presentes = alunosIds.filter(id => presencas[id] === 'presente').length;
    const faltasSemJustificativa = alunosIds.filter(id => presencas[id] === 'falta').length;
    const faltasJustificadas = alunosIds.filter(id => presencas[id] === 'falta-justificada').length;
    const faltas = faltasSemJustificativa + faltasJustificadas;
    
    // Calcular percentual: começa em 100% e diminui com as faltas
    // Faltas justificadas também contam como faltas no percentual
    let percentual = 100;
    if (total > 0) {
      percentual = ((presentes / total) * 100);
      // Garantir que nunca ultrapasse 100%
      percentual = Math.min(percentual, 100);
      percentual = percentual.toFixed(1);
    }

    setStats({ total, presentes, faltas, faltasSemJustificativa, faltasJustificadas, percentual });
  };

  const handleVisualizarFrequenciaAluno = async (aluno) => {
    try {
      setLoading(true);
      setAlunoSelecionado(aluno);
      
      const params = {
        turma: filtros.turma
      };
      
      // Se houver filtro de período, aplica
      if (filtros.dataInicio && filtros.dataFim) {
        params.dataInicio = filtros.dataInicio;
        params.dataFim = filtros.dataFim;
      }
      
      const data = await frequenciaService.getFrequenciaAcumuladaAluno(aluno._id, params);
      setFrequenciaAcumuladaAluno(data);
      setOpenModalFrequenciaIndividual(true);
    } catch (error) {
      console.error('Erro ao carregar frequência do aluno:', error);
      toast.error('Erro ao carregar frequência do aluno');
    } finally {
      setLoading(false);
    }
  };

  const handlePresencaChange = (alunoId, status) => {
    setPresencas(prev => ({
      ...prev,
      [alunoId]: status
    }));
  };

  const handleSalvarChamada = async () => {
    console.log('🔵 handleSalvarChamada INICIADA');
    console.log('📋 Estado atual:', {
      turma: filtros.turma,
      data: filtros.data,
      totalAlunos: alunos.length,
      totalPresencas: Object.keys(presencas).length
    });
    
    // Validações ANTES do try-catch para não bloquear o finally
    if (!filtros.turma) {
      console.log('❌ Validação falhou: turma não selecionada');
      toast.error('Selecione uma turma primeiro');
      return;
    }
    
    if (!filtros.data) {
      console.log('❌ Validação falhou: data não selecionada');
      toast.error('Selecione uma data');
      return;
    }
    
    if (alunos.length === 0) {
      console.log('❌ Validação falhou: nenhum aluno');
      toast.error('Nenhum aluno encontrado na turma');
      return;
    }
    
    if (!presencas || Object.keys(presencas).length === 0) {
      console.log('❌ Validação falhou: nenhuma frequência definida');
      toast.error('Nenhuma frequência para salvar');
      return;
    }
    
    console.log('✅ Todas as validações passaram, iniciando salvamento...');
    
    try {
      setSalvando(true);
      
      const turma = turmas.find(t => t._id === filtros.turma);
      
      console.log('💾 SALVANDO FREQUÊNCIA:', {
        turma: turma?.nome,
        turmaId: filtros.turma,
        data: filtros.data,
        totalAlunos: alunos.length,
        presencasDefinidas: Object.keys(presencas).length,
        periodo: turma?.turno || 'matutino'
      });
      
      // Validar que todos os alunos têm status definido
      const alunosSemStatus = alunos.filter(a => !presencas[a._id]);
      if (alunosSemStatus.length > 0) {
        console.warn('⚠️ Alunos sem status definido:', alunosSemStatus.length);
      }
      
      // Usar a nova função que salva em TODAS as disciplinas
      const response = await frequenciaService.registrarChamadaGeral(filtros.turma, {
        data: filtros.data,
        periodo: turma?.turno || 'matutino',
        presencas
      });
      
      console.log('✅ Resposta do backend:', response);
      
      // Verificar se houve erros
      if (response.erros && response.erros.length > 0) {
        console.error('⚠️ Salvamento com erros:', response.erros);
        
        // Se muitos erros, mostrar mensagem detalhada
        if (response.erros.length > 5) {
          toast.warning(
            `Frequência salva parcialmente: ${response.total} registros salvos, mas ${response.totalErros} falharam. ` +
            `Verifique se todas as disciplinas têm professores atribuídos.`,
            { autoClose: 8000 }
          );
        } else {
          // Poucos erros, mostrar quais foram
          const errosMsg = response.erros.map(e => `${e.aluno} - ${e.disciplina}: ${e.erro}`).join('\n');
          toast.warning(
            `Frequência salva com ${response.totalErros} erro(s):\n${errosMsg}`,
            { autoClose: 8000 }
          );
        }
      } else {
        // Sucesso total
        toast.success(
          `✅ Frequência geral salva com sucesso!\n` +
          `${response.criados} alunos registrados\n` +
          `${response.atualizados} alunos atualizados\n` +
          `Total: ${response.total} de ${response.esperado} alunos (${response.percentualSucesso}%)`,
          { autoClose: 5000 }
        );
      }
      
      // IMPORTANTE: Recarregar os dados do banco para sincronizar
      console.log('🔄 Recarregando dados do banco...');
      await loadFrequencia(alunos);
      
      // Recarregar estatísticas acumuladas
      await loadEstatisticas();
      
      console.log('✅ Dados sincronizados com sucesso');
      
    } catch (error) {
      console.error('❌ ERRO ao salvar frequência:', error);
      
      // Tratamento de erros específicos
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        
        if (errorData.disciplinasPendentes) {
          // Erro específico: disciplinas sem professor
          toast.error(
            `❌ ${errorData.message}\n\n` +
            `Configure professores para as disciplinas antes de registrar frequências.`,
            { autoClose: 10000 }
          );
        } else {
          // Outro erro de validação
          toast.error(
            `❌ ${errorData.message}\n` +
            (errorData.detalhes ? `\n${errorData.detalhes}` : ''),
            { autoClose: 7000 }
          );
        }
      } else if (error.response?.status === 404) {
        toast.error('Turma não encontrada. Recarregue a página e tente novamente.');
      } else if (error.response?.status === 500) {
        toast.error(
          'Erro no servidor ao salvar frequência. ' +
          'Verifique a conexão e tente novamente.',
          { autoClose: 7000 }
        );
      } else {
        // Erro genérico
        toast.error(
          `Erro ao salvar frequência: ${error.response?.data?.message || error.message}`,
          { autoClose: 7000 }
        );
      }
      
      // Em caso de erro, recarregar os dados para garantir que estão sincronizados
      try {
        await loadFrequencia(alunos);
      } catch (reloadError) {
        console.error('Erro ao recarregar dados:', reloadError);
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleResetRegistros = async () => {
    const turma = turmas.find(t => t._id === filtros.turma);
    const totalRegistros = Object.keys(frequencias).length;
    
    const confirmacao = window.confirm(
      `⚠️ ATENÇÃO - RESETAR FREQUÊNCIA DO DIA!\n\n` +
      `Turma: ${turma?.nome || 'Selecionada'}\n` +
      `Data: ${formatarDataLocal(filtros.data)}\n` +
      `Registros salvos: ${totalRegistros}\n\n` +
      `Esta ação irá DELETAR todos os ${totalRegistros} registros de frequência desta turma APENAS para o dia selecionado.\n\n` +
      `Os registros de outros dias NÃO serão afetados.\n\n` +
      `Esta ação NÃO pode ser desfeita!\n\n` +
      `Deseja continuar?`
    );
    
    if (!confirmacao) return;
    
    try {
      setLoading(true);
      await frequenciaService.resetarDia(filtros.turma, filtros.data);
      toast.success(`Frequências do dia ${formatarDataLocal(filtros.data)} resetadas com sucesso!`);
      
      // Recarregar todos os dados após resetar
      await loadDadosTurma();
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
        return;
      }
      
      const freq = frequencias[alunoJustificar];
      if (freq) {
        // Salvar a justificativa no backend
        const response = await frequenciaService.justificarFalta(freq._id, {
          descricao: justificativa
        });
        
        // Atualizar o objeto de frequências com a versão atualizada do backend
        setFrequencias(prev => ({
          ...prev,
          [alunoJustificar]: response.frequencia
        }));
      }
      
      // Atualizar apenas o estado local do aluno justificado
      setPresencas(prev => ({
        ...prev,
        [alunoJustificar]: 'falta-justificada'
      }));
      
      toast.success('Justificativa salva com sucesso!');
      setDialogJustificativa(false);
      setJustificativa('');
      setAlunoJustificar(null);
      
      // NÃO recarregar todas as frequências para não perder as alterações locais
      // Os dados já foram atualizados no estado local
    } catch (error) {
      console.error('Erro ao justificar falta:', error);
      toast.error('Erro ao salvar justificativa');
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
      const dataExemplo = getDataHoje();
      
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
              sx={(theme) => ({
                '& input[type="date"]': {
                  fontSize: '1.15rem',
                  padding: '14px',
                  cursor: 'pointer',
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  filter: !isDarkMode ? 'invert(1)' : 'invert(0.6) sepia(1) saturate(5) hue-rotate(140deg)',
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
              })}
            />
          </Grid>
        </Grid>
        
        {/* Filtros de Período (Novo) */}
        <Box sx={{ mt: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Filtros de Período (para estatísticas acumuladas)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="Data Início"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={(theme) => ({
                  '& input[type="date"]': {
                    color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                  },
                  '& input[type="date"]::-webkit-calendar-picker-indicator': {
                    filter: !isDarkMode ? 'invert(1)' : 'invert(0.6) sepia(1) saturate(5) hue-rotate(140deg)',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                  },
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="Data Fim"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={(theme) => ({
                  '& input[type="date"]': {
                    color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                  },
                  '& input[type="date"]::-webkit-calendar-picker-indicator': {
                    filter: !isDarkMode ? 'invert(1)' : 'invert(0.6) sepia(1) saturate(5) hue-rotate(140deg)',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                  },
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Tipo de Agrupamento"
                value={filtros.tipoPeriodo}
                onChange={(e) => setFiltros({ ...filtros, tipoPeriodo: e.target.value })}
                disabled={!filtros.dataInicio || !filtros.dataFim}
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
                <MenuItem value="diario">Diário</MenuItem>
                <MenuItem value="semanal">Semanal</MenuItem>
                <MenuItem value="mensal">Mensal</MenuItem>
                <MenuItem value="trimestral">Trimestral</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          {(filtros.dataInicio || filtros.dataFim) && (
            <Box sx={{ mt: 1 }}>
              <Button 
                size="small" 
                onClick={() => setFiltros({ ...filtros, dataInicio: '', dataFim: '' })}
                color="secondary"
              >
                Limpar Filtros de Período
              </Button>
            </Box>
          )}
        </Box>
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
                <Typography 
                  variant="h2" 
                  sx={{ 
                    color: '#FFF', 
                    fontWeight: 700,
                    textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                    WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                  }} 
                  align="center"
                >
                  {alunos.length}
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
                <Typography 
                  variant="h2" 
                  align="center" 
                  fontWeight="700"
                  sx={{
                    textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                    WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                  }}
                >
                  {stats.total > 0 ? ((stats.presentes / stats.total) * 100).toFixed(1) : 0}%
                </Typography>
                <Typography variant="body1" align="center" sx={{ mt: 1 }}>Presentes Hoje</Typography>
                <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
                <Typography 
                  variant="h5" 
                  align="center" 
                  sx={{ 
                    fontWeight: 600,
                    textShadow: '0 0 1px rgba(255,255,255,0.6)',
                    WebkitTextStroke: '1px rgba(255,255,255,0.4)'
                  }}
                >
                  {stats.presentes} alunos
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
                <Typography 
                  variant="h2" 
                  align="center" 
                  fontWeight="700"
                  sx={{
                    textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                    WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                  }}
                >
                  {stats.total > 0 ? ((stats.faltasSemJustificativa / stats.total) * 100).toFixed(1) : 0}%
                </Typography>
                <Typography variant="body1" align="center" sx={{ mt: 1 }}>Faltas Hoje</Typography>
                <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
                <Typography 
                  variant="h5" 
                  align="center" 
                  sx={{ 
                    fontWeight: 600,
                    textShadow: '0 0 1px rgba(255,255,255,0.6)',
                    WebkitTextStroke: '1px rgba(255,255,255,0.4)'
                  }}
                >
                  {stats.faltasSemJustificativa} alunos
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
                <Typography 
                  variant="h2" 
                  align="center" 
                  fontWeight="700"
                  sx={{
                    textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                    WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                  }}
                >
                  {stats.faltasJustificadas}
                </Typography>
                <Typography variant="body1" align="center">Justificadas Hoje</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 5 - Frequência Acumulada (Dinâmico) */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              sx={{ 
                bgcolor: 
                  parseFloat(estatisticas.percentualGeral) >= 80 ? 'success.main' :
                  parseFloat(estatisticas.percentualGeral) >= 60 ? 'warning.main' :
                  'error.main',
                color: 'white',
                transition: 'all 0.3s',
                '&:hover': { 
                  transform: 'scale(1.05)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent>
                <Typography 
                  variant="h2" 
                  align="center" 
                  fontWeight="700"
                  sx={{
                    textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                    WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                  }}
                >
                  {estatisticas.percentualGeral}%
                </Typography>
                <Typography variant="body1" align="center" sx={{ mt: 1 }}>Frequência Acumulada</Typography>
                <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
                <Typography 
                  variant="h5" 
                  align="center" 
                  sx={{ 
                    fontWeight: 600,
                    textShadow: '0 0 1px rgba(255,255,255,0.6)',
                    WebkitTextStroke: '1px rgba(255,255,255,0.4)'
                  }}
                >
                  Hoje: {stats.percentual}%
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
                  Lista de Presença - {formatarDataLocal(filtros.data)}
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
                <Tooltip 
                  title={
                    Object.keys(frequencias).length === 0 
                      ? "Não há registros salvos para resetar neste dia" 
                      : `Resetar os ${Object.keys(frequencias).length} registros salvos do dia ${formatarDataLocal(filtros.data)}`
                  }
                  arrow
                >
                  <span>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={handleResetRegistros}
                      disabled={!filtros.turma || !filtros.data || salvando || loading || Object.keys(frequencias).length === 0}
                    >
                      Resetar Dia
                    </Button>
                  </span>
                </Tooltip>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  onClick={handleSalvarChamada}
                  disabled={salvando || loading}
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
                            <Tooltip title={
                              frequencias[aluno._id]?.justificativa?.descricao 
                                ? 'Ver/Editar justificativa salva' 
                                : 'Adicionar justificativa'
                            }>
                              <Badge 
                                color="success" 
                                variant="dot" 
                                invisible={!frequencias[aluno._id]?.justificativa?.descricao}
                              >
                                <IconButton
                                  size="small"
                                  color={frequencias[aluno._id]?.justificativa?.descricao ? "success" : "primary"}
                                  onClick={() => {
                                    setAlunoJustificar(aluno._id);
                                    // Carregar justificativa existente se houver
                                    const freq = frequencias[aluno._id];
                                    if (freq?.justificativa?.descricao) {
                                      setJustificativa(freq.justificativa.descricao);
                                    } else {
                                      setJustificativa('');
                                    }
                                    setDialogJustificativa(true);
                                  }}
                                >
                                  <EventNote />
                                </IconButton>
                              </Badge>
                            </Tooltip>
                          )}
                          <Tooltip title="Ver histórico de frequência">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleVisualizarFrequenciaAluno(aluno)}
                            >
                              <Assessment />
                            </IconButton>
                          </Tooltip>
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
        onClose={() => {
          setDialogJustificativa(false);
          setJustificativa('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {frequencias[alunoJustificar]?.justificativa?.descricao ? 'Ver/Editar Justificativa' : 'Justificar Falta'}
        </DialogTitle>
        <DialogContent>
          {frequencias[alunoJustificar]?.justificativa?.dataJustificativa && (
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              <strong>Justificativa registrada em:</strong>{' '}
              {new Date(frequencias[alunoJustificar].justificativa.dataJustificativa).toLocaleString('pt-BR')}
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Justificativa"
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Digite o motivo da falta..."
            helperText="Esta justificativa ficará salva e poderá ser consultada posteriormente"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogJustificativa(false);
            setJustificativa('');
          }}>
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

      {/* Modal de Frequência Individual do Aluno */}
      <Dialog 
        open={openModalFrequenciaIndividual} 
        onClose={() => setOpenModalFrequenciaIndividual(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment color="primary" />
              <Typography variant="h6">Histórico de Frequência</Typography>
            </Box>
            {alunoSelecionado && (
              <Chip 
                label={`Mat: ${alunoSelecionado.matricula}`}
                color="primary"
                size="small"
              />
            )}
          </Box>
          {alunoSelecionado && (
            <Typography variant="subtitle2" color="text.secondary">
              {alunoSelecionado.nome}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {frequenciaAcumuladaAluno ? (
            <Box>
              {/* Resumo Geral */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom>
                  📊 Resumo Geral {frequenciaAcumuladaAluno.periodo.inicio && frequenciaAcumuladaAluno.periodo.fim && 
                    `(${formatarDataLocal(frequenciaAcumuladaAluno.periodo.inicio)} - ${formatarDataLocal(frequenciaAcumuladaAluno.periodo.fim)})`
                  }
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main">
                        {frequenciaAcumuladaAluno.resumoGeral.total}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total de Registros
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {frequenciaAcumuladaAluno.resumoGeral.presentes}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Presenças
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="error.main">
                        {frequenciaAcumuladaAluno.resumoGeral.faltas}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Faltas
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {frequenciaAcumuladaAluno.resumoGeral.justificadas}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Justificadas
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="h5" 
                    sx={{ 
                      color: frequenciaAcumuladaAluno.resumoGeral.percentualPresenca >= 80 ? 'success.main' :
                             frequenciaAcumuladaAluno.resumoGeral.percentualPresenca >= 60 ? 'warning.main' :
                             'error.main'
                    }}
                  >
                    {frequenciaAcumuladaAluno.resumoGeral.percentualPresenca}% de Presença
                  </Typography>
                </Box>
              </Paper>

              {/* Frequência por Disciplina */}
              {frequenciaAcumuladaAluno.porDisciplina && frequenciaAcumuladaAluno.porDisciplina.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    📚 Por Disciplina
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Disciplina</TableCell>
                          <TableCell align="center">Total</TableCell>
                          <TableCell align="center">Presentes</TableCell>
                          <TableCell align="center">Faltas</TableCell>
                          <TableCell align="center">Percentual</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {frequenciaAcumuladaAluno.porDisciplina.map((disc, index) => (
                          <TableRow key={index}>
                            <TableCell>{disc.disciplina.nome}</TableCell>
                            <TableCell align="center">{disc.total}</TableCell>
                            <TableCell align="center">
                              <Chip label={disc.presentes} color="success" size="small" />
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={disc.faltas + disc.justificadas} color="error" size="small" />
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                sx={{
                                  color: disc.percentualPresenca >= 80 ? 'success.main' :
                                         disc.percentualPresenca >= 60 ? 'warning.main' :
                                         'error.main',
                                  fontWeight: 600
                                }}
                              >
                                {disc.percentualPresenca}%
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Histórico Diário */}
              {frequenciaAcumuladaAluno.historicoDiario && frequenciaAcumuladaAluno.historicoDiario.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    📅 Histórico Diário (Últimos registros)
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Data</TableCell>
                          <TableCell align="center">Presentes</TableCell>
                          <TableCell align="center">Faltas</TableCell>
                          <TableCell align="center">Percentual</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {frequenciaAcumuladaAluno.historicoDiario.map((dia, index) => (
                          <TableRow key={index}>
                            <TableCell>{formatarDataLocal(dia._id.toISOString().split('T')[0])}</TableCell>
                            <TableCell align="center">
                              <Chip label={dia.presentes} color="success" size="small" />
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={dia.faltas + dia.justificadas} color="error" size="small" />
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                sx={{
                                  color: dia.percentualPresenca >= 80 ? 'success.main' :
                                         dia.percentualPresenca >= 60 ? 'warning.main' :
                                         'error.main'
                                }}
                              >
                                {dia.percentualPresenca}%
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Carregando dados...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModalFrequenciaIndividual(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Frequencias;
