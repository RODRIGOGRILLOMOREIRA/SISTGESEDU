/**
 * Script para verificar o nome correto das collections no MongoDB
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistgesedu';

async function verificarCollections() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');

    // Listar todas as collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('📋 Collections disponíveis no banco:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    console.log('\n🔍 Verificando nome da collection de alunos...');
    const alunosCollection = collections.find(c => c.name.includes('aluno'));
    if (alunosCollection) {
      console.log(`✅ Collection de alunos: "${alunosCollection.name}"`);
      
      // Contar documentos
      const count = await mongoose.connection.db.collection(alunosCollection.name).countDocuments();
      console.log(`   Total de documentos: ${count}`);
      
      // Mostrar amostra
      const sample = await mongoose.connection.db.collection(alunosCollection.name)
        .find({ ativo: true })
        .limit(3)
        .toArray();
      
      console.log(`\n📊 Amostra de alunos ATIVOS (${sample.length}):`);
      sample.forEach(doc => {
        console.log(`   - ${doc.nome} (${doc.matricula})`);
      });
      
      // Verificar alunos inativos
      const inativos = await mongoose.connection.db.collection(alunosCollection.name)
        .find({ ativo: false })
        .toArray();
      
      console.log(`\n📊 Alunos INATIVOS (${inativos.length}):`);
      inativos.forEach(doc => {
        console.log(`   - ${doc.nome} (${doc.matricula})`);
      });
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
verificarCollections();
