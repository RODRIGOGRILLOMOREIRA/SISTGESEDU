const Frequencia = require('../models/Frequencia');
const Aluno = require('../models/Aluno');
const { paginate, paginatedResponse } = require('../utils/helpers');

/**
 * Converte uma string de data no formato 'YYYY-MM-DD' para um objeto Date
 * garantindo que seja sempre o início do dia em UTC, evitando problemas de timezone
 * @param {string} dataString - Data no formato 'YYYY-MM-DD'
 * @returns {Date} - Objeto Date no início do dia UTC
 */
const parseDataUTC = (dataString) => {
  if (!dataString) return null;
  const [ano, mes, dia] = dataString.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia, 0, 0, 0, 0));
};

/**
 * Extrai o ano de uma string de data 'YYYY-MM-DD'
 * @param {string} dataString - Data no formato 'YYYY-MM-DD'
 * @returns {number} - Ano
 */
const extrairAno = (dataString) => {
  if (!dataString) return null;
  return parseInt(dataString.split('-')[0]);
};

/**
 * Obtém a data de hoje no formato 'YYYY-MM-DD' sem problemas de timezone
 * @returns {string} - Data atual no formato 'YYYY-MM-DD'
 */
const getDataHoje = () => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

// @desc    Listar frequências com filtros
// @route   GET /api/frequencias
exports.getFrequencias = async (req, res) => {
  try {
    const { page = 1, limit = 50, aluno, turma, disciplina, data, status, ano, mes, trimestre } = req.query;
    const { skip, limitNum, pageNum } = paginate(page, limit);
    
    const filter = { ativo: true };
    if (aluno) filter.aluno = aluno;
    if (turma) filter.turma = turma;
    if (disciplina) filter.disciplina = disciplina;
    if (data) filter.data = parseDataUTC(data);
    if (status) filter.status = status;
    if (ano) filter.ano = parseInt(ano);
    if (mes) filter.mes = parseInt(mes);
    if (trimestre) filter.trimestre = parseInt(trimestre);
    
    const [frequencias, total] = await Promise.all([
      Frequencia.find(filter)
        .populate('aluno', 'nome matricula')
        .populate('disciplina', 'nome codigo')
        .populate('turma', 'nome')
        .populate('professor', 'nome')
        .sort({ data: -1 })
        .skip(skip)
        .limit(limitNum),
      Frequencia.countDocuments(filter)
    ]);
    
    res.json(paginatedResponse(frequencias, pageNum, limitNum, total));
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar frequências', error: error.message });
  }
};

// @desc    Registrar frequência (individual ou em lote)
// @route   POST /api/frequencias
exports.registrarFrequencia = async (req, res) => {
  try {
    const { registros } = req.body; // Array de registros ou registro único
    
    // Suporta registro único ou múltiplo
    const dadosParaRegistrar = Array.isArray(registros) ? registros : [req.body];
    
    const frequenciasCriadas = [];
    const erros = [];
    
    for (const registro of dadosParaRegistrar) {
      try {
        const { aluno, turma, disciplina, professor, data, status, observacao, periodo } = registro;
        
        // Verificar se já existe registro para esta data/aluno/disciplina
        const existente = await Frequencia.findOne({
          aluno,
          disciplina,
          data: parseDataUTC(data)
        });
        
        if (existente) {
          // Atualizar existente
          existente.status = status || existente.status;
          existente.observacao = observacao || existente.observacao;
          await existente.save();
          frequenciasCriadas.push(existente);
        } else {
          // Criar novo
          const frequencia = await Frequencia.create({
            aluno,
            turma,
            disciplina,
            professor,
            data: parseDataUTC(data),
            status: status || 'presente',
            observacao,
            periodo,
            ano: extrairAno(data),
            registradoPor: req.user?._id
          });
          frequenciasCriadas.push(frequencia);
        }
      } catch (error) {
        erros.push({ registro, erro: error.message });
      }
    }
    
    if (erros.length > 0) {
      return res.status(207).json({
        message: 'Alguns registros falharam',
        sucesso: frequenciasCriadas.length,
        falhas: erros.length,
        frequencias: frequenciasCriadas,
        erros
      });
    }
    
    res.status(201).json({
      message: 'Frequência(s) registrada(s) com sucesso',
      total: frequenciasCriadas.length,
      frequencias: frequenciasCriadas
    });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao registrar frequência', error: error.message });
  }
};

// @desc    Registrar frequência da turma (chamada diária)
// @route   POST /api/frequencias/turma/:turmaId/chamada
exports.registrarChamadaTurma = async (req, res) => {
  try {
    const { turmaId } = req.params;
    const { data, disciplina, professor, periodo, presencas } = req.body;
    // presencas: { alunoId: 'presente' | 'falta' | 'falta-justificada' }
    
    const Turma = require('../models/Turma');
    const turma = await Turma.findById(turmaId).populate('alunos');
    
    if (!turma) {
      return res.status(404).json({ message: 'Turma não encontrada' });
    }
    
    const frequenciasCriadas = [];
    
    for (const aluno of turma.alunos) {
      const status = presencas[aluno._id] || 'presente';
      
      const frequenciaData = {
        aluno: aluno._id,
        turma: turmaId,
        disciplina,
        professor,
        data: parseDataUTC(data),
        status,
        periodo,
        ano: extrairAno(data),
        registradoPor: req.user?._id
      };
      
      // Verificar se já existe
      const existente = await Frequencia.findOne({
        aluno: aluno._id,
        disciplina,
        data: parseDataUTC(data)
      });
      
      if (existente) {
        existente.status = status;
        await existente.save();
        frequenciasCriadas.push(existente);
      } else {
        const frequencia = await Frequencia.create(frequenciaData);
        frequenciasCriadas.push(frequencia);
      }
    }
    
    res.status(201).json({
      message: 'Chamada registrada com sucesso',
      total: frequenciasCriadas.length,
      frequencias: frequenciasCriadas
    });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao registrar chamada', error: error.message });
  }
};

// @desc    Obter frequência de um aluno
// @route   GET /api/frequencias/aluno/:alunoId
exports.getFrequenciaAluno = async (req, res) => {
  try {
    const { alunoId } = req.params;
    const { ano, trimestre, disciplina, dataInicio, dataFim } = req.query;
    
    const filter = { aluno: alunoId, ativo: true };
    if (ano) filter.ano = parseInt(ano);
    if (trimestre) filter.trimestre = parseInt(trimestre);
    if (disciplina) filter.disciplina = disciplina;
    
    if (dataInicio && dataFim) {
      filter.data = {
        $gte: new Date(dataInicio),
        $lte: new Date(dataFim)
      };
    }
    
    const frequencias = await Frequencia.find(filter)
      .populate('disciplina', 'nome codigo')
      .populate('turma', 'nome')
      .sort({ data: -1 });
    
    // Calcular estatísticas
    const total = frequencias.length;
    const presencas = frequencias.filter(f => f.status === 'presente').length;
    const faltas = frequencias.filter(f => f.status === 'falta').length;
    const faltasJustificadas = frequencias.filter(f => f.status === 'falta-justificada').length;
    const percentualPresenca = total > 0 ? ((presencas / total) * 100).toFixed(2) : 100;
    
    const statusFrequencia = Frequencia.getStatusFrequencia(parseFloat(percentualPresenca));
    
    res.json({
      frequencias,
      estatisticas: {
        total,
        presencas,
        faltas,
        faltasJustificadas,
        percentualPresenca: parseFloat(percentualPresenca),
        status: statusFrequencia
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar frequência do aluno', error: error.message });
  }
};

// @desc    Obter resumo de frequência da turma por dia
// @route   GET /api/frequencias/turma/:turmaId/dia/:data
exports.getFrequenciaTurmaDia = async (req, res) => {
  try {
    const { turmaId, data } = req.params;
    const { disciplina } = req.query;
    
    const filter = {
      turma: turmaId,
      data: parseDataUTC(data),
      ativo: true
    };
    
    if (disciplina) filter.disciplina = disciplina;
    
    const frequencias = await Frequencia.find(filter)
      .populate('aluno', 'nome matricula')
      .populate('disciplina', 'nome');
    
    const resumo = {
      total: frequencias.length,
      presentes: frequencias.filter(f => f.status === 'presente').length,
      faltas: frequencias.filter(f => f.status === 'falta').length,
      faltasJustificadas: frequencias.filter(f => f.status === 'falta-justificada').length,
      percentualPresenca: 0
    };
    
    resumo.percentualPresenca = resumo.total > 0 
      ? ((resumo.presentes / resumo.total) * 100).toFixed(2) 
      : 0;
    
    res.json({
      data: parseDataUTC(data),
      resumo,
      frequencias
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar frequência da turma', error: error.message });
  }
};

// @desc    Dashboard de frequência
// @route   GET /api/frequencias/dashboard
exports.getDashboardFrequencia = async (req, res) => {
  try {
    const { turma, disciplina, aluno, ano, trimestre, dataInicio, dataFim } = req.query;
    
    const filter = { ativo: true };
    if (turma) filter.turma = turma;
    if (disciplina) filter.disciplina = disciplina;
    if (aluno) filter.aluno = aluno;
    if (ano) filter.ano = parseInt(ano);
    if (trimestre) filter.trimestre = parseInt(trimestre);
    
    if (dataInicio && dataFim) {
      filter.data = {
        $gte: new Date(dataInicio),
        $lte: new Date(dataFim)
      };
    }
    
    // Estatísticas gerais
    const [total, presencas, faltas, faltasJustificadas] = await Promise.all([
      Frequencia.countDocuments(filter),
      Frequencia.countDocuments({ ...filter, status: 'presente' }),
      Frequencia.countDocuments({ ...filter, status: 'falta' }),
      Frequencia.countDocuments({ ...filter, status: 'falta-justificada' })
    ]);
    
    const percentualPresenca = total > 0 ? ((presencas / total) * 100).toFixed(2) : 100;
    
    // Buscar TODOS os alunos (não apenas críticos) com suas frequências
    // Se disciplina estiver filtrada, agrupa por aluno+disciplina
    // Caso contrário, agrupa apenas por aluno (visão geral)
    const groupField = disciplina ? { aluno: '$aluno', disciplina: '$disciplina' } : '$aluno';
    
    const todosAlunos = await Frequencia.aggregate([
      { $match: filter },
      {
        $group: {
          _id: groupField,
          totalAulas: { $sum: 1 },
          presencas: {
            $sum: { $cond: [{ $eq: ['$status', 'presente'] }, 1, 0] }
          },
          faltas: {
            $sum: { $cond: [{ $in: ['$status', ['falta', 'falta-justificada']] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          percentualPresenca: {
            $multiply: [
              { $divide: ['$presencas', '$totalAulas'] },
              100
            ]
          }
        }
      },
      { $sort: { percentualPresenca: 1 } }
    ]);
    
    // Popular dados dos alunos
    // Se agrupado por disciplina, o _id é um objeto { aluno, disciplina }
    if (disciplina) {
      await Aluno.populate(todosAlunos, { path: '_id.aluno', select: 'nome matricula' });
    } else {
      await Aluno.populate(todosAlunos, { path: '_id', select: 'nome matricula' });
    }
    
    // Classificar alunos por status de frequência
    const alunosClassificados = todosAlunos.map(aluno => {
      const percentual = aluno.percentualPresenca;
      let classificacao = '';
      
      if (percentual >= 85) {
        classificacao = 'adequado';
      } else if (percentual >= 75) {
        classificacao = 'atencao';
      } else {
        classificacao = 'critico';
      }
      
      return {
        aluno: disciplina ? aluno._id.aluno : aluno._id,
        total: aluno.totalAulas,
        presentes: aluno.presencas,
        faltas: aluno.faltas,
        percentualPresenca: parseFloat(percentual.toFixed(2)),
        classificacao
      };
    });
    
    // Frequência por dia da semana
    const frequenciaPorDia = await Frequencia.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dayOfWeek: '$data' },
          total: { $sum: 1 },
          presencas: {
            $sum: { $cond: [{ $eq: ['$status', 'presente'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Contadores por classificação
    const contadores = {
      total: alunosClassificados.length,
      adequado: alunosClassificados.filter(a => a.classificacao === 'adequado').length,
      atencao: alunosClassificados.filter(a => a.classificacao === 'atencao').length,
      critico: alunosClassificados.filter(a => a.classificacao === 'critico').length
    };
    
    res.json({
      totalRegistros: total,
      presentes: presencas,
      faltas,
      faltasJustificadas,
      percentualPresenca: parseFloat(percentualPresenca),
      percentualFaltas: total > 0 ? ((faltas / total) * 100).toFixed(2) : 0,
      todosAlunos: alunosClassificados,
      contadores,
      frequenciaPorDiaSemana: frequenciaPorDia
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao gerar dashboard', error: error.message });
  }
};

// @desc    Justificar falta
// @route   PUT /api/frequencias/:id/justificar
exports.justificarFalta = async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, anexo } = req.body;
    
    const frequencia = await Frequencia.findById(id);
    
    if (!frequencia) {
      return res.status(404).json({ message: 'Frequência não encontrada' });
    }
    
    await frequencia.justificarFalta(descricao, anexo);
    
    res.json({
      message: 'Falta justificada com sucesso',
      frequencia
    });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao justificar falta', error: error.message });
  }
};

// @desc    Atualizar frequência
// @route   PUT /api/frequencias/:id
exports.updateFrequencia = async (req, res) => {
  try {
    const frequencia = await Frequencia.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('aluno disciplina turma');
    
    if (!frequencia) {
      return res.status(404).json({ message: 'Frequência não encontrada' });
    }
    
    res.json(frequencia);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar frequência', error: error.message });
  }
};

// @desc    Deletar frequência
// @route   DELETE /api/frequencias/:id
exports.deleteFrequencia = async (req, res) => {
  try {
    const frequencia = await Frequencia.findByIdAndUpdate(
      req.params.id,
      { ativo: false },
      { new: true }
    );
    
    if (!frequencia) {
      return res.status(404).json({ message: 'Frequência não encontrada' });
    }
    
    res.json({ message: 'Frequência removida com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar frequência', error: error.message });
  }
};

// @desc    Gerar template de frequências por turma
// @route   GET /api/frequencias/template/:turmaId
exports.gerarTemplatePorTurma = async (req, res) => {
  try {
    const { turmaId } = req.params;
    const { disciplinaId, data } = req.query;
    
    const Turma = require('../models/Turma');
    const Disciplina = require('../models/Disciplina');
    
    // Validar ID da turma
    if (!turmaId || turmaId === 'undefined' || turmaId === 'null') {
      return res.status(400).json({ message: 'ID da turma inválido' });
    }
    
    // Buscar turma
    const turma = await Turma.findById(turmaId).populate('disciplinas.disciplina');
    if (!turma) {
      return res.status(404).json({ message: 'Turma não encontrada' });
    }
    
    // Buscar alunos da turma
    const alunos = await Aluno.find({ turma: turmaId, ativo: true }).sort({ nome: 1 });
    
    if (alunos.length === 0) {
      return res.status(400).json({ 
        message: 'Nenhum aluno encontrado nesta turma',
        detalhes: `A turma "${turma.nome}" não possui alunos cadastrados. Cadastre alunos primeiro.`
      });
    }
    
    // Buscar disciplina se especificada
    let disciplina = null;
    if (disciplinaId) {
      disciplina = await Disciplina.findById(disciplinaId);
    }
    
    // Data padrão: hoje
    const dataTemplate = data || getDataHoje();
    
    // Gerar template com dados dos alunos
    const template = alunos.map(aluno => ({
      matricula_aluno: aluno.matricula,
      aluno_nome: aluno.nome,
      turma_nome: turma.nome,
      codigo_disciplina: disciplina?.codigo || '',
      disciplina_nome: disciplina?.nome || '',
      data: dataTemplate,
      status: '', // Vazio para fácil preenchimento
      status_codigo: '', // P, F, FJ, A (facilitador)
      periodo: turma.turno || 'matutino',
      observacao: ''
    }));
    
    res.json({
      turma: {
        id: turma._id,
        nome: turma.nome,
        turno: turma.turno,
        totalAlunos: alunos.length
      },
      disciplina: disciplina ? {
        id: disciplina._id,
        nome: disciplina.nome,
        codigo: disciplina.codigo
      } : null,
      template,
      instrucoes: {
        status: 'Preencha a coluna "status" com: presente, falta, falta-justificada ou atestado',
        status_codigo: 'OU use a coluna "status_codigo" com códigos rápidos: P (presente), F (falta), FJ (falta-justificada), A (atestado)',
        periodo: 'Valores: matutino, vespertino, noturno, integral',
        data: 'Formato: AAAA-MM-DD',
        dica: 'Deixe "status" e "status_codigo" vazios para marcar como PRESENTE automaticamente'
      },
      codigos_status: {
        'P': 'presente',
        'F': 'falta',
        'FJ': 'falta-justificada',
        'A': 'atestado',
        '': 'presente (padrão)'
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar template de frequências:', error);
    res.status(500).json({ message: 'Erro ao gerar template', error: error.message });
  }
};

// @desc    Importar frequências em lote (CSV/Excel)
// @route   POST /api/frequencias/importar
exports.importarFrequencias = async (req, res) => {
  try {
    const { frequencias } = req.body; // Array de frequências
    
    if (!Array.isArray(frequencias) || frequencias.length === 0) {
      return res.status(400).json({ message: 'É necessário fornecer um array de frequências' });
    }
    
    const Turma = require('../models/Turma');
    const Disciplina = require('../models/Disciplina');
    const Professor = require('../models/Professor');
    
    const resultados = {
      sucesso: 0,
      erros: 0,
      atualizados: 0,
      detalhes: []
    };
    
    for (const item of frequencias) {
      try {
        // Buscar IDs por matrícula, nome, código, etc
        let alunoId = null;
        let disciplinaId = null;
        let turmaId = null;
        let professorId = null;
        
        // Buscar aluno por matrícula ou nome
        if (item.matricula_aluno) {
          const aluno = await Aluno.findOne({ 
            matricula: item.matricula_aluno, 
            ativo: true 
          });
          alunoId = aluno?._id;
        } else if (item.aluno_nome) {
          const aluno = await Aluno.findOne({ 
            nome: { $regex: new RegExp(item.aluno_nome, 'i') },
            ativo: true 
          }).limit(1);
          alunoId = aluno?._id;
        }
        
        // Buscar disciplina por código ou nome
        if (item.codigo_disciplina) {
          const disciplina = await Disciplina.findOne({ 
            codigo: item.codigo_disciplina,
            ativo: true 
          });
          disciplinaId = disciplina?._id;
        } else if (item.disciplina_nome) {
          const disciplina = await Disciplina.findOne({ 
            nome: { $regex: new RegExp(item.disciplina_nome, 'i') },
            ativo: true 
          }).limit(1);
          disciplinaId = disciplina?._id;
        }
        
        // Buscar turma por nome
        if (item.turma_nome) {
          const turma = await Turma.findOne({ 
            nome: { $regex: new RegExp(item.turma_nome, 'i') },
            ativo: true 
          }).limit(1);
          turmaId = turma?._id;
        }
        
        // Buscar professor por nome
        if (item.professor_nome) {
          const professor = await Professor.findOne({ 
            nome: { $regex: new RegExp(item.professor_nome, 'i') },
            ativo: true 
          }).limit(1);
          professorId = professor?._id;
        }
        
        if (!alunoId || !disciplinaId || !turmaId) {
          resultados.erros++;
          resultados.detalhes.push({
            linha: item.linha || resultados.sucesso + resultados.erros + resultados.atualizados,
            erro: 'Aluno, disciplina ou turma não encontrados',
            dados: item
          });
          continue;
        }
        
        // Validar data
        const data = item.data ? parseDataUTC(item.data) : null;
        if (!data || isNaN(data.getTime())) {
          resultados.erros++;
          resultados.detalhes.push({
            linha: item.linha || resultados.sucesso + resultados.erros + resultados.atualizados,
            erro: 'Data inválida ou não fornecida',
            dados: item
          });
          continue;
        }
        
        // Processar status (com suporte a códigos: P, F, FJ, A)
        let status = 'presente'; // Padrão
        
        // Primeiro verificar se há código de status
        if (item.status_codigo) {
          const codigo = item.status_codigo.toString().toUpperCase().trim();
          const mapaCodigos = {
            'P': 'presente',
            'F': 'falta',
            'FJ': 'falta-justificada',
            'A': 'atestado'
          };
          
          if (mapaCodigos[codigo]) {
            status = mapaCodigos[codigo];
          } else {
            resultados.erros++;
            resultados.detalhes.push({
              linha: item.linha || resultados.sucesso + resultados.erros + resultados.atualizados,
              erro: `Código de status inválido: ${item.status_codigo}. Use: P, F, FJ ou A`,
              dados: item
            });
            continue;
          }
        } 
        // Se não houver código, verificar status por extenso
        else if (item.status) {
          status = item.status.toLowerCase().trim();
        }
        
        // Validar status final
        const statusValidos = ['presente', 'falta', 'falta-justificada', 'atestado'];
        if (!statusValidos.includes(status)) {
          resultados.erros++;
          resultados.detalhes.push({
            linha: item.linha || resultados.sucesso + resultados.erros + resultados.atualizados,
            erro: `Status inválido: ${status}. Use: ${statusValidos.join(', ')} ou códigos P, F, FJ, A`,
            dados: item
          });
          continue;
        }
        
        // Preparar dados da frequência
        const frequenciaData = {
          aluno: alunoId,
          disciplina: disciplinaId,
          turma: turmaId,
          data: data,
          status: status,
          observacao: item.observacao || '',
          periodo: item.periodo?.toLowerCase() || 'matutino',
          ano: data.getUTCFullYear()
        };
        
        if (professorId) {
          frequenciaData.professor = professorId;
        }
        
        // Verificar se já existe registro para esta data/aluno/disciplina
        const existente = await Frequencia.findOne({
          aluno: alunoId,
          disciplina: disciplinaId,
          data: data
        });
        
        if (existente) {
          // Atualizar existente
          existente.status = status;
          existente.observacao = frequenciaData.observacao;
          existente.periodo = frequenciaData.periodo;
          if (professorId) existente.professor = professorId;
          await existente.save();
          
          resultados.atualizados++;
          resultados.detalhes.push({
            linha: item.linha || resultados.sucesso + resultados.erros + resultados.atualizados,
            status: 'atualizado',
            frequenciaId: existente._id
          });
        } else {
          // Criar novo
          const frequencia = await Frequencia.create(frequenciaData);
          
          resultados.sucesso++;
          resultados.detalhes.push({
            linha: item.linha || resultados.sucesso + resultados.erros + resultados.atualizados,
            status: 'criado',
            frequenciaId: frequencia._id
          });
        }
        
      } catch (error) {
        resultados.erros++;
        resultados.detalhes.push({
          linha: item.linha || resultados.sucesso + resultados.erros + resultados.atualizados,
          erro: error.message,
          dados: item
        });
      }
    }
    
    res.json({
      message: 'Importação concluída',
      total: frequencias.length,
      criados: resultados.sucesso,
      atualizados: resultados.atualizados,
      erros: resultados.erros,
      detalhes: resultados.detalhes
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Erro ao importar frequências', error: error.message });
  }
};

// @desc    Estatísticas de frequência da turma (acumulativo)
// @route   GET /api/frequencias/estatisticas-turma/:turmaId
exports.getEstatisticasTurma = async (req, res) => {
  try {
    const { turmaId } = req.params;
    const { data, ano, trimestre } = req.query;
    
    const Turma = require('../models/Turma');
    const turma = await Turma.findById(turmaId).populate('alunos');
    
    if (!turma) {
      return res.status(404).json({ message: 'Turma não encontrada' });
    }
    
    const totalAlunos = turma.alunos.length;
    const dataReferencia = data || getDataHoje();
    
    // Filtro para o dia específico
    const filtroHoje = {
      turma: turmaId,
      data: parseDataUTC(dataReferencia),
      ativo: true
    };
    
    // Filtro acumulativo
    const filtroAcumulado = {
      turma: turmaId,
      ativo: true
    };
    
    if (ano) {
      filtroAcumulado.ano = parseInt(ano);
      filtroHoje.ano = parseInt(ano);
    }
    if (trimestre) {
      filtroAcumulado.trimestre = parseInt(trimestre);
      filtroHoje.trimestre = parseInt(trimestre);
    }
    
    // Stats do dia
    const [presentesHoje, faltasHoje, justificadasHoje] = await Promise.all([
      Frequencia.countDocuments({ ...filtroHoje, status: 'presente' }),
      Frequencia.countDocuments({ ...filtroHoje, status: 'falta' }),
      Frequencia.countDocuments({ ...filtroHoje, status: 'falta-justificada' })
    ]);
    
    // Stats acumuladas
    const [totalRegistros, presentesAcumulado, faltasAcumulado, justificadasAcumulado] = await Promise.all([
      Frequencia.countDocuments(filtroAcumulado),
      Frequencia.countDocuments({ ...filtroAcumulado, status: 'presente' }),
      Frequencia.countDocuments({ ...filtroAcumulado, status: 'falta' }),
      Frequencia.countDocuments({ ...filtroAcumulado, status: 'falta-justificada' })
    ]);
    
    const percentualPresenca = totalRegistros > 0 
      ? parseFloat(((presentesAcumulado / totalRegistros) * 100).toFixed(2))
      : 100;
    
    const percentualFaltas = totalRegistros > 0 
      ? parseFloat(((faltasAcumulado / totalRegistros) * 100).toFixed(2))
      : 0;
    
    let classificacao = 'adequado';
    if (percentualPresenca < 75) classificacao = 'critico';
    else if (percentualPresenca < 85) classificacao = 'atencao';
    
    res.json({
      turmaId,
      turma: turma.nome,
      dataReferencia,
      totalAlunos,
      hoje: {
        presentes: presentesHoje,
        faltas: faltasHoje,
        justificadas: justificadasHoje
      },
      acumulado: {
        totalRegistros,
        presentes: presentesAcumulado,
        faltas: faltasAcumulado,
        justificadas: justificadasAcumulado,
        percentualPresenca,
        percentualFaltas
      },
      percentualGeral: percentualPresenca,
      classificacao
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar estatísticas', error: error.message });
  }
};

// @desc    Resetar frequências de um dia específico
// @route   DELETE /api/frequencias/resetar-dia
exports.resetarDia = async (req, res) => {
  try {
    const { turma, data } = req.body;
    
    if (!turma || !data) {
      return res.status(400).json({ message: 'Turma e data são obrigatórios' });
    }
    
    const resultado = await Frequencia.deleteMany({
      turma,
      data: parseDataUTC(data)
    });
    
    res.json({
      message: 'Registros resetados com sucesso',
      deletados: resultado.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao resetar registros', error: error.message });
  }
};

// @desc    Registrar chamada geral da turma (todas as disciplinas)
// @route   POST /api/frequencias/turma-geral/:turmaId
exports.registrarChamadaTurmaGeral = async (req, res) => {
  try {
    const { turmaId } = req.params;
    const { data, periodo, presencas } = req.body;
    
    const Turma = require('../models/Turma');
    const turma = await Turma.findById(turmaId)
      .populate('alunos')
      .populate('disciplinas.disciplina')
      .populate('disciplinas.professor');
    
    if (!turma) {
      return res.status(404).json({ message: 'Turma não encontrada' });
    }
    
    const frequenciasCriadas = [];
    const erros = [];
    
    // Para cada aluno
    for (const aluno of turma.alunos) {
      const status = presencas[aluno._id] || 'presente';
      
      // Para cada disciplina da turma
      for (const disc of turma.disciplinas) {
        try {
          const frequenciaData = {
            aluno: aluno._id,
            turma: turmaId,
            disciplina: disc.disciplina._id,
            professor: disc.professor._id,
            data: parseDataUTC(data),
            status,
            periodo: periodo || turma.turno || 'matutino',
            ano: extrairAno(data),
            registradoPor: req.user?._id
          };
          
          // Verificar se já existe
          const existente = await Frequencia.findOne({
            aluno: aluno._id,
            disciplina: disc.disciplina._id,
            data: parseDataUTC(data)
          });
          
          if (existente) {
            existente.status = status;
            await existente.save();
            frequenciasCriadas.push(existente);
          } else {
            const freq = await Frequencia.create(frequenciaData);
            frequenciasCriadas.push(freq);
          }
        } catch (error) {
          erros.push({ 
            aluno: aluno.nome, 
            disciplina: disc.disciplina.nome, 
            erro: error.message 
          });
        }
      }
    }
    
    res.status(201).json({
      message: 'Chamada registrada com sucesso',
      total: frequenciasCriadas.length,
      alunos: turma.alunos.length,
      disciplinas: turma.disciplinas.length,
      registrosPorAluno: turma.disciplinas.length,
      erros: erros.length > 0 ? erros : undefined
    });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao registrar chamada', error: error.message });
  }
};
