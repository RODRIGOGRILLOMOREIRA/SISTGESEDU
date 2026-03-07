const mongoose = require('mongoose');
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
 * Converte uma string de data no formato 'YYYY-MM-DD' para o FINAL do dia em UTC
 * garantindo 23:59:59.999, para queries com $lte incluírem o dia inteiro
 * @param {string} dataString - Data no formato 'YYYY-MM-DD'
 * @returns {Date} - Objeto Date no final do dia UTC
 */
const parseDataFimUTC = (dataString) => {
  if (!dataString) return null;
  const [ano, mes, dia] = dataString.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia, 23, 59, 59, 999));
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
    if (aluno && mongoose.Types.ObjectId.isValid(aluno)) filter.aluno = new mongoose.Types.ObjectId(aluno);
    if (turma && mongoose.Types.ObjectId.isValid(turma)) filter.turma = new mongoose.Types.ObjectId(turma);
    if (disciplina && mongoose.Types.ObjectId.isValid(disciplina)) filter.disciplina = new mongoose.Types.ObjectId(disciplina);
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
    if (disciplina && mongoose.Types.ObjectId.isValid(disciplina)) filter.disciplina = new mongoose.Types.ObjectId(disciplina);
    
    // CORREÇÃO: Usar parseDataUTC e parseDataFimUTC para evitar problemas de timezone
    if (dataInicio && dataFim) {
      filter.data = {
        $gte: parseDataUTC(dataInicio),
        $lte: parseDataFimUTC(dataFim)
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
    
    const dataUTC = parseDataUTC(data);
    
    console.log('📖 Backend - getFrequenciaTurmaDia:', {
      turmaId,
      dataOriginal: data,
      dataUTC: dataUTC.toISOString(),
      disciplina: disciplina || 'todas'
    });
    
    const filter = {
      turma: turmaId,
      data: dataUTC,
      ativo: true
    };
    
    if (disciplina && mongoose.Types.ObjectId.isValid(disciplina)) filter.disciplina = new mongoose.Types.ObjectId(disciplina);
    
    const frequencias = await Frequencia.find(filter)
      .populate('aluno', 'nome matricula')
      .populate('disciplina', 'nome');
    
    console.log(`✅ Backend - Encontrou ${frequencias.length} registros de frequência`);
    
    if (frequencias.length > 0) {
      console.log('📋 Amostra dos registros:', frequencias.slice(0, 3).map(f => ({
        aluno: f.aluno?.nome,
        status: f.status,
        disciplina: f.disciplina?.nome,
        data: f.data.toISOString().split('T')[0]
      })));
    }
    
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
      data: dataUTC,
      resumo,
      frequencias
    });
  } catch (error) {
    console.error('❌ Backend - Erro ao buscar frequência da turma:', error);
    res.status(500).json({ message: 'Erro ao buscar frequência da turma', error: error.message });
  }
};

// @desc    Dashboard de frequência
// @route   GET /api/frequencias/dashboard
exports.getDashboardFrequencia = async (req, res) => {
  try {
    const { turma, disciplina, aluno, ano, trimestre, dataInicio, dataFim } = req.query;
    
    console.log('🔍 Backend - getDashboardFrequencia - Filtros recebidos:', { turma, disciplina, aluno, ano, trimestre, dataInicio, dataFim });
    
    const filter = { ativo: true };
    // Converter IDs para ObjectId (MongoDB) apenas se forem válidos
    if (turma && mongoose.Types.ObjectId.isValid(turma)) filter.turma = new mongoose.Types.ObjectId(turma);
    if (disciplina && mongoose.Types.ObjectId.isValid(disciplina)) filter.disciplina = new mongoose.Types.ObjectId(disciplina);
    if (aluno && mongoose.Types.ObjectId.isValid(aluno)) filter.aluno = new mongoose.Types.ObjectId(aluno);
    if (ano) filter.ano = parseInt(ano);
    if (trimestre) filter.trimestre = parseInt(trimestre);
    
    // CORREÇÃO: Usar parseDataUTC e parseDataFimUTC para evitar problemas de timezone
    if (dataInicio && dataFim) {
      const dataInicioUTC = parseDataUTC(dataInicio);
      const dataFimUTC = parseDataFimUTC(dataFim);
      
      filter.data = {
        $gte: dataInicioUTC,
        $lte: dataFimUTC
      };
      
      console.log('📅 Backend - Datas convertidas:', {
        dataInicioOriginal: dataInicio,
        dataFimOriginal: dataFim,
        dataInicioUTC: dataInicioUTC.toISOString(),
        dataFimUTC: dataFimUTC.toISOString()
      });
    }
    
    console.log('🔍 Backend - Query MongoDB:', JSON.stringify(filter, null, 2));
    
    // Debug: Verifica se existe o campo turma nos registros
    if (turma) {
      const amostraComTurma = await Frequencia.findOne(filter).select('turma aluno data').lean();
      console.log('🔍 Backend - Amostra com turma:', amostraComTurma);
    }
    
    // Estatísticas gerais
    const [total, presencas, faltas, faltasJustificadas] = await Promise.all([
      Frequencia.countDocuments(filter),
      Frequencia.countDocuments({ ...filter, status: 'presente' }),
      Frequencia.countDocuments({ ...filter, status: 'falta' }),
      Frequencia.countDocuments({ ...filter, status: 'falta-justificada' })
    ]);
    
    // Buscar amostra dos registros para debug
    const amostraRegistros = await Frequencia.find(filter)
      .limit(3)
      .select('data ano mes trimestre status')
      .lean();
    
    console.log('✅ Backend - Registros encontrados:', { 
      total, 
      presencas, 
      faltas, 
      faltasJustificadas,
      amostra: amostraRegistros.map(r => ({
        data: r.data.toISOString().split('T')[0],
        ano: r.ano,
        mes: r.mes,
        trimestre: r.trimestre,
        status: r.status
      }))
    });
    
    const percentualPresenca = total > 0 ? ((presencas / total) * 100).toFixed(2) : 100;
    
    // Buscar TODOS os alunos com suas frequências usando agregação
    const todosAlunos = await Frequencia.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$aluno', // Sempre agrupa por aluno (frequência geral)
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
      // Lookup para buscar dados do aluno
      {
        $lookup: {
          from: 'alunos', // Nome da collection no MongoDB
          localField: '_id',
          foreignField: '_id',
          as: 'alunoData',
          // Adicionar pipeline para filtrar no lookup
          pipeline: [
            {
              $match: { ativo: true } // FILTRAR APENAS ALUNOS ATIVOS NO LOOKUP
            }
          ]
        }
      },
      {
        $unwind: {
          path: '$alunoData',
          preserveNullAndEmptyArrays: false // Excluir alunos que não existem ou estão inativos
        }
      },
      // Lookup para buscar dados da turma
      {
        $lookup: {
          from: 'turmas',
          localField: 'alunoData.turma',
          foreignField: '_id',
          as: 'turmaData'
        }
      },
      {
        $unwind: {
          path: '$turmaData',
          preserveNullAndEmptyArrays: true // Permitir alunos sem turma
        }
      },
      {
        $project: {
          _id: 0,
          aluno: {
            _id: '$_id',
            nome: '$alunoData.nome',
            matricula: '$alunoData.matricula',
            turma: {
              _id: '$turmaData._id',
              nome: '$turmaData.nome'
            }
          },
          total: '$totalAulas',
          presentes: '$presencas',
          faltas: '$faltas',
          percentualPresenca: { $round: ['$percentualPresenca', 2] }
        }
      },
      { $sort: { percentualPresenca: 1 } } // Ordenar dos menores para maiores (críticos primeiro)
    ]);
    
    console.log(`📋 Backend - Alunos agregados: ${todosAlunos.length} alunos encontrados`);
    console.log('🔍 DEBUG - Filtro usado na agregação:', JSON.stringify(filter, null, 2));
    
    // VALIDAÇÃO EXTRA: Filtrar alunos que não têm dados válidos
    const alunosValidos = todosAlunos.filter(a => {
      // Verificar se o aluno tem dados completos
      if (!a.aluno || !a.aluno._id || !a.aluno.nome) {
        console.log('⚠️ Aluno sem dados completos removido:', a);
        return false;
      }
      return true;
    });
    
    console.log(`✅ Backend - Alunos válidos após filtragem: ${alunosValidos.length} de ${todosAlunos.length}`);
    
    if (alunosValidos.length > 0) {
      console.log('📊 Lista completa de alunos retornados:', alunosValidos.map(a => ({
        nome: a.aluno?.nome || 'SEM NOME',
        _id: a.aluno?._id,
        matricula: a.aluno?.matricula,
        total: a.total,
        presentes: a.presentes,
        percentual: a.percentualPresenca
      })));
    } else {
      console.log('⚠️ NENHUM ALUNO VÁLIDO RETORNADO - Verificando se há registros sem filtros...');
      const totalSemFiltro = await Frequencia.countDocuments({ ativo: true });
      console.log(`📊 Total de registros sem filtro: ${totalSemFiltro}`);
    }
    
    // Classificar alunos por status de frequência (usar alunosValidos)
    const alunosClassificados = alunosValidos.map(aluno => {
      const percentual = aluno.percentualPresenca;
      let classificacao = '';
      
      if (percentual >= 80) {
        classificacao = 'adequado';
      } else if (percentual >= 60) {
        classificacao = 'atencao';
      } else {
        classificacao = 'critico';
      }
      
      return {
        aluno: aluno.aluno,
        total: aluno.total,
        presentes: aluno.presentes,
        faltas: aluno.faltas,
        percentualPresenca: aluno.percentualPresenca,
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
    
    console.log('📊 Backend - Resposta Dashboard:', {
      totalRegistros: total,
      presentes: presencas,
      faltas,
      faltasJustificadas,
      totalAlunos: alunosClassificados.length,
      contadores
    });
    
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
    console.error('❌ Backend - Erro ao gerar dashboard:', error);
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
    const { data, ano, trimestre, dataInicio, dataFim } = req.query;
    
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
    
    // Se houver intervalo de datas, usa ele no acumulado
    if (dataInicio && dataFim) {
      filtroAcumulado.data = {
        $gte: parseDataUTC(dataInicio),
        $lte: parseDataFimUTC(dataFim)
      };
    } else {
      // Senão, acumula até a data de referência
      if (data) {
        filtroAcumulado.data = { $lte: parseDataFimUTC(data) };
      }
      if (ano) {
        filtroAcumulado.ano = parseInt(ano);
        filtroHoje.ano = parseInt(ano);
      }
      if (trimestre) {
        filtroAcumulado.trimestre = parseInt(trimestre);
        filtroHoje.trimestre = parseInt(trimestre);
      }
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
    if (percentualPresenca < 60) classificacao = 'critico';
    else if (percentualPresenca < 80) classificacao = 'atencao';
    
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
      classificacao,
      periodo: dataInicio && dataFim ? { inicio: dataInicio, fim: dataFim } : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar estatísticas', error: error.message });
  }
};

// @desc    Obter estatísticas de frequência por período
// @route   GET /api/frequencias/turma/:turmaId/periodo
exports.getEstatisticasPorPeriodo = async (req, res) => {
  try {
    const { turmaId } = req.params;
    const { dataInicio, dataFim, tipo = 'diario' } = req.query;
    // tipo: 'diario', 'semanal', 'mensal', 'trimestral'
    
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ message: 'dataInicio e dataFim são obrigatórios' });
    }
    
    const Turma = require('../models/Turma');
    const turma = await Turma.findById(turmaId).populate('alunos');
    
    if (!turma) {
      return res.status(404).json({ message: 'Turma não encontrada' });
    }
    
    const filtro = {
      turma: turmaId,
      data: {
        $gte: parseDataUTC(dataInicio),
        $lte: parseDataFimUTC(dataFim)
      },
      ativo: true
    };
    
    // Agregação para obter dados por dia
    let groupBy;
    if (tipo === 'diario') {
      groupBy = {
        ano: '$ano',
        mes: '$mes',
        dia: { $dayOfMonth: '$data' }
      };
    } else if (tipo === 'semanal') {
      groupBy = {
        ano: '$ano',
        semana: { $week: '$data' }
      };
    } else if (tipo === 'mensal') {
      groupBy = {
        ano: '$ano',
        mes: '$mes'
      };
    } else if (tipo === 'trimestral') {
      groupBy = {
        ano: '$ano',
        trimestre: '$trimestre'
      };
    }
    
    const estatisticasPorPeriodo = await Frequencia.aggregate([
      { $match: filtro },
      {
        $group: {
          _id: groupBy,
          total: { $sum: 1 },
          presentes: {
            $sum: { $cond: [{ $eq: ['$status', 'presente'] }, 1, 0] }
          },
          faltas: {
            $sum: { $cond: [{ $eq: ['$status', 'falta'] }, 1, 0] }
          },
          justificadas: {
            $sum: { $cond: [{ $eq: ['$status', 'falta-justificada'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.ano': 1, '_id.mes': 1, '_id.dia': 1 } }
    ]);
    
    // Calcular percentuais
    const estatisticasComPercentuais = estatisticasPorPeriodo.map(stat => ({
      ...stat,
      percentualPresenca: ((stat.presentes / stat.total) * 100).toFixed(2),
      percentualFaltas: ((stat.faltas / stat.total) * 100).toFixed(2)
    }));
    
    // Totais gerais do período
    const [totalGeral, presentesGeral, faltasGeral, justificadasGeral] = await Promise.all([
      Frequencia.countDocuments(filtro),
      Frequencia.countDocuments({ ...filtro, status: 'presente' }),
      Frequencia.countDocuments({ ...filtro, status: 'falta' }),
      Frequencia.countDocuments({ ...filtro, status: 'falta-justificada' })
    ]);
    
    const percentualPresencaGeral = totalGeral > 0 
      ? parseFloat(((presentesGeral / totalGeral) * 100).toFixed(2))
      : 100;
    
    res.json({
      turma: turma.nome,
      periodo: { inicio: dataInicio, fim: dataFim, tipo },
      estatisticasPorPeriodo: estatisticasComPercentuais,
      resumoGeral: {
        total: totalGeral,
        presentes: presentesGeral,
        faltas: faltasGeral,
        justificadas: justificadasGeral,
        percentualPresenca: percentualPresencaGeral
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar estatísticas por período', error: error.message });
  }
};

// @desc    Obter frequência acumulada individual do aluno com histórico por período
// @route   GET /api/frequencias/aluno/:alunoId/acumulado
exports.getFrequenciaAcumuladaAluno = async (req, res) => {
  try {
    const { alunoId } = req.params;
    const { dataInicio, dataFim, disciplina, turma } = req.query;
    
    const Aluno = require('../models/Aluno');
    const aluno = await Aluno.findById(alunoId);
    
    if (!aluno) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    
    const filtro = { aluno: alunoId, ativo: true };
    
    if (dataInicio && dataFim) {
      filtro.data = {
        $gte: parseDataUTC(dataInicio),
        $lte: parseDataFimUTC(dataFim)
      };
    }
    if (disciplina) filtro.disciplina = disciplina;
    if (turma) filtro.turma = turma;
    
    // Buscar todas as frequências do período
    const frequencias = await Frequencia.find(filtro)
      .populate('disciplina', 'nome codigo')
      .populate('turma', 'nome')
      .sort({ data: 1 });
    
    // Estatísticas gerais
    const total = frequencias.length;
    const presentes = frequencias.filter(f => f.status === 'presente').length;
    const faltas = frequencias.filter(f => f.status === 'falta').length;
    const justificadas = frequencias.filter(f => f.status === 'falta-justificada').length;
    const percentualPresenca = total > 0 ? parseFloat(((presentes / total) * 100).toFixed(2)) : 100;
    
    // Agrupar por disciplina
    const porDisciplina = {};
    frequencias.forEach(freq => {
      // Verificar se a disciplina está populada
      if (!freq.disciplina || !freq.disciplina._id) {
        console.log('⚠️ Frequência sem disciplina válida:', freq._id);
        return; // Pular esta frequência
      }
      
      const disciplinaId = freq.disciplina._id.toString();
      if (!porDisciplina[disciplinaId]) {
        porDisciplina[disciplinaId] = {
          disciplina: freq.disciplina,
          total: 0,
          presentes: 0,
          faltas: 0,
          justificadas: 0
        };
      }
      porDisciplina[disciplinaId].total++;
      if (freq.status === 'presente') porDisciplina[disciplinaId].presentes++;
      if (freq.status === 'falta') porDisciplina[disciplinaId].faltas++;
      if (freq.status === 'falta-justificada') porDisciplina[disciplinaId].justificadas++;
    });
    
    // Calcular percentuais por disciplina
    const estatisticasPorDisciplina = Object.values(porDisciplina).map(disc => ({
      ...disc,
      percentualPresenca: ((disc.presentes / disc.total) * 100).toFixed(2)
    }));
    
    // Histórico dia a dia (últimos registros)
    const historicoDiario = await Frequencia.aggregate([
      { $match: filtro },
      {
        $group: {
          _id: '$data',
          presentes: { $sum: { $cond: [{ $eq: ['$status', 'presente'] }, 1, 0] } },
          faltas: { $sum: { $cond: [{ $eq: ['$status', 'falta'] }, 1, 0] } },
          justificadas: { $sum: { $cond: [{ $eq: ['$status', 'falta-justificada'] }, 1, 0] } },
          total: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } },
      { $limit: 30 } // Últimos 30 dias com registro
    ]);
    
    res.json({
      aluno: {
        _id: aluno._id,
        nome: aluno.nome,
        matricula: aluno.matricula
      },
      periodo: {
        inicio: dataInicio || null,
        fim: dataFim || null,
        descricao: dataInicio && dataFim ? `${dataInicio} a ${dataFim}` : 'Todos os registros'
      },
      resumoGeral: {
        total,
        presentes,
        faltas,
        justificadas,
        percentualPresenca
      },
      porDisciplina: estatisticasPorDisciplina,
      historicoDiario: historicoDiario.map(h => ({
        _id: h._id,
        data: h._id,
        presentes: h.presentes || 0,
        faltas: h.faltas || 0,
        justificadas: h.justificadas || 0,
        total: h.total || 0,
        percentualPresenca: h.total > 0 ? ((h.presentes / h.total) * 100).toFixed(2) : '0'
      })),
      frequencias: frequencias.slice(0, 50) // Últimas 50 frequências detalhadas
    });
  } catch (error) {
    console.error('Erro em getFrequenciaAcumuladaAluno:', error);
    res.status(500).json({ message: 'Erro ao buscar frequência acumulada do aluno', error: error.message });
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
/**
 * REGISTRO DE FREQUÊNCIA GERAL SIMPLIFICADA
 * Registra apenas 1 registro por aluno por dia (não por disciplina)
 * Controla presença geral do dia na escola
 */
exports.registrarChamadaTurmaGeral = async (req, res) => {
  try {
    const { turmaId } = req.params;
    const { data, periodo, presencas } = req.body;
    
    // Validações iniciais
    if (!turmaId) {
      return res.status(400).json({ 
        message: 'ID da turma é obrigatório',
        detalhes: 'Forneça o ID da turma no parâmetro da URL'
      });
    }
    
    if (!data) {
      return res.status(400).json({ 
        message: 'Data é obrigatória',
        detalhes: 'Forneça a data no formato YYYY-MM-DD'
      });
    }
    
    if (!presencas || typeof presencas !== 'object') {
      return res.status(400).json({ 
        message: 'Presenças são obrigatórias',
        detalhes: 'Forneça um objeto com { alunoId: "status" }'
      });
    }
    
    console.log('\n🚀 INICIANDO REGISTRO DE FREQUÊNCIA GERAL (SIMPLIFICADA)');
    console.log(`📅 Data: ${data}`);
    console.log(`🏫 Turma ID: ${turmaId}`);
    console.log(`📊 Total de presenças recebidas: ${Object.keys(presencas).length}`);
    
    const Turma = require('../models/Turma');
    const turma = await Turma.findById(turmaId).populate('alunos');
    
    if (!turma) {
      return res.status(404).json({ 
        message: 'Turma não encontrada',
        detalhes: `Nenhuma turma encontrada com o ID: ${turmaId}`
      });
    }
    
    console.log(`✅ Turma encontrada: ${turma.nome}`);
    console.log(`👥 Total de alunos: ${turma.alunos.length}`);
    
    // Validar se turma tem alunos
    if (!turma.alunos || turma.alunos.length === 0) {
      return res.status(400).json({ 
        message: 'Turma sem alunos cadastrados',
        detalhes: `A turma "${turma.nome}" não possui alunos. Cadastre alunos primeiro.`
      });
    }
    
    const frequenciasCriadas = [];
    const frequenciasAtualizadas = [];
    const erros = [];
    const dataUTC = parseDataUTC(data);
    const ano = extrairAno(data);
    const periodoFinal = periodo || turma.turno || 'matutino';
    
    // Calcular mês e trimestre a partir da data
    const dataObj = new Date(dataUTC);
    const mes = dataObj.getMonth() + 1; // 1-12
    let trimestre;
    if (mes <= 3) trimestre = 1;
    else if (mes <= 6) trimestre = 2;
    else if (mes <= 9) trimestre = 3;
    else trimestre = 4;
    
    console.log(`\n📝 Iniciando salvamento de frequência geral para ${turma.alunos.length} alunos (1 registro por aluno)`);
    console.log(`📅 Data: ${data} → Ano: ${ano}, Mês: ${mes}, Trimestre: ${trimestre}`);
    
    // Para cada aluno, criar apenas 1 registro (presença geral do dia)
    for (const aluno of turma.alunos) {
      const status = presencas[aluno._id] || 'presente';
      
      try {
        // Validar dados do registro
        if (!aluno._id) {
          throw new Error('ID do aluno inválido');
        }
        
        const frequenciaData = {
          aluno: aluno._id,
          turma: turmaId,
          data: dataUTC,
          status,
          periodo: periodoFinal,
          ano: ano,
          mes: mes,
          trimestre: trimestre,
          registradoPor: req.user?._id
          // disciplina e professor são opcionais - frequência geral não precisa
        };
        
        // Verificar se já existe (índice único: aluno + data)
        const existente = await Frequencia.findOne({
          aluno: aluno._id,
          data: dataUTC
        });
        
        if (existente) {
          // Atualizar existente
          const statusAnterior = existente.status;
          existente.status = status;
          existente.periodo = periodoFinal;
          await existente.save();
          
          frequenciasAtualizadas.push({
            _id: existente._id,
            aluno: aluno.nome,
            statusAnterior: statusAnterior,
            statusNovo: status
          });
          
          console.log(`   🔄 Atualizado: ${aluno.nome} (${statusAnterior} → ${status})`);
        } else {
          // Criar novo
          const freq = await Frequencia.create(frequenciaData);
          frequenciasCriadas.push({
            _id: freq._id,
            aluno: aluno.nome,
            status: status,
            ano: freq.ano,
            mes: freq.mes,
            trimestre: freq.trimestre
          });
          
          console.log(`   ✅ Criado: ${aluno.nome} (${status})`);
        }
      } catch (error) {
        console.error(`❌ Erro ao salvar frequência: ${aluno.nome}:`, error.message);
        erros.push({ 
          aluno: aluno.nome, 
          alunoId: aluno._id,
          erro: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
    
    const totalProcessado = frequenciasCriadas.length + frequenciasAtualizadas.length;
    const totalEsperado = turma.alunos.length;
    
    console.log(`\n📦 RESUMO DO SALVAMENTO:`);
    console.log(`   ✅ Criados: ${frequenciasCriadas.length}`);
    console.log(`   🔄 Atualizados: ${frequenciasAtualizadas.length}`);
    console.log(`   📊 Total processado: ${totalProcessado}/${totalEsperado}`);
    console.log(`   ❌ Erros: ${erros.length}`);
    
    if (erros.length > 0) {
      console.log(`\n⚠️ DETALHES DOS ERROS:`);
      erros.forEach((erro, index) => {
        console.log(`   ${index + 1}. ${erro.aluno}: ${erro.erro}`);
      });
    }
    
    // Se houve muitos erros, retornar erro
    if (erros.length > totalEsperado * 0.5) {
      return res.status(500).json({
        message: 'Falha ao registrar a maioria das frequências',
        detalhes: `Apenas ${totalProcessado} de ${totalEsperado} frequências foram salvas com sucesso`,
        criados: frequenciasCriadas.length,
        atualizados: frequenciasAtualizadas.length,
        erros: erros,
        totalErros: erros.length
      });
    }
    
    // Sucesso (mesmo com alguns erros)
    const response = {
      message: erros.length > 0 
        ? `Chamada registrada com ${erros.length} erro(s)` 
        : 'Chamada registrada com sucesso',
      sucesso: true,
      total: totalProcessado,
      criados: frequenciasCriadas.length,
      atualizados: frequenciasAtualizadas.length,
      alunos: turma.alunos.length,
      registrosPorAluno: 1, // Agora é sempre 1 registro por aluno
      esperado: totalEsperado,
      percentualSucesso: ((totalProcessado / totalEsperado) * 100).toFixed(2)
    };
    
    if (erros.length > 0) {
      response.erros = erros;
      response.totalErros = erros.length;
    }
    
    console.log(`✅ CONCLUÍDO COM SUCESSO (${response.percentualSucesso}%)\n`);
    
    res.status(erros.length > 0 ? 207 : 201).json(response);
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO ao registrar chamada:', error);
    res.status(400).json({ 
      message: 'Erro ao registrar chamada', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Verificar se frequências foram salvas (endpoint de debug)
// @route   GET /api/frequencias/verificar/:turmaId/:data
exports.verificarFrequenciasSalvas = async (req, res) => {
  try {
    const { turmaId, data } = req.params;
    
    console.log('\n🔍 VERIFICAÇÃO DE FREQUÊNCIAS SALVAS');
    console.log(`📅 Data: ${data}`);
    console.log(`🏫 Turma ID: ${turmaId}`);
    
    const Turma = require('../models/Turma');
    const turma = await Turma.findById(turmaId)
      .populate('alunos')
      .populate('disciplinas.disciplina');
    
    if (!turma) {
      return res.status(404).json({ message: 'Turma não encontrada' });
    }
    
    const dataUTC = parseDataUTC(data);
    
    // Buscar todas as frequências do dia
    const frequenciasDoDia = await Frequencia.find({
      turma: turmaId,
      data: dataUTC,
      ativo: true
    })
      .populate('aluno', 'nome matricula')
      .populate('disciplina', 'nome codigo')
      .populate('professor', 'nome')
      .sort({ 'aluno.nome': 1, 'disciplina.nome': 1 });
    
    // Estatísticas
    const totalEsperado = turma.alunos.length * turma.disciplinas.length;
    const totalSalvo = frequenciasDoDia.length;
    const percentual = totalEsperado > 0 ? ((totalSalvo / totalEsperado) * 100).toFixed(2) : 0;
    
    // Contar por status
    const presentes = frequenciasDoDia.filter(f => f.status === 'presente').length;
    const faltas = frequenciasDoDia.filter(f => f.status === 'falta').length;
    const justificadas = frequenciasDoDia.filter(f => f.status === 'falta-justificada').length;
    
    // Identificar alunos sem registro
    const alunosComRegistro = new Set(frequenciasDoDia.map(f => f.aluno._id.toString()));
    const alunosSemRegistro = turma.alunos.filter(a => !alunosComRegistro.has(a._id.toString()));
    
    // Agrupar por aluno
    const porAluno = {};
    frequenciasDoDia.forEach(freq => {
      const alunoId = freq.aluno._id.toString();
      if (!porAluno[alunoId]) {
        porAluno[alunoId] = {
          aluno: freq.aluno.nome,
          matricula: freq.aluno.matricula,
          disciplinas: []
        };
      }
      porAluno[alunoId].disciplinas.push({
        disciplina: freq.disciplina.nome,
        status: freq.status,
        professor: freq.professor?.nome || 'Não informado',
        ano: freq.ano,
        mes: freq.mes,
        trimestre: freq.trimestre
      });
    });
    
    const resultado = {
      turma: turma.nome,
      data: data,
      dataUTC: dataUTC.toISOString(),
      resumo: {
        totalAlunos: turma.alunos.length,
        totalDisciplinas: turma.disciplinas.length,
        registrosEsperados: totalEsperado,
        registrosSalvos: totalSalvo,
        percentualCompletude: parseFloat(percentual),
        status: percentual >= 100 ? 'COMPLETO' : percentual >= 50 ? 'PARCIAL' : 'INCOMPLETO'
      },
      estatisticas: {
        presentes,
        faltas,
        justificadas,
        percentualPresenca: totalSalvo > 0 ? ((presentes / totalSalvo) * 100).toFixed(2) : 0
      },
      alunosSemRegistro: alunosSemRegistro.map(a => ({
        id: a._id,
        nome: a.nome,
        matricula: a.matricula
      })),
      frequenciasPorAluno: Object.values(porAluno),
      todosRegistros: frequenciasDoDia.map(f => ({
        id: f._id,
        aluno: f.aluno.nome,
        disciplina: f.disciplina.nome,
        status: f.status,
        professor: f.professor?.nome,
        periodo: f.periodo,
        ano: f.ano,
        mes: f.mes,
        trimestre: f.trimestre,
        criadoEm: f.createdAt,
        atualizadoEm: f.updatedAt
      }))
    };
    
    console.log(`✅ Verificação concluída:`);
    console.log(`   Registros salvos: ${totalSalvo}/${totalEsperado} (${percentual}%)`);
    console.log(`   Alunos sem registro: ${alunosSemRegistro.length}`);
    
    res.json(resultado);
  } catch (error) {
    console.error('❌ Erro ao verificar frequências:', error);
    res.status(500).json({ 
      message: 'Erro ao verificar frequências salvas', 
      error: error.message 
    });
  }
};
