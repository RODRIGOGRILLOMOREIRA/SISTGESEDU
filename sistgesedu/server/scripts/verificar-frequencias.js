/**
 * Script de Verificação de Frequências
 * 
 * Este script verifica a integridade dos dados de frequências no banco de dados:
 * - Verifica turmas sem professores atribuídos
 * - Identifica registros duplicados
 * - Lista estatísticas gerais
 * - Valida consistência dos dados
 * 
 * USO:
 * node server/scripts/verificar-frequencias.js
 */

const mongoose = require('mongoose');
const path = require('path');

// Carregar configurações
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Importar models
const Turma = require('../src/models/Turma');
const Frequencia = require('../src/models/Frequencia');
const Aluno = require('../src/models/Aluno');
const Disciplina = require('../src/models/Disciplina');
const Professor = require('../src/models/Professor');

async function conectarBanco() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistgesedu';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao MongoDB:', mongoUri);
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    process.exit(1);
  }
}

async function verificarTurmasSemProfessores() {
  console.log('\n📚 VERIFICANDO TURMAS SEM PROFESSORES...\n');
  
  const turmas = await Turma.find()
    .populate('disciplinas.disciplina')
    .populate('disciplinas.professor');
  
  let problemasEncontrados = 0;
  
  for (const turma of turmas) {
    const disciplinasSemProfessor = turma.disciplinas.filter(
      d => !d.professor || !d.professor._id
    );
    
    if (disciplinasSemProfessor.length > 0) {
      problemasEncontrados++;
      console.log(`⚠️  Turma: ${turma.nome} (ID: ${turma._id})`);
      console.log(`   Disciplinas sem professor:`);
      disciplinasSemProfessor.forEach(d => {
        console.log(`     - ${d.disciplina?.nome || 'Desconhecida'} (ID: ${d.disciplina?._id})`);
      });
      console.log('');
    }
  }
  
  if (problemasEncontrados === 0) {
    console.log('✅ Todas as turmas têm professores atribuídos!\n');
  } else {
    console.log(`⚠️  ${problemasEncontrados} turma(s) com disciplinas sem professor\n`);
  }
  
  return problemasEncontrados;
}

async function verificarRegistrosDuplicados() {
  console.log('\n🔍 VERIFICANDO REGISTROS DUPLICADOS...\n');
  
  const duplicados = await Frequencia.aggregate([
    {
      $group: {
        _id: {
          aluno: '$aluno',
          disciplina: '$disciplina',
          data: '$data'
        },
        count: { $sum: 1 },
        ids: { $push: '$_id' }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ]);
  
  if (duplicados.length === 0) {
    console.log('✅ Nenhum registro duplicado encontrado!\n');
    return 0;
  }
  
  console.log(`⚠️  ${duplicados.length} grupo(s) de registros duplicados encontrados:\n`);
  
  for (const dup of duplicados.slice(0, 10)) { // Mostrar apenas os 10 primeiros
    const freq = await Frequencia.findById(dup.ids[0])
      .populate('aluno', 'nome')
      .populate('disciplina', 'nome');
    
    console.log(`   Aluno: ${freq.aluno.nome}`);
    console.log(`   Disciplina: ${freq.disciplina.nome}`);
    console.log(`   Data: ${freq.data.toISOString().split('T')[0]}`);
    console.log(`   Registros duplicados: ${dup.count}`);
    console.log(`   IDs: ${dup.ids.join(', ')}`);
    console.log('');
  }
  
  if (duplicados.length > 10) {
    console.log(`   ... e mais ${duplicados.length - 10} grupos de duplicados\n`);
  }
  
  return duplicados.length;
}

async function verificarEstatisticas() {
  console.log('\n📊 ESTATÍSTICAS GERAIS\n');
  
  const [
    totalTurmas,
    totalAlunos,
    totalDisciplinas,
    totalProfessores,
    totalFrequencias,
    frequenciasPorMes
  ] = await Promise.all([
    Turma.countDocuments(),
    Aluno.countDocuments({ ativo: true }),
    Disciplina.countDocuments({ ativo: true }),
    Professor.countDocuments({ ativo: true }),
    Frequencia.countDocuments({ ativo: true }),
    Frequencia.aggregate([
      { $match: { ativo: true } },
      {
        $group: {
          _id: { ano: '$ano', mes: '$mes' },
          total: { $sum: 1 }
        }
      },
      { $sort: { '_id.ano': -1, '_id.mes': -1 } },
      { $limit: 6 }
    ])
  ]);
  
  console.log(`📚 Turmas: ${totalTurmas}`);
  console.log(`👥 Alunos: ${totalAlunos}`);
  console.log(`📖 Disciplinas: ${totalDisciplinas}`);
  console.log(`👨‍🏫 Professores: ${totalProfessores}`);
  console.log(`📅 Frequências registradas: ${totalFrequencias}`);
  console.log('');
  
  if (frequenciasPorMes.length > 0) {
    console.log('Frequências por mês (últimos 6 meses):');
    frequenciasPorMes.forEach(item => {
      const nomesMeses = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];
      const mesNome = nomesMeses[item._id.mes - 1];
      console.log(`  ${mesNome}/${item._id.ano}: ${item.total} registros`);
    });
    console.log('');
  }
  
  // Frequências por status
  const porStatus = await Frequencia.aggregate([
    { $match: { ativo: true } },
    {
      $group: {
        _id: '$status',
        total: { $sum: 1 }
      }
    }
  ]);
  
  console.log('Frequências por status:');
  porStatus.forEach(item => {
    const percent = ((item.total / totalFrequencias) * 100).toFixed(2);
    console.log(`  ${item._id}: ${item.total} (${percent}%)`);
  });
  console.log('');
}

async function verificarConsistencia() {
  console.log('\n🔧 VERIFICANDO CONSISTÊNCIA DOS DADOS...\n');
  
  let problemas = 0;
  
  // Verificar frequências com datas inválidas
  const datasInvalidas = await Frequencia.countDocuments({
    data: { $exists: false }
  });
  
  if (datasInvalidas > 0) {
    console.log(`⚠️  ${datasInvalidas} registro(s) sem data`);
    problemas++;
  }
  
  // Verificar frequências sem ano/mês/trimestre
  const semMetadados = await Frequencia.countDocuments({
    $or: [
      { ano: { $exists: false } },
      { mes: { $exists: false } },
      { trimestre: { $exists: false } }
    ]
  });
  
  if (semMetadados > 0) {
    console.log(`⚠️  ${semMetadados} registro(s) sem metadados (ano/mês/trimestre)`);
    problemas++;
  }
  
  // Verificar frequências com alunos inexistentes
  const frequencias = await Frequencia.find({ ativo: true }).limit(1000);
  const alunosIds = new Set((await Aluno.find({ ativo: true }).select('_id')).map(a => a._id.toString()));
  
  let alunosInexistentes = 0;
  for (const freq of frequencias) {
    if (!alunosIds.has(freq.aluno.toString())) {
      alunosInexistentes++;
    }
  }
  
  if (alunosInexistentes > 0) {
    console.log(`⚠️  ${alunosInexistentes} registro(s) referenciando alunos inexistentes`);
    problemas++;
  }
  
  if (problemas === 0) {
    console.log('✅ Nenhum problema de consistência encontrado!\n');
  } else {
    console.log(`\n⚠️  ${problemas} problema(s) de consistência encontrado(s)\n`);
  }
  
  return problemas;
}

async function executarVerificacao() {
  try {
    console.log('\n========================================');
    console.log('🔍 VERIFICAÇÃO DE INTEGRIDADE DE FREQUÊNCIAS');
    console.log('========================================');
    
    await conectarBanco();
    
    const problemasProfessores = await verificarTurmasSemProfessores();
    const duplicados = await verificarRegistrosDuplicados();
    await verificarEstatisticas();
    const problemasConsistencia = await verificarConsistencia();
    
    console.log('\n========================================');
    console.log('📋 RESUMO DA VERIFICAÇÃO');
    console.log('========================================\n');
    
    const totalProblemas = problemasProfessores + duplicados + problemasConsistencia;
    
    if (totalProblemas === 0) {
      console.log('✅ TUDO OK! Nenhum problema encontrado.\n');
    } else {
      console.log(`⚠️  ${totalProblemas} problema(s) encontrado(s):`);
      if (problemasProfessores > 0) {
        console.log(`   - ${problemasProfessores} turma(s) sem professores`);
      }
      if (duplicados > 0) {
        console.log(`   - ${duplicados} grupo(s) de registros duplicados`);
      }
      if (problemasConsistencia > 0) {
        console.log(`   - ${problemasConsistencia} problema(s) de consistência`);
      }
      console.log('\n💡 Correções sugeridas:');
      if (problemasProfessores > 0) {
        console.log('   1. Atribua professores às disciplinas das turmas');
      }
      if (duplicados > 0) {
        console.log('   2. Remova os registros duplicados do banco');
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO durante verificação:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Conexão fechada\n');
  }
}

// Executar
executarVerificacao();
