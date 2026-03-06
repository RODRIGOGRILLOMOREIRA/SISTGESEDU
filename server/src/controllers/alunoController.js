const Aluno = require('../models/Aluno');
const { paginate, paginatedResponse } = require('../utils/helpers');

exports.getAlunos = async (req, res) => {
  try {
    const { turma, search, page = 1, limit = 5000 } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);
    
    const filter = { ativo: true };
    
    if (turma) {
      filter.turma = turma;
    }

    if (search) {
      filter.$or = [
        { nome: { $regex: search, $options: 'i' } },
        { matricula: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [alunos, total] = await Promise.all([
      Aluno.find(filter)
        .populate('turma', 'nome ano serie')
        .skip(skip)
        .limit(limitNum)
        .sort({ nome: 1 })
        .lean(),
      Aluno.countDocuments(filter)
    ]);
    
    res.json(paginatedResponse(alunos, page, limitNum, total));
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar alunos', error: error.message });
  }
};

exports.getAlunoById = async (req, res) => {
  try {
    const aluno = await Aluno.findById(req.params.id).populate('turma');
    if (!aluno) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    res.json(aluno);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar aluno', error: error.message });
  }
};

exports.createAluno = async (req, res) => {
  try {
    const { nome, matricula, dataNascimento, turma, responsavel } = req.body;

    // Log detalhado para debug
    console.log('📝 Tentando criar aluno:', {
      nome,
      matricula,
      dataNascimento,
      turma,
      responsavel
    });

    // Validação: Nome é obrigatório
    if (!nome || nome.trim().length < 3) {
      console.error('❌ Erro: Nome inválido');
      return res.status(400).json({ 
        message: 'Nome é obrigatório e deve ter pelo menos 3 caracteres' 
      });
    }

    // Validação: Matrícula é obrigatória
    if (!matricula || matricula.trim().length === 0) {
      console.error('❌ Erro: Matrícula inválida');
      return res.status(400).json({ 
        message: 'Matrícula é obrigatória' 
      });
    }

    // Verificar se matrícula já existe (buscar em todos os registros)
    const matriculaExiste = await Aluno.findOne({ 
      matricula: matricula.toUpperCase().trim()
    });

    if (matriculaExiste) {
      console.log('⚠️  Matrícula já existe - Atualizando aluno existente:', matriculaExiste.nome);
      // Em vez de retornar erro, atualizar o aluno existente
      const alunoAtualizado = await Aluno.findByIdAndUpdate(
        matriculaExiste._id,
        {
          nome: nome.trim(),
          dataNascimento: dataNascimento || null,
          turma: turma || matriculaExiste.turma,
          responsavel: {
            nome: responsavel?.nome?.trim() || matriculaExiste.responsavel?.nome || '',
            telefone: responsavel?.telefone?.trim() || matriculaExiste.responsavel?.telefone || '',
            email: responsavel?.email?.trim().toLowerCase() || matriculaExiste.responsavel?.email || '',
          }
        },
        { new: true, runValidators: true }
      );
      
      console.log('✅ Aluno atualizado com sucesso');
      return res.status(200).json(alunoAtualizado);
    }

    // Validação: Email do responsável (se fornecido e não vazio)
    if (responsavel?.email && responsavel.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(responsavel.email.trim())) {
        console.error('❌ Erro: Email inválido:', responsavel.email);
        return res.status(400).json({ 
          message: `Email do responsável inválido: ${responsavel.email}`,
          code: 'INVALID_EMAIL'
        });
      }
    }

    // Validação: Data de nascimento (se fornecida)
    if (dataNascimento && dataNascimento !== null && dataNascimento !== '') {
      const dataNasc = new Date(dataNascimento);
      const hoje = new Date();
      
      if (isNaN(dataNasc.getTime())) {
        console.error('❌ Erro: Data de nascimento inválida:', dataNascimento);
        return res.status(400).json({ 
          message: `Data de nascimento em formato inválido: ${dataNascimento}. Use AAAA-MM-DD`,
          code: 'INVALID_DATE'
        });
      }
      
      const idade = hoje.getFullYear() - dataNasc.getFullYear();
      
      if (idade < 0 || idade > 120) {
        console.error('❌ Erro: Idade fora do intervalo válido:', idade);
        return res.status(400).json({ 
          message: `Data de nascimento inválida: idade calculada de ${idade} anos (deve estar entre 0 e 120)`,
          code: 'INVALID_AGE'
        });
      }
    }

    // Criar aluno
    console.log('✅ Criando novo aluno...');
    const aluno = await Aluno.create({
      nome: nome.trim(),
      matricula: matricula.toUpperCase().trim(),
      dataNascimento: dataNascimento || null,
      turma: turma || null,
      responsavel: {
        nome: responsavel?.nome?.trim() || '',
        telefone: responsavel?.telefone?.trim() || '',
        email: responsavel?.email?.trim().toLowerCase() || '',
      }
    });
    
    // Adicionar aluno na turma
    if (aluno.turma) {
      const Turma = require('../models/Turma');
      await Turma.findByIdAndUpdate(
        aluno.turma,
        { $push: { alunos: aluno._id } }
      );
      console.log('✅ Aluno adicionado à turma');
    }
    
    console.log('✅ Aluno criado com sucesso:', aluno.nome);
    res.status(201).json(aluno);
  } catch (error) {
    console.error('Erro ao criar aluno:', error);
    
    // Tratamento específico de erros do MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue ? error.keyValue[field] : 'desconhecido';
      return res.status(400).json({ 
        message: `${field === 'matricula' ? 'Matrícula' : 'Campo'} "${value}" já existe no sistema (incluindo registros inativos)`,
        code: 'DUPLICATE_KEY',
        field,
        value
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Erro de validação: ' + messages.join(', '),
        code: 'VALIDATION_ERROR',
        errors: messages
      });
    }
    
    res.status(400).json({ 
      message: error.message || 'Erro ao criar aluno',
      code: 'CREATE_ERROR'
    });
  }
};

exports.updateAluno = async (req, res) => {
  try {
    const aluno = await Aluno.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!aluno) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    res.json(aluno);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar aluno', error: error.message });
  }
};

exports.deleteAluno = async (req, res) => {
  try {
    const aluno = await Aluno.findByIdAndUpdate(
      req.params.id,
      { ativo: false },
      { new: true }
    );
    if (!aluno) {
      return res.status(404).json({ message: 'Aluno não encontrado' });
    }
    res.json({ message: 'Aluno desativado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar aluno', error: error.message });
  }
};

// @desc    Gerar template de alunos por turma
// @route   GET /api/alunos/template/:turmaId
exports.gerarTemplatePorTurma = async (req, res) => {
  try {
    const { turmaId } = req.params;
    const Turma = require('../models/Turma');
    
    // Validar ID da turma
    if (!turmaId || turmaId === 'undefined' || turmaId === 'null') {
      return res.status(400).json({ message: 'ID da turma inválido' });
    }
    
    // Buscar turma
    const turma = await Turma.findById(turmaId);
    if (!turma) {
      return res.status(404).json({ message: 'Turma não encontrada' });
    }
    
    // Gerar template vazio com estrutura correta para a turma
    // Incluir alguns exemplos para orientação
    const template = [
      {
        nome: 'João Silva',
        matricula: '',
        dataNascimento: '2010-05-15',
        turma: turma.nome,
        responsavel_nome: 'Maria Silva',
        responsavel_telefone: '(11) 98765-4321',
        responsavel_email: 'maria@email.com'
      },
      {
        nome: 'Ana Santos',
        matricula: '',
        dataNascimento: '2011-08-20',
        turma: turma.nome,
        responsavel_nome: 'Carlos Santos',
        responsavel_telefone: '(11) 91234-5678',
        responsavel_email: 'carlos@email.com'
      },
      {
        nome: '',
        matricula: '',
        dataNascimento: '',
        turma: turma.nome,
        responsavel_nome: '',
        responsavel_telefone: '',
        responsavel_email: ''
      }
    ];
    
    res.json({
      turma: {
        id: turma._id,
        nome: turma.nome,
        ano: turma.ano,
        serie: turma.serie,
        turno: turma.turno,
        capacidadeMaxima: turma.capacidadeMaxima
      },
      template,
      instrucoes: {
        turma: `Campo turma já está preenchido com "${turma.nome}"`,
        matricula: 'Matrícula será gerada automaticamente se deixada em branco',
        dataNascimento: 'Formato: AAAA-MM-DD (ex: 2010-05-15)',
        responsavel: 'Preencha todos os dados do responsável',
        dica: 'As 2 primeiras linhas são exemplos. Você pode apagá-las e preencher seus dados'
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar template de alunos:', error);
    res.status(500).json({ message: 'Erro ao gerar template', error: error.message });
  }
};

// @desc    Importar múltiplos alunos em lote
// @route   POST /api/alunos/importar
exports.importarAlunos = async (req, res) => {
  try {
    const { alunos } = req.body;

    if (!Array.isArray(alunos) || alunos.length === 0) {
      return res.status(400).json({ 
        message: 'Array de alunos é obrigatório e não pode estar vazio',
        code: 'INVALID_INPUT'
      });
    }

    console.log(`📥 Iniciando importação de ${alunos.length} alunos...`);

    const resultados = {
      sucesso: [],
      atualizados: [],
      erros: [],
      total: alunos.length
    };

    const Turma = require('../models/Turma');
    const operacoesBulk = [];
    const alunosParaTurma = {}; // {turmaId: [alunoId, ...]}

    // Processar cada aluno
    for (let i = 0; i < alunos.length; i++) {
      const alunoData = alunos[i];
      const { nome, matricula, dataNascimento, turma, responsavel } = alunoData;

      try {
        // Validação: Nome é obrigatório
        if (!nome || nome.trim().length < 3) {
          throw new Error('Nome é obrigatório e deve ter pelo menos 3 caracteres');
        }

        // Validação: Matrícula é obrigatória
        if (!matricula || matricula.trim().length === 0) {
          throw new Error('Matrícula é obrigatória');
        }

        const matriculaLimpa = matricula.toUpperCase().trim();

        // Validação: Email do responsável (se fornecido e não vazio)
        if (responsavel?.email && responsavel.email.trim().length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(responsavel.email.trim())) {
            throw new Error(`Email do responsável inválido: ${responsavel.email}`);
          }
        }

        // Validação: Data de nascimento (se fornecida)
        let dataNascimentoValida = null;
        if (dataNascimento && dataNascimento !== null && dataNascimento !== '') {
          const dataNasc = new Date(dataNascimento);
          const hoje = new Date();
          
          if (isNaN(dataNasc.getTime())) {
            throw new Error(`Data de nascimento em formato inválido: ${dataNascimento}. Use AAAA-MM-DD`);
          }
          
          const idade = hoje.getFullYear() - dataNasc.getFullYear();
          
          if (idade < 0 || idade > 120) {
            throw new Error(`Data de nascimento inválida: idade calculada de ${idade} anos (deve estar entre 0 e 120)`);
          }
          
          dataNascimentoValida = dataNasc;
        }

        // Verificar se o aluno já existe
        const alunoExiste = await Aluno.findOne({ matricula: matriculaLimpa });

        const dadosAluno = {
          nome: nome.trim(),
          matricula: matriculaLimpa,
          dataNascimento: dataNascimentoValida,
          turma: turma || null,
          responsavel: {
            nome: responsavel?.nome?.trim() || '',
            telefone: responsavel?.telefone?.trim() || '',
            email: responsavel?.email?.trim().toLowerCase() || '',
          },
          ativo: true
        };

        if (alunoExiste) {
          // Atualizar aluno existente
          const alunoAtualizado = await Aluno.findByIdAndUpdate(
            alunoExiste._id,
            dadosAluno,
            { new: true, runValidators: true }
          );

          resultados.atualizados.push({
            nome: alunoAtualizado.nome,
            matricula: alunoAtualizado.matricula,
            id: alunoAtualizado._id
          });

          // Adicionar à lista de alunos da turma
          if (turma) {
            if (!alunosParaTurma[turma]) alunosParaTurma[turma] = [];
            alunosParaTurma[turma].push(alunoAtualizado._id);
          }

          console.log(`✅ Aluno atualizado: ${alunoAtualizado.nome} (${alunoAtualizado.matricula})`);
        } else {
          // Criar novo aluno
          const novoAluno = await Aluno.create(dadosAluno);

          resultados.sucesso.push({
            nome: novoAluno.nome,
            matricula: novoAluno.matricula,
            id: novoAluno._id
          });

          // Adicionar à lista de alunos da turma
          if (turma) {
            if (!alunosParaTurma[turma]) alunosParaTurma[turma] = [];
            alunosParaTurma[turma].push(novoAluno._id);
          }

          console.log(`✅ Aluno criado: ${novoAluno.nome} (${novoAluno.matricula})`);
        }
      } catch (error) {
        // Registrar erro para este aluno específico
        resultados.erros.push({
          nome: alunoData.nome || 'Desconhecido',
          matricula: alunoData.matricula || 'N/A',
          erro: error.message || 'Erro desconhecido',
          linha: i + 1
        });

        console.error(`❌ Erro ao processar aluno ${alunoData.nome} (${alunoData.matricula}):`, error.message);
      }
    }

    // Atualizar turmas com os novos alunos (usando $addToSet para evitar duplicatas)
    for (const [turmaId, alunosIds] of Object.entries(alunosParaTurma)) {
      try {
        await Turma.findByIdAndUpdate(
          turmaId,
          { $addToSet: { alunos: { $each: alunosIds } } }
        );
        console.log(`✅ Turma ${turmaId} atualizada com ${alunosIds.length} aluno(s)`);
      } catch (error) {
        console.error(`⚠️  Erro ao atualizar turma ${turmaId}:`, error.message);
      }
    }

    // Preparar resposta
    const totalProcessado = resultados.sucesso.length + resultados.atualizados.length + resultados.erros.length;
    
    console.log(`\n📊 Resumo da importação:`);
    console.log(`   ✅ Criados: ${resultados.sucesso.length}`);
    console.log(`   🔄 Atualizados: ${resultados.atualizados.length}`);
    console.log(`   ❌ Erros: ${resultados.erros.length}`);
    console.log(`   📦 Total processado: ${totalProcessado}/${resultados.total}`);

    res.status(200).json({
      message: `Importação concluída: ${resultados.sucesso.length} criado(s), ${resultados.atualizados.length} atualizado(s), ${resultados.erros.length} erro(s)`,
      resultados,
      estatisticas: {
        criados: resultados.sucesso.length,
        atualizados: resultados.atualizados.length,
        erros: resultados.erros.length,
        totalProcessado,
        totalEnviado: resultados.total
      }
    });

  } catch (error) {
    console.error('❌ Erro geral na importação:', error);
    res.status(500).json({ 
      message: 'Erro ao importar alunos',
      error: error.message,
      code: 'IMPORT_ERROR'
    });
  }
};
