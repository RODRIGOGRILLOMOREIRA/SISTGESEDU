/**
 * Script para identificar e desativar alunos que não deveriam aparecer no sistema
 * Específico para remover Luan e Yasmin Dutra da listagem
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Aluno = require('../src/models/Aluno');
const Frequencia = require('../src/models/Frequencia');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistgesedu';

async function limparAlunosRemovidos() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');

    // 1. Buscar alunos com nomes específicos
    console.log('🔍 Buscando alunos Luan e Yasmin Dutra...');
    const alunosProblematicos = await Aluno.find({
      $or: [
        { nome: /luan/i },
        { nome: /yasmin.*dutra/i }
      ]
    });

    console.log(`📋 Encontrados ${alunosProblematicos.length} aluno(s):`);
    alunosProblematicos.forEach(aluno => {
      console.log(`   - ID: ${aluno._id}`);
      console.log(`     Nome: ${aluno.nome}`);
      console.log(`     Matrícula: ${aluno.matricula}`);
      console.log(`     Ativo: ${aluno.ativo}`);
      console.log(`     Turma: ${aluno.turma}`);
      console.log('');
    });

    if (alunosProblematicos.length > 0) {
      console.log('\n❓ Deseja DESATIVAR esses alunos? (eles não aparecerão mais no sistema)');
      console.log('   Execute: node limpar-alunos-removidos.js --confirmar');
      
      // Verificar se foi passado o argumento --confirmar
      if (process.argv.includes('--confirmar')) {
        console.log('\n🔧 DESATIVANDO alunos...');
        
        const ids = alunosProblematicos.map(a => a._id);
        
        // Desativar os alunos
        const resultAlunos = await Aluno.updateMany(
          { _id: { $in: ids } },
          { $set: { ativo: false } }
        );
        
        console.log(`✅ ${resultAlunos.modifiedCount} aluno(s) desativado(s)\n`);
        
        // Verificar frequências associadas
        console.log('🔍 Verificando frequências desses alunos...');
        const frequencias = await Frequencia.find({
          aluno: { $in: ids }
        });
        
        console.log(`📊 Encontradas ${frequencias.length} frequência(s) associada(s)`);
        
        if (frequencias.length > 0) {
          console.log('   As frequências continuarão no banco mas não aparecerão no Dashboard');
          console.log('   (devido ao filtro de alunos ativos)');
        }
      }
    } else {
      console.log('✅ Nenhum aluno encontrado com esses nomes.');
      console.log('\n🔍 Verificando todos os alunos na turma "Sexto Ano"...');
      
      const turma = await mongoose.connection.db.collection('turmas').findOne({ 
        nome: /sexto.*ano/i 
      });
      
      if (turma) {
        console.log(`📚 Turma encontrada: ${turma.nome} (ID: ${turma._id})`);
        
        const alunosTurma = await Aluno.find({ turma: turma._id });
        console.log(`\n👥 Alunos cadastrados nesta turma: ${alunosTurma.length}`);
        alunosTurma.forEach(aluno => {
          console.log(`   - ${aluno.nome} (${aluno.matricula}) - Ativo: ${aluno.ativo}`);
        });
      }
    }

    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexão fechada');
  }
}

// Executar
limparAlunosRemovidos();
