const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const connectDB = require('../src/config/database');
const Turma = require('../src/models/Turma');

async function debugTurma() {
  try {
    await connectDB();
    console.log('✅ Conectado ao MongoDB\n');
    
    const turmaId = '69a6bdd4d7a6d02d0444c4a4'; // ID da turma do log
    
    console.log(`🔍 Buscando turma: ${turmaId}\n`);
    
    const turma = await Turma.findById(turmaId)
      .populate('alunos')
      .populate('disciplinas.disciplina')
      .populate('disciplinas.professor');
    
    if (!turma) {
      console.log('❌ Turma não encontrada!');
      process.exit(1);
    }
    
    console.log('📚 INFORMAÇÕES DA TURMA:');
    console.log(`   Nome: ${turma.nome}`);
    console.log(`   Total de alunos: ${turma.alunos.length}`);
    console.log(`   Total de disciplinas: ${turma.disciplinas.length}`);
    console.log('');
    
    console.log('📖 DISCIPLINAS E PROFESSORES:');
    turma.disciplinas.forEach((disc, index) => {
      console.log(`\n${index + 1}. Disciplina:`);
      console.log(`   - Disciplina ID: ${disc.disciplina?._id || 'NULL'}`);
      console.log(`   - Disciplina Nome: ${disc.disciplina?.nome || 'NULL'}`);
      console.log(`   - Professor ID: ${disc.professor || 'NULL'}`);
      console.log(`   - Professor populado: ${disc.professor?._id ? '✅' : '❌'}`);
      if (disc.professor?._id) {
        console.log(`   - Professor Nome: ${disc.professor.nome || 'N/A'}`);
      }
      console.log(`   - Tem professor? ${disc.professor ? 'SIM' : 'NÃO'}`);
    });
    
    console.log('\n\n🔬 ESTRUTURA RAW (sem populate):');
    const turmaRaw = await Turma.findById(turmaId);
    console.log(JSON.stringify(turmaRaw.disciplinas, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Conexão fechada');
  }
}

debugTurma();
