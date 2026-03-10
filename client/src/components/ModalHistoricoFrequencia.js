/**
 * Modal de Histórico de Frequência
 * 
 * Componente reutilizável para exibir histórico detalhado de frequências
 * de um aluno, com suporte a exportação para PNG (WhatsApp)
 * 
 * @author SISTGESEDU
 * @date 2026-03-07
 */

import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Assessment,
  Close,
  WhatsApp
} from '@mui/icons-material';
import { exportToImage, downloadFile } from '../utils/exportUtils';
import { toast } from 'react-toastify';
import { useSchool } from '../context/SchoolContext';
import CardExportacaoFrequencia from './CardExportacaoFrequencia';

/**
 * Formata data no padrão brasileiro (dd/mm/yyyy)
 */
const formatarDataLocal = (data) => {
  if (!data) return '';
  
  try {
    let dateObj;
    
    if (typeof data === 'string') {
      dateObj = new Date(data);
    } else if (data instanceof Date) {
      dateObj = data;
    } else {
      dateObj = new Date(data);
    }
    
    // Adicionar um dia para corrigir timezone
    dateObj.setDate(dateObj.getDate() + 1);
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
};

const ModalHistoricoFrequencia = ({ 
  open, 
  onClose, 
  aluno, 
  frequenciaData 
}) => {
  const contentRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const { schoolSettings } = useSchool();
  
  /**
   * Handler de exportação para PNG (WhatsApp)
   */
  const handleExport = async () => {
    if (!aluno || !frequenciaData) {
      toast.error('Dados não disponíveis para exportação');
      return;
    }
    
    try {
      setExporting(true);
      
      console.log('🔍 Verificando dados para exportação:');
      console.log('   Aluno:', aluno.nome, '| Matrícula:', aluno.matricula);
      console.log('   Frequências:', frequenciaData.resumoGeral);
      console.log('   Logo da escola:', schoolSettings?.logo ? 'Presente' : 'Ausente');
      
      // Criar nome de arquivo amigável
      const nomeAluno = aluno.nome || 'Aluno';
      const nomeArquivo = `historico-frequencia-${nomeAluno.replace(/\s+/g, '-').toLowerCase()}.png`;
      
      // Aguardar um momento para garantir que imagens (logo) carreguem
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verificar se o elemento existe
      const elemento = document.getElementById('card-exportacao-whatsapp');
      console.log('📦 Elemento encontrado:', elemento ? 'SIM' : 'NÃO');
      if (elemento) {
        console.log('   Dimensões:', elemento.offsetWidth, 'x', elemento.offsetHeight);
      }
      
      // Capturar card otimizado como imagem (não o modal)
      const blob = await exportToImage('card-exportacao-whatsapp', nomeArquivo);
      
      // Fazer download
      downloadFile(blob, nomeArquivo);
      
      // Feedback de sucesso
      toast.success('✅ Imagem exportada! Pronta para enviar via WhatsApp', {
        autoClose: 4000
      });
      
      // Log de sucesso
      console.log('📸 Imagem exportada com sucesso:', nomeArquivo);
      
    } catch (error) {
      console.error('Erro ao exportar imagem:', error);
      toast.error('Erro ao exportar imagem. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };
  
  // Não renderizar se não houver dados
  if (!frequenciaData || !aluno) return null;
  
  return (
    <>
      {/* Card oculto para exportação otimizada (mobile-friendly) */}
      <Box 
        id="card-exportacao-whatsapp" 
        sx={{ 
          position: 'absolute', 
          left: '-100%',
          top: 0,
          width: '600px',
          minWidth: '600px',
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: -1
          // NÃO usar opacity: 0 ou visibility: hidden - impede captura do html2canvas
        }}
      >
        <CardExportacaoFrequencia
          aluno={aluno}
          frequenciaData={frequenciaData}
          schoolSettings={schoolSettings}
        />
      </Box>

      {/* Modal principal (visualização normal) */}
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment color="primary" sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Histórico de Frequência
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {aluno.nome} - Mat: {aluno.matricula}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Exportar para WhatsApp">
              <span>
                <IconButton 
                  onClick={handleExport}
                  disabled={exporting}
                  sx={{
                    bgcolor: '#25D366',
                    color: 'white',
                    '&:hover': { bgcolor: '#128C7E' },
                    '&:disabled': { bgcolor: '#cccccc' }
                  }}
                >
                  {exporting ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    <WhatsApp />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box id="modal-content" ref={contentRef} sx={{ p: 1 }}>
          
          {/* RESUMO GERAL */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              📊 Resumo Geral
              {frequenciaData.periodo?.inicio && frequenciaData.periodo?.fim 
                ? ` (${formatarDataLocal(frequenciaData.periodo.inicio)} - ${formatarDataLocal(frequenciaData.periodo.fim)})`
                : frequenciaData.periodo?.descricao 
                  ? ` ${frequenciaData.periodo.descricao}`
                  : ''
              }
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                    {frequenciaData.resumoGeral.total}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                    {frequenciaData.resumoGeral.presentes}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Presenças
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
                    {frequenciaData.resumoGeral.faltas}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Faltas
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                    {frequenciaData.resumoGeral.justificadas}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Justificadas
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, textAlign: 'center', p: 1, borderRadius: 2, bgcolor: 'action.hover' }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  color: frequenciaData.resumoGeral.percentualPresenca >= 75 
                    ? 'success.main' 
                    : frequenciaData.resumoGeral.percentualPresenca >= 60
                      ? 'warning.main'
                      : 'error.main'
                }}
              >
                {frequenciaData.resumoGeral.percentualPresenca}% de Presença
              </Typography>
            </Box>
          </Paper>

          {/* FREQUÊNCIA POR DISCIPLINA */}
          {frequenciaData.porDisciplina && frequenciaData.porDisciplina.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                📚 Por Disciplina
              </Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Disciplina</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Total</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Presentes</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Faltas</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {frequenciaData.porDisciplina.map((disc, idx) => (
                      <TableRow 
                        key={idx}
                        sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                      >
                        <TableCell>{disc.disciplina?.nome || 'N/A'}</TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="600">
                            {disc.total}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={disc.presentes} 
                            color="success" 
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={disc.faltas}
                            color="error" 
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            sx={{
                              color: disc.percentualPresenca >= 75 
                                ? 'success.main' 
                                : disc.percentualPresenca >= 60
                                  ? 'warning.main'
                                  : 'error.main',
                              fontWeight: 700
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

          {/* HISTÓRICO DIÁRIO */}
          {frequenciaData.historicoDiario && frequenciaData.historicoDiario.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                📅 Histórico Diário (Últimos {frequenciaData.historicoDiario.length} registros)
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 300, borderRadius: 2 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'action.hover' }}>Data</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, bgcolor: 'action.hover' }}>Presentes</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, bgcolor: 'action.hover' }}>Faltas</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, bgcolor: 'action.hover' }}>%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {frequenciaData.historicoDiario.map((dia, idx) => (
                      <TableRow 
                        key={idx}
                        sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">
                            {formatarDataLocal(
                              typeof dia._id === 'string' 
                                ? dia._id 
                                : dia.data
                                  ? dia.data
                                  : dia._id instanceof Date 
                                    ? dia._id.toISOString().split('T')[0]
                                    : new Date(dia._id).toISOString().split('T')[0]
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={dia.presentes} 
                            color="success" 
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={dia.faltas}
                            color="error" 
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            sx={{
                              color: dia.percentualPresenca >= 75 
                                ? 'success.main' 
                                : dia.percentualPresenca >= 60
                                  ? 'warning.main'
                                  : 'error.main',
                              fontWeight: 700
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
          
          {/* Rodapé com marca d'água e licença */}
          <Box sx={{ mt: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 700,
                color: 'text.primary',
                letterSpacing: 1
              }}
            >
              SISTGESEDU
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ display: 'block', mt: 0.5 }}
            >
              Licensed under MIT © 2026
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default ModalHistoricoFrequencia;
