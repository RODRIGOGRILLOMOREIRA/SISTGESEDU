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
  Fade,
  Zoom,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Grid,
  Skeleton,
  InputAdornment,
  Divider,
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Delete, 
  Upload, 
  Download,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  School as SchoolIcon,
  Event as EventIcon,
  WbSunny as WbSunnyIcon,
  NightsStay as NightsStayIcon,
  WbTwilight as WbTwilightIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { turmaService, professorService, disciplinaService } from '../services';
import { toast } from 'react-toastify';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import PageHeader from '../components/PageHeader';
import { People as TurmasIcon } from '@mui/icons-material';
import { useSchool } from '../context/SchoolContext';

const Turmas = () => {
  const { alunos, turmas, syncData, turmasLoading } = useSchool();
  const [localTurmas, setLocalTurmas] = useState([]);
  const [filteredTurmas, setFilteredTurmas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [professores, setProfessores] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    nome: '',
    ano: new Date().getFullYear(),
    serie: '',
    turno: 'matutino',
    capacidadeMaxima: 35,
  });
  const [editId, setEditId] = useState(null);
  const [importData, setImportData] = useState([]);

  // Sincronizar com o contexto
  useEffect(() => {
    setLocalTurmas(turmas);
    setFilteredTurmas(turmas);
  }, [turmas]);

  // Filtrar turmas baseado na pesquisa
  useEffect(() => {
    if (searchTerm) {
      const filtered = localTurmas.filter(turma => 
        turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turma.serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turma.turno.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTurmas(filtered);
    } else {
      setFilteredTurmas(localTurmas);
    }
  }, [searchTerm, localTurmas]);

  useEffect(() => {
    loadProfessores();
    loadDisciplinas();
  }, []);

  const loadTurmas = async () => {
    await syncData(); // Atualiza tanto turmas quanto alunos
  };

  const loadProfessores = async () => {
    try {
      const data = await professorService.getAll();
      setProfessores(data);
    } catch (error) {
      console.error('Erro ao carregar professores');
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

  const handleOpen = (turma = null) => {
    if (turma) {
      setFormData({
        nome: turma.nome,
        ano: turma.ano,
        serie: turma.serie,
        turno: turma.turno,
        capacidadeMaxima: turma.capacidadeMaxima || 35,
      });
      setEditId(turma._id);
    } else {
      setFormData({
        nome: '',
        ano: new Date().getFullYear(),
        serie: '',
        turno: 'matutino',
        capacidadeMaxima: 35,
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
      ano: new Date().getFullYear(),
      serie: '',
      turno: 'matutino',
      capacidadeMaxima: 35,
    });
    setEditId(null);
    setImportData([]);
    setTabValue(0);
  };

  const handleSubmit = async () => {
    try {
      // Validações básicas
      if (!formData.nome || !formData.serie) {
        toast.error('Por favor, preencha o nome e a série da turma');
        return;
      }

      if (editId) {
        await turmaService.update(editId, formData);
        toast.success('Turma atualizada com sucesso!');
      } else {
        await turmaService.create(formData);
        toast.success('Turma criada com sucesso! Agora você pode adicionar alunos.');
      }
      handleClose();
      await syncData();
    } catch (error) {
      console.error('Erro ao salvar turma:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar turma');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta turma?')) {
      try {
        await turmaService.delete(id);
        toast.success('Turma excluída com sucesso!');
        await syncData();
      } catch (error) {
        toast.error('Erro ao excluir turma');
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
            row.nome && row.serie && row.turno
          );
          setImportData(validData);
          if (validData.length > 0) {
            toast.success(`${validData.length} turmas encontradas no arquivo Excel`);
          } else {
            toast.error('Nenhuma turma válida encontrada no arquivo');
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
            row.nome && row.serie && row.turno
          );
          setImportData(validData);
          if (validData.length > 0) {
            toast.success(`${validData.length} turmas encontradas no arquivo CSV`);
          } else {
            toast.error('Nenhuma turma válida encontrada no arquivo');
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
      toast.error('Nenhuma turma para importar');
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const row of importData) {
        try {
          await turmaService.create({
            nome: row.nome,
            ano: row.ano || new Date().getFullYear(),
            serie: row.serie,
            turno: row.turno.toLowerCase(),
            capacidadeMaxima: row.capacidadeMaxima || 35,
          });
          successCount++;
        } catch (error) {
          errorCount++;
          console.error('Erro ao importar turma:', row.nome, error);
        }
      }

      toast.success(`${successCount} turmas importadas com sucesso!`);
      if (errorCount > 0) {
        toast.warning(`${errorCount} turmas com erro`);
      }
      
      handleClose();
      await syncData();
    } catch (error) {
      toast.error('Erro ao importar turmas');
    }
  };

  const downloadTemplate = (format = 'csv') => {
    if (format === 'excel') {
      // Criar template Excel
      const ws = XLSX.utils.json_to_sheet([
        { nome: '1º Ano A', ano: 2026, serie: '1º Ano', turno: 'matutino', capacidadeMaxima: 35 },
        { nome: '2º Ano B', ano: 2026, serie: '2º Ano', turno: 'vespertino', capacidadeMaxima: 30 },
        { nome: '3º Ano C', ano: 2026, serie: '3º Ano', turno: 'matutino', capacidadeMaxima: 32 }
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Turmas');
      XLSX.writeFile(wb, 'template_turmas.xlsx');
    } else {
      // Criar template CSV
      const csv = 'nome,ano,serie,turno,capacidadeMaxima\n' +
                  '1º Ano A,2026,1º Ano,matutino,35\n' +
                  '2º Ano B,2026,2º Ano,vespertino,30\n' +
                  '3º Ano C,2026,3º Ano,matutino,32';
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'template_turmas.csv';
      link.click();
    }
  };

  const getTurnoColor = (turno) => {
    const colors = {
      matutino: 'primary',
      vespertino: 'secondary',
      noturno: 'default',
      integral: 'success'
    };
    return colors[turno] || 'default';
  };

  const getTurnoIcon = (turno) => {
    const icons = {
      matutino: <WbSunnyIcon />,
      vespertino: <WbTwilightIcon />,
      noturno: <NightsStayIcon />,
      integral: <SchoolIcon />
    };
    return icons[turno] || <SchoolIcon />;
  };

  const getAlunosPorTurma = (turmaId) => {
    return alunos.filter(aluno => aluno.turma?._id === turmaId);
  };

  const getInitials = (nome) => {
    if (!nome) return 'T';
    const names = nome.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <Container maxWidth="xl">
      <PageHeader 
        title="Turmas"
        subtitle="Organize e gerencie as turmas da escola"
        icon={TurmasIcon}
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
            placeholder="Buscar turma..."
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
            Nova Turma
          </Button>
        </Box>
      </Zoom>

      {/* Contador de turmas */}
      <Fade in={true} timeout={400}>
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 3, 
            color: 'text.secondary',
            fontWeight: 500 
          }}
        >
          {filteredTurmas.length} {filteredTurmas.length === 1 ? 'turma encontrada' : 'turmas encontradas'}
        </Typography>
      </Fade>

      {/* Grid de Cards */}
      <Grid container spacing={3}>
        {turmasLoading ? (
          // Skeleton loading
          [...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
            </Grid>
          ))
        ) : filteredTurmas.length === 0 ? (
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
              <SchoolIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {searchTerm ? 'Nenhuma turma encontrada' : 'Nenhuma turma cadastrada'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                {searchTerm ? 
                  'Tente buscar com outros termos' : 
                  'Crie sua primeira turma para começar a organizar os alunos'}
              </Typography>
              {!searchTerm && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpen()}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                  }}
                >
                  Criar Primeira Turma
                </Button>
              )}
            </Paper>
          </Grid>
        ) : (
          filteredTurmas.map((turma, index) => {
            const alunosDaTurma = getAlunosPorTurma(turma._id);
            const totalAlunos = alunosDaTurma.length;
            const capacidade = turma.capacidadeMaxima || 35;
            const percentualOcupacao = (totalAlunos / capacidade) * 100;
            const isCheio = percentualOcupacao >= 100;
            const isQuaseCompleto = percentualOcupacao >= 80 && percentualOcupacao < 100;

            return (
              <Grid item xs={12} sm={6} md={4} key={turma._id}>
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
                          {getInitials(turma.nome)}
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
                            {turma.nome}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            <Chip 
                              icon={getTurnoIcon(turma.turno)}
                              label={turma.turno}
                              size="small"
                              color={getTurnoColor(turma.turno)}
                              sx={{ 
                                height: 24,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            />
                            <Chip 
                              label={turma.ano}
                              size="small"
                              variant="outlined"
                              sx={{ height: 24, fontSize: '0.75rem' }}
                            />
                          </Box>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Informações */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {/* Série */}
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
                            <strong>Série:</strong> {turma.serie}
                          </Typography>
                        </Box>

                        {/* Alunos Matriculados (TEMPO REAL!) */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PeopleIcon 
                            sx={{ 
                              fontSize: 20, 
                              color: isCheio ? 'error.main' : 
                                     isQuaseCompleto ? 'warning.main' : 
                                     (theme) => theme.palette.mode === 'dark'
                                       ? 'rgba(0, 188, 212, 0.7)'
                                       : 'text.secondary'
                            }} 
                          />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ flex: 1 }}
                          >
                            <strong>Alunos:</strong> {totalAlunos} / {capacidade}
                          </Typography>
                          <Chip 
                            label={`${Math.round(percentualOcupacao)}%`}
                            size="small"
                            color={isCheio ? 'error' : isQuaseCompleto ? 'warning' : 'success'}
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                          />
                        </Box>

                        {/* Lista de alguns alunos */}
                        {totalAlunos > 0 && (
                          <Box 
                            sx={{ 
                              mt: 1,
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: (theme) => theme.palette.mode === 'dark'
                                ? 'rgba(0, 188, 212, 0.05)'
                                : 'rgba(102, 126, 234, 0.05)',
                              border: (theme) => theme.palette.mode === 'dark'
                                ? '1px solid rgba(0, 188, 212, 0.1)'
                                : '1px solid rgba(102, 126, 234, 0.1)',
                            }}
                          >
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontWeight: 600,
                                color: (theme) => theme.palette.mode === 'dark'
                                  ? '#00bcd4'
                                  : 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                mb: 0.5,
                              }}
                            >
                              <PersonAddIcon sx={{ fontSize: 14 }} />
                              Alunos Matriculados:
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                              {alunosDaTurma.slice(0, 3).map((aluno) => (
                                <Typography 
                                  key={aluno._id}
                                  variant="caption" 
                                  color="text.secondary"
                                  sx={{ fontSize: '0.7rem', pl: 1 }}
                                >
                                  • {aluno.nome}
                                </Typography>
                              ))}
                              {totalAlunos > 3 && (
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                  sx={{ fontSize: '0.7rem', pl: 1, fontStyle: 'italic' }}
                                >
                                  + {totalAlunos - 3} outros alunos
                                </Typography>
                              )}
                            </Box>
                          </Box>
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
                        onClick={() => handleOpen(turma)}
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
                        onClick={() => handleDelete(turma._id)}
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
            );
          })
        )}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editId ? 'Editar Turma' : 'Nova Turma'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab label="Cadastro Manual" />
            <Tab label="Importar Arquivo" disabled={!!editId} />
          </Tabs>

          {tabValue === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {!editId && (
                <Alert severity="success" sx={{ mb: 1 }}>
                  <strong>💡 Dica:</strong> Você pode criar a turma vazia agora e adicionar alunos depois!
                  <br />
                  <small>Os alunos podem ser cadastrados individualmente ou importados em lote.</small>
                </Alert>
              )}
              
              <TextField
                autoFocus
                label="Nome da Turma"
                fullWidth
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: 1º Ano A"
                required
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Ano"
                  type="number"
                  value={formData.ano}
                  onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Série"
                  fullWidth
                  value={formData.serie}
                  onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                  placeholder="Ex: 1º Ano"
                  sx={{ flex: 2 }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  select
                  label="Turno"
                  value={formData.turno}
                  onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                  sx={{ flex: 1 }}
                >
                  <MenuItem value="matutino">Matutino</MenuItem>
                  <MenuItem value="vespertino">Vespertino</MenuItem>
                  <MenuItem value="noturno">Noturno</MenuItem>
                  <MenuItem value="integral">Integral</MenuItem>
                </TextField>

                <TextField
                  label="Capacidade Máxima"
                  type="number"
                  value={formData.capacidadeMaxima}
                  onChange={(e) => setFormData({ ...formData, capacidadeMaxima: parseInt(e.target.value) })}
                  sx={{ flex: 1 }}
                  inputProps={{ min: 1, max: 50 }}
                />
              </Box>
            </Box>
          )}

          {tabValue === 1 && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Formatos aceitos: CSV e Excel (.xlsx)</strong>
                <br />
                Colunas: nome, ano, serie, turno, capacidadeMaxima
                <br />
                Turnos válidos: matutino, vespertino, noturno, integral
              </Alert>

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
                    {importData.length} turmas prontas para importar:
                  </Typography>
                  <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <List dense>
                      {importData.map((row, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={row.nome}
                            secondary={`${row.serie} - ${row.turno} - Ano: ${row.ano || 2026}`}
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
              Importar {importData.length} Turmas
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Turmas;
