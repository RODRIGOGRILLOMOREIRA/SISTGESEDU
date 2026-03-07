/**
 * Card de Exportação de Histórico de Frequência
 * 
 * Componente visual otimizado para exportação como imagem PNG
 * para compartilhamento via WhatsApp. Design mobile-friendly (600px).
 * 
 * @author SISTGESEDU
 * @date 2026-03-07
 */

import React from 'react';
import {
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
  Chip
} from '@mui/material';

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

/**
 * Card de Exportação de Histórico de Frequência
 */
const CardExportacaoFrequencia = ({ 
  aluno, 
  frequenciaData,
  schoolSettings 
}) => {
  // Não renderizar se não houver dados
  if (!frequenciaData || !aluno) return null;

  // Data atual para o cabeçalho
  const dataGeracao = new Date().toLocaleDateString('pt-BR');

  return (
    <Box
      sx={{
        width: '600px',
        minWidth: '600px',
        maxWidth: '600px',
        backgroundColor: '#ffffff',
        padding: '24px',
        fontFamily: 'Roboto, sans-serif',
        color: '#212121',
        boxSizing: 'border-box'
      }}
    >
      {/* CABEÇALHO COM LOGO + DADOS DO ALUNO */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 3, 
          bgcolor: '#f5f5f5',
          borderRadius: 2,
          border: '2px solid #1976d2'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {/* Logo da Escola */}
          {schoolSettings?.logo && (
            <Box sx={{ flexShrink: 0 }}>
              <img 
                src={schoolSettings.logo} 
                alt="Logo da Escola"
                style={{
                  maxHeight: '60px',
                  maxWidth: '100px',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
          
          {/* Nome da Escola */}
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                fontSize: '18px',
                color: '#1976d2',
                lineHeight: 1.2
              }}
            >
              {schoolSettings?.nomeEscola || 'Sistema de Gerenciamento Escolar'}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#666',
                fontSize: '12px',
                mt: 0.5
              }}
            >
              Histórico de Frequência
            </Typography>
          </Box>
        </Box>

        {/* Dados do Aluno */}
        <Box 
          sx={{ 
            bgcolor: 'white', 
            p: 1.5, 
            borderRadius: 1,
            border: '1px solid #e0e0e0'
          }}
        >
          <Typography 
            sx={{ 
              fontSize: '16px',
              fontWeight: 600,
              color: '#212121',
              mb: 0.5
            }}
          >
            👤 {aluno.nome}
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Typography 
              sx={{ 
                fontSize: '14px',
                color: '#666'
              }}
            >
              📋 Matrícula: <strong>{aluno.matricula}</strong>
            </Typography>
            <Typography 
              sx={{ 
                fontSize: '14px',
                color: '#666'
              }}
            >
              📅 Gerado em: <strong>{dataGeracao}</strong>
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* RESUMO GERAL */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 2, 
          bgcolor: '#fafafa',
          borderRadius: 2,
          border: '1px solid #e0e0e0'
        }}
      >
        <Typography 
          variant="subtitle2" 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            fontSize: '15px',
            color: '#212121',
            mb: 1.5
          }}
        >
          📊 Resumo Geral
          {frequenciaData.periodo?.inicio && frequenciaData.periodo?.fim 
            ? ` (${formatarDataLocal(frequenciaData.periodo.inicio)} - ${formatarDataLocal(frequenciaData.periodo.fim)})`
            : frequenciaData.periodo?.descricao 
              ? ` ${frequenciaData.periodo.descricao}`
              : ''
          }
        </Typography>
        
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={3}>
            <Box 
              sx={{ 
                textAlign: 'center',
                bgcolor: 'white',
                p: 1,
                borderRadius: 1,
                border: '1px solid #e0e0e0'
              }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  color: '#1976d2',
                  fontWeight: 700,
                  fontSize: '28px'
                }}
              >
                {frequenciaData.resumoGeral.total}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#666',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                Total
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box 
              sx={{ 
                textAlign: 'center',
                bgcolor: 'white',
                p: 1,
                borderRadius: 1,
                border: '1px solid #e0e0e0'
              }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  color: '#4caf50',
                  fontWeight: 700,
                  fontSize: '28px'
                }}
              >
                {frequenciaData.resumoGeral.presentes}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#666',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                Presenças
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box 
              sx={{ 
                textAlign: 'center',
                bgcolor: 'white',
                p: 1,
                borderRadius: 1,
                border: '1px solid #e0e0e0'
              }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  color: '#f44336',
                  fontWeight: 700,
                  fontSize: '28px'
                }}
              >
                {frequenciaData.resumoGeral.faltas}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#666',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                Faltas
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box 
              sx={{ 
                textAlign: 'center',
                bgcolor: 'white',
                p: 1,
                borderRadius: 1,
                border: '1px solid #e0e0e0'
              }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  color: '#ff9800',
                  fontWeight: 700,
                  fontSize: '28px'
                }}
              >
                {frequenciaData.resumoGeral.justificadas}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#666',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                Justificadas
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Box 
          sx={{ 
            textAlign: 'center',
            p: 1.5,
            borderRadius: 1,
            bgcolor: frequenciaData.resumoGeral.percentualPresenca >= 75 
              ? '#e8f5e9' 
              : frequenciaData.resumoGeral.percentualPresenca >= 60
                ? '#fff3e0'
                : '#ffebee',
            border: '2px solid',
            borderColor: frequenciaData.resumoGeral.percentualPresenca >= 75 
              ? '#4caf50' 
              : frequenciaData.resumoGeral.percentualPresenca >= 60
                ? '#ff9800'
                : '#f44336'
          }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              fontSize: '24px',
              color: frequenciaData.resumoGeral.percentualPresenca >= 75 
                ? '#2e7d32' 
                : frequenciaData.resumoGeral.percentualPresenca >= 60
                  ? '#f57c00'
                  : '#c62828'
            }}
          >
            🎯 {frequenciaData.resumoGeral.percentualPresenca}% de Presença
          </Typography>
        </Box>
      </Paper>

      {/* FREQUÊNCIA POR DISCIPLINA */}
      {frequenciaData.porDisciplina && frequenciaData.porDisciplina.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="subtitle2" 
            gutterBottom 
            sx={{ 
              fontWeight: 600,
              fontSize: '15px',
              color: '#212121',
              mb: 1
            }}
          >
            📚 Por Disciplina
          </Typography>
          <TableContainer 
            component={Paper} 
            elevation={0}
            sx={{ 
              borderRadius: 2,
              border: '1px solid #e0e0e0'
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#212121',
                      py: 1
                    }}
                  >
                    Disciplina
                  </TableCell>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#212121',
                      py: 1
                    }}
                  >
                    Total
                  </TableCell>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#212121',
                      py: 1
                    }}
                  >
                    Presentes
                  </TableCell>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#212121',
                      py: 1
                    }}
                  >
                    Faltas
                  </TableCell>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#212121',
                      py: 1
                    }}
                  >
                    %
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {frequenciaData.porDisciplina.map((disc, idx) => (
                  <TableRow 
                    key={idx}
                    sx={{ 
                      '&:nth-of-type(odd)': { bgcolor: '#fafafa' },
                      bgcolor: 'white'
                    }}
                  >
                    <TableCell sx={{ fontSize: '13px', py: 1 }}>
                      {disc.disciplina?.nome || 'N/A'}
                    </TableCell>
                    <TableCell align="center">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '13px'
                        }}
                      >
                        {disc.total}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={disc.presentes} 
                        size="small"
                        sx={{ 
                          bgcolor: '#4caf50',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '12px',
                          height: '22px'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={disc.faltas + disc.justificadas} 
                        size="small"
                        sx={{ 
                          bgcolor: '#f44336',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '12px',
                          height: '22px'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        sx={{
                          color: disc.percentualPresenca >= 75 
                            ? '#2e7d32' 
                            : disc.percentualPresenca >= 60
                              ? '#f57c00'
                              : '#c62828',
                          fontWeight: 700,
                          fontSize: '13px'
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
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="subtitle2" 
            gutterBottom 
            sx={{ 
              fontWeight: 600,
              fontSize: '15px',
              color: '#212121',
              mb: 1
            }}
          >
            📅 Histórico Diário (Últimos {frequenciaData.historicoDiario.length} registros)
          </Typography>
          <TableContainer 
            component={Paper} 
            elevation={0}
            sx={{ 
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              maxHeight: '400px'
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#212121',
                      py: 1
                    }}
                  >
                    Data
                  </TableCell>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#212121',
                      py: 1
                    }}
                  >
                    Presentes
                  </TableCell>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#212121',
                      py: 1
                    }}
                  >
                    Faltas
                  </TableCell>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#212121',
                      py: 1
                    }}
                  >
                    %
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {frequenciaData.historicoDiario.map((dia, idx) => (
                  <TableRow 
                    key={idx}
                    sx={{ 
                      '&:nth-of-type(odd)': { bgcolor: '#fafafa' },
                      bgcolor: 'white'
                    }}
                  >
                    <TableCell sx={{ py: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          fontSize: '13px'
                        }}
                      >
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
                        size="small"
                        sx={{ 
                          bgcolor: '#4caf50',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '12px',
                          height: '22px'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={dia.faltas + dia.justificadas} 
                        size="small"
                        sx={{ 
                          bgcolor: '#f44336',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '12px',
                          height: '22px'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        sx={{
                          color: dia.percentualPresenca >= 75 
                            ? '#2e7d32' 
                            : dia.percentualPresenca >= 60
                              ? '#f57c00'
                              : '#c62828',
                          fontWeight: 700,
                          fontSize: '13px'
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
      
      {/* RODAPÉ */}
      <Box 
        sx={{ 
          mt: 2,
          pt: 1.5,
          borderTop: '2px solid #e0e0e0',
          textAlign: 'center'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 700,
            color: '#1976d2',
            letterSpacing: 1,
            fontSize: '13px',
            mb: 0.5
          }}
        >
          SISTGESEDU
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#666',
            fontSize: '11px'
          }}
        >
          Licença MIT 2026
        </Typography>
      </Box>
    </Box>
  );
};

export default CardExportacaoFrequencia;
