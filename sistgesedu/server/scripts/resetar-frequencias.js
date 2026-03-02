/**
 * Script para resetar todos os dados de frequência
 * Remove todos os registros da coleção de Frequencias
 * 
 * Uso: npm run resetar-frequencias
 * ou: node scripts/resetar-frequencias.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Frequencia = require('../src/models/Frequencia');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const perguntarConfirmacao = () => {
  return new Promise((resolve) => {
    rl.question(
      '\n⚠️  ATENÇÃO! Esta ação irá DELETAR TODOS os registros de frequência.\n' +
      'Esta operação NÃO pode ser desfeita!\n\n' +
      'Digite "CONFIRMAR" para prosseguir ou qualquer outra coisa para cancelar: ',
      (resposta) => {
        resolve(resposta.trim().toUpperCase() === 'CONFIRMAR');
      }
    );
  });
};

const resetarFrequencias = async () => {
  try {
    console.log('🔄 Iniciando processo de reset de frequências...\n');
    
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conexão com MongoDB estabelecida\n');

    // Contar registros antes
    const totalAntes = await Frequencia.countDocuments();
    console.log(`📊 Total de registros de frequência encontrados: ${totalAntes}\n`);

    if (totalAntes === 0) {
      console.log('ℹ️  Não há registros para deletar.\n');
      await mongoose.connection.close();
      rl.close();
      process.exit(0);
    }

    // Solicitar confirmação
    const confirmado = await perguntarConfirmacao();
    
    if (!confirmado) {
      console.log('\n❌ Operação cancelada pelo usuário.\n');
      await mongoose.connection.close();
      rl.close();
      process.exit(0);
    }

    // Executar deleção
    console.log('\n🗑️  Deletando todos os registros de frequência...\n');
    const resultado = await Frequencia.deleteMany({});

    console.log('✅ Frequências resetadas com sucesso!\n');
    console.log(`📊 Estatísticas:`);
    console.log(`   - Registros deletados: ${resultado.deletedCount}`);
    console.log(`   - Registros restantes: ${await Frequencia.countDocuments()}`);
    
    console.log('\n✨ Banco de dados limpo. Você pode começar a registrar frequências do zero.\n');

    // Fechar conexão
    await mongoose.connection.close();
    console.log('👋 Conexão com MongoDB encerrada\n');
    
    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erro ao resetar frequências:', error.message);
    console.error('\nStack trace:', error.stack);
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    rl.close();
    process.exit(1);
  }
};

// Executar o script
resetarFrequencias();
