/**
 * Utilitários para classificação de desempenho de alunos
 * Sistema de Avaliação por Pontos de Corte
 */

// Classificações e faixas de nota
const CLASSIFICACOES = {
  ADEQUADO: {
    value: 'adequado',
    label: 'Adequado',
    min: 80,
    max: 100,
    color: 'success',
    icon: 'CheckCircle'
  },
  PROFICIENTE: {
    value: 'proficiente',
    label: 'Proficiente',
    min: 60,
    max: 79.9,
    color: 'info',
    icon: 'Info'
  },
  EM_ALERTA: {
    value: 'em-alerta',
    label: 'Em Alerta',
    min: 40,
    max: 59.9,
    color: 'warning',
    icon: 'Warning'
  },
  INTERVENCAO_IMEDIATA: {
    value: 'intervencao-imediata',
    label: 'Intervenção Imediata',
    min: 0,
    max: 39.9,
    color: 'error',
    icon: 'Error'
  },
  SEM_AVALIACAO: {
    value: 'sem-avaliacao',
    label: 'Sem Avaliação',
    min: 0,
    max: 0,
    color: 'default',
    icon: 'HelpOutline'
  }
};

/**
 * Calcula a classificação baseada na nota final
 * @param {Number} notaFinal - Nota final do trimestre (0-100)
 * @returns {String} - Classificação
 */
exports.calcularClassificacao = (notaFinal) => {
  if (!notaFinal || notaFinal === 0) {
    return CLASSIFICACOES.SEM_AVALIACAO.value;
  }
  
  if (notaFinal >= CLASSIFICACOES.ADEQUADO.min) {
    return CLASSIFICACOES.ADEQUADO.value;
  }
  
  if (notaFinal >= CLASSIFICACOES.PROFICIENTE.min) {
    return CLASSIFICACOES.PROFICIENTE.value;
  }
  
  if (notaFinal >= CLASSIFICACOES.EM_ALERTA.min) {
    return CLASSIFICACOES.EM_ALERTA.value;
  }
  
  return CLASSIFICACOES.INTERVENCAO_IMEDIATA.value;
};

/**
 * Obtém informações detalhadas de uma classificação
 * @param {String} classificacao - Valor da classificação
 * @returns {Object} - Objeto com detalhes da classificação
 */
exports.getClassificacaoInfo = (classificacao) => {
  return Object.values(CLASSIFICACOES).find(c => c.value === classificacao) || CLASSIFICACOES.SEM_AVALIACAO;
};

/**
 * Calcula a média final (PC1 + PC2)
 * @param {Number} pc1 - Nota do Ponto de Corte 1 (0-50)
 * @param {Number} pc2 - Nota do Ponto de Corte 2 (0-50)
 * @returns {Number} - Média final (0-100)
 */
exports.calcularMediaFinal = (pc1 = 0, pc2 = 0) => {
  return parseFloat((pc1 + pc2).toFixed(2));
};

/**
 * Calcula a nota final do trimestre (maior entre média final e EAC)
 * @param {Number} mediaFinal - Média final (PC1 + PC2)
 * @param {Number} eac - Nota do EAC (0-100)
 * @returns {Number} - Nota final (0-100)
 */
exports.calcularNotaFinal = (mediaFinal = 0, eac = 0) => {
  return parseFloat(Math.max(mediaFinal, eac).toFixed(2));
};

/**
 * Valida se uma nota está dentro dos limites permitidos
 * @param {Number} nota - Nota a validar
 * @param {Number} max - Valor máximo permitido
 * @param {String} campo - Nome do campo (para mensagem de erro)
 * @returns {Object} - { valid: Boolean, error: String }
 */
exports.validarNota = (nota, max, campo) => {
  if (nota < 0) {
    return {
      valid: false,
      error: `${campo} não pode ser negativa`
    };
  }
  
  if (nota > max) {
    return {
      valid: false,
      error: `${campo} não pode ultrapassar ${max} pontos`
    };
  }
  
  return { valid: true };
};

/**
 * Valida todos os campos de uma avaliação
 * @param {Object} pontosCorte - Objeto com pc1, pc2 e eac
 * @returns {Object} - { valid: Boolean, errors: Array }
 */
exports.validarAvaliacao = (pontosCorte) => {
  const errors = [];
  
  if (pontosCorte.pc1?.nota !== undefined) {
    const validacao = exports.validarNota(pontosCorte.pc1.nota, 50, 'PC1');
    if (!validacao.valid) errors.push(validacao.error);
  }
  
  if (pontosCorte.pc2?.nota !== undefined) {
    const validacao = exports.validarNota(pontosCorte.pc2.nota, 50, 'PC2');
    if (!validacao.valid) errors.push(validacao.error);
  }
  
  if (pontosCorte.eac?.nota !== undefined) {
    const validacao = exports.validarNota(pontosCorte.eac.nota, 100, 'EAC');
    if (!validacao.valid) errors.push(validacao.error);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Gera estatísticas de classificação para uma lista de avaliações
 * @param {Array} avaliacoes - Array de avaliações
 * @returns {Object} - Estatísticas por classificação
 */
exports.gerarEstatisticas = (avaliacoes) => {
  const stats = {
    total: avaliacoes.length,
    adequado: 0,
    proficiente: 0,
    emAlerta: 0,
    intervencaoImediata: 0,
    semAvaliacao: 0,
    mediaGeral: 0
  };
  
  let somaNotas = 0;
  let totalComNota = 0;
  
  avaliacoes.forEach(av => {
    const classificacao = av.classificacao || 'sem-avaliacao';
    
    switch (classificacao) {
      case 'adequado':
        stats.adequado++;
        break;
      case 'proficiente':
        stats.proficiente++;
        break;
      case 'em-alerta':
        stats.emAlerta++;
        break;
      case 'intervencao-imediata':
        stats.intervencaoImediata++;
        break;
      default:
        stats.semAvaliacao++;
    }
    
    if (av.notaFinalTrimestre > 0) {
      somaNotas += av.notaFinalTrimestre;
      totalComNota++;
    }
  });
  
  stats.mediaGeral = totalComNota > 0 ? parseFloat((somaNotas / totalComNota).toFixed(2)) : 0;
  
  // Calcular percentuais
  stats.percentuais = {
    adequado: stats.total > 0 ? parseFloat(((stats.adequado / stats.total) * 100).toFixed(1)) : 0,
    proficiente: stats.total > 0 ? parseFloat(((stats.proficiente / stats.total) * 100).toFixed(1)) : 0,
    emAlerta: stats.total > 0 ? parseFloat(((stats.emAlerta / stats.total) * 100).toFixed(1)) : 0,
    intervencaoImediata: stats.total > 0 ? parseFloat(((stats.intervencaoImediata / stats.total) * 100).toFixed(1)) : 0,
    semAvaliacao: stats.total > 0 ? parseFloat(((stats.semAvaliacao / stats.total) * 100).toFixed(1)) : 0
  };
  
  return stats;
};

/**
 * Identifica alunos que precisam de atenção (Em Alerta ou Intervenção)
 * @param {Array} avaliacoes - Array de avaliações populadas com aluno
 * @returns {Array} - Array de alunos que precisam de atenção
 */
exports.identificarAlunosEmRisco = (avaliacoes) => {
  return avaliacoes
    .filter(av => av.classificacao === 'em-alerta' || av.classificacao === 'intervencao-imediata')
    .map(av => ({
      aluno: av.aluno,
      notaFinal: av.notaFinalTrimestre,
      classificacao: av.classificacao,
      disciplina: av.disciplina,
      turma: av.turma
    }))
    .sort((a, b) => a.notaFinal - b.notaFinal); // Ordenar por nota (piores primeiro)
};

module.exports = exports;
module.exports.CLASSIFICACOES = CLASSIFICACOES;
