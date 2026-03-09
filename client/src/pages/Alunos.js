import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  IconButton,
  MenuItem,
  Chip,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Grid,
  Fade,
  Zoom,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Skeleton,
  InputAdornment,
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Delete, 
  Upload, 
  Download,
  Person as PersonIcon,
  School as SchoolIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Badge as BadgeIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { alunoService, turmaService } from '../services';
import { toast } from 'react-toastify';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import PageHeader from '../components/PageHeader';
import { Person as AlunosIcon } from '@mui/icons-material';
import { useSchool } from '../context/SchoolContext';

const Alunos = () => {
  // Função helper para formatar data sem problemas de timezone
  const formatarDataLocal = (dataString) => {
    if (!dataString) return '-';
    // Se for uma string no formato ISO (com timestamp), extrair apenas a parte da data
    const dataISO = dataString.split('T')[0];
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const { alunos, turmas, syncData, alunosLoading } = useSchool();
  const [localAlunos, setLocalAlunos] = useState([]);
  const [localTurmas, setLocalTurmas] = useState([]);
  const [filteredAlunos, setFilteredAlunos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [turmasLoading, setTurmasLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    nome: '',
    matricula: '',
    dataNascimento: '',
    turma: '',
    responsavel: {
      nome: '',
      telefone: '',
      email: '',
    },
  });
  const [editId, setEditId] = useState(null);
  const [importData, setImportData] = useState([]);
  const [importValidation, setImportValidation] = useState([]);
  const [turmaSelecionadaTemplate, setTurmaSelecionadaTemplate] = useState('');

  // Sincronizar com o contexto
  useEffect(() => {
    const alunosArray = Array.isArray(alunos) ? alunos : [];
    setLocalAlunos(alunosArray);
    setFilteredAlunos(alunosArray);
  }, [alunos]);

  useEffect(() => {
    const turmasArray = Array.isArray(turmas) ? turmas : [];
    setLocalTurmas(turmasArray);
  }, [turmas]);

  // Carregar turmas independentemente (fallback se contexto falhar)
  useEffect(() => {
    if (turmas.length === 0 && !turmasLoading) {
      loadTurmas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carregar dados ao montar o componente
  useEffect(() => {
    const carregarDados = async () => {
      await syncData(); // Carrega alunos e turmas do SchoolContext
    };
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrar alunos baseado na pesquisa
  useEffect(() => {
    if (!Array.isArray(localAlunos)) {
      setFilteredAlunos([]);
      return;
    }
    
    if (searchTerm) {
      const filtered = localAlunos.filter(aluno => 
        aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.turma?.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAlunos(filtered);
    } else {
      setFilteredAlunos(localAlunos);
    }
  }, [searchTerm, localAlunos]);

  const loadAlunos = async () => {
    await syncData(); // Atualiza tanto alunos quanto turmas
  };

  const loadTurmas = async () => {
    try {
      setTurmasLoading(true);
      console.log('Iniciando carregamento de turmas...');
      const data = await turmaService.getAll();
      console.log('Turmas recebidas do backend:', data);
      // Garantir que data seja um array
      const turmasArray = Array.isArray(data) ? data : [];
      console.log(`${turmasArray.length} turmas processadas`);
      setLocalTurmas(turmasArray);
      if (turmasArray.length === 0) {
        console.warn('Nenhuma turma cadastrada. Crie turmas antes de cadastrar alunos.');
        toast.warning('Nenhuma turma cadastrada. Crie turmas primeiro!', { autoClose: 5000 });
      }
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      toast.error('Erro ao carregar turmas. Verifique a conexão com o servidor.');
      setLocalTurmas([]); // Garantir array vazio em caso de erro
    } finally {
      setTurmasLoading(false);
    }
  };

  // Função para converter data serial do Excel para formato ISO
  const converterDataExcel = (valor) => {
    if (!valor) return null;
    
    // Limpar o valor
    const valorLimpo = typeof valor === 'string' ? valor.trim() : valor;
    
    // Se já é uma string no formato correto (AAAA-MM-DD)
    if (typeof valorLimpo === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valorLimpo)) {
      return valorLimpo;
    }
    
    // Tentar converter string em formato padrão brasileiro (DD/MM/AAAA ou DD/MM/AA)
    if (typeof valorLimpo === 'string') {
      // Formato DD/MM/AAAA
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(valorLimpo)) {
        const [dia, mes, ano] = valorLimpo.split('/');
        return `${ano}-${mes}-${dia}`;
      }
      
      // Formato DD/MM/AA (ano com 2 dígitos)
      if (/^\d{2}\/\d{2}\/\d{2}$/.test(valorLimpo)) {
        const [dia, mes, anoAbr] = valorLimpo.split('/');
        const anoCompleto = parseInt(anoAbr) > 50 ? `19${anoAbr}` : `20${anoAbr}`;
        return `${anoCompleto}-${mes}-${dia}`;
      }
      
      // Formato DD-MM-AAAA (com traço)
      if (/^\d{2}-\d{2}-\d{4}$/.test(valorLimpo)) {
        const [dia, mes, ano] = valorLimpo.split('-');
        return `${ano}-${mes}-${dia}`;
      }
    }
    
    // Se é número serial do Excel (dias desde 1900-01-01)
    if (typeof valorLimpo === 'number') {
      const dateOffset = (valorLimpo - 25569) * 86400 * 1000; // Ajuste para época Unix
      const date = new Date(dateOffset);
      const ano = date.getFullYear();
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const dia = String(date.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    }
    
    return null;
  };

  // Função para normalizar strings (remover acentos, trim, lowercase)
  const normalizarString = (str) => {
    if (!str) return '';
    return str
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Função para validar email
  const validarEmail = (email) => {
    if (!email) return true; // Email é opcional
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Função para validar e formatar dados de importação
  const validarEFormatarDadosImportacao = (dados) => {
    const matriculasExistentes = new Set(localAlunos.map(a => a.matricula.toUpperCase()));
    const matriculasNaPlanilha = new Set();
    const resultados = [];

    // Criar mapa normalizado de turmas para busca eficiente
    const turmaMap = new Map();
    localTurmas.forEach(turma => {
      const nomeNormalizado = normalizarString(turma.nome);
      turmaMap.set(nomeNormalizado, turma);
    });

    dados.forEach((row, index) => {
      const erros = [];
      const avisos = [];
      const linha = index + 2; // +2 porque começa em 1 e tem cabeçalho

      // Limpar e validar campos
      const nome = row.nome?.toString().trim() || '';
      const matricula = row.matricula?.toString().trim().toUpperCase() || '';
      const dataNascimentoOriginal = row.dataNascimento;
      const turmaTexto = row.turma?.toString().trim() || '';
      const responsavel_nome = row.responsavel_nome?.toString().trim() || '';
      const responsavel_telefone = row.responsavel_telefone?.toString().trim() || '';
      
      // Email: converter para lowercase e garantir que strings vazias sejam vazias (não null/undefined)
      let responsavel_email = '';
      if (row.responsavel_email && row.responsavel_email.toString().trim().length > 0) {
        responsavel_email = row.responsavel_email.toString().trim().toLowerCase();
      }

      // Validação: Nome obrigatório
      if (!nome) {
        erros.push('Nome é obrigatório');
      } else if (nome.length < 3) {
        erros.push('Nome deve ter pelo menos 3 caracteres');
      }

      // Validação: Matrícula obrigatória
      if (!matricula) {
        erros.push('Matrícula é obrigatória');
      } else {
        // Aviso se já existe (mas não impede importação - será atualizado)
        if (matriculasExistentes.has(matricula)) {
          avisos.push(`Matrícula ${matricula} já existe - será atualizado`);
        }
        if (matriculasNaPlanilha.has(matricula)) {
          erros.push(`Matrícula ${matricula} duplicada na planilha`);
        }
        matriculasNaPlanilha.add(matricula);
      }

      // Validação: Data de nascimento
      const dataNascimento = converterDataExcel(dataNascimentoOriginal);
      if (dataNascimento) {
        const dataNasc = new Date(dataNascimento);
        const hoje = new Date();
        const idade = hoje.getFullYear() - dataNasc.getFullYear();
        
        if (isNaN(dataNasc.getTime())) {
          erros.push(`Data de nascimento inválida: "${dataNascimentoOriginal}"`);
          console.error('Data inválida:', {original: dataNascimentoOriginal, convertida: dataNascimento});
        } else if (idade < 3 || idade > 99) {
          avisos.push(`Idade incomum: ${idade} anos`);
        }
      } else if (dataNascimentoOriginal) {
        erros.push(`Formato de data inválido: "${dataNascimentoOriginal}" (use DD/MM/AAAA ou AAAA-MM-DD)`);
        console.error('Formato de data não reconhecido:', dataNascimentoOriginal);
      }

      // Validação: Turma
      let turmaId = null;
      let turmaNome = null;
      if (turmaTexto) {
        const turmaNormalizada = normalizarString(turmaTexto);
        const turmaEncontrada = turmaMap.get(turmaNormalizada);
        
        if (turmaEncontrada) {
          turmaId = turmaEncontrada._id;
          turmaNome = turmaEncontrada.nome;
        } else {
          // Tentar busca parcial (mais tolerante)
          const turmasPossiveis = localTurmas.filter(t => 
            normalizarString(t.nome).includes(turmaNormalizada) ||
            turmaNormalizada.includes(normalizarString(t.nome))
          );
          
          if (turmasPossiveis.length === 1) {
            turmaId = turmasPossiveis[0]._id;
            turmaNome = turmasPossiveis[0].nome;
            avisos.push(`Turma interpretada como "${turmaNome}"`);
          } else if (turmasPossiveis.length > 1) {
            erros.push(`Turma "${turmaTexto}" ambígua. Opções: ${turmasPossiveis.map(t => t.nome).join(', ')}`);
          } else {
            erros.push(`Turma "${turmaTexto}" não encontrada`);
          }
        }
      } else {
        avisos.push('Sem turma atribuída');
      }

      // Validação: Email do responsável
      if (responsavel_email && !validarEmail(responsavel_email)) {
        erros.push('Email do responsável inválido');
      }

      // Validação: Telefone do responsável (básica)
      if (responsavel_telefone && responsavel_telefone.length < 8) {
        avisos.push('Telefone parece incompleto');
      }

      // Criar objeto validado
      resultados.push({
        linha,
        valido: erros.length === 0,
        erros,
        avisos,
        dados: {
          nome,
          matricula,
          dataNascimento,
          turma: turmaId,
          turmaNome,
          responsavel: {
            nome: responsavel_nome,
            telefone: responsavel_telefone,
            email: responsavel_email,
          },
        },
        original: row,
      });
    });

    return resultados;
  };

  const handleOpen = (aluno = null) => {
    console.log('=== MODAL ABRINDO ===');
    console.log('localTurmas:', localTurmas);
    console.log('Quantidade de turmas:', localTurmas.length);
    console.log('turmasLoading:', turmasLoading);
    
    // Garantir que as turmas estejam carregadas ao abrir o modal
    if (localTurmas.length === 0) {
      console.log('Carregando turmas ao abrir modal...');
      loadTurmas();
    } else {
      console.log(`${localTurmas.length} turmas disponíveis`);
      localTurmas.forEach((turma, index) => {
        console.log(`Turma ${index + 1}:`, turma.nome, '-', turma._id);
      });
    }
    
    if (aluno) {
      const novoFormData = {
        nome: aluno.nome,
        matricula: aluno.matricula,
        dataNascimento: aluno.dataNascimento ? aluno.dataNascimento.split('T')[0] : '',
        turma: aluno.turma?._id || '',
        responsavel: {
          nome: aluno.responsavel?.nome || '',
          telefone: aluno.responsavel?.telefone || '',
          email: aluno.responsavel?.email || '',
        },
      };
      console.log('Editando aluno - formData inicial:', novoFormData);
      setFormData(novoFormData);
      setEditId(aluno._id);
    } else {
      const novoFormData = {
        nome: '',
        matricula: '',
        dataNascimento: '',
        turma: '',
        responsavel: {
          nome: '',
          telefone: '',
          email: '',
        },
      };
      console.log('Novo aluno - formData inicial:', novoFormData);
      setFormData(novoFormData);
      setEditId(null);
    }
    setTabValue(0);
    setImportData([]);
    setOpen(true);
    console.log('=== MODAL ABERTO ===');
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      nome: '',
      matricula: '',
      dataNascimento: '',
      turma: '',
      responsavel: {
        nome: '',
        telefone: '',
        email: '',
      },
    });
    setEditId(null);
    setImportData([]);
    setImportValidation([]);
    setTabValue(0);
  };

  const handleSubmit = async () => {
    try {
      console.log('Dados do formulário a serem enviados:', formData);
      if (editId) {
        await alunoService.update(editId, formData);
        toast.success('Aluno atualizado com sucesso!');
      } else {
        await alunoService.create(formData);
        toast.success('Aluno cadastrado com sucesso!');
      }
      handleClose();
      await syncData(); // Sincroniza tanto alunos quanto turmas
    } catch (error) {
      console.error('Erro ao salvar aluno:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar aluno');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este aluno?')) {
      try {
        await alunoService.delete(id);
        toast.success('Aluno excluído com sucesso!');
        await syncData(); // Sincroniza tanto alunos quanto turmas
      } catch (error) {
        toast.error('Erro ao excluir aluno');
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Verificar se há turmas cadastradas antes de processar
    if (localTurmas.length === 0) {
      toast.warning('Atenção: Nenhuma turma cadastrada. Os alunos serão importados sem turma.');
    }

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (isExcel) {
      // Processar arquivo Excel
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // Configuração para processar datas corretamente
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            raw: false, // Não retornar valores brutos
            dateNF: 'yyyy-mm-dd', // Formato de data
            defval: '', // Valor padrão para células vazias
          });
          
          if (jsonData.length === 0) {
            toast.error('Arquivo Excel está vazio ou sem dados válidos');
            return;
          }

          // Validar e formatar dados
          const validacao = validarEFormatarDadosImportacao(jsonData);
          setImportValidation(validacao);
          
          const validos = validacao.filter(v => v.valido);
          const invalidos = validacao.filter(v => !v.valido);
          
          if (validos.length > 0) {
            setImportData(validos.map(v => v.dados));
            toast.success(`✅ ${validos.length} aluno(s) validado(s) com sucesso!`, { autoClose: 3000 });
            
            if (invalidos.length > 0) {
              toast.warning(`⚠️ ${invalidos.length} aluno(s) com erros que precisam ser corrigidos`, { autoClose: 5000 });
            }
            
            // Contar avisos
            const totalAvisos = validacao.reduce((sum, v) => sum + v.avisos.length, 0);
            if (totalAvisos > 0) {
              toast.info(`ℹ️ ${totalAvisos} aviso(s) encontrado(s)`, { autoClose: 3000 });
            }
          } else {
            setImportData([]);
            toast.error(`❌ Nenhum aluno válido encontrado. ${invalidos.length} erro(s) detectado(s).`);
          }
        } catch (error) {
          console.error('Erro ao ler Excel:', error);
          toast.error('Erro ao ler arquivo Excel: ' + error.message);
          setImportData([]);
          setImportValidation([]);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Processar arquivo CSV com encoding UTF-8
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          if (results.data.length === 0) {
            toast.error('Arquivo CSV está vazio');
            return;
          }

          // Validar e formatar dados
          const validacao = validarEFormatarDadosImportacao(results.data);
          setImportValidation(validacao);
          
          const validos = validacao.filter(v => v.valido);
          const invalidos = validacao.filter(v => !v.valido);
          
          if (validos.length > 0) {
            setImportData(validos.map(v => v.dados));
            toast.success(`✅ ${validos.length} aluno(s) validado(s) com sucesso!`, { autoClose: 3000 });
            
            if (invalidos.length > 0) {
              toast.warning(`⚠️ ${invalidos.length} aluno(s) com erros que precisam ser corrigidos`, { autoClose: 5000 });
            }
            
            const totalAvisos = validacao.reduce((sum, v) => sum + v.avisos.length, 0);
            if (totalAvisos > 0) {
              toast.info(`ℹ️ ${totalAvisos} aviso(s) encontrado(s)`, { autoClose: 3000 });
            }
          } else {
            setImportData([]);
            toast.error(`❌ Nenhum aluno válido encontrado. ${invalidos.length} erro(s) detectado(s).`);
          }
        },
        error: (error) => {
          console.error('Erro ao ler CSV:', error);
          toast.error('Erro ao ler arquivo CSV: ' + error.message);
          setImportData([]);
          setImportValidation([]);
        }
      });
    }
    
    // Limpar input para permitir re-upload do mesmo arquivo
    event.target.value = '';
  };

  const handleImport = async () => {
    if (importData.length === 0) {
      toast.error('Nenhum aluno para importar');
      return;
    }

    try {
      // Adicionar loading toast
      const loadingToast = toast.info(`Importando ${importData.length} aluno(s)...`, {
        autoClose: false,
      });

      // Usar o novo endpoint de importação em lote
      const resultado = await alunoService.importar(importData);

      // Fechar loading toast
      toast.dismiss(loadingToast);

      // Extrair estatísticas
      const { resultados, estatisticas } = resultado;
      
      console.log('✅ Resultado da importação:', resultado);

      // Mensagem de sucesso
      if (estatisticas.criados > 0 || estatisticas.atualizados > 0) {
        let mensagem = '';
        if (estatisticas.criados > 0) {
          mensagem += `✅ ${estatisticas.criados} aluno(s) criado(s)`;
        }
        if (estatisticas.atualizados > 0) {
          if (mensagem) mensagem += ' • ';
          mensagem += `🔄 ${estatisticas.atualizados} aluno(s) atualizado(s)`;
        }
        toast.success(mensagem, { autoClose: 5000 });
      }

      // Mensagem de erro (se houver)
      if (estatisticas.erros > 0) {
        // Mostrar até 5 erros detalhados
        const errosExibir = resultados.erros.slice(0, 5);
        const mensagemErro = errosExibir
          .map(e => `• ${e.nome} (${e.matricula}): ${e.erro}`)
          .join('\n');
        
        const mensagemCompleta = estatisticas.erros > 5 
          ? `${mensagemErro}\n... e mais ${estatisticas.erros - 5} erro(s)`
          : mensagemErro;

        toast.error(
          <div>
            <strong>❌ {estatisticas.erros} aluno(s) com erro:</strong>
            <pre style={{ fontSize: '0.85em', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
              {mensagemCompleta}
            </pre>
          </div>,
          { autoClose: 10000 }
        );

        // Log completo no console para debug
        console.error('Erros detalhados da importação:', resultados.erros);
      }
      
      // Se houve algum sucesso, fechar modal e atualizar dados
      if (estatisticas.criados > 0 || estatisticas.atualizados > 0) {
        handleClose();
        await syncData();
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      
      let errorMsg = 'Erro ao importar alunos';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg, { autoClose: 8000 });
    }
  };

  const downloadTemplate = async (format = 'csv') => {
    try {
      // Se há turma selecionada, baixar template personalizado
      if (turmaSelecionadaTemplate) {
        const response = await alunoService.getTemplatePorTurma(turmaSelecionadaTemplate);
        const { turma, template, instrucoes } = response;

        if (format === 'excel') {
          const ws = XLSX.utils.json_to_sheet(template);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Alunos');
          
          // Adicionar instruções em outra aba
          const wsInstrucoes = XLSX.utils.aoa_to_sheet([
            ['INSTRUÇÕES PARA PREENCHIMENTO DE ALUNOS'],
            [''],
            ['INFORMAÇÕES DA TURMA:'],
            [`Turma: ${turma.nome}`],
            [`Ano: ${turma.ano}`],
            [`Série: ${turma.serie}`],
            [`Turno: ${turma.turno}`],
            [`Capacidade Máxima: ${turma.capacidadeMaxima} alunos`],
            [''],
            ['INSTRUÇÕES:'],
            [instrucoes.turma],
            [instrucoes.matricula],
            [instrucoes.dataNascimento],
            [instrucoes.responsavel],
            [instrucoes.dica],
            [''],
            ['IMPORTANTE:'],
            ['- Campo "turma" já está preenchido, não altere'],
            ['- Data de nascimento no formato AAAA-MM-DD'],
            ['- Preencha todos os dados do responsável'],
            ['- As 2 primeiras linhas são exemplos, podem ser apagadas'],
          ]);
          XLSX.utils.book_append_sheet(wb, wsInstrucoes, 'Instruções');
          
          const fileName = `alunos_${turma.nome.replace(/\s+/g, '_')}.xlsx`;
          XLSX.writeFile(wb, fileName);
        } else {
          const csv = Papa.unparse(template);
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          const fileName = `alunos_${turma.nome.replace(/\s+/g, '_')}.csv`;
          link.download = fileName;
          link.click();
        }

        toast.success(`Template para turma ${turma.nome} baixado com sucesso!`);
        return;
      }

      // Template genérico (comportamento anterior)
      if (format === 'excel') {
        // Criar template Excel
        const ws = XLSX.utils.json_to_sheet([
          {
            nome: 'João Silva',
            matricula: '2026001',
            dataNascimento: '2010-05-15',
            turma: '1º Ano A',
            responsavel_nome: 'Maria Silva',
            responsavel_telefone: '(11) 98765-4321',
            responsavel_email: 'maria@email.com'
          },
          {
            nome: 'Ana Santos',
            matricula: '2026002',
            dataNascimento: '2011-08-20',
            turma: '2º Ano B',
            responsavel_nome: 'Carlos Santos',
            responsavel_telefone: '(11) 91234-5678',
            responsavel_email: 'carlos@email.com'
          },
          {
            nome: 'Pedro Costa',
            matricula: '2026003',
            dataNascimento: '2009-03-10',
            turma: '3º Ano C',
            responsavel_nome: 'Lucia Costa',
            responsavel_telefone: '(11) 99876-5432',
            responsavel_email: 'lucia@email.com'
          }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Alunos');
        XLSX.writeFile(wb, 'template_alunos.xlsx');
      } else {
        // Criar template CSV
        const csv = 'nome,matricula,dataNascimento,turma,responsavel_nome,responsavel_telefone,responsavel_email\n' +
                    'João Silva,2026001,2010-05-15,1º Ano A,Maria Silva,(11) 98765-4321,maria@email.com\n' +
                    'Ana Santos,2026002,2011-08-20,2º Ano B,Carlos Santos,(11) 91234-5678,carlos@email.com\n' +
                    'Pedro Costa,2026003,2009-03-10,3º Ano C,Lucia Costa,(11) 99876-5432,lucia@email.com';
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'template_alunos.csv';
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

  const formatDate = (dateString) => {
    return formatarDataLocal(dateString);
  };

  const getInitials = (nome) => {
    if (!nome) return '?';
    const names = nome.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <Container maxWidth="xl">
      <PageHeader 
        title="Alunos"
        subtitle="Gerencie os estudantes matriculados na instituição"
        icon={AlunosIcon}
      />
      
      <Zoom in={true} timeout={400}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mb: 3,
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          <TextField
            placeholder="Buscar aluno..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              flex: 1,
              minWidth: 250,
              maxWidth: 400,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1.5,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
              }
            }}
          >
            Novo Aluno
          </Button>
        </Box>
      </Zoom>

      {/* Contador de alunos */}
      <Fade in={true} timeout={400}>
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 3, 
            color: 'text.secondary',
            fontWeight: 500 
          }}
        >
          {filteredAlunos.length} {filteredAlunos.length === 1 ? 'aluno encontrado' : 'alunos encontrados'}
        </Typography>
      </Fade>

      {/* Grid de Cards */}
      <Grid container spacing={3}>
        {alunosLoading ? (
          // Skeleton loading
          [...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 3 }} />
            </Grid>
          ))
        ) : !Array.isArray(filteredAlunos) || filteredAlunos.length === 0 ? (
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 3,
                bgcolor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.05)' 
                  : 'rgba(0,0,0,0.02)',
              }}
            >
              <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Nenhum aluno encontrado
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {searchTerm ? 
                  'Tente buscar com outros termos' : 
                  'Clique em "Novo Aluno" para começar'}
              </Typography>
            </Paper>
          </Grid>
        ) : (
          filteredAlunos.map((aluno, index) => (
            <Grid item xs={12} sm={6} md={4} key={aluno._id}>
              <Fade in={true} timeout={400 + index * 50}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(0, 188, 212, 0.05)' 
                      : '#ffffff',
                    border: (theme) => theme.palette.mode === 'dark'
                      ? '1px solid rgba(0, 188, 212, 0.2)'
                      : '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 4px 12px rgba(0, 0, 0, 0.4)'
                      : '0 4px 12px rgba(0, 0, 0, 0.08)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '0 12px 24px rgba(0, 188, 212, 0.3)'
                        : '0 12px 24px rgba(102, 126, 234, 0.2)',
                      border: (theme) => theme.palette.mode === 'dark'
                        ? '1px solid rgba(0, 188, 212, 0.4)'
                        : '1px solid rgba(102, 126, 234, 0.3)',
                    }
                  }}
                >
                  <CardContent>
                    {/* Header com Avatar e Nome */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          mr: 2,
                          bgcolor: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(0, 188, 212, 0.3)'
                            : 'primary.main',
                          fontSize: 20,
                          fontWeight: 'bold',
                        }}
                      >
                        {getInitials(aluno.nome)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            mb: 0.5,
                            color: (theme) => theme.palette.mode === 'dark'
                              ? '#00bcd4'
                              : 'primary.main',
                          }}
                        >
                          {aluno.nome}
                        </Typography>
                        <Chip 
                          icon={<BadgeIcon sx={{ fontSize: 14 }} />}
                          label={aluno.matricula}
                          size="small"
                          sx={{ 
                            height: 24,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    {/* Informações */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {/* Turma */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon 
                          sx={{ 
                            fontSize: 20, 
                            color: (theme) => theme.palette.mode === 'dark'
                              ? 'rgba(0, 188, 212, 0.7)'
                              : 'text.secondary'
                          }} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          <strong>Turma:</strong> {aluno.turma?.nome || 'Não definida'}
                          {aluno.turma && (
                            <Chip 
                              label={aluno.turma.turno}
                              size="small"
                              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Typography>
                      </Box>

                      {/* Data de Nascimento */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon 
                          sx={{ 
                            fontSize: 20, 
                            color: (theme) => theme.palette.mode === 'dark'
                              ? 'rgba(0, 188, 212, 0.7)'
                              : 'text.secondary'
                          }} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          <strong>Nascimento:</strong> {formatDate(aluno.dataNascimento)}
                        </Typography>
                      </Box>

                      {/* Responsável */}
                      {aluno.responsavel?.nome && (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon 
                              sx={{ 
                                fontSize: 20, 
                                color: (theme) => theme.palette.mode === 'dark'
                                  ? 'rgba(0, 188, 212, 0.7)'
                                  : 'text.secondary'
                              }} 
                            />
                            <Typography variant="body2" color="text.secondary" noWrap>
                              <strong>Resp.:</strong> {aluno.responsavel.nome}
                            </Typography>
                          </Box>

                          {aluno.responsavel?.telefone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PhoneIcon 
                                sx={{ 
                                  fontSize: 20, 
                                  color: (theme) => theme.palette.mode === 'dark'
                                    ? 'rgba(0, 188, 212, 0.7)'
                                    : 'text.secondary'
                                }} 
                              />
                              <Typography variant="body2" color="text.secondary">
                                {aluno.responsavel.telefone}
                              </Typography>
                            </Box>
                          )}
                        </>
                      )}
                    </Box>
                  </CardContent>

                  <CardActions 
                    sx={{ 
                      justifyContent: 'flex-end', 
                      px: 2, 
                      pb: 2,
                      pt: 0,
                    }}
                  >
                    <IconButton
                      color="primary"
                      onClick={() => handleOpen(aluno)}
                      size="small"
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          bgcolor: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(0, 188, 212, 0.1)'
                            : 'rgba(102, 126, 234, 0.1)',
                        }
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(aluno._id)}
                      size="small"
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          bgcolor: 'rgba(244, 67, 54, 0.1)',
                        }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              </Fade>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editId ? 'Editar Aluno' : 'Novo Aluno'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab label="Cadastro Manual" />
            <Tab label="Importar Arquivo" disabled={!!editId} />
          </Tabs>

          {tabValue === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Typography variant="h6" sx={{ mt: 1 }}>
                Dados do Aluno
              </Typography>
              
              <TextField
                autoFocus
                label="Nome Completo"
                fullWidth
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: João Silva Santos"
              />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Matrícula"
                    fullWidth
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                    placeholder="Ex: 2026001"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Data de Nascimento"
                    type="date"
                    fullWidth
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& input[type="date"]': {
                        fontSize: '1.1rem',
                        padding: '14px',
                        cursor: 'pointer'
                      },
                      '& input[type="date"]::-webkit-calendar-picker-indicator': {
                        fontSize: '1.4rem',
                        cursor: 'pointer'
                      }
                    }}
                  />
                </Grid>
              </Grid>

              <TextField
                select
                label="Turma"
                value={formData.turma || ''}
                onChange={(e) => {
                  console.log('Turma selecionada:', e.target.value);
                  console.log('formData antes:', formData);
                  const novoFormData = { ...formData, turma: e.target.value };
                  console.log('formData depois:', novoFormData);
                  setFormData(novoFormData);
                }}
                fullWidth
                SelectProps={{
                  native: false,
                }}
                helperText={
                  turmasLoading ? "Carregando turmas..." :
                  localTurmas.length === 0 ? "⚠️ Crie turmas na aba 'Turmas' primeiro" : 
                  `${localTurmas.length} turma(s) disponível(is) - Selecione uma (opcional)`
                }
                error={localTurmas.length === 0 && !turmasLoading}
              >
                {turmasLoading ? (
                  <MenuItem disabled>
                    <em>Carregando turmas...</em>
                  </MenuItem>
                ) : localTurmas.length === 0 ? (
                  <MenuItem value="">
                    <em>Nenhuma turma cadastrada - Crie turmas primeiro</em>
                  </MenuItem>
                ) : [
                  <MenuItem key="" value="">Sem turma</MenuItem>,
                  ...localTurmas.map((turma) => (
                    <MenuItem key={turma._id} value={turma._id}>
                      {turma.nome} - {turma.serie} ({turma.turno})
                    </MenuItem>
                  ))
                ]}
              </TextField>

              <Typography variant="h6" sx={{ mt: 2 }}>
                Dados do Responsável
              </Typography>

              <TextField
                label="Nome do Responsável"
                fullWidth
                value={formData.responsavel.nome}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  responsavel: { ...formData.responsavel, nome: e.target.value }
                })}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Telefone"
                    fullWidth
                    value={formData.responsavel.telefone}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      responsavel: { ...formData.responsavel, telefone: e.target.value }
                    })}
                    placeholder="(11) 98765-4321"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    value={formData.responsavel.email}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      responsavel: { ...formData.responsavel, email: e.target.value }
                    })}
                    placeholder="responsavel@email.com"
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {tabValue === 1 && (
            <Box sx={{ mt: 2 }}>
              {localTurmas.length === 0 && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <strong>⚠️ Nenhuma turma cadastrada!</strong>
                  <br />
                  <br />
                  Para importar alunos, você precisa primeiro:
                  <ol style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                    <li>Ir para a aba <strong>"Turmas"</strong></li>
                    <li>Criar as turmas necessárias (ex: 1º Ano A, 2º Ano B, etc.)</li>
                    <li>Voltar aqui e baixar o template com a turma selecionada</li>
                  </ol>
                </Alert>
              )}
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Formatos aceitos: CSV e Excel (.xlsx)</strong>
                <br />
                Colunas: nome, matricula, dataNascimento, turma, responsavel_nome, responsavel_telefone, responsavel_email
                <br />
                Data no formato: AAAA-MM-DD (ex: 2010-05-15)
                <br />
                Turma: nome exato da turma cadastrada
              </Alert>

              {/* Seletor para template personalizado */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  Template Personalizado por Turma
                </Typography>
                <Typography variant="caption" display="block" sx={{ mb: 2, color: 'text.secondary' }}>
                  Baixe um template com o nome da turma já preenchido
                </Typography>
                
                {localTurmas.length === 0 ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <strong>Atenção!</strong> Nenhuma turma cadastrada.
                    <br />
                    Vá para a aba <strong>"Turmas"</strong> e crie turmas antes de importar alunos.
                  </Alert>
                ) : null}
                
                <TextField
                  select
                  fullWidth
                  label="Selecione a Turma"
                  value={turmaSelecionadaTemplate}
                  onChange={(e) => setTurmaSelecionadaTemplate(e.target.value)}
                  size="small"
                  disabled={turmasLoading || localTurmas.length === 0}
                  helperText={turmasLoading ? "Carregando turmas..." : localTurmas.length === 0 ? "Cadastre turmas primeiro" : ""}
                >
                  {turmasLoading ? (
                    <MenuItem disabled>
                      <em>Carregando...</em>
                    </MenuItem>
                  ) : [
                    <MenuItem key="generico" value="">
                      <em>Template genérico (todas as turmas)</em>
                    </MenuItem>,
                    ...localTurmas.map((turma) => (
                      <MenuItem key={turma._id} value={turma._id}>
                        {turma.nome} - {turma.serie} ({turma.turno})
                      </MenuItem>
                    ))
                  ]}
                </TextField>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => downloadTemplate('csv')}
                >
                  Baixar Modelo CSV
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => downloadTemplate('excel')}
                  color="success"
                >
                  Baixar Modelo Excel
                </Button>

                <Button
                  variant="contained"
                  component="label"
                  startIcon={<Upload />}
                >
                  Selecionar Arquivo
                  <input
                    type="file"
                    hidden
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                  />
                </Button>
              </Box>

              {/* Preview dos dados com validação */}
              {importValidation.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
                    Preview da Importação ({importValidation.length} registro(s)):
                  </Typography>
                  
                  {/* Resumo da validação */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`${importValidation.filter(v => v.valido).length} Válidos`}
                      color="success"
                      size="small"
                      icon={<SchoolIcon />}
                    />
                    <Chip 
                      label={`${importValidation.filter(v => !v.valido).length} Com Erro`}
                      color="error"
                      size="small"
                      icon={<BadgeIcon />}
                    />
                    {importValidation.some(v => v.avisos.length > 0) && (
                      <Chip 
                        label={`${importValidation.filter(v => v.avisos.length > 0).length} Com Aviso`}
                        color="warning"
                        size="small"
                      />
                    )}
                  </Box>

                  <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                    <List dense>
                      {importValidation.map((item, index) => (
                        <ListItem 
                          key={index}
                          sx={{ 
                            bgcolor: !item.valido 
                              ? 'rgba(211, 47, 47, 0.08)' 
                              : item.avisos.length > 0 
                                ? 'rgba(237, 108, 2, 0.08)'
                                : 'rgba(46, 125, 50, 0.08)',
                            borderLeft: 4,
                            borderColor: !item.valido 
                              ? 'error.main' 
                              : item.avisos.length > 0 
                                ? 'warning.main'
                                : 'success.main',
                            mb: 0.5,
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {item.dados.nome || '(sem nome)'}
                                </Typography>
                                <Chip 
                                  label={item.dados.matricula || '(sem matrícula)'} 
                                  size="small" 
                                  variant="outlined"
                                />
                                {!item.valido && (
                                  <Chip label="ERRO" size="small" color="error" />
                                )}
                                {item.valido && item.avisos.length > 0 && (
                                  <Chip label="AVISO" size="small" color="warning" />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="caption" display="block" color="text.secondary">
                                  Turma: {item.dados.turmaNome || '(sem turma)'} | 
                                  Responsável: {item.dados.responsavel.nome || '(não informado)'}
                                  {item.dados.dataNascimento && ` | Nascimento: ${formatarDataLocal(item.dados.dataNascimento)}`}
                                </Typography>
                                
                                {/* Mostrar erros */}
                                {item.erros.length > 0 && (
                                  <Box sx={{ mt: 0.5 }}>
                                    {item.erros.map((erro, i) => (
                                      <Typography 
                                        key={i} 
                                        variant="caption" 
                                        display="block" 
                                        color="error.main"
                                        sx={{ fontWeight: 'bold' }}
                                      >
                                        ❌ {erro}
                                      </Typography>
                                    ))}
                                  </Box>
                                )}
                                
                                {/* Mostrar avisos */}
                                {item.avisos.length > 0 && (
                                  <Box sx={{ mt: 0.5 }}>
                                    {item.avisos.map((aviso, i) => (
                                      <Typography 
                                        key={i} 
                                        variant="caption" 
                                        display="block" 
                                        color="warning.main"
                                      >
                                        ⚠️ {aviso}
                                      </Typography>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          {tabValue === 0 ? (
            <Button onClick={handleSubmit} variant="contained">
              Salvar
            </Button>
          ) : (
            <Button 
              onClick={handleImport} 
              variant="contained"
              disabled={importData.length === 0}
              color={importValidation.some(v => !v.valido) ? 'warning' : 'primary'}
            >
              Importar {importData.length} Aluno(s) Válido(s)
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Alunos;
