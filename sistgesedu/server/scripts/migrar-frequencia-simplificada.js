/**
 * MIGRAÇÃO: Frequência Simplificada
 * 
 * Este script realiza a migração do sistema de frequências de:
 * - Sistema antigo: 1 registro por aluno POR DISCIPLINA (aluno+disciplina+data)
 * - Sistema novo: 1 registro por aluno POR DIA (aluno+data) - Frequência geral
 * 
 * O que este script faz:
 * 1. Remove o índice único antigo (aluno+disciplina+data)
 * 2. Cria o novo índice único (aluno+data)
 * 3. Remove todos os registros antigos para evitar duplicados
 * 4. Prepara o sistema para começar limpo
 * 
 * ATENÇÃO: Este script APAGA TODOS OS DADOS DE FREQUÊNCIA!
 * Faça backup antes de executar!
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const connectDB = require('../src/config/database');
const Frequencia = require('../src/models/Frequencia');

async function migrarFrequencia() {
  try {
    await connectDB();
    console.log('✅ Conectado ao MongoDB\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 MIGRAÇÃO: Frequência Simplificada');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 1. Verificar dados existentes
    const totalAntes = await Frequencia.countDocuments();
    console.log(`📊 Registros existentes: ${totalAntes}\n`);
    
    if (totalAntes > 0) {
      console.log('⚠️  ATENÇÃO: Existem dados de frequência no banco!');
      console.log('⚠️  Esta migração irá APAGAR TODOS os registros.\n');
      
      // Mostrar estatísticas dos dados antes de deletar
      const estatisticas = await Frequencia.aggregate([
        {
          $group: {
            _id: null,
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
        }
      ]);
      
      if (estatisticas.length > 0) {
        const stats = estatisticas[0];
        console.log('📋 Estatísticas dos dados atuais:');
        console.log(`   Total: ${stats.total}`);
        console.log(`   Presentes: ${stats.presentes}`);
        console.log(`   Faltas: ${stats.faltas}`);
        console.log(`   Justificadas: ${stats.justificadas}\n`);
      }
      
      console.log('Para continuar, os dados serão deletados em 5 segundos...');
      console.log('Pressione Ctrl+C para cancelar.\n');
      
      // Aguardar 5 segundos
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 2. Deletar todos os registros
      console.log('🗑️  Deletando registros antigos...');
      const resultado = await Frequencia.deleteMany({});
      console.log(`✅ ${resultado.deletedCount} registros deletados\n`);
    }
    
    // 3. Remover índices antigos
    console.log('🔧 Removendo índices antigos...');
    try {
      await Frequencia.collection.dropIndex('aluno_1_disciplina_1_data_1');
      console.log('✅ Índice antigo (aluno+disciplina+data) removido');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Índice antigo não existe (já foi removido ou nunca foi criado)');
      } else {
        console.log('⚠️  Erro ao remover índice antigo:', error.message);
      }
    }
    
    // 4. Criar novo índice
    console.log('\n🔧 Criando novo índice (aluno+data)...');
    try {
      await Frequencia.collection.createIndex(
        { aluno: 1, data: 1 }, 
        { unique: true, name: 'aluno_1_data_1' }
      );
      console.log('✅ Novo índice criado com sucesso');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('ℹ️  Índice já existe');
      } else {
        throw error;
      }
    }
    
    // 5. Listar índices atuais
    console.log('\n📋 Índices atuais na coleção:');
    const indices = await Frequencia.collection.indexes();
    indices.forEach(index => {
      console.log(`   - ${index.name}:`, JSON.stringify(index.key));
    });
    
    // 6. Verificar estado final
    const totalDepois = await Frequencia.countDocuments();
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📊 Resumo:');
    console.log(`   Registros antes: ${totalAntes}`);
    console.log(`   Registros depois: ${totalDepois}`);
    console.log(`   Sistema pronto para frequência simplificada!\n`);
    
    console.log('ℹ️  Próximos passos:');
    console.log('   1. Reinicie o backend (se estiver rodando)');
    console.log('   2. Acesse a página de Frequências');
    console.log('   3. Registre frequências normalmente');
    console.log('   4. Agora cada aluno terá apenas 1 registro por dia\n');
    
  } catch (error) {
    console.error('\n❌ ERRO durante a migração:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Conexão fechada\n');
  }
}

// Verificar se o usuário quer executar
console.log('\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⚠️  MIGRAÇÃO: FREQUÊNCIA SIMPLIFICADA');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\nMudança: De frequência por disciplina → Frequência geral por dia');
console.log('\n⚠️  ATENÇÃO: Esta operação irá DELETAR todos os registros');
console.log('   de frequência existentes!\n');
console.log('Pressione Ctrl+C para cancelar...\n');

// Aguardar 3 segundos antes de começar
setTimeout(() => {
  migrarFrequencia();
}, 3000);
