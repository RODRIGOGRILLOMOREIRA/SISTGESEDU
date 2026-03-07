const Avaliacao = require('../models/Avaliacao');
const Habilidade = require('../models/Habilidade');
const { paginate, paginatedResponse } = require('../utils/helpers');
const { validarAvaliacao, gerarEstatisticas } = require('../utils/classificacao');

// @desc    Listar avaliações com filtros
// @route   GET /api/avaliacoes
exports.getAvaliacoes = async (req, res) => {
  try {
    const { page = 1, limit = 20, aluno, turma, disciplina, ano, trimestre } = req.query;
    const { skip, limitNum, pageNum } = paginate(page, limit);
    
    const filter = {};
    if (aluno) filter.aluno = aluno;
    if (turma) filter.turma = turma;
    if (disciplina) filter.disciplina = disciplina;
    if (ano) filter.ano = parseInt(ano);
    if (trimestre) filter.trimestre = parseInt(trimestre);
    
    const [avaliacoes, total] = await Promise.all([
      Avaliacao.find(filter)
        .populate('aluno', 'nome matricula')
        .populate('disciplina', 'nome codigo')
        .populate('turma', 'nome')
        .populate('professor', 'nome')
        .sort({ ano: -1, trimestre: -1 })
        .skip(skip)
        .limit(limitNum),
      Avaliacao.countDocuments(filter)
    ]);
    
    res.json(paginatedResponse(avaliacoes, pageNum, limitNum, total));
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar avaliações', error: error.message });
  }
};

// @desc    Buscar avaliação por ID
// @route   GET /api/avaliacoes/:id
exports.getAvaliacaoById = async (req, res) => {
  try {
    const avaliacao = await Avaliacao.findById(req.params.id)
      .populate('aluno')
      .populate('disciplina')
      .populate('turma')
      .populate('professor');
    
    if (!avaliacao) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }
    res.json(avaliacao);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar avaliação', error: error.message });
  }
};

// @desc    Criar ou atualizar avaliação
// @route   POST /api/avaliacoes
exports.createAvaliacao = async (req, res) => {
  try {
    const { aluno, disciplina, turma, ano, trimestre } = req.body;
    
    // Verificar se já existe avaliação para este aluno/disciplina/trimestre
    let avaliacao = await Avaliacao.findOne({
      aluno,
      disciplina,
      turma,
      ano,
      trimestre
    });
    
    if (avaliacao) {
      // Atualizar existente - usar objeto e .save() para disparar hooks
      Object.assign(avaliacao, req.body);
      await avaliacao.save();
    } else {
      // Criar nova
      avaliacao = await Avaliacao.create(req.body);
    }
    
    // Repopular para retornar dados completos
    avaliacao = await Avaliacao.findById(avaliacao._id)
      .populate('aluno', 'nome matricula')
      .populate('disciplina', 'nome codigo')
      .populate('turma', 'nome')
      .populate('professor', 'nome');
    
    res.status(201).json(avaliacao);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar avaliação', error: error.message });
  }
};

// @desc    Atualizar pontos de corte (P.C. 01, P.C. 02, P.C. 03 ou E.A.C)
// @route   PUT /api/avaliacoes/:id/pontos-corte
exports.atualizarPontosCorte = async (req, res) => {
  try {
    const { id } = req.params;
    const { pontosCorte } = req.body;
    
    // Validar dados
    const validacao = validarAvaliacao(pontosCorte);
    if (!validacao.valid) {
      return res.status(400).json({ 
        message: 'Validação falhou', 
        errors: validacao.errors 
      });
    }
    
    const avaliacao = await Avaliacao.findById(id);
    if (!avaliacao) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }
    
    // Atualizar pontos de corte
    if (pontosCorte.pc1) {
      avaliacao.pontosCorte.pc1 = {
        ...avaliacao.pontosCorte.pc1,
        ...pontosCorte.pc1
      };
    }
    
    if (pontosCorte.pc2) {
      avaliacao.pontosCorte.pc2 = {
        ...avaliacao.pontosCorte.pc2,
        ...pontosCorte.pc2
      };
    }
    
    if (pontosCorte.pc3) {
      avaliacao.pontosCorte.pc3 = {
        ...avaliacao.pontosCorte.pc3,
        ...pontosCorte.pc3
      };
    }
    
    if (pontosCorte.eac) {
      avaliacao.pontosCorte.eac = {
        ...avaliacao.pontosCorte.eac,
        ...pontosCorte.eac
      };
    }
    
    // Atualizar observações se fornecidas
    if (req.body.observacoes !== undefined) {
      avaliacao.observacoes = req.body.observacoes;
    }
    
    // Salvar (triggers automáticos calculam tudo)
    await avaliacao.save();
    
    // Atualizar habilidades se fornecidas
    const todasHabilidades = [
      ...(pontosCorte.pc1?.habilidades || []),
      ...(pontosCorte.pc2?.habilidades || []),
      ...(pontosCorte.pc3?.habilidades || []),
      ...(pontosCorte.eac?.habilidades || [])
    ].filter(Boolean);
    
    if (todasHabilidades.length > 0) {
      await atualizarHabilidadesAluno(avaliacao.aluno, todasHabilidades, avaliacao.trimestre);
    }
    
    // Repopular e retornar
    const avaliacaoAtualizada = await Avaliacao.findById(id)
      .populate('aluno', 'nome matricula')
      .populate('disciplina', 'nome codigo')
      .populate('turma', 'nome')
      .populate('pontosCorte.pc1.habilidades', 'codigo descricao')
      .populate('pontosCorte.pc2.habilidades', 'codigo descricao')
      .populate('pontosCorte.eac.habilidades', 'codigo descricao');
    
    res.json(avaliacaoAtualizada);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar pontos de corte', error: error.message });
  }
};

// @desc    Buscar avaliações por turma/disciplina com todos os alunos
// @route   GET /api/avaliacoes/turma/:turmaId/disciplina/:disciplinaId
exports.getAvaliacoesPorTurmaDisciplina = async (req, res) => {
  try {
    const { turmaId, disciplinaId } = req.params;
    const { trimestre, ano = new Date().getFullYear() } = req.query;
    
    if (!trimestre) {
      return res.status(400).json({ message: 'Trimestre é obrigatório' });
    }
    
    // Buscar todos os alunos da turma
    const Aluno = require('../models/Aluno');
    const alunos = await Aluno.find({ turma: turmaId, ativo: true }).sort({ nome: 1 });
    
    // Buscar avaliações existentes
    const avaliacoes = await Avaliacao.find({
      turma: turmaId,
      disciplina: disciplinaId,
      ano: parseInt(ano),
      trimestre: parseInt(trimestre)
    })
    .populate('aluno', 'nome matricula')
    .populate('pontosCorte.pc1.habilidades', 'codigo descricao')
    .populate('pontosCorte.pc2.habilidades', 'codigo descricao')
    .populate('pontosCorte.eac.habilidades', 'codigo descricao');
    
    // Criar map de avaliações por aluno
    const avaliacoesMap = new Map();
    avaliacoes.forEach(av => {
      avaliacoesMap.set(av.aluno._id.toString(), av);
    });
    
    // Montar resposta com todos os alunos
    const resultado = alunos.map(aluno => {
      const avaliacao = avaliacoesMap.get(aluno._id.toString());
      return {
        aluno: {
          _id: aluno._id,
          nome: aluno.nome,
          matricula: aluno.matricula
        },
        avaliacao: avaliacao || null
      };
    });
    
    // Gerar estatísticas
    const stats = gerarEstatisticas(avaliacoes);
    
    res.json({
      alunos: resultado,
      estatisticas: stats,
      total: resultado.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar avaliações', error: error.message });
  }
};

// Função auxiliar para atualizar habilidades do aluno
async function atualizarHabilidadesAluno(alunoId, habilidadesIds, trimestre) {
  try {
    for (const habId of habilidadesIds) {
      // Verificar se habilidade existe
      const habilidade = await Habilidade.findById(habId);
      if (!habilidade) continue;
      
      // Verificar se aluno já está na lista
      const alunoExiste = habilidade.alunosDesempenho.some(
        ad => ad.aluno.toString() === alunoId.toString()
      );
      
      if (!alunoExiste) {
        habilidade.alunosDesempenho.push({
          aluno: alunoId,
          nivel: 'em-desenvolvimento',
          observacao: `Trabalhada no ${trimestre}º trimestre`
        });
        await habilidade.save();
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar habilidades:', error);
  }
}

// @desc    Adicionar nota a uma avaliação existente (SISTEMA ANTIGO - mantido para compatibilidade)
// @route   POST /api/avaliacoes/:id/notas
exports.adicionarNota = async (req, res) => {
  try {
    const avaliacao = await Avaliacao.findById(req.params.id);
    
    if (!avaliacao) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }
    
    avaliacao.avaliacoes.push(req.body);
    await avaliacao.save();
    
    res.json(avaliacao);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao adicionar nota', error: error.message });
  }
};

// @desc    Calcular média anual do aluno
// @route   GET /api/avaliacoes/aluno/:alunoId/media-anual
exports.getMediaAnual = async (req, res) => {
  try {
    const { alunoId } = req.params;
    const { disciplina, ano } = req.query;
    
    const avaliacoes = await Avaliacao.find({
      aluno: alunoId,
      disciplina,
      ano,
      trimestre: { $in: [1, 2, 3] }
    }).sort({ trimestre: 1 });
    
    if (avaliacoes.length === 0) {
      return res.json({ mediaAnual: 0, avaliacoes: [] });
    }
    
    // Criar objeto com notas por trimestre
    const notasPorTrimestre = {};
    avaliacoes.forEach(av => {
      if (av.notaTrimestre !== null && av.notaTrimestre !== undefined) {
        notasPorTrimestre[av.trimestre] = av.notaTrimestre;
      }
    });
    
    // Fórmula com pesos: (T1×3 + T2×3 + T3×4) / 10
    const t1 = notasPorTrimestre[1] || 0;
    const t2 = notasPorTrimestre[2] || 0;
    const t3 = notasPorTrimestre[3] || 0;
    
    const mediaAnual = ((t1 * 3) + (t2 * 3) + (t3 * 4)) / 10;
    
    res.json({
      mediaAnual: mediaAnual.toFixed(2),
      trimestres: {
        primeiro: t1,
        segundo: t2,
        terceiro: t3
      },
      avaliacoes: avaliacoes.map(av => ({
        trimestre: av.trimestre,
        notaTrimestre: av.notaTrimestre,
        avaliacoes: av.avaliacoes
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao calcular média anual', error: error.message });
  }
};

// @desc    Atualizar avaliação
// @route   PUT /api/avaliacoes/:id
exports.updateAvaliacao = async (req, res) => {
  try {
    let avaliacao = await Avaliacao.findById(req.params.id);
    
    if (!avaliacao) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }
    
    // Atualizar usando Object.assign e .save() para disparar hooks
    Object.assign(avaliacao, req.body);
    await avaliacao.save();
    
    // Repopular para retornar dados completos
    avaliacao = await Avaliacao.findById(avaliacao._id)
      .populate('aluno', 'nome matricula')
      .populate('disciplina', 'nome codigo')
      .populate('turma', 'nome')
      .populate('professor', 'nome');
    
    res.json(avaliacao);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar avaliação', error: error.message });
  }
};

// @desc    Deletar avaliação
// @route   DELETE /api/avaliacoes/:id
exports.deleteAvaliacao = async (req, res) => {
  try {
    const avaliacao = await Avaliacao.findByIdAndDelete(req.params.id);
    
    if (!avaliacao) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }
    res.json({ message: 'Avaliação deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar avaliação', error: error.message });
  }
};

// @desc    Buscar habilidades disponíveis para uma avaliação
// @route   GET /api/avaliacoes/habilidades-disponiveis
exports.getHabilidadesDisponiveis = async (req, res) => {
  try {
    const { disciplina, turma, ano, trimestre } = req.query;
    const Habilidade = require('../models/Habilidade');
    
    const filter = { ativo: true };
    if (disciplina) filter.disciplina = disciplina;
    if (turma) filter.turma = turma;
    if (ano) filter.ano = parseInt(ano);
    if (trimestre) filter.trimestre = parseInt(trimestre);
    
    const habilidades = await Habilidade.find(filter)
      .populate('disciplina', 'nome codigo')
      .select('codigo descricao disciplina ano trimestre');
    
    res.json(habilidades);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar habilidades', error: error.message });
  }
};

// @desc    Atualizar habilidades em uma avaliação específica
// @route   PUT /api/avaliacoes/:id/avaliacoes/:avaliacaoIndex/habilidades
exports.updateHabilidadesAvaliacao = async (req, res) => {
  try {
    const { id, avaliacaoIndex } = req.params;
    const { habilidades } = req.body; // Array de { habilidade, nivel, observacao }
    
    const avaliacao = await Avaliacao.findById(id);
    
    if (!avaliacao) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }
    
    if (!avaliacao.avaliacoes[avaliacaoIndex]) {
      return res.status(404).json({ message: 'Item de avaliação não encontrado' });
    }
    
    avaliacao.avaliacoes[avaliacaoIndex].habilidades = habilidades;
    await avaliacao.save();
    
    // Repopular para retornar dados completos
    const avaliacaoAtualizada = await Avaliacao.findById(id)
      .populate('aluno', 'nome matricula')
      .populate('disciplina', 'nome codigo')
      .populate('turma', 'nome')
      .populate('avaliacoes.habilidades.habilidade', 'codigo descricao');
    
    res.json(avaliacaoAtualizada);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar habilidades', error: error.message });
  }
};

// @desc    Relatório de evolução de habilidades do aluno
// @route   GET /api/avaliacoes/aluno/:alunoId/evolucao-habilidades
exports.getEvolucaoHabilidades = async (req, res) => {
  try {
    const { alunoId } = req.params;
    const { disciplina, ano } = req.query;
    
    const filter = { aluno: alunoId };
    if (disciplina) filter.disciplina = disciplina;
    if (ano) filter.ano = parseInt(ano);
    
    const avaliacoes = await Avaliacao.find(filter)
      .populate('disciplina', 'nome codigo')
      .populate('avaliacoes.habilidades.habilidade', 'codigo descricao')
      .sort({ ano: 1, trimestre: 1 });
    
    // Agrupar habilidades e calcular evolução
    const habilidadesMap = new Map();
    const niveisValor = {
      'nao-desenvolvido': 0,
      'em-desenvolvimento': 1,
      'desenvolvido': 2,
      'plenamente-desenvolvido': 3
    };
    
    avaliacoes.forEach(av => {
      av.avaliacoes.forEach((item, itemIndex) => {
        if (item.habilidades && item.habilidades.length > 0) {
          item.habilidades.forEach(hab => {
            if (!hab.habilidade) return;
            
            const habId = hab.habilidade._id.toString();
            if (!habilidadesMap.has(habId)) {
              habilidadesMap.set(habId, {
                habilidade: hab.habilidade,
                registros: []
              });
            }
            
            habilidadesMap.get(habId).registros.push({
              trimestre: av.trimestre,
              ano: av.ano,
              nivel: hab.nivel,
              nivelValor: niveisValor[hab.nivel] || 0,
              data: item.data,
              observacao: hab.observacao
            });
          });
        }
      });
    });
    
    // Calcular estatísticas de evolução
    const evolucao = Array.from(habilidadesMap.values()).map(({ habilidade, registros }) => {
      registros.sort((a, b) => new Date(a.data) - new Date(b.data));
      
      const primeiro = registros[0];
      const ultimo = registros[registros.length - 1];
      const evolucaoPercentual = registros.length > 1
        ? ((ultimo.nivelValor - primeiro.nivelValor) / 3) * 100
        : 0;
      
      return {
        habilidade: {
          _id: habilidade._id,
          codigo: habilidade.codigo,
          descricao: habilidade.descricao
        },
        nivelAtual: ultimo.nivel,
        nivelInicial: primeiro.nivel,
        evolucaoPercentual: evolucaoPercentual.toFixed(1),
        totalAvaliacoes: registros.length,
        historico: registros
      };
    });
    
    res.json({
      aluno: alunoId,
      disciplina,
      ano,
      totalHabilidades: evolucao.length,
      habilidades: evolucao
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar evolução de habilidades', error: error.message });
  }
};

// @desc    Gerar template de avaliações por turma (Sistema de Pontos de Corte)
// @route   GET /api/avaliacoes/template/:turmaId
exports.gerarTemplatePorTurma = async (req, res) => {
  try {
    const { turmaId } = req.params;
    const { disciplinaId, trimestre, ano } = req.query;
    
    const Aluno = require('../models/Aluno');
    const Turma = require('../models/Turma');
    const Disciplina = require('../models/Disciplina');
    const Habilidade = require('../models/Habilidade');
    
    // Buscar turma
    const turma = await Turma.findById(turmaId).populate('disciplinas.disciplina');
    if (!turma) {
      return res.status(404).json({ message: 'Turma não encontrada' });
    }
    
    // Buscar alunos da turma
    const alunos = await Aluno.find({ turma: turmaId, ativo: true }).sort({ nome: 1 });
    
    if (alunos.length === 0) {
      return res.status(400).json({ message: 'Nenhum aluno encontrado nesta turma' });
    }
    
    // Buscar disciplina se especificada
    let disciplina = null;
    if (disciplinaId) {
      disciplina = await Disciplina.findById(disciplinaId);
      if (!disciplina) {
        return res.status(404).json({ message: 'Disciplina não encontrada' });
      }
    }
    
    // Buscar habilidades disponíveis para a disciplina (se especificada)
    let habilidadesDisponiveis = [];
    if (disciplinaId) {
      habilidadesDisponiveis = await Habilidade.find({ 
        disciplina: disciplinaId, 
        ativo: true 
      }).select('codigo descricao').sort({ codigo: 1 });
    }
    
    // Gerar template com dados dos alunos - SISTEMA DE PONTOS DE CORTE
    const template = alunos.map(aluno => ({
      matricula_aluno: aluno.matricula,
      aluno_nome: aluno.nome,
      turma_nome: turma.nome,
      codigo_disciplina: disciplina?.codigo || '',
      disciplina_nome: disciplina?.nome || '',
      trimestre: trimestre || '1',
      ano: ano || new Date().getFullYear(),
      pc1_nota: '', // 0 a 50
      pc1_data: '', // Formato: YYYY-MM-DD
      pc1_habilidades: '', // Ex: EF06MA01,EF06MA02 ou EF06MA01;EF06MA02
      pc2_nota: '', // 0 a 50
      pc2_data: '', // Formato: YYYY-MM-DD
      pc2_habilidades: '', // Ex: EF06MA03,EF06MA04
      eac_nota: '', // 0 a 100
      eac_data: '', // Formato: YYYY-MM-DD
      eac_habilidades: '', // Ex: EF06MA01,EF06MA05
      observacoes: ''
    }));
    
    res.json({
      turma: {
        id: turma._id,
        nome: turma.nome,
        totalAlunos: alunos.length
      },
      disciplina: disciplina ? {
        id: disciplina._id,
        nome: disciplina.nome,
        codigo: disciplina.codigo
      } : null,
      habilidadesDisponiveis: habilidadesDisponiveis.map(h => ({
        codigo: h.codigo,
        descricao: h.descricao
      })),
      template,
      instrucoes: {
        sistema: 'Sistema de Pontos de Corte (P.C. 01, P.C. 02, P.C. 03, E.A.C)',
        pc1: 'P.C. 01: Nota de 0 a 3,0 (com uma casa decimal, ex: 2,5). Data no formato YYYY-MM-DD (ex: 2026-03-15)',
        pc2: 'P.C. 02: Nota de 0 a 3,0 (com uma casa decimal, ex: 2,8). Data no formato YYYY-MM-DD',
        pc3: 'P.C. 03: Nota de 0 a 4,0 (com uma casa decimal, ex: 3,5). Data no formato YYYY-MM-DD',
        eac: 'E.A.C: Nota de 0 a 10 (com uma casa decimal, ex: 9,0). Data no formato YYYY-MM-DD',
        habilidades: 'Preencha as colunas de habilidades (pc1_habilidades, pc2_habilidades, pc3_habilidades, eac_habilidades) com os códigos separados por vírgula ou ponto e vírgula. Exemplo: EF06MA01,EF06MA02 ou EF06MA01;EF06MA02',
        notaFinal: 'A nota final do trimestre será calculada automaticamente como o maior valor entre: (P.C. 01 + P.C. 02 + P.C. 03) ou E.A.C',
        trimestre: 'Valores: 1, 2 ou 3',
        formato_data: 'YYYY-MM-DD (ex: 2026-03-15)',
        multiplas_habilidades: 'Sim, você pode informar várias habilidades separadas por vírgula em cada ponto de corte'
      }
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Erro ao gerar template', error: error.message });
  }
};

// @desc    Importar avaliações em lote - Sistema de Pontos de Corte
// @route   POST /api/avaliacoes/importar
exports.importarAvaliacoes = async (req, res) => {
  try {
    const { avaliacoes } = req.body; // Array de avaliações
    
    if (!Array.isArray(avaliacoes) || avaliacoes.length === 0) {
      return res.status(400).json({ message: 'É necessário fornecer um array de avaliações' });
    }
    
    const Aluno = require('../models/Aluno');
    const Disciplina = require('../models/Disciplina');
    const Turma = require('../models/Turma');
    const Professor = require('../models/Professor');
    const Habilidade = require('../models/Habilidade');
    
    const resultados = {
      sucesso: 0,
      erros: 0,
      atualizados: 0,
      criados: 0,
      detalhes: []
    };

    // Função auxiliar para processar habilidades
    const processarHabilidades = async (habilidadesString, disciplinaId) => {
      if (!habilidadesString || habilidadesString.trim() === '') {
        return [];
      }
      
      // Separar por vírgula ou ponto e vírgula
      const codigosHabilidades = habilidadesString
        .split(/[,;]/)
        .map(codigo => codigo.trim())
        .filter(codigo => codigo.length > 0);
      
      if (codigosHabilidades.length === 0) {
        return [];
      }
      
      // Buscar habilidades pelos códigos
      const habilidadesEncontradas = await Habilidade.find({
        codigo: { $in: codigosHabilidades },
        disciplina: disciplinaId,
        ativo: true
      }).select('_id');
      
      return habilidadesEncontradas.map(h => h._id);
    };
    
    for (const item of avaliacoes) {
      try {
        // Buscar IDs por matrícula, nome, código, etc
        let alunoId = null;
        let disciplinaId = null;
        let turmaId = null;
        let professorId = null;
        
        // Buscar aluno por matrícula
        if (item.matricula_aluno) {
          const aluno = await Aluno.findOne({ 
            matricula: item.matricula_aluno, 
            ativo: true 
          });
          alunoId = aluno?._id;
        }
        
        // Buscar disciplina por código
        if (item.codigo_disciplina) {
          const disciplina = await Disciplina.findOne({ 
            codigo: item.codigo_disciplina,
            ativo: true 
          });
          disciplinaId = disciplina?._id;
        }
        
        // Buscar turma por nome
        if (item.turma_nome) {
          const turma = await Turma.findOne({ 
            nome: { $regex: new RegExp(`^${item.turma_nome}$`, 'i') },
            ativo: true 
          });
          turmaId = turma?._id;
        }
        
        // Buscar professor por nome (opcional)
        if (item.professor_nome) {
          const professor = await Professor.findOne({ 
            nome: { $regex: new RegExp(item.professor_nome, 'i') },
            ativo: true 
          }).limit(1);
          professorId = professor?._id;
        }
        
        if (!alunoId) {
          resultados.erros++;
          resultados.detalhes.push({
            linha: resultados.sucesso + resultados.erros,
            erro: `Aluno com matrícula "${item.matricula_aluno}" não encontrado`,
            dados: { matricula: item.matricula_aluno, nome: item.aluno_nome }
          });
          continue;
        }

        if (!disciplinaId) {
          resultados.erros++;
          resultados.detalhes.push({
            linha: resultados.sucesso + resultados.erros,
            erro: `Disciplina com código "${item.codigo_disciplina}" não encontrada`,
            dados: { codigo: item.codigo_disciplina }
          });
          continue;
        }

        if (!turmaId) {
          resultados.erros++;
          resultados.detalhes.push({
            linha: resultados.sucesso + resultados.erros,
            erro: `Turma "${item.turma_nome}" não encontrada`,
            dados: { turma: item.turma_nome }
          });
          continue;
        }
        
        // Processar habilidades de cada ponto de corte
        const pc1Habilidades = await processarHabilidades(item.pc1_habilidades, disciplinaId);
        const pc2Habilidades = await processarHabilidades(item.pc2_habilidades, disciplinaId);
        const eacHabilidades = await processarHabilidades(item.eac_habilidades, disciplinaId);
        
        // Preparar dados da avaliação - SISTEMA DE PONTOS DE CORTE
        const avaliacaoData = {
          aluno: alunoId,
          disciplina: disciplinaId,
          turma: turmaId,
          ano: parseInt(item.ano) || new Date().getFullYear(),
          trimestre: parseInt(item.trimestre) || 1,
          pontosCorte: {
            pc1: {
              nota: parseFloat(item.pc1_nota) || 0,
              data: item.pc1_data ? new Date(item.pc1_data) : null,
              habilidades: pc1Habilidades
            },
            pc2: {
              nota: parseFloat(item.pc2_nota) || 0,
              data: item.pc2_data ? new Date(item.pc2_data) : null,
              habilidades: pc2Habilidades
            },
            eac: {
              nota: parseFloat(item.eac_nota) || 0,
              data: item.eac_data ? new Date(item.eac_data) : null,
              habilidades: eacHabilidades
            }
          },
          observacoes: item.observacoes || ''
        };

        // Validar limites de notas (0 a 10 com uma casa decimal)
        if (avaliacaoData.pontosCorte.pc1.nota < 0 || avaliacaoData.pontosCorte.pc1.nota > 10) {
          resultados.erros++;
          resultados.detalhes.push({
            linha: resultados.sucesso + resultados.erros,
            erro: `PC1 deve estar entre 0 e 10. Valor fornecido: ${avaliacaoData.pontosCorte.pc1.nota}`,
            dados: item
          });
          continue;
        }

        if (avaliacaoData.pontosCorte.pc2.nota < 0 || avaliacaoData.pontosCorte.pc2.nota > 10) {
          resultados.erros++;
          resultados.detalhes.push({
            linha: resultados.sucesso + resultados.erros,
            erro: `PC2 deve estar entre 0 e 10. Valor fornecido: ${avaliacaoData.pontosCorte.pc2.nota}`,
            dados: item
          });
          continue;
        }

        if (avaliacaoData.pontosCorte.eac.nota < 0 || avaliacaoData.pontosCorte.eac.nota > 10) {
          resultados.erros++;
          resultados.detalhes.push({
            linha: resultados.sucesso + resultados.erros,
            erro: `EAC deve estar entre 0 e 10. Valor fornecido: ${avaliacaoData.pontosCorte.eac.nota}`,
            dados: item
          });
          continue;
        }

        // Calcular Média Final e Nota Final do Trimestre (0 a 10)
        const mediaFinal = avaliacaoData.pontosCorte.pc1.nota + avaliacaoData.pontosCorte.pc2.nota + (avaliacaoData.pontosCorte.pc3?.nota || 0);
        avaliacaoData.pontosCorte.mediaFinal = parseFloat(mediaFinal.toFixed(1));
        avaliacaoData.notaFinalTrimestre = parseFloat(Math.max(mediaFinal, avaliacaoData.pontosCorte.eac.nota).toFixed(1));
        
        // Determinar classificação (Verde: 10-8.0, Azul: 7.9-6.0, Amarelo: 5.9-4.0, Vermelho: <4.0)
        const notaFinal = avaliacaoData.notaFinalTrimestre;
        if (notaFinal === 0) {
          avaliacaoData.classificacao = 'sem-avaliacao';
        } else if (notaFinal >= 8.0) {
          avaliacaoData.classificacao = 'adequado';
        } else if (notaFinal >= 6.0) {
          avaliacaoData.classificacao = 'proficiente';
        } else if (notaFinal >= 4.0) {
          avaliacaoData.classificacao = 'em-alerta';
        } else {
          avaliacaoData.classificacao = 'intervencao-imediata';
        }

        if (professorId) {
          avaliacaoData.professor = professorId;
        }
        
        // Verificar se já existe avaliação para este aluno/disciplina/trimestre/ano
        let avaliacao = await Avaliacao.findOne({
          aluno: alunoId,
          disciplina: disciplinaId,
          turma: turmaId,
          ano: avaliacaoData.ano,
          trimestre: avaliacaoData.trimestre
        });
        
        if (avaliacao) {
          // Atualizar avaliação existente
          avaliacao.pontosCorte = avaliacaoData.pontosCorte;
          avaliacao.notaFinalTrimestre = avaliacaoData.notaFinalTrimestre;
          avaliacao.classificacao = avaliacaoData.classificacao;
          if (avaliacaoData.observacoes) {
            avaliacao.observacoes = avaliacaoData.observacoes;
          }
          if (professorId) {
            avaliacao.professor = professorId;
          }
          await avaliacao.save();
          resultados.atualizados++;
        } else {
          // Criar nova avaliação
          avaliacao = await Avaliacao.create(avaliacaoData);
          resultados.criados++;
        }
        
        resultados.sucesso++;
        resultados.detalhes.push({
          linha: resultados.sucesso + resultados.erros,
          status: avaliacao.isNew ? 'criado' : 'atualizado',
          avaliacaoId: avaliacao._id,
          aluno: item.aluno_nome,
          notaFinal: avaliacaoData.notaFinalTrimestre
        });
        
      } catch (error) {
        resultados.erros++;
        resultados.detalhes.push({
          linha: resultados.sucesso + resultados.erros,
          erro: error.message,
          dados: item
        });
      }
    }
    
    res.json({
      message: 'Importação concluída',
      total: avaliacoes.length,
      sucesso: resultados.sucesso,
      criados: resultados.criados,
      atualizados: resultados.atualizados,
      erros: resultados.erros,
      detalhes: resultados.detalhes
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Erro ao importar avaliações', error: error.message });
  }
};
