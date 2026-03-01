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
  Email as EmailIcon,
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
  const [turmaSelecionadaTemplate, setTurmaSelecionadaTemplate] = useState('');

  // Sincronizar com o contexto
  useEffect(() => {
    setLocalAlunos(alunos);
    setFilteredAlunos(alunos);
  }, [alunos]);

  useEffect(() => {
    setLocalTurmas(turmas);
  }, [turmas]);

  // Carregar turmas independentemente (fallback se contexto falhar)
  useEffect(() => {
    if (turmas.length === 0 && !turmasLoading) {
      loadTurmas();
    }
  }, []);

  // Filtrar alunos baseado na pesquisa
  useEffect(() => {
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
      const data = await turmaService.getAll();
      setLocalTurmas(data);
      if (data.length === 0) {
        console.warn('Nenhuma turma cadastrada. Crie turmas antes de importar alunos.');
      }
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      toast.error('Erro ao carregar turmas. Verifique a conexão com o servidor.');
    } finally {
      setTurmasLoading(false);
    }
  };

  const handleOpen = (aluno = null) => {
    if (aluno) {
      setFormData({
        nome: aluno.nome,
        matricula: aluno.matricula,
        dataNascimento: aluno.dataNascimento ? aluno.dataNascimento.split('T')[0] : '',
        turma: aluno.turma?._id || '',
        responsavel: {
          nome: aluno.responsavel?.nome || '',
          telefone: aluno.responsavel?.telefone || '',
          email: aluno.responsavel?.email || '',
        },
      });
      setEditId(aluno._id);
    } else {
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
    }
    setTabValue(0);
    setImportData([]);
    setOpen(true);
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
    setTabValue(0);
  };

  const handleSubmit = async () => {
    try {
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
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          const validData = jsonData.filter(row => 
            row.nome && row.matricula
          );
          setImportData(validData);
          if (validData.length > 0) {
            toast.success(`${validData.length} alunos encontrados no arquivo Excel`);
          } else {
            toast.error('Nenhum aluno válido encontrado no arquivo');
          }
        } catch (error) {
          toast.error('Erro ao ler arquivo Excel: ' + error.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Processar arquivo CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const validData = results.data.filter(row => 
            row.nome && row.matricula
          );
          setImportData(validData);
          if (validData.length > 0) {
            toast.success(`${validData.length} alunos encontrados no arquivo CSV`);
          } else {
            toast.error('Nenhum aluno válido encontrado no arquivo');
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
      toast.error('Nenhum aluno para importar');
      return;
    }

    // Verificar se há turmas cadastradas
    if (localTurmas.length === 0) {
      toast.error('Por favor, cadastre turmas antes de importar alunos!');
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      let semTurmaCount = 0;

      for (const row of importData) {
        try {
          // Buscar turma pelo nome se fornecido
          let turmaId = null;
          if (row.turma && localTurmas.length > 0) {
            const turmaEncontrada = localTurmas.find(t => 
              t.nome.toLowerCase() === row.turma.toLowerCase()
            );
            if (turmaEncontrada) {
              turmaId = turmaEncontrada._id;
            } else {
              console.warn(`Turma "${row.turma}" não encontrada para aluno ${row.nome}`);
              semTurmaCount++;
            }
          }

          await alunoService.create({
            nome: row.nome,
            matricula: row.matricula,
            dataNascimento: row.dataNascimento || null,
            turma: turmaId,
            responsavel: {
              nome: row.responsavel_nome || '',
              telefone: row.responsavel_telefone || '',
              email: row.responsavel_email || '',
            },
          });
          successCount++;
        } catch (error) {
          errorCount++;
          console.error('Erro ao importar aluno:', row.nome, error);
        }
      }

      toast.success(`${successCount} alunos importados com sucesso!`);
      if (errorCount > 0) {
        toast.warning(`${errorCount} alunos com erro`);
      }
      if (semTurmaCount > 0) {
        toast.info(`${semTurmaCount} alunos importados sem turma (turma não encontrada)`);
      }
      
      handleClose();
      await syncData();
    } catch (error) {
      toast.error('Erro ao importar alunos');
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
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
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
        ) : filteredAlunos.length === 0 ? (
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
                  />
                </Grid>
              </Grid>

              <TextField
                select
                label="Turma"
                value={formData.turma}
                onChange={(e) => setFormData({ ...formData, turma: e.target.value })}
                fullWidth
                helperText={localTurmas.length === 0 ? "Crie turmas na aba 'Turmas' primeiro" : ""}
              >
                {turmasLoading ? (
                  <MenuItem disabled>
                    <em>Carregando turmas...</em>
                  </MenuItem>
                ) : localTurmas.length === 0 ? (
                  <MenuItem value="">
                    <em>Nenhuma turma cadastrada - Crie turmas primeiro</em>
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem value="">Sem turma</MenuItem>
                    {localTurmas.map((turma) => (
                      <MenuItem key={turma._id} value={turma._id}>
                        {turma.nome} - {turma.serie} ({turma.turno})
                      </MenuItem>
                    ))}
                  </>
                )}
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

              {importData.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {importData.length} alunos prontos para importar:
                  </Typography>
                  <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <List dense>
                      {importData.map((row, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={`${row.nome} - ${row.matricula}`}
                            secondary={`Turma: ${row.turma || 'Não definida'} | Responsável: ${row.responsavel_nome || '-'}`}
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
            >
              Importar {importData.length} Alunos
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Alunos;
