import React, { useState, useEffect, useRef } from 'react';
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
  Divider,
  Button,
  Dialog,
  AppBar,
  Toolbar,
  Slide,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AssessmentOutlined,
  Assessment,
  SchoolOutlined,
  CheckCircleOutlined,
  TrendingUpOutlined,
  PeopleOutlined,
  EventAvailableOutlined,
  WarningAmberOutlined,
  EventBusyOutlined,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  PictureAsPdf as PdfIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
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
import { Bar, Pie, Line, Scatter } from 'react-chartjs-2';
import { dashboardService, turmaService, disciplinaService, alunoService, frequenciaService } from '../services';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import ModalHistoricoFrequencia from '../components/ModalHistoricoFrequencia';
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

// Componente de transição para o Dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Dashboard = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const frequenciaRef = useRef(null);
  
  // Refs para os containers dos gráficos (usados na exportação)
  const containerGraficoComparacaoRef = useRef(null);
  const containerGraficoPredicaoRef = useRef(null);
  const [exportando, setExportando] = useState(false);
  
  const [turmas, setTurmas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [filters, setFilters] = useState({
    turma: '',
    aluno: '',
    disciplina: '',
    ano: '', // Vazio por padrão para mostrar todos os dados
    trimestre: '',
    dataInicio: '',
    dataFim: '',
    pontoCorte: '', // P.C. 01, P.C. 02, P.C. 03 ou E.A.C
  });

  const [estatisticas, setEstatisticas] = useState(null);
  const [desempenhoDisciplina, setDesempenhoDisciplina] = useState([]);
  const [evolucaoTrimestral, setEvolucaoTrimestral] = useState([]);
  const [evolucaoHabilidades, setEvolucaoHabilidades] = useState(null);
  const [distribuicaoHabilidades, setDistribuicaoHabilidades] = useState(null);
  const [dashboardFrequencia, setDashboardFrequencia] = useState({
    totalRegistros: 0,
    presentes: 0,
    faltas: 0,
    faltasJustificadas: 0,
    percentualPresenca: 0,
    percentualFaltas: 0,
    todosAlunos: [],
    contadores: { total: 0, adequado: 0, atencao: 0, critico: 0 },
    frequenciaPorDiaSemana: []
  });
  const [frequenciaFiltros, setFrequenciaFiltros] = useState(['todos']);
  const [habilidadesFiltro, setHabilidadesFiltro] = useState('todos'); // todos, nao-desenvolvido, em-desenvolvimento, desenvolvido, plenamente-desenvolvido
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [graficoExpandido, setGraficoExpandido] = useState(null); // null, 'comparacao', 'predicao'
  
  // Estados para modal de histórico de frequência
  const [openModalHistorico, setOpenModalHistorico] = useState(false);
  const [alunoHistoricoSelecionado, setAlunoHistoricoSelecionado] = useState(null);
  const [frequenciaHistorico, setFrequenciaHistorico] = useState(null);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // Funções para controle de expansão dos gráficos
  const handleExpandirGrafico = (tipoGrafico) => {
    setGraficoExpandido(tipoGrafico);
  };

  const handleFecharGrafico = () => {
    setGraficoExpandido(null);
  };

  /**
   * Formata uma data no formato 'YYYY-MM-DD' para 'DD/MM/YYYY'
   * sem problemas de timezone (não cria objeto Date)
   */
  const formatarDataBR = (dataString) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

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
      
      // Adicionar timestamp para evitar cache
      params._t = Date.now();

      console.log('🔍 Dashboard: Carregando dados com filtros:', params);

      const [stats, desempenho, evolucao, evolHab, distHab, dashFreq] = await Promise.all([
        dashboardService.getEstatisticas(params),
        dashboardService.getDesempenhoDisciplina(params),
        dashboardService.getEvolucaoTrimestral(params),
        dashboardService.getEvolucaoHabilidades(params),
        dashboardService.getDistribuicaoNiveisHabilidades(params),
        frequenciaService.getDashboard(params),
      ]);

      console.log('✅ Dashboard Frequência recebido:', dashFreq);
      console.log('📊 Total de registros:', dashFreq?.totalRegistros);
      console.log('👥 Total de alunos:', dashFreq?.todosAlunos?.length);
      console.log('📋 Alunos classificados:', dashFreq?.todosAlunos);
      console.log('🔍 Contadores:', dashFreq?.contadores);

      // FILTRAR APENAS ALUNOS COM DADOS VÁLIDOS (segunda camada de segurança)
      let alunosValidos = [];
      if (dashFreq?.todosAlunos && Array.isArray(dashFreq.todosAlunos)) {
        alunosValidos = dashFreq.todosAlunos.filter(item => {
          // Verificar se o aluno existe e tem dados completos
          const temDadosCompletos = item?.aluno && 
                                     item.aluno._id && 
                                     item.aluno.nome && 
                                     item.aluno.matricula;
          
          if (!temDadosCompletos) {
            console.warn('⚠️ Aluno com dados incompletos removido da listagem:', item);
            return false;
          }
          
          return true;
        });
        
        console.log(`✅ Frontend - Alunos válidos: ${alunosValidos.length} de ${dashFreq.todosAlunos.length}`);
        if (alunosValidos.length !== dashFreq.todosAlunos.length) {
          console.warn(`⚠️ ${dashFreq.todosAlunos.length - alunosValidos.length} aluno(s) foram removidos por dados incompletos`);
        }
      }

      // Garantir que sempre temos uma estrutura mínima, mesmo que vazia
      const dashFreqFormatado = dashFreq ? {
        ...dashFreq,
        todosAlunos: alunosValidos, // Usar lista filtrada
      } : {
        totalRegistros: 0,
        presentes: 0,
        faltas: 0,
        faltasJustificadas: 0,
        percentualPresenca: 0,
        percentualFaltas: 0,
        todosAlunos: [],
        contadores: { total: 0, adequado: 0, atencao: 0, critico: 0 },
        frequenciaPorDiaSemana: []
      };

      console.log('💾 Setando dashboardFrequencia:', dashFreqFormatado);
      console.log('📋 Array todosAlunos tem', dashFreqFormatado.todosAlunos?.length || 0, 'itens');

      setEstatisticas(stats);
      setDesempenhoDisciplina(desempenho);
      setEvolucaoTrimestral(evolucao);
      setEvolucaoHabilidades(evolHab);
      setDistribuicaoHabilidades(distHab);
      setDashboardFrequencia(dashFreqFormatado);
    } catch (error) {
      console.error('❌ Erro ao carregar dashboard:', error);
      // Setar estrutura vazia em caso de erro
      setDashboardFrequencia({
        totalRegistros: 0,
        presentes: 0,
        faltas: 0,
        faltasJustificadas: 0,
        percentualPresenca: 0,
        percentualFaltas: 0,
        todosAlunos: [],
        contadores: { total: 0, adequado: 0, atencao: 0, critico: 0 },
        frequenciaPorDiaSemana: []
      });
    }
  };

  /**
   * Handler para visualizar histórico de frequência de um aluno
   * Abre modal com detalhes completos e opção de exportação
   */
  const handleVisualizarHistorico = async (aluno) => {
    try {
      setLoadingHistorico(true);
      setAlunoHistoricoSelecionado({
        _id: aluno.aluno._id,
        nome: aluno.aluno.nome,
        matricula: aluno.aluno.matricula
      });
      
      // Preparar parâmetros baseados nos filtros atuais
      const params = {
        turma: filters.turma
      };
      
      // Se houver filtro de período, aplica
      if (filters.dataInicio && filters.dataFim) {
        params.dataInicio = filters.dataInicio;
        params.dataFim = filters.dataFim;
      }
      
      console.log('📊 Dashboard: Buscando histórico do aluno', aluno.aluno.nome);
      console.log('🔍 Params:', params);
      
      // Buscar dados da API
      const data = await frequenciaService.getFrequenciaAcumuladaAluno(
        aluno.aluno._id, 
        params
      );
      
      console.log('✅ Dados de histórico recebidos:', data);
      
      setFrequenciaHistorico(data);
      setOpenModalHistorico(true);
      
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico de frequência: ' + error.message);
    } finally {
      setLoadingHistorico(false);
    }
  };

  // Função para exportar Dashboard de Frequência em PDF com múltiplas páginas
  const exportarFrequenciaPDF = async () => {
    // Validar se os containers estão disponíveis
    if (!containerGraficoComparacaoRef.current || !containerGraficoPredicaoRef.current) {
      toast.error('Erro: Gráficos não disponíveis. Selecione uma turma e aguarde o carregamento.');
      return;
    }

    // Validar se há dados para exportar
    if (!dashboardFrequencia.todosAlunos || dashboardFrequencia.todosAlunos.length === 0) {
      toast.error('Erro: Nenhum dado disponível para exportação. Selecione uma turma com dados.');
      return;
    }

    try {
      setExportando(true);
      toast.info('📸 Capturando gráficos... Aguarde', { autoClose: 2000 });

      // 1. AGUARDAR RENDERIZAÇÃO COMPLETA
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2. CAPTURAR GRÁFICOS COM HTML2CANVAS
      const canvasComparacao = await html2canvas(containerGraficoComparacaoRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200
      });

      const canvasPredicao = await html2canvas(containerGraficoPredicaoRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200
      });

      // 3. CONVERTER CANVAS PARA BASE64
      const imagemComparacao = canvasComparacao.toDataURL('image/jpeg', 0.98);
      const imagemPredicao = canvasPredicao.toDataURL('image/jpeg', 0.98);

      // Verificar se as imagens foram geradas
      if (!imagemComparacao || !imagemPredicao) {
        toast.error('Erro: Falha ao capturar os gráficos.');
        return;
      }

      toast.info('📄 Gerando PDF... Aguarde', { autoClose: 2000 });

      // 4. CRIAR CONTAINER TEMPORÁRIO - PÁGINA 1 (GRÁFICOS)
      const containerGraficos = document.createElement('div');
      containerGraficos.style.width = '1400px';
      containerGraficos.style.backgroundColor = '#ffffff';
      containerGraficos.style.padding = '40px';
      containerGraficos.style.position = 'absolute';
      containerGraficos.style.left = '0';
      containerGraficos.style.top = '0';
      containerGraficos.style.visibility = 'hidden';
      
      const turmaInfo = filters.turma ? turmas.find(t => t._id === filters.turma) : null;
      const periodoInfo = filters.dataInicio && filters.dataFim 
        ? ` | Período: ${formatarDataBR(filters.dataInicio)} a ${formatarDataBR(filters.dataFim)}` 
        : '';
      
      containerGraficos.innerHTML = `
        <div style="margin-bottom: 30px; text-align: center; border-bottom: 3px solid #1976d2; padding-bottom: 15px;">
          <h1 style="color: #1976d2; font-weight: 700; margin: 0;">📊 Dashboard de Frequência - Análise Gráfica</h1>
          <h3 style="color: #666; margin: 10px 0;">Sistema de Gestão Escolar - SistGesEdu</h3>
          <p style="color: #999; margin: 5px 0;">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          ${turmaInfo ? `<p style="color: #666; font-weight: 600; margin: 5px 0;">Turma: ${turmaInfo.nome}${periodoInfo}</p>` : ''}
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
          <div style="background-color: #0D47A1; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="font-weight: 700; margin-bottom: 10px;">${dashboardFrequencia.totalRegistros}</h1>
            <h4 style="margin: 0;">Total de Registros</h4>
          </div>
          <div style="background-color: #2E7D32; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="font-weight: 700; margin-bottom: 10px;">${dashboardFrequencia.percentualPresenca || 0}%</h1>
            <h4 style="margin: 0;">Presentes</h4>
            <p style="margin-top: 10px; font-weight: 600;">${dashboardFrequencia.presentes} alunos</p>
          </div>
          <div style="background-color: #C62828; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="font-weight: 700; margin-bottom: 10px;">${dashboardFrequencia.percentualFaltas || 0}%</h1>
            <h4 style="margin: 0;">Faltas</h4>
            <p style="margin-top: 10px; font-weight: 600;">${dashboardFrequencia.faltas} alunos</p>
          </div>
          <div style="background-color: #F57C00; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="font-weight: 700; margin-bottom: 10px;">${dashboardFrequencia.faltasJustificadas}</h1>
            <h4 style="margin: 0;">Justificadas</h4>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1976d2; margin-bottom: 15px;">📊 Comparação de Frequência</h3>
          <img src="${imagemComparacao}" style="width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px;" />
        </div>
        
        <div>
          <h3 style="color: #1976d2; margin-bottom: 15px;">🎯 Análise de Risco e Predição</h3>
          <img src="${imagemPredicao}" style="width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px;" />
        </div>
      `;
      
      document.body.appendChild(containerGraficos);

      // 5. CRIAR CONTAINER TEMPORÁRIO - PÁGINA 2 (TABELA)
      const containerTabela = document.createElement('div');
      containerTabela.style.width = '800px';
      containerTabela.style.backgroundColor = '#ffffff';
      containerTabela.style.padding = '40px';
      containerTabela.style.position = 'absolute';
      containerTabela.style.left = '0';
      containerTabela.style.top = '0';
      containerTabela.style.visibility = 'hidden';
      
      // Gerar linhas da tabela
      const linhasTabela = dashboardFrequencia.todosAlunos.map(aluno => {
        const percentual = aluno.percentualPresenca;
        let statusLabel = 'Adequado', statusIcon = '✅', statusBg = '#e8f5e9';
        
        if (aluno.classificacao === 'critico') {
          statusLabel = 'Crítico'; statusIcon = '🚨'; statusBg = '#ffebee';
        } else if (aluno.classificacao === 'atencao') {
          statusLabel = 'Atenção'; statusIcon = '⚠️'; statusBg = '#fff3e0';
        }
        
        return `
          <tr style="background-color: ${statusBg};">
            <td style="border: 1px solid #ddd; padding: 12px; font-size: 11px; font-weight: 600;">${aluno.aluno.nome}</td>
            <td style="border: 1px solid #ddd; padding: 12px; font-size: 10px;">${aluno.aluno.matricula}</td>
            <td style="border: 1px solid #ddd; padding: 12px; font-size: 11px; font-weight: 600; text-align: center;">${aluno.total}</td>
            <td style="border: 1px solid #ddd; padding: 12px; font-size: 11px; font-weight: 700; color: #2e7d32; text-align: center;">${aluno.presentes}</td>
            <td style="border: 1px solid #ddd; padding: 12px; font-size: 11px; font-weight: 700; color: #c62828; text-align: center;">${aluno.faltas}</td>
            <td style="border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: 700; text-align: center;">${percentual}%</td>
            <td style="border: 1px solid #ddd; padding: 12px; font-size: 11px; font-weight: 600; text-align: center;">${statusIcon} ${statusLabel}</td>
          </tr>
        `;
      }).join('');
      
      containerTabela.innerHTML = `
        <div style="margin-bottom: 30px; text-align: center; border-bottom: 3px solid #1976d2; padding-bottom: 15px;">
          <h1 style="color: #1976d2; font-weight: 700; margin: 0;">📋 Relatório Detalhado de Alunos</h1>
          <h3 style="color: #666; margin: 10px 0;">Sistema de Gestão Escolar - SistGesEdu</h3>
          <p style="color: #999; margin: 5px 0;">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          ${turmaInfo ? `<p style="color: #666; font-weight: 600; margin: 5px 0;">Turma: ${turmaInfo.nome}${periodoInfo}</p>` : ''}
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #1976d2; color: white;">
              <th style="border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: 700;">Aluno</th>
              <th style="border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: 700;">Matrícula</th>
              <th style="border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: 700; text-align: center;">Total Aulas</th>
              <th style="border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: 700; text-align: center;">Presentes</th>
              <th style="border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: 700; text-align: center;">Faltas</th>
              <th style="border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: 700; text-align: center;">Frequência</th>
              <th style="border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: 700; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${linhasTabela}
          </tbody>
        </table>
        
        <div style="padding: 15px; background-color: #f5f5f5; border-radius: 8px;">
          <p style="font-weight: 600; margin-bottom: 10px;">📊 Resumo:</p>
          <p style="margin: 5px 0;">• Total de alunos: ${dashboardFrequencia.todosAlunos?.length || 0}</p>
          <p style="margin: 5px 0;">• Total de registros: ${dashboardFrequencia.totalRegistros}</p>
          <p style="margin: 5px 0;">• Presentes: ${dashboardFrequencia.presentes} (${dashboardFrequencia.percentualPresenca}%)</p>
          <p style="margin: 5px 0;">• Faltas: ${dashboardFrequencia.faltas} (${dashboardFrequencia.percentualFaltas}%)</p>
          <p style="margin: 5px 0;">• Faltas Justificadas: ${dashboardFrequencia.faltasJustificadas}</p>
        </div>
      `;
      
      document.body.appendChild(containerTabela);

      // 6. AGUARDAR PARA GARANTIR RENDERIZAÇÃO
      await new Promise(resolve => setTimeout(resolve, 300));

      // 7. CONFIGURAÇÕES DE EXPORTAÇÃO
      const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      const nomeArquivo = `Dashboard_Frequencia_${dataAtual}.pdf`;

      const optGraficos = {
        margin: [20, 20, 20, 20],
        filename: nomeArquivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'landscape'
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      const optTabela = {
        margin: [20, 20, 20, 20],
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait'
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // 8. GERAR PDFS
      const pdfGraficos = await html2pdf()
        .set(optGraficos)
        .from(containerGraficos)
        .toPdf()
        .get('pdf');

      const pdfTabela = await html2pdf()
        .set(optTabela)
        .from(containerTabela)
        .toPdf()
        .get('pdf');

      // 9. COMBINAR PDFS
      const totalPagesGraficos = pdfGraficos.internal.getNumberOfPages();
      
      for (let i = 1; i <= pdfTabela.internal.getNumberOfPages(); i++) {
        pdfGraficos.addPage('a4', 'portrait');
        const pageData = pdfTabela.internal.pages[i];
        pdfGraficos.internal.pages[totalPagesGraficos + i] = pageData;
      }

      // 10. ADICIONAR NUMERAÇÃO
      const totalPages = pdfGraficos.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdfGraficos.setPage(i);
        pdfGraficos.setFontSize(10);
        pdfGraficos.setTextColor(100);
        
        const pageInfo = pdfGraficos.internal.getCurrentPageInfo();
        const isLandscape = pageInfo.pageContext.width > pageInfo.pageContext.height;
        
        if (isLandscape) {
          pdfGraficos.text(`Página ${i} de ${totalPages}`, 277, 200, { align: 'right' });
        } else {
          pdfGraficos.text(`Página ${i} de ${totalPages}`, 190, 287, { align: 'right' });
        }
      }

      // 11. SALVAR PDF
      pdfGraficos.save(nomeArquivo);

      // 12. LIMPAR CONTAINERS TEMPORÁRIOS
      document.body.removeChild(containerGraficos);
      document.body.removeChild(containerTabela);
      
      toast.success('✅ PDF exportado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF: ' + error.message);
    } finally {
      setExportando(false);
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

  const chartDataDistribuicaoHabilidades = distribuicaoHabilidades ? (() => {
    const niveis = {
      'nao-desenvolvido': { label: 'Não Desenvolvido', bg: 'rgba(244, 67, 54, 0.6)', border: 'rgba(244, 67, 54, 1)' },
      'em-desenvolvimento': { label: 'Em Desenvolvimento', bg: 'rgba(255, 152, 0, 0.6)', border: 'rgba(255, 152, 0, 1)' },
      'desenvolvido': { label: 'Desenvolvido', bg: 'rgba(33, 150, 243, 0.6)', border: 'rgba(33, 150, 243, 1)' },
      'plenamente-desenvolvido': { label: 'Plenamente Desenvolvido', bg: 'rgba(76, 175, 80, 0.6)', border: 'rgba(76, 175, 80, 1)' },
    };

    // Se há filtro ativo, mostra apenas o nível selecionado
    if (habilidadesFiltro !== 'todos') {
      const nivelInfo = niveis[habilidadesFiltro];
      return {
        labels: [nivelInfo.label],
        datasets: [{
          data: [distribuicaoHabilidades.distribuicao?.[habilidadesFiltro]?.quantidade || 0],
          backgroundColor: [nivelInfo.bg],
          borderColor: [nivelInfo.border],
          borderWidth: 1,
        }],
      };
    }

    // Sem filtro, mostra todos os níveis
    return {
      labels: ['Não Desenvolvido', 'Em Desenvolvimento', 'Desenvolvido', 'Plenamente Desenvolvido'],
      datasets: [{
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
      }],
    };
  })() : null;

  // Opções de gráficos com cores adaptáveis ao tema
  const chartOptionsBar = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: isDarkMode ? '#ffffff' : '#000000'
        }
      },
      title: {
        color: isDarkMode ? '#ffffff' : '#000000'
      }
    },
    scales: {
      y: {
        ticks: {
          color: isDarkMode ? '#ffffff' : '#000000'
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        border: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
        }
      },
      x: {
        ticks: {
          color: isDarkMode ? '#ffffff' : '#000000'
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        border: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
        }
      }
    }
  };

  const chartOptionsLine = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: isDarkMode ? '#ffffff' : '#000000'
        }
      },
      title: {
        color: isDarkMode ? '#ffffff' : '#000000'
      }
    },
    scales: {
      y: {
        ticks: {
          color: isDarkMode ? '#ffffff' : '#000000'
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        border: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
        }
      },
      x: {
        ticks: {
          color: isDarkMode ? '#ffffff' : '#000000'
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        border: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
        }
      }
    }
  };

  const chartOptionsPie = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: isDarkMode ? '#ffffff' : '#000000'
        }
      },
      title: {
        color: isDarkMode ? '#ffffff' : '#000000'
      }
    }
  };

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
              <InputLabel sx={{
                color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
              }}>Turma</InputLabel>
              <Select
                value={filters.turma}
                label="Turma"
                onChange={(e) => setFilters({ ...filters, turma: e.target.value, aluno: '' })}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '& .MuiSelect-select': {
                    color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                  },
                  '& .MuiSvgIcon-root': {
                    color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                  },
                }}
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
              <InputLabel sx={{
                color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
              }}>Aluno</InputLabel>
              <Select
                value={filters.aluno}
                label="Aluno"
                onChange={(e) => setFilters({ ...filters, aluno: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '& .MuiSelect-select': {
                    color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                  },
                  '& .MuiSvgIcon-root': {
                    color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                  },
                }}
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
              <InputLabel sx={{
                color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
              }}>Disciplina</InputLabel>
              <Select
                value={filters.disciplina}
                label="Disciplina"
                onChange={(e) => setFilters({ ...filters, disciplina: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '& .MuiSelect-select': {
                    color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                  },
                  '& .MuiSvgIcon-root': {
                    color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                  },
                }}
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
              <InputLabel sx={{
                color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
              }}>Ano</InputLabel>
              <Select
                value={filters.ano}
                label="Ano"
                onChange={(e) => setFilters({ ...filters, ano: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '& .MuiSelect-select': {
                    color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                  },
                  '& .MuiSvgIcon-root': {
                    color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                  },
                }}
              >
                <MenuItem value="">Todos os Anos</MenuItem>
                <MenuItem value={2024}>2024</MenuItem>
                <MenuItem value={2025}>2025</MenuItem>
                <MenuItem value={2026}>2026</MenuItem>
                <MenuItem value={2027}>2027</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{
                color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
              }}>Trimestre</InputLabel>
              <Select
                value={filters.trimestre}
                label="Trimestre"
                onChange={(e) => setFilters({ ...filters, trimestre: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '& .MuiSelect-select': {
                    color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                  },
                  '& .MuiSvgIcon-root': {
                    color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                  },
                }}
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
              type="date"
              label="Data Início"
              value={filters.dataInicio}
              onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
              InputLabelProps={{ 
                shrink: true,
                sx: {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                }
              }}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                },
                '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                },
                '& .MuiInputBase-input': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
                '& input[type="date"]': {
                  fontSize: '1rem',
                  padding: '12px',
                  cursor: 'pointer'
                },
                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                  fontSize: '1.3rem',
                  cursor: 'pointer',
                  filter: !isDarkMode ? 'invert(1)' : undefined,
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              type="date"
              label="Data Fim"
              value={filters.dataFim}
              onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
              InputLabelProps={{ 
                shrink: true,
                sx: {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                }
              }}
              inputProps={{ min: filters.dataInicio }}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                },
                '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                },
                '& .MuiInputBase-input': {
                  color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                },
                '& input[type="date"]': {
                  fontSize: '1rem',
                  padding: '12px',
                  cursor: 'pointer'
                },
                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                  fontSize: '1.3rem',
                  cursor: 'pointer',
                  filter: !isDarkMode ? 'invert(1)' : undefined,
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{
                color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
              }}>Ponto de Corte</InputLabel>
              <Select
                value={filters.pontoCorte}
                label="Ponto de Corte"
                onChange={(e) => setFilters({ ...filters, pontoCorte: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: !isDarkMode ? '#FFFFFF !important' : undefined,
                  },
                  '& .MuiSelect-select': {
                    color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                  },
                  '& .MuiSvgIcon-root': {
                    color: !isDarkMode ? '#FFFFFF !important' : '#00CED1 !important',
                  },
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pc1">P.C. 01</MenuItem>
                <MenuItem value="pc2">P.C. 02</MenuItem>
                <MenuItem value="pc3">P.C. 03</MenuItem>
                <MenuItem value="eac">E.A.C</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Filtros Rápidos de Período */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
            <Button
                size="small"
                variant="contained"
                color="secondary"
                onClick={() => {
                  const hoje = new Date();
                  const seteDias = new Date();
                  seteDias.setDate(hoje.getDate() - 7);
                  setFilters({
                    ...filters,
                    dataInicio: seteDias.toISOString().split('T')[0],
                    dataFim: hoje.toISOString().split('T')[0],
                    ano: '',
                    trimestre: ''
                  });
                }}
                sx={{
                  color: '#003366 !important'
                }}
              >
                📅 Últimos 7 dias
              </Button>
              <Button
                size="small"
                variant="contained"
                color="secondary"
                onClick={() => {
                  const hoje = new Date();
                  const trintaDias = new Date();
                  trintaDias.setDate(hoje.getDate() - 30);
                  setFilters({
                    ...filters,
                    dataInicio: trintaDias.toISOString().split('T')[0],
                    dataFim: hoje.toISOString().split('T')[0],
                    ano: '',
                    trimestre: ''
                  });
                }}
                sx={{
                  color: '#003366 !important'
                }}
              >
                📅 Últimos 30 dias
              </Button>
              <Button
                size="small"
                variant="contained"
                color="secondary"
                onClick={() => {
                  const hoje = new Date();
                  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                  setFilters({
                    ...filters,
                    dataInicio: primeiroDia.toISOString().split('T')[0],
                    dataFim: hoje.toISOString().split('T')[0],
                    ano: '',
                    trimestre: ''
                  });
                }}
                sx={{
                  color: '#003366 !important'
                }}
              >
                📅 Mês Atual
              </Button>
              <Button
                size="small"
                variant="contained"
                color="secondary"
                onClick={() => {
                  const ano = 2026;
                  setFilters({
                    ...filters,
                    ano: ano,
                    trimestre: 1,
                    dataInicio: `${ano}-01-01`,
                    dataFim: `${ano}-03-31`
                  });
                }}
                sx={{
                  color: '#003366 !important'
                }}
              >
                📅 1º Trimestre 2026
              </Button>
              <Button
                size="small"
                variant="contained"
                color="secondary"
                onClick={() => {
                  const ano = 2026;
                  setFilters({
                    ...filters,
                    ano: ano,
                    dataInicio: `${ano}-01-01`,
                    dataFim: `${ano}-12-31`,
                    trimestre: ''
                  });
                }}
                sx={{
                  color: '#003366 !important'
                }}
              >
                📅 Ano Completo 2026
              </Button>
              <Button
                size="small"
                variant="contained"
                color="secondary"
                onClick={() => {
                  setFilters({
                    ...filters,
                    dataInicio: '',
                    dataFim: '',
                    ano: '',
                    trimestre: ''
                  });
                }}
                sx={{
                  color: '#003366 !important'
                }}
              >
                🔄 Limpar Filtros
              </Button>
          </Box>
          {(filters.dataInicio || filters.dataFim || filters.ano || filters.trimestre) && (
            <Alert severity="info" icon={<FilterListIcon />} sx={{ py: 0.5 }}>
              <Typography variant="caption">
                Filtro ativo: 
                {filters.dataInicio && filters.dataFim && ` ${formatarDataBR(filters.dataInicio)} até ${formatarDataBR(filters.dataFim)}`}
                {filters.ano && ` Ano ${filters.ano}`}
                {filters.trimestre && ` | ${filters.trimestre}º Trimestre`}
                {!filters.dataInicio && !filters.dataFim && !filters.ano && ` Todos os períodos`}
              </Typography>
            </Alert>
          )}
        </Box>
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
                      <Typography 
                        variant="h4" 
                        fontWeight="bold"
                        sx={{
                          textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                          WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                        }}
                      >
                        {estatisticas.totalAvaliacoes}
                      </Typography>
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
                      <Typography 
                        variant="h4" 
                        fontWeight="bold"
                        sx={{
                          textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                          WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                        }}
                      >
                        {estatisticas.mediaGeral.toFixed(2)}
                      </Typography>
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
                      <Typography 
                        variant="h4" 
                        fontWeight="bold"
                        sx={{
                          textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                          WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                        }}
                      >
                        {estatisticas.aprovados}
                      </Typography>
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
                      <Typography 
                        variant="h4" 
                        fontWeight="bold"
                        sx={{
                          textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                          WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                        }}
                      >
                        {estatisticas.percentualAprovacao}%
                      </Typography>
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
              <Typography 
                variant="h6" 
                gutterBottom 
                fontWeight="600"
                sx={{
                  color: '#00CED1',
                  borderBottom: theme.palette.mode === 'light' ? '3px solid #003366' : '3px solid white',
                  paddingBottom: 1,
                  marginBottom: 2
                }}
              >
                Desempenho por Disciplina
              </Typography>
              <Box sx={{ height: 300 }}>
              <Bar data={chartDataDesempenho} options={chartOptionsBar} />
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
              <Typography 
                variant="h6" 
                gutterBottom 
                fontWeight="600"
                sx={{
                  color: '#00CED1',
                  borderBottom: theme.palette.mode === 'light' ? '3px solid #003366' : '3px solid white',
                  paddingBottom: 1,
                  marginBottom: 2
                }}
              >
                Aprovação x Reprovação
              </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              {chartDataAprovacao && (
                <Pie data={chartDataAprovacao} options={chartOptionsPie} />
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
              <Typography 
                variant="h6" 
                gutterBottom 
                fontWeight="600"
                sx={{
                  color: '#00CED1',
                  borderBottom: theme.palette.mode === 'light' ? '3px solid #003366' : '3px solid white',
                  paddingBottom: 1,
                  marginBottom: 2
                }}
              >
                Evolução Trimestral
              </Typography>
            <Box sx={{ height: 300 }}>
              <Line data={chartDataEvolucao} options={chartOptionsLine} />
            </Box>
          </Paper>
          </Fade>
        </Grid>

        {/* Cards de Habilidades - Clicáveis para filtrar gráficos */}
        {distribuicaoHabilidades && (
          <Grid item xs={12}>
            <Fade in={true} timeout={1050}>
              <Box>
                <Typography variant="h6" gutterBottom fontWeight="600" sx={{ mb: 2, px: 1 }}>
                  📊 Estatísticas de Habilidades
                </Typography>
                <Grid container spacing={2}>
                  {/* Card 1 - Não Desenvolvido (Vermelho) */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card 
                      sx={{ 
                        bgcolor: 'error.main',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        border: habilidadesFiltro === 'nao-desenvolvido' ? '3px solid #FFD700' : 'none',
                        '&:hover': { 
                          transform: 'scale(1.05)',
                          boxShadow: 6
                        }
                      }}
                      onClick={() => setHabilidadesFiltro(
                        habilidadesFiltro === 'nao-desenvolvido' ? 'todos' : 'nao-desenvolvido'
                      )}
                    >
                      <CardContent>
                        <Typography 
                          variant="h3" 
                          align="center"
                          sx={{
                            fontWeight: 700,
                            textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                            WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                          }}
                        >
                          {distribuicaoHabilidades.distribuicao?.['nao-desenvolvido']?.quantidade || 0}
                        </Typography>
                        <Typography variant="body1" align="center" sx={{ mt: 1 }}>
                          Não Desenvolvido
                        </Typography>
                        <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
                        <Typography variant="caption" align="center" display="block" sx={{ opacity: 0.9 }}>
                          {distribuicaoHabilidades.distribuicao?.['nao-desenvolvido']?.percentual || 0}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Card 2 - Em Desenvolvimento (Amarelo) */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card 
                      sx={{ 
                        bgcolor: 'warning.main',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        border: habilidadesFiltro === 'em-desenvolvimento' ? '3px solid #FFD700' : 'none',
                        '&:hover': { 
                          transform: 'scale(1.05)',
                          boxShadow: 6
                        }
                      }}
                      onClick={() => setHabilidadesFiltro(
                        habilidadesFiltro === 'em-desenvolvimento' ? 'todos' : 'em-desenvolvimento'
                      )}
                    >
                      <CardContent>
                        <Typography 
                          variant="h3" 
                          align="center"
                          sx={{
                            fontWeight: 700,
                            textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                            WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                          }}
                        >
                          {distribuicaoHabilidades.distribuicao?.['em-desenvolvimento']?.quantidade || 0}
                        </Typography>
                        <Typography variant="body1" align="center" sx={{ mt: 1 }}>
                          Em Desenvolvimento
                        </Typography>
                        <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
                        <Typography variant="caption" align="center" display="block" sx={{ opacity: 0.9 }}>
                          {distribuicaoHabilidades.distribuicao?.['em-desenvolvimento']?.percentual || 0}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Card 3 - Desenvolvido (Verde) */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card 
                      sx={{ 
                        bgcolor: 'success.main',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        border: habilidadesFiltro === 'desenvolvido' ? '3px solid #FFD700' : 'none',
                        '&:hover': { 
                          transform: 'scale(1.05)',
                          boxShadow: 6
                        }
                      }}
                      onClick={() => setHabilidadesFiltro(
                        habilidadesFiltro === 'desenvolvido' ? 'todos' : 'desenvolvido'
                      )}
                    >
                      <CardContent>
                        <Typography 
                          variant="h3" 
                          align="center"
                          sx={{
                            fontWeight: 700,
                            textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                            WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                          }}
                        >
                          {distribuicaoHabilidades.distribuicao?.['desenvolvido']?.quantidade || 0}
                        </Typography>
                        <Typography variant="body1" align="center" sx={{ mt: 1 }}>
                          Desenvolvido
                        </Typography>
                        <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
                        <Typography variant="caption" align="center" display="block" sx={{ opacity: 0.9 }}>
                          {distribuicaoHabilidades.distribuicao?.['desenvolvido']?.percentual || 0}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Card 4 - Plenamente Desenvolvido (Azul Marinho) */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card 
                      sx={{ 
                        bgcolor: '#0D47A1',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        border: habilidadesFiltro === 'plenamente-desenvolvido' ? '3px solid #FFD700' : 'none',
                        '&:hover': { 
                          transform: 'scale(1.05)',
                          boxShadow: 6
                        }
                      }}
                      onClick={() => setHabilidadesFiltro(
                        habilidadesFiltro === 'plenamente-desenvolvido' ? 'todos' : 'plenamente-desenvolvido'
                      )}
                    >
                      <CardContent>
                        <Typography 
                          variant="h3" 
                          align="center"
                          sx={{
                            fontWeight: 700,
                            textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                            WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                          }}
                        >
                          {distribuicaoHabilidades.distribuicao?.['plenamente-desenvolvido']?.quantidade || 0}
                        </Typography>
                        <Typography variant="body1" align="center" sx={{ mt: 1 }}>
                          Plenamente Desenvolvido
                        </Typography>
                        <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
                        <Typography variant="caption" align="center" display="block" sx={{ opacity: 0.9 }}>
                          {distribuicaoHabilidades.distribuicao?.['plenamente-desenvolvido']?.percentual || 0}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Indicador de filtro ativo */}
                {habilidadesFiltro !== 'todos' && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Chip 
                      label={`Filtro ativo: ${
                        habilidadesFiltro === 'nao-desenvolvido' ? 'Não Desenvolvido' :
                        habilidadesFiltro === 'em-desenvolvimento' ? 'Em Desenvolvimento' :
                        habilidadesFiltro === 'desenvolvido' ? 'Desenvolvido' :
                        'Plenamente Desenvolvido'
                      }`}
                      color="primary"
                      onDelete={() => setHabilidadesFiltro('todos')}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                )}
              </Box>
            </Fade>
          </Grid>
        )}

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
              <Typography 
                variant="h6" 
                gutterBottom 
                fontWeight="600"
                sx={{
                  color: '#00CED1',
                  borderBottom: theme.palette.mode === 'light' ? '3px solid #003366' : '3px solid white',
                  paddingBottom: 1,
                  marginBottom: 2
                }}
              >
                📚 Evolução de Habilidades por Trimestre
              </Typography>
            <Box sx={{ height: 300 }}>
              {chartDataEvolucaoHabilidades ? (
                <Line 
                  data={chartDataEvolucaoHabilidades} 
                  options={{ 
                    ...chartOptionsLine,
                    scales: {
                      ...chartOptionsLine.scales,
                      y: {
                        ...chartOptionsLine.scales.y,
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          ...chartOptionsLine.scales.y.ticks,
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
              <Typography 
                variant="h6" 
                gutterBottom 
                fontWeight="600"
                sx={{
                  color: '#00CED1',
                  borderBottom: theme.palette.mode === 'light' ? '3px solid #003366' : '3px solid white',
                  paddingBottom: 1,
                  marginBottom: 2
                }}
              >
                🎯 Distribuição de Níveis de Habilidades
              </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              {chartDataDistribuicaoHabilidades && distribuicaoHabilidades?.total > 0 ? (
                <Pie 
                  data={chartDataDistribuicaoHabilidades} 
                  options={{ 
                    ...chartOptionsPie,
                    plugins: {
                      ...chartOptionsPie.plugins,
                      legend: {
                        ...chartOptionsPie.plugins.legend,
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
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  fontWeight="600"
                  sx={{
                    color: '#00CED1',
                    borderBottom: theme.palette.mode === 'light' ? '3px solid #003366' : '3px solid white',
                    paddingBottom: 1,
                    marginBottom: 2
                  }}
                >
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

        {/* Seção de Frequências em Tempo Real - Sempre renderiza, mesmo sem dados */}
        <Grid item xs={12}>
          <Fade in={true} timeout={1400}>
            <Paper 
              ref={frequenciaRef}
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
                    <Typography 
                      variant="h6" 
                      fontWeight="600"
                      sx={{
                        color: '#00CED1',
                        borderBottom: theme.palette.mode === 'light' ? '3px solid #003366' : '3px solid white',
                        paddingBottom: 1
                      }}
                    >
                      📅 Dashboard de Frequência - Dados Acumulados
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Botão Exportar PDF */}
                      <Tooltip title="Exportar Dashboard em PDF - Gráficos e Tabela em páginas separadas (A4 com margens 20mm)">
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          startIcon={<PdfIcon />}
                          onClick={exportarFrequenciaPDF}
                          disabled={exportando || !dashboardFrequencia.todosAlunos || dashboardFrequencia.todosAlunos.length === 0}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            boxShadow: 2,
                            '&:hover': { boxShadow: 4 }
                          }}
                        >
                          {exportando ? 'Gerando PDF...' : 'Exportar PDF'}
                        </Button>
                      </Tooltip>
                      
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
                  </Box>

                  {/* Banner Informativo de Dados Acumulados */}
                  <Alert 
                    severity="info" 
                    icon={<AssessmentOutlined />}
                    sx={{ 
                      mb: 3,
                      bgcolor: 'info.lighter',
                      '& .MuiAlert-message': { width: '100%' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                          📊 Estatísticas Acumuladas
                        </Typography>
                        <Typography variant="body2">
                          Os dados abaixo representam frequências acumuladas
                          {filters.turma && ` da turma ${turmas.find(t => t._id === filters.turma)?.nome}`}
                          {filters.ano && ` do ano ${filters.ano}`}
                          {filters.trimestre && ` no ${filters.trimestre}º trimestre`}
                          {filters.dataInicio && filters.dataFim && ` no período de ${formatarDataBR(filters.dataInicio)} a ${formatarDataBR(filters.dataFim)}`}
                          {!filters.dataInicio && !filters.dataFim && !filters.trimestre && !filters.ano && ` (todos os períodos)`}
                        </Typography>
                      </Box>
                      {filters.turma && (
                        <Chip 
                          label={`Turma: ${turmas.find(t => t._id === filters.turma)?.nome}`}
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                  </Alert>
                
                {/* Cards de Estatísticas de Frequência */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card 
                      sx={{ 
                        bgcolor: '#0D47A1',
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
                          variant="h3" 
                          align="center"
                          sx={{
                            fontWeight: 700,
                            textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                            WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                          }}
                        >
                          {dashboardFrequencia.totalRegistros}
                        </Typography>
                        <Typography variant="body1" align="center" sx={{ mt: 1 }}>
                          Total de Registros
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card 
                      sx={{ 
                        bgcolor: 'success.main',
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
                          variant="h3" 
                          align="center"
                          sx={{
                            fontWeight: 700,
                            textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                            WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                          }}
                        >
                          {dashboardFrequencia.percentualPresenca || 0}%
                        </Typography>
                        <Typography variant="body1" align="center" sx={{ mt: 1 }}>
                          Presentes
                        </Typography>
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
                          {dashboardFrequencia.presentes} alunos
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card 
                      sx={{ 
                        bgcolor: 'error.main',
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
                          variant="h3" 
                          align="center"
                          sx={{
                            fontWeight: 700,
                            textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                            WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                          }}
                        >
                          {dashboardFrequencia.percentualFaltas || 0}%
                        </Typography>
                        <Typography variant="body1" align="center" sx={{ mt: 1 }}>
                          Faltas
                        </Typography>
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
                          {dashboardFrequencia.faltas} alunos
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card 
                      sx={{ 
                        bgcolor: 'warning.main',
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
                          variant="h3" 
                          align="center"
                          sx={{
                            fontWeight: 700,
                            textShadow: '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                            WebkitTextStroke: '1.5px rgba(255,255,255,0.4)'
                          }}
                        >
                          {dashboardFrequencia.faltasJustificadas}
                        </Typography>
                        <Typography variant="body1" align="center" sx={{ mt: 1 }}>
                          Justificadas
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Gráficos de Análise */}
                {dashboardFrequencia.todosAlunos && dashboardFrequencia.todosAlunos.length > 0 && (() => {
                  // Processar dados para gráfico de comparação por turma
                  const turmasMap = {};
                  dashboardFrequencia.todosAlunos.forEach(aluno => {
                    const turmaId = aluno.aluno?.turma?._id || 'sem-turma';
                    const turmaNome = aluno.aluno?.turma?.nome || 'Sem Turma';
                    
                    if (!turmasMap[turmaId]) {
                      turmasMap[turmaId] = {
                        nome: turmaNome,
                        alunos: [],
                        somaFrequencia: 0,
                        adequado: 0,
                        atencao: 0,
                        critico: 0
                      };
                    }
                    
                    turmasMap[turmaId].alunos.push(aluno);
                    turmasMap[turmaId].somaFrequencia += parseFloat(aluno.percentualPresenca) || 0;
                    
                    // Contar por classificação
                    if (aluno.classificacao === 'adequado') turmasMap[turmaId].adequado++;
                    else if (aluno.classificacao === 'atencao') turmasMap[turmaId].atencao++;
                    else if (aluno.classificacao === 'critico') turmasMap[turmaId].critico++;
                  });

                  let turmasArray = Object.values(turmasMap).map(turma => ({
                    ...turma,
                    media: (turma.somaFrequencia / turma.alunos.length).toFixed(1),
                    total: turma.alunos.length
                  })).sort((a, b) => b.media - a.media); // Ordenar por média decrescente

                  // Se houver filtro de turma específica, mostrar apenas aquela turma
                  if (filters.turma) {
                    const turmaFiltrada = turmasArray.find(t => 
                      t.alunos.some(a => a.aluno?.turma?._id === filters.turma)
                    );
                    if (turmaFiltrada) {
                      turmasArray = [turmaFiltrada];
                    }
                  }

                  // Paleta de cores distintas para cada turma
                  const coresTurmas = [
                    { bg: 'rgba(25, 118, 210, 0.7)', border: 'rgb(25, 118, 210)' },      // Azul
                    { bg: 'rgba(156, 39, 176, 0.7)', border: 'rgb(156, 39, 176)' },      // Roxo
                    { bg: 'rgba(0, 150, 136, 0.7)', border: 'rgb(0, 150, 136)' },        // Teal
                    { bg: 'rgba(255, 87, 34, 0.7)', border: 'rgb(255, 87, 34)' },        // Laranja Escuro
                    { bg: 'rgba(233, 30, 99, 0.7)', border: 'rgb(233, 30, 99)' },        // Rosa
                    { bg: 'rgba(103, 58, 183, 0.7)', border: 'rgb(103, 58, 183)' },      // Roxo Profundo
                    { bg: 'rgba(0, 188, 212, 0.7)', border: 'rgb(0, 188, 212)' },        // Ciano
                    { bg: 'rgba(255, 193, 7, 0.7)', border: 'rgb(255, 193, 7)' },        // Âmbar
                    { bg: 'rgba(121, 85, 72, 0.7)', border: 'rgb(121, 85, 72)' },        // Marrom
                    { bg: 'rgba(96, 125, 139, 0.7)', border: 'rgb(96, 125, 139)' },      // Cinza Azulado
                  ];

                  // Dados para gráfico de comparação
                  const dadosComparacao = {
                    labels: turmasArray.map(t => t.nome),
                    datasets: [{
                      label: 'Frequência Média (%)',
                      data: turmasArray.map(t => parseFloat(t.media)),
                      // Se há filtro, usar cor baseada no desempenho; senão, usar cores distintas
                      backgroundColor: filters.turma 
                        ? turmasArray.map(t => 
                            t.media >= 80 ? 'rgba(76, 175, 80, 0.7)' : 
                            t.media >= 60 ? 'rgba(255, 152, 0, 0.7)' : 
                            'rgba(244, 67, 54, 0.7)'
                          )
                        : turmasArray.map((t, idx) => coresTurmas[idx % coresTurmas.length].bg),
                      borderColor: filters.turma
                        ? turmasArray.map(t => 
                            t.media >= 80 ? 'rgb(76, 175, 80)' : 
                            t.media >= 60 ? 'rgb(255, 152, 0)' : 
                            'rgb(244, 67, 54)'
                          )
                        : turmasArray.map((t, idx) => coresTurmas[idx % coresTurmas.length].border),
                      borderWidth: 2,
                    }]
                  };

                  const opcoesComparacao = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                        labels: {
                          color: isDarkMode ? '#ffffff' : '#000000'
                        }
                      },
                      title: {
                        display: true,
                        text: filters.turma 
                          ? `📊 Frequência da Turma ${turmasArray[0]?.nome || ''}`
                          : '📊 Comparação de Frequência por Turma',
                        font: { size: 24, weight: 'bold' },
                        color: isDarkMode ? '#ffffff' : '#000000'
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const turma = turmasArray[context.dataIndex];
                            return [
                              `Frequência Média: ${context.parsed.y}%`,
                              `Total de Alunos: ${turma.total}`,
                              `Adequado: ${turma.adequado} | Atenção: ${turma.atencao} | Crítico: ${turma.critico}`
                            ];
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Frequência Média (%)',
                          color: isDarkMode ? '#ffffff' : '#000000',
                          font: { size: 18, weight: 'bold' }
                        },
                        ticks: {
                          color: isDarkMode ? '#ffffff' : '#000000',
                          font: { size: 18 }
                        },
                        grid: {
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        },
                        border: {
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: filters.turma ? 'Turma' : 'Turmas',
                          color: isDarkMode ? '#ffffff' : '#000000',
                          font: { size: 18, weight: 'bold' }
                        },
                        ticks: {
                          color: isDarkMode ? '#ffffff' : '#000000',
                          font: { size: 18 }
                        },
                        grid: {
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        },
                        border: {
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
                        }
                      }
                    }
                  };

                  // Plugin customizado para exibir valores no topo das barras
                  const pluginValoresNoTopo = {
                    id: 'valoresNoTopo',
                    afterDatasetsDraw(chart) {
                      const { ctx, data, scales: { x, y } } = chart;
                      ctx.save();
                      
                      data.datasets.forEach((dataset, datasetIndex) => {
                        chart.getDatasetMeta(datasetIndex).data.forEach((bar, index) => {
                          const value = dataset.data[index];
                          
                          // Configurar o texto
                          ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
                          ctx.font = 'bold 21px Arial';
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'bottom';
                          
                          // Posição do texto (acima da barra)
                          const xPos = bar.x;
                          const yPos = bar.y - 5;
                          
                          // Desenhar o texto
                          ctx.fillText(`${value}%`, xPos, yPos);
                        });
                      });
                      
                      ctx.restore();
                    }
                  };

                  // Dados para gráfico de predição (scatter)
                  const alunosAdequado = [];
                  const alunosAtencao = [];
                  const alunosCritico = [];

                  dashboardFrequencia.todosAlunos.forEach(aluno => {
                    const ponto = {
                      x: aluno.total || 0,
                      y: parseFloat(aluno.percentualPresenca) || 0,
                      nome: aluno.aluno?.nome || 'Sem nome',
                      turma: aluno.aluno?.turma?.nome || 'Sem turma'
                    };

                    if (aluno.classificacao === 'adequado') {
                      alunosAdequado.push(ponto);
                    } else if (aluno.classificacao === 'atencao') {
                      alunosAtencao.push(ponto);
                    } else {
                      alunosCritico.push(ponto);
                    }
                  });

                  const dadosPredicao = {
                    datasets: [
                      {
                        label: 'Adequado (≥80%)',
                        data: alunosAdequado,
                        backgroundColor: 'rgba(76, 175, 80, 0.6)',
                        borderColor: 'rgb(76, 175, 80)',
                        borderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                      },
                      {
                        label: 'Atenção (60-79%)',
                        data: alunosAtencao,
                        backgroundColor: 'rgba(255, 152, 0, 0.6)',
                        borderColor: 'rgb(255, 152, 0)',
                        borderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                      },
                      {
                        label: 'Crítico (<60%)',
                        data: alunosCritico,
                        backgroundColor: 'rgba(244, 67, 54, 0.6)',
                        borderColor: 'rgb(244, 67, 54)',
                        borderWidth: 2,
                        pointRadius: 8,
                        pointHoverRadius: 10,
                      }
                    ]
                  };

                  const opcoesPredicao = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top',
                        labels: {
                          color: isDarkMode ? '#ffffff' : '#000000'
                        }
                      },
                      title: {
                        display: true,
                        text: '🎯 Análise de Risco e Predição',
                        font: { size: 24, weight: 'bold' },
                        color: isDarkMode ? '#ffffff' : '#000000'
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const ponto = context.raw;
                            return [
                              `Aluno: ${ponto.nome}`,
                              `Turma: ${ponto.turma}`,
                              `Total de Aulas: ${ponto.x}`,
                              `Frequência: ${ponto.y}%`
                            ];
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Frequência (%)',
                          color: isDarkMode ? '#ffffff' : '#000000',
                          font: { size: 18, weight: 'bold' }
                        },
                        ticks: {
                          color: isDarkMode ? '#ffffff' : '#000000',
                          font: { size: 18 }
                        },
                        grid: {
                          color: function(context) {
                            // Linhas de referência coloridas
                            if (context.tick.value === 80) return 'rgba(76, 175, 80, 0.4)';
                            if (context.tick.value === 60) return 'rgba(255, 152, 0, 0.4)';
                            return isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                          },
                          lineWidth: function(context) {
                            return (context.tick.value === 80 || context.tick.value === 60) ? 2 : 1;
                          }
                        },
                        border: {
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Total de Aulas Registradas',
                          color: isDarkMode ? '#ffffff' : '#000000',
                          font: { size: 18, weight: 'bold' }
                        },
                        ticks: {
                          color: isDarkMode ? '#ffffff' : '#000000',
                          font: { size: 18 }
                        },
                        grid: {
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        },
                        border: {
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
                        }
                      }
                    }
                  };

                  // Identificar alertas
                  const alertas = [];
                  const alunosCriticos = dashboardFrequencia.todosAlunos.filter(a => a.classificacao === 'critico');
                  const turmasBaixaMedia = turmasArray.filter(t => parseFloat(t.media) < 75);
                  const alunosRisco = dashboardFrequencia.todosAlunos.filter(a => 
                    parseFloat(a.percentualPresenca) >= 60 && parseFloat(a.percentualPresenca) < 70
                  );

                  if (alunosCriticos.length > 0) {
                    alertas.push(`🚨 ${alunosCriticos.length} aluno(s) em situação crítica (<60%)`);
                  }
                  if (turmasBaixaMedia.length > 0) {
                    alertas.push(`⚠️ ${turmasBaixaMedia.length} turma(s) com média abaixo de 75%: ${turmasBaixaMedia.map(t => t.nome).join(', ')}`);
                  }
                  if (alunosRisco.length > 0) {
                    alertas.push(`📉 ${alunosRisco.length} aluno(s) próximo(s) da zona crítica (60-70%)`);
                  }

                  return (
                    <>
                      {/* Grid dos Gráficos */}
                      <Grid container spacing={3} sx={{ my: 3 }}>
                        <Grid item xs={12}>
                          <Paper 
                            ref={containerGraficoComparacaoRef}
                            elevation={3} 
                            sx={{ p: 2, height: 500, position: 'relative' }}
                          >
                            <IconButton
                              onClick={() => handleExpandirGrafico('comparacao')}
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                zIndex: 10,
                                bgcolor: 'rgba(0,0,0,0.05)',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' }
                              }}
                              title="Expandir gráfico"
                            >
                              <FullscreenIcon />
                            </IconButton>
                            <Bar 
                              data={dadosComparacao} 
                              options={opcoesComparacao}
                              plugins={[pluginValoresNoTopo]}
                            />
                          </Paper>
                        </Grid>
                        <Grid item xs={12}>
                          <Paper 
                            ref={containerGraficoPredicaoRef}
                            elevation={3} 
                            sx={{ p: 2, height: 500, position: 'relative' }}
                          >
                            <IconButton
                              onClick={() => handleExpandirGrafico('predicao')}
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                zIndex: 10,
                                bgcolor: 'rgba(0,0,0,0.05)',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' }
                              }}
                              title="Expandir gráfico"
                            >
                              <FullscreenIcon />
                            </IconButton>
                            <Scatter data={dadosPredicao} options={opcoesPredicao} />
                          </Paper>
                        </Grid>
                      </Grid>

                      {/* Dialog de Visualização Expandida */}
                      <Dialog
                        fullScreen
                        open={graficoExpandido !== null}
                        onClose={handleFecharGrafico}
                        TransitionComponent={Transition}
                      >
                        <AppBar sx={{ position: 'relative', bgcolor: 'primary.main' }}>
                          <Toolbar>
                            <IconButton
                              edge="start"
                              color="inherit"
                              onClick={handleFecharGrafico}
                              aria-label="fechar"
                            >
                              <CloseIcon />
                            </IconButton>
                            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                              {graficoExpandido === 'comparacao' 
                                ? '📊 Comparação de Frequência por Turma' 
                                : '🎯 Análise de Risco e Predição'}
                            </Typography>
                            <IconButton
                              color="inherit"
                              onClick={handleFecharGrafico}
                              aria-label="retornar ao modo normal"
                            >
                              <FullscreenExitIcon />
                            </IconButton>
                          </Toolbar>
                        </AppBar>
                        <Box sx={{ p: 4, height: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center' }}>
                          {graficoExpandido === 'comparacao' && (
                            <Box sx={{ width: '100%', height: '80vh' }}>
                              <Bar 
                                data={dadosComparacao} 
                                options={{
                                  ...opcoesComparacao,
                                  maintainAspectRatio: true,
                                  plugins: {
                                    ...opcoesComparacao.plugins,
                                    title: {
                                      ...opcoesComparacao.plugins.title,
                                      font: { size: 20, weight: 'bold' }
                                    }
                                  }
                                }}
                                plugins={[pluginValoresNoTopo]}
                              />
                            </Box>
                          )}
                          {graficoExpandido === 'predicao' && (
                            <Box sx={{ width: '100%', height: '80vh' }}>
                              <Scatter 
                                data={dadosPredicao} 
                                options={{
                                  ...opcoesPredicao,
                                  maintainAspectRatio: true,
                                  plugins: {
                                    ...opcoesPredicao.plugins,
                                    title: {
                                      ...opcoesPredicao.plugins.title,
                                      font: { size: 20, weight: 'bold' }
                                    }
                                  }
                                }} 
                              />
                            </Box>
                          )}
                        </Box>
                      </Dialog>

                      {/* Alertas Automáticos */}
                      {alertas.length > 0 && (
                        <Alert severity="warning" icon={<WarningAmberOutlined />} sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" fontWeight="700" gutterBottom>
                            🚨 ALERTAS AUTOMÁTICOS
                          </Typography>
                          {alertas.map((alerta, idx) => (
                            <Typography key={idx} variant="body2" sx={{ mt: 0.5 }}>
                              • {alerta}
                            </Typography>
                          ))}
                        </Alert>
                      )}

                      {/* Seção de Rankings - TOP 3 */}
                      {dashboardFrequencia.todosAlunos && dashboardFrequencia.todosAlunos.length > 0 && (() => {
                        // Processar rankings
                        const alunosComDados = dashboardFrequencia.todosAlunos.filter(a => 
                          a.aluno && a.aluno.nome && a.total > 0
                        );

                        // TOP 3 MELHORES FREQUÊNCIAS (ordenar por percentual decrescente)
                        const top3Melhores = [...alunosComDados]
                          .sort((a, b) => parseFloat(b.percentualPresenca) - parseFloat(a.percentualPresenca))
                          .slice(0, 3);

                        // TOP 3 CONSISTENTES (frequência >= 75% e maior número de presenças)
                        const top3Consistentes = [...alunosComDados]
                          .filter(a => parseFloat(a.percentualPresenca) >= 75)
                          .sort((a, b) => b.presentes - a.presentes)
                          .slice(0, 3);

                        // TOP 3 PIORES FREQUÊNCIAS (ordenar por percentual crescente)
                        const top3Piores = [...alunosComDados]
                          .sort((a, b) => parseFloat(a.percentualPresenca) - parseFloat(b.percentualPresenca))
                          .slice(0, 3);

                        // Criar dados para gráfico TOP 3 Melhores
                        const dadosMelhores = {
                          labels: top3Melhores.map(a => a.aluno.nome.length > 20 ? a.aluno.nome.substring(0, 20) + '...' : a.aluno.nome),
                          datasets: [{
                            label: 'Frequência (%)',
                            data: top3Melhores.map(a => parseFloat(a.percentualPresenca)),
                            backgroundColor: 'rgba(76, 175, 80, 0.8)',
                            borderColor: 'rgb(76, 175, 80)',
                            borderWidth: 2,
                          }]
                        };

                        // Criar dados para gráfico TOP 3 Consistentes
                        const dadosConsistentes = {
                          labels: top3Consistentes.map(a => a.aluno.nome.length > 20 ? a.aluno.nome.substring(0, 20) + '...' : a.aluno.nome),
                          datasets: [{
                            label: 'Presenças Totais',
                            data: top3Consistentes.map(a => a.presentes),
                            backgroundColor: 'rgba(255, 193, 7, 0.8)',
                            borderColor: 'rgb(255, 193, 7)',
                            borderWidth: 2,
                          }]
                        };

                        // Criar dados para gráfico TOP 3 Piores
                        const dadosPiores = {
                          labels: top3Piores.map(a => a.aluno.nome.length > 20 ? a.aluno.nome.substring(0, 20) + '...' : a.aluno.nome),
                          datasets: [{
                            label: 'Frequência (%)',
                            data: top3Piores.map(a => parseFloat(a.percentualPresenca)),
                            backgroundColor: 'rgba(244, 67, 54, 0.8)',
                            borderColor: 'rgb(244, 67, 54)',
                            borderWidth: 2,
                          }]
                        };

                        // Opções comuns para gráficos horizontais
                        const opcoesHorizontal = (titulo, sufixo = '%') => ({
                          indexAxis: 'y',
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            },
                            title: {
                              display: true,
                              text: titulo,
                              font: { size: 16, weight: 'bold' },
                              color: isDarkMode ? '#ffffff' : '#000000',
                              padding: { bottom: 15 }
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const aluno = sufixo === '%' 
                                    ? (titulo.includes('Melhores') ? top3Melhores : top3Piores)[context.dataIndex]
                                    : top3Consistentes[context.dataIndex];
                                  return [
                                    `${context.label}`,
                                    sufixo === '%' 
                                      ? `Frequência: ${context.parsed.x}%`
                                      : `Presenças: ${context.parsed.x} de ${aluno.total}`,
                                    sufixo === '%' 
                                      ? `Total de Aulas: ${aluno.total}`
                                      : `Frequência: ${aluno.percentualPresenca}%`,
                                    `Matrícula: ${aluno.aluno.matricula}`
                                  ];
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                              max: sufixo === '%' ? 100 : undefined,
                              title: {
                                display: true,
                                text: sufixo === '%' ? 'Frequência (%)' : 'Número de Presenças',
                                color: isDarkMode ? '#ffffff' : '#000000',
                                font: { size: 14, weight: 'bold' }
                              },
                              ticks: {
                                color: isDarkMode ? '#ffffff' : '#000000',
                                font: { size: 13 }
                              },
                              grid: {
                                color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                              }
                            },
                            y: {
                              ticks: {
                                color: isDarkMode ? '#ffffff' : '#000000',
                                font: { size: 13, weight: '600' }
                              },
                              grid: {
                                display: false
                              }
                            }
                          }
                        });

                        return (
                          <>
                            {/* Título da Seção de Rankings */}
                            <Box sx={{ mt: 4, mb: 2 }}>
                              <Typography 
                                variant="h6" 
                                fontWeight="600"
                                sx={{
                                  color: '#00CED1',
                                  borderBottom: theme.palette.mode === 'light' ? '3px solid #003366' : '3px solid white',
                                  paddingBottom: 1,
                                  marginBottom: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}
                              >
                                🏆 Rankings de Frequência - TOP 3
                              </Typography>
                            </Box>

                            {/* Grid com os 3 gráficos de ranking */}
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                              {/* TOP 3 MELHORES */}
                              <Grid item xs={12} md={4}>
                                <Fade in={true} timeout={1500}>
                                  <Paper 
                                    elevation={3} 
                                    sx={{ 
                                      p: 2, 
                                      height: 350,
                                      borderRadius: 3,
                                      border: '8px solid rgba(76, 175, 80, 0.5)',
                                      boxShadow: '0 4px 20px rgba(76, 175, 80, 0.2)',
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        boxShadow: '0 8px 30px rgba(76, 175, 80, 0.3)',
                                        transform: 'translateY(-4px)',
                                      }
                                    }}
                                  >
                                    {top3Melhores.length > 0 ? (
                                      <Bar 
                                        data={dadosMelhores} 
                                        options={opcoesHorizontal('🥇 TOP 3 Melhores Frequências', '%')}
                                      />
                                    ) : (
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <Typography variant="body2" color="text.secondary">
                                          Sem dados disponíveis
                                        </Typography>
                                      </Box>
                                    )}
                                  </Paper>
                                </Fade>
                              </Grid>

                              {/* TOP 3 CONSISTENTES */}
                              <Grid item xs={12} md={4}>
                                <Fade in={true} timeout={1600}>
                                  <Paper 
                                    elevation={3} 
                                    sx={{ 
                                      p: 2, 
                                      height: 350,
                                      borderRadius: 3,
                                      border: '8px solid rgba(255, 193, 7, 0.5)',
                                      boxShadow: '0 4px 20px rgba(255, 193, 7, 0.2)',
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        boxShadow: '0 8px 30px rgba(255, 193, 7, 0.3)',
                                        transform: 'translateY(-4px)',
                                      }
                                    }}
                                  >
                                    {top3Consistentes.length > 0 ? (
                                      <Bar 
                                        data={dadosConsistentes} 
                                        options={opcoesHorizontal('📈 TOP 3 Mais Consistentes', '')}
                                      />
                                    ) : (
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 1 }}>
                                        <Typography variant="body2" color="text.secondary" align="center">
                                          Sem alunos com frequência ≥ 75%
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" align="center">
                                          (Requer frequência mínima de 75%)
                                        </Typography>
                                      </Box>
                                    )}
                                  </Paper>
                                </Fade>
                              </Grid>

                              {/* TOP 3 PIORES */}
                              <Grid item xs={12} md={4}>
                                <Fade in={true} timeout={1700}>
                                  <Paper 
                                    elevation={3} 
                                    sx={{ 
                                      p: 2, 
                                      height: 350,
                                      borderRadius: 3,
                                      border: '8px solid rgba(244, 67, 54, 0.5)',
                                      boxShadow: '0 4px 20px rgba(244, 67, 54, 0.2)',
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        boxShadow: '0 8px 30px rgba(244, 67, 54, 0.3)',
                                        transform: 'translateY(-4px)',
                                      }
                                    }}
                                  >
                                    {top3Piores.length > 0 ? (
                                      <Bar 
                                        data={dadosPiores} 
                                        options={opcoesHorizontal('⚠️ TOP 3 Piores Frequências', '%')}
                                      />
                                    ) : (
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <Typography variant="body2" color="text.secondary">
                                          Sem dados disponíveis
                                        </Typography>
                                      </Box>
                                    )}
                                  </Paper>
                                </Fade>
                              </Grid>
                            </Grid>

                            {/* Legenda explicativa */}
                            <Alert severity="info" icon={<AssessmentOutlined />} sx={{ mb: 3 }}>
                              <Typography variant="body2">
                                <strong>🥇 Melhores:</strong> Alunos com maior percentual de frequência | 
                                <strong> 📈 Consistentes:</strong> Alunos com ≥75% de frequência e mais presenças totais | 
                                <strong> ⚠️ Piores:</strong> Alunos com menor percentual (precisam de atenção)
                              </Typography>
                            </Alert>
                          </>
                        );
                      })()}
                    </>
                  );
                })()}

                {/* Filtros de Frequência */}
                <Box sx={{ my: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <FilterListIcon color="primary" sx={{ fontSize: 28 }} />
                    <Typography variant="h6" fontWeight="700" color="primary">
                      Filtrar por Status
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {/* Botão TODOS */}
                    <Button
                      variant={frequenciaFiltros.includes('todos') ? 'contained' : 'outlined'}
                      onClick={() => setFrequenciaFiltros(['todos'])}
                      startIcon={<CheckCircleOutlined />}
                      sx={{
                        px: 3,
                        py: 1.5,
                        borderRadius: 3,
                        borderWidth: 2,
                        borderColor: 'primary.main',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        boxShadow: frequenciaFiltros.includes('todos') ? 4 : 2,
                        transition: 'all 0.3s ease',
                        background: frequenciaFiltros.includes('todos') 
                          ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
                          : 'transparent',
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-2px)',
                          boxShadow: 6,
                          borderColor: 'primary.dark',
                          background: frequenciaFiltros.includes('todos')
                            ? 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
                            : 'rgba(25, 118, 210, 0.08)',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="700">
                          TODOS
                        </Typography>
                        <Chip 
                          label={dashboardFrequencia.contadores?.total || 0}
                          size="small"
                          sx={{ 
                            height: 24,
                            fontWeight: 700,
                            bgcolor: frequenciaFiltros.includes('todos') ? 'rgba(255,255,255,0.3)' : 'primary.main',
                            color: frequenciaFiltros.includes('todos') ? 'white' : 'white'
                          }}
                        />
                      </Box>
                    </Button>

                    {/* Botão ADEQUADO */}
                    <Button
                      variant={frequenciaFiltros.includes('adequado') ? 'contained' : 'outlined'}
                      onClick={() => {
                        const newFiltros = frequenciaFiltros.includes('adequado')
                          ? frequenciaFiltros.filter(f => f !== 'adequado')
                          : [...frequenciaFiltros.filter(f => f !== 'todos'), 'adequado'];
                        setFrequenciaFiltros(newFiltros.length === 0 ? ['todos'] : newFiltros);
                      }}
                      startIcon={<CheckCircleOutlined />}
                      sx={{
                        px: 3,
                        py: 1.5,
                        borderRadius: 3,
                        borderWidth: 2,
                        borderColor: 'success.main',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        boxShadow: frequenciaFiltros.includes('adequado') ? 4 : 2,
                        transition: 'all 0.3s ease',
                        background: frequenciaFiltros.includes('adequado')
                          ? 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)'
                          : 'transparent',
                        color: frequenciaFiltros.includes('adequado') ? 'white' : 'success.main',
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-2px)',
                          boxShadow: 6,
                          borderColor: 'success.dark',
                          background: frequenciaFiltros.includes('adequado')
                            ? 'linear-gradient(135deg, #1b5e20 0%, #0d3d10 100%)'
                            : 'rgba(46, 125, 50, 0.08)',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="700">
                          ADEQUADO
                        </Typography>
                        <Typography variant="caption" fontWeight="600" sx={{ opacity: 0.9 }}>
                          ≥80%
                        </Typography>
                        <Chip 
                          label={dashboardFrequencia.contadores?.adequado || 0}
                          size="small"
                          sx={{ 
                            height: 24,
                            fontWeight: 700,
                            bgcolor: frequenciaFiltros.includes('adequado') ? 'rgba(255,255,255,0.3)' : 'success.main',
                            color: 'white'
                          }}
                        />
                      </Box>
                    </Button>

                    {/* Botão ATENÇÃO */}
                    <Button
                      variant={frequenciaFiltros.includes('atencao') ? 'contained' : 'outlined'}
                      onClick={() => {
                        const newFiltros = frequenciaFiltros.includes('atencao')
                          ? frequenciaFiltros.filter(f => f !== 'atencao')
                          : [...frequenciaFiltros.filter(f => f !== 'todos'), 'atencao'];
                        setFrequenciaFiltros(newFiltros.length === 0 ? ['todos'] : newFiltros);
                      }}
                      startIcon={<WarningAmberOutlined />}
                      sx={{
                        px: 3,
                        py: 1.5,
                        borderRadius: 3,
                        borderWidth: 2,
                        borderColor: 'warning.main',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        boxShadow: frequenciaFiltros.includes('atencao') ? 4 : 2,
                        transition: 'all 0.3s ease',
                        background: frequenciaFiltros.includes('atencao')
                          ? 'linear-gradient(135deg, #ed6c02 0%, #e65100 100%)'
                          : 'transparent',
                        color: frequenciaFiltros.includes('atencao') ? 'white' : 'warning.main',
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-2px)',
                          boxShadow: 6,
                          borderColor: 'warning.dark',
                          background: frequenciaFiltros.includes('atencao')
                            ? 'linear-gradient(135deg, #e65100 0%, #bf360c 100%)'
                            : 'rgba(237, 108, 2, 0.08)',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="700">
                          ATENÇÃO
                        </Typography>
                        <Typography variant="caption" fontWeight="600" sx={{ opacity: 0.9 }}>
                          60-79%
                        </Typography>
                        <Chip 
                          label={dashboardFrequencia.contadores?.atencao || 0}
                          size="small"
                          sx={{ 
                            height: 24,
                            fontWeight: 700,
                            bgcolor: frequenciaFiltros.includes('atencao') ? 'rgba(255,255,255,0.3)' : 'warning.main',
                            color: 'white'
                          }}
                        />
                      </Box>
                    </Button>

                    {/* Botão CRÍTICO */}
                    <Button
                      variant={frequenciaFiltros.includes('critico') ? 'contained' : 'outlined'}
                      onClick={() => {
                        const newFiltros = frequenciaFiltros.includes('critico')
                          ? frequenciaFiltros.filter(f => f !== 'critico')
                          : [...frequenciaFiltros.filter(f => f !== 'todos'), 'critico'];
                        setFrequenciaFiltros(newFiltros.length === 0 ? ['todos'] : newFiltros);
                      }}
                      startIcon={<WarningAmberOutlined />}
                      sx={{
                        px: 3,
                        py: 1.5,
                        borderRadius: 3,
                        borderWidth: 2,
                        borderColor: 'error.main',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        boxShadow: frequenciaFiltros.includes('critico') ? 4 : 2,
                        transition: 'all 0.3s ease',
                        background: frequenciaFiltros.includes('critico')
                          ? 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)'
                          : 'transparent',
                        color: frequenciaFiltros.includes('critico') ? 'white' : 'error.main',
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-2px)',
                          boxShadow: 6,
                          borderColor: 'error.dark',
                          background: frequenciaFiltros.includes('critico')
                            ? 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)'
                            : 'rgba(211, 47, 47, 0.08)',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="700">
                          CRÍTICO
                        </Typography>
                        <Typography variant="caption" fontWeight="600" sx={{ opacity: 0.9 }}>
                          &lt;60%
                        </Typography>
                        <Chip 
                          label={dashboardFrequencia.contadores?.critico || 0}
                          size="small"
                          sx={{ 
                            height: 24,
                            fontWeight: 700,
                            bgcolor: frequenciaFiltros.includes('critico') ? 'rgba(255,255,255,0.3)' : 'error.main',
                            color: 'white'
                          }}
                        />
                      </Box>
                    </Button>
                  </Box>
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
                                <TableCell>Ações</TableCell>
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
                                    <TableCell align="center" sx={{ width: '80px' }}>
                                      <Tooltip title="Ver Histórico de Frequências">
                                        <IconButton
                                          onClick={() => handleVisualizarHistorico(aluno)}
                                          color="primary"
                                          size="small"
                                          disabled={loadingHistorico}
                                        >
                                          <Assessment />
                                        </IconButton>
                                      </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" fontWeight="600">
                                        {aluno.aluno.nome}
                                      </Typography>
                                      <Typography 
                                        variant="caption" 
                                        sx={{
                                          color: theme.palette.mode === 'light' ? '#003366' : 'text.secondary'
                                        }}
                                      >
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
                                        size="medium"
                                        variant="outlined"
                                        sx={{
                                          fontWeight: 700,
                                          fontSize: '1rem',
                                          '& .MuiChip-label': {
                                            color: '#000000'
                                          }
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip 
                                        label={aluno.faltas} 
                                        color="error" 
                                        size="medium"
                                        variant="outlined"
                                        sx={{
                                          fontWeight: 700,
                                          fontSize: '1rem',
                                          '& .MuiChip-label': {
                                            color: '#000000'
                                          }
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip 
                                        label={`${percentual}%`}
                                        color={statusColor}
                                        size="medium"
                                        variant="outlined"
                                        sx={{
                                          fontWeight: 700,
                                          fontSize: '1rem',
                                          bgcolor: 'transparent',
                                          '& .MuiChip-label': {
                                            color: '#000000'
                                          }
                                        }}
                                      />
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
                    {filters.turma ? (
                      <Box>
                        <Typography variant="body1" fontWeight="600" gutterBottom>
                          📊 Nenhum registro de frequência encontrado
                        </Typography>
                        <Typography variant="body2">
                          Não há frequências registradas para o período selecionado.
                          {filters.dataInicio && filters.dataFim && (
                            <> Período: {formatarDataBR(filters.dataInicio)} a {formatarDataBR(filters.dataFim)}</>
                          )}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          💡 Dica: Vá em <strong>Frequências</strong> para registrar presença dos alunos.
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body1" fontWeight="600" gutterBottom>
                          🎯 Selecione uma TURMA nos filtros acima
                        </Typography>
                        <Typography variant="body2">
                          Para visualizar a frequência acumulada dos alunos, selecione uma turma no filtro acima.
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          💡 Você também pode filtrar por período (Data Início/Fim) para ver estatísticas específicas.
                        </Typography>
                      </Box>
                    )}
                  </Alert>
                )}
              </Paper>
              </Fade>
            </Grid>
      </Grid>

      {/* Modal de Histórico de Frequência */}
      <ModalHistoricoFrequencia
        open={openModalHistorico}
        onClose={() => {
          setOpenModalHistorico(false);
          setAlunoHistoricoSelecionado(null);
          setFrequenciaHistorico(null);
        }}
        aluno={alunoHistoricoSelecionado}
        frequenciaData={frequenciaHistorico}
      />

    </Container>
  );
};

export default Dashboard;
