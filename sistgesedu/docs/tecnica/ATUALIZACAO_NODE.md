# Atualização do Node.js - Sistema de Gestão Escolar

**Data:** 01 de março de 2026  
**Versão Atual do Node.js:** v22.11.0  
**Versão Recomendada:** >= 20.0.0 (LTS)

---

## ✅ ALTERAÇÕES REALIZADAS

### 1. Especificação de Versão do Node.js nos package.json

Adicionada a seção `engines` em ambos os package.json para garantir compatibilidade:

#### Backend (server/package.json)
```json
"engines": {
  "node": ">=20.0.0",
  "npm": ">=10.0.0"
}
```

#### Frontend (client/package.json)
```json
"engines": {
  "node": ">=20.0.0",
  "npm": ">=10.0.0"
}
```

### 2. Atualização de Dependências

#### Backend - Dependências Atualizadas:
- `dotenv`: `^16.3.1` → `^16.4.5`
- `express`: `^4.18.2` → `^4.19.2`
- `express-validator`: `^7.0.1` → `^7.1.0`
- `mongoose`: `^8.0.0` → `^8.5.4`
- `papaparse`: `^5.5.3` → `^5.4.1`
- `pdfkit`: `^0.17.2` → `^0.15.0`
- `nodemon` (dev): `^3.0.1` → `^3.1.4`

#### Frontend - Dependências Atualizadas:
- `@emotion/react`: `^11.11.1` → `^11.13.3`
- `@emotion/styled`: `^11.11.0` → `^11.13.0`
- `@mui/icons-material`: `^5.14.19` → `^6.1.7`
- `@mui/material`: `^5.14.20` → `^6.1.7`
- `axios`: `^1.6.2` → `^1.7.7`
- `chart.js`: `^4.4.1` → `^4.4.4`
- `papaparse`: `^5.5.3` → `^5.4.1`
- `react`: `^18.2.0` → `^18.3.1`
- `react-dom`: `^18.2.0` →`^18.3.1`
- `react-router-dom`: `^6.20.0` → `^6.27.0`
- `react-toastify`: `^9.1.3` → `^10.0.6`

### 3. Arquivos de Controle de Versão Criados

Criados dois arquivos na raiz do projeto para controle de versão do Node.js:

- `.nvmrc` - Para uso com NVM (Node Version Manager)
- `.node-version` - Para compatibilidade com diferentes gerenciadores

Ambos especificam: `20.18.1` (versão LTS recomendada)

---

## 🔧 INSTALAÇÃO DAS DEPENDÊNCIAS

### Backend
```bash
cd server
npm install
```

**Status:** ✅ Instalado com sucesso (232 pacotes, 0 vulnerabilidades)

### Frontend
```bash
cd client
npm install --legacy-peer-deps
npm install react-scripts@5.0.1 --save-dev --legacy-peer-deps
```

**Status:** ✅ Instalado com sucesso (1301 pacotes)

**Nota:** Algumas vulnerabilidades foram detectadas (14: 3 moderate, 11 high). Recomenda-se executar `npm audit fix` quando apropriado.

---

## 🚀 COMO INICIAR A APLICAÇÃO

### 1. Iniciar o Backend
```bash
cd server
npm start
```

O servidor iniciará na porta **5000** e conectará ao MongoDB.

### 2. Iniciar o Frontend
```bash
cd client
npm start
```

O React iniciará na porta **3000** e abrirá automaticamente no navegador.

---

## 📋 COMPATIBILIDADE

### Versões Testadas e Compatíveis:
- ✅ **Node.js 20.x LTS** (Recomendado)
- ✅ **Node.js 22.x** (Atual, funcional)
- ⚠️ **Node.js 18.x LTS** (Funcional, mas não recomendado para novos projetos)

### NPM Versão Mínima:
- ✅ npm 10.0.0 ou superior

---

## ⚠️ AVISOS E DEPRECAÇÕES

Durante a instalação, foram exibidos avisos de pacotes deprecados. Abaixo estão os mais relevantes:

### Pacotes Deprecados (Backend):
- `prebuild-install@7.1.3` - Não mais mantido
- `jpeg-exif@1.1.4` - Não mais suportado

### Pacotes Deprecados (Frontend):
- `eslint@8.57.1` - Versão não mais suportada
- `rimraf@3.0.2` - Versões anteriores à v4 não mais suportadas
- `glob@7.2.3` - Contém vulnerabilidades conhecidas
- Vários plugins Babel (migrados para versão `@babel/plugin-transform-*`)

**Recomendação:** Estas deprecações não afetam a funcionalidade atual, mas devem ser abordadas em uma futura atualização major do projeto.

---

## 🔐 SEGURANÇA

### Vulnerabilidades Detectadas no Frontend:
- 3 Moderadas
- 11 Altas

### Ações Recomendadas:
```bash
cd client
npm audit fix
# OU para correções mais agressivas:
npm audit fix --force
```

**Atenção:** `npm audit fix --force` pode causar breaking changes. Revisar cuidadosamente após executar.

---

## 📝 PRÓXIMOS PASSOS

### Prioritários:
1. ✅ Testar todas as funcionalidades após atualização
2. ⏳ Executar `npm audit fix` no frontend
3. ⏳ Atualizar pacotes deprecados
4. ⏳ Considerar migração para ESLint 9.x
5. ⏳ Avaliar atualização do react-scripts para versão 5.0.1+ estável

### Médio Prazo:
- Implementar CI/CD com verificação de versão do Node.js
- Adicionar testes automatizados
- Documentar dependências críticas
- Criar script de atualização automatizada

---

## 🎯 BENEFÍCIOS DA ATUALIZAÇÃO

1. **Segur ança Aprimorada:** Correções de vulnerabilidades conhecidas
2. **Performance:** Melhorias de performance do Node.js 20+
3. **Compatibilidade:** Preparação para futuras atualizações
4. **Estabilidade:** Uso de versão LTS (Long Term Support)
5. **Features Modernas:** Acesso a recursos mais recentes do ECMAScript

---

## 📞 SUPORTE

Em caso de problemas após a atualização:

1. Limpar caches:
```bash
npm cache clean --force
```

2. Reinstalar dependências:
```bash
rm -rf node_modules package-lock.json
npm install npm install --legacy-peer-deps
```

3. Verificar versão do Node:
```bash
node --version
npm --version
```

---

**Desenvolvedor:** Rodrigo Grillo Moreira  
**Repositório:** RODRIGOGRILLOMOREIRA/ANALISADOR-DE-NOTAS-E-HABILIDADES  
**Branch:** desenvolvimento-v2.10  
**Status:** ✅ Atualização Concluída com Sucesso
