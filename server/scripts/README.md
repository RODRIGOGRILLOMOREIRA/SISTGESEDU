# Scripts de Manutenção do SISTGESEDU

Este diretório contém scripts utilitários para gerenciar o banco de dados e a aplicação.

## 📜 Scripts Disponíveis

### 1. `criar-turmas.js`
Cria automaticamente turmas do 1º ao 9º ano.

**Uso:**
```bash
npm run criar-turmas
```

**Pré-requisitos:** Professores e disciplinas devem existir no banco.

---

### 2. `gerar-matriculas.js`
Gera matrículas automáticas para alunos sem matrícula.

**Uso:**
```bash
npm run gerar-matriculas
```

**Formato:** AAAANNNN (ex: 20260001)

---

### 3. `verificar-saude.js`
Verifica a saúde do banco de dados e exibe estatísticas completas.

**Uso:**
```bash
npm run verificar
```

**Informações exibidas:**
- Contadores de documentos
- Ocupação de turmas
- Uso de armazenamento
- Índices das coleções
- Recomendações

---

### 4. `resetar-frequencias.js` ⚠️
**ATENÇÃO: OPERAÇÃO DESTRUTIVA!**

Remove TODOS os registros de frequência do banco de dados.

**Uso:**
```bash
npm run resetar-frequencias
```

**Características:**
- ❌ Irreversível - não há recuperação
- ✅ Requer confirmação digitando "CONFIRMAR"
- 📊 Mostra estatísticas antes e depois
- 🔒 Solicita confirmação explícita

**Quando usar:**
- Início de novo período letivo
- Testes em ambiente de desenvolvimento
- Correção de dados em massa
- Reset completo do sistema

**Quando NÃO usar:**
- Em produção sem backup
- Durante período letivo ativo
- Sem documentação do motivo
- Sem autorização da coordenação

**Saída esperada:**
```
🔄 Iniciando processo de reset de frequências...
✅ Conexão com MongoDB estabelecida
📊 Total de registros de frequência encontrados: XXX

⚠️  ATENÇÃO! Esta ação irá DELETAR TODOS os registros de frequência.
Esta operação NÃO pode ser desfeita!

Digite "CONFIRMAR" para prosseguir ou qualquer outra coisa para cancelar: _
```

---

## 🔐 Segurança

### Operações Destrutivas

Apenas o script `resetar-frequencias.js` deleta dados. Ele possui:

1. **Confirmação Obrigatória**: Requer digitar "CONFIRMAR"
2. **Informações Detalhadas**: Mostra quantos registros serão deletados
3. **Possibilidade de Cancelamento**: Qualquer entrada diferente de "CONFIRMAR" cancela
4. **Log Detalhado**: Informa exatamente o que foi feito

### Boas Práticas

✅ **FAÇA:**
- Backup antes de operações destrutivas
- Documente o motivo e a data do reset
- Verifique o ambiente (dev/prod)
- Comunique à equipe antes de executar
- Execute em horários de baixo uso

❌ **NÃO FAÇA:**
- Reset em produção sem aviso
- Operações sem backup
- Executar sem entender as consequências
- Resetar dados de período letivo ativo

---

## 📋 Fluxo de Trabalho Recomendado

### Início de Período Letivo

```bash
# 1. Fazer backup no MongoDB Atlas
# 2. Verificar estado atual
npm run verificar

# 3. Resetar frequências do período anterior
npm run resetar-frequencias
# Digite: CONFIRMAR

# 4. Verificar se reset foi bem-sucedido
npm run verificar

# 5. Sistema pronto para novo período
```

### Manutenção Regular

```bash
# Verificação semanal
npm run verificar

# Gerar matrículas para novos alunos
npm run gerar-matriculas
```

---

## 🆘 Suporte

Para adicionar novos scripts:

1. Crie o arquivo `.js` neste diretório
2. Siga o padrão dos scripts existentes
3. Adicione o comando no `package.json` (scripts)
4. Documente neste README
5. Atualize o `docs/SCRIPTS.md`

### Padrão de Script

```javascript
require('dotenv').config();
const mongoose = require('mongoose');

const meuScript = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado');
    
    // Seu código aqui
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
};

meuScript();
```

---

## 📝 Changelog

- **2026-03-02**: Adicionado script `resetar-frequencias.js`
- **2026**: Scripts originais criados

---

**Desenvolvido para SISTGESEDU - Sistema de Gestão Escolar**
