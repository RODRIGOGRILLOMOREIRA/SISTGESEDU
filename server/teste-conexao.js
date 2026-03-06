// Script de teste de conexão MongoDB
require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testando conexão com MongoDB...\n');
console.log('URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@') : 'NÃO CONFIGURADA');
console.log('');

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000
})
.then(() => {
  console.log('✅ Conexão bem-sucedida!');
  console.log('📊 Banco de dados:', mongoose.connection.name);
  process.exit(0);
})
.catch((error) => {
  console.log('❌ Erro de conexão:', error.message);
  process.exit(1);
});
