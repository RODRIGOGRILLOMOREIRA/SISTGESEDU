# 🔧 PLANO DE CORREÇÃO - Histórico de Frequência do Aluno

**Data**: 7 de março de 2026  
**Problema**: Ao clicar no ícone de histórico de frequência na tabela de frequências, ocorre erro e o modal não abre

---

## 🔍 DIAGNÓSTICO

### **ERRO #1: Backend retorna `periodo` como string quando não há filtro de data**

**Localização**: `server/src/controllers/frequenciaController.js` - Linha ~1256

**Código Problemático**:
```javascript
periodo: dataInicio && dataFim ? { inicio: dataInicio, fim: dataFim } : 'Todos os registros',
```

**Por que causa erro**:
- Quando não há filtro de data, `periodo` é uma STRING (`'Todos os registros'`)
- Frontend tenta acessar `frequenciaAcumuladaAluno.periodo.inicio` (linha 1708)
- Isso causa **erro**: `Cannot read property 'inicio' of string`

---

### **ERRO #2: Formatação de data do histórico diário falha**

**Localização**: `client/src/pages/Frequencias.js` - Linha ~1835

**Código Problemático**:
```javascript
<TableCell>{formatarDataLocal(dia._id.toISOString().split('T')[0])}</TableCell>
```

**Por que causa erro**:
- `dia._id` retorna do MongoDB aggregate como ISODate ou string
- Tentar chamar `.toISOString()` pode falhar se for string
- Causa erro na renderização da tabela do histórico diário

---

## ✅ SOLUÇÃO PROPOSTA

### **CORREÇÃO #1: Backend - Sempre retornar `periodo` como objeto**

**Arquivo**: `server/src/controllers/frequenciaController.js`  
**Linha**: ~1256

**ANTES**:
```javascript
periodo: dataInicio && dataFim ? { inicio: dataInicio, fim: dataFim } : 'Todos os registros',
```

**DEPOIS**:
```javascript
periodo: {
  inicio: dataInicio || null,
  fim: dataFim || null,
  descricao: dataInicio && dataFim ? `${dataInicio} a ${dataFim}` : 'Todos os registros'
},
```

**Impacto**: ✅ Não altera dados salvos, apenas o formato da resposta da API

---

### **CORREÇÃO #2: Frontend - Proteger acesso ao `periodo`**

**Arquivo**: `client/src/pages/Frequencias.js`  
**Linha**: ~1708

**ANTES**:
```javascript
📊 Resumo Geral {frequenciaAcumuladaAluno.periodo.inicio && frequenciaAcumuladaAluno.periodo.fim && 
  `(${formatarDataLocal(frequenciaAcumuladaAluno.periodo.inicio)} - ${formatarDataLocal(frequenciaAcumuladaAluno.periodo.fim)})`
}
```

**DEPOIS**:
```javascript
📊 Resumo Geral {
  frequenciaAcumuladaAluno.periodo?.inicio && frequenciaAcumuladaAluno.periodo?.fim 
    ? `(${formatarDataLocal(frequenciaAcumuladaAluno.periodo.inicio)} - ${formatarDataLocal(frequenciaAcumuladaAluno.periodo.fim)})`
    : frequenciaAcumuladaAluno.periodo?.descricao || ''
}
```

**Impacto**: ✅ Usa optional chaining para evitar erros, exibe descrição quando não há período

---

### **CORREÇÃO #3: Frontend - Corrigir formatação de data do histórico**

**Arquivo**: `client/src/pages/Frequencias.js`  
**Linha**: ~1835

**ANTES**:
```javascript
<TableCell>{formatarDataLocal(dia._id.toISOString().split('T')[0])}</TableCell>
```

**DEPOIS**:
```javascript
<TableCell>
  {formatarDataLocal(
    typeof dia._id === 'string' 
      ? dia._id 
      : dia._id instanceof Date 
        ? dia._id.toISOString().split('T')[0]
        : new Date(dia._id).toISOString().split('T')[0]
  )}
</TableCell>
```

**Impacto**: ✅ Trata todos os formatos possíveis de data retornados pelo MongoDB

---

### **CORREÇÃO #4: Frontend - Proteger outros acessos a dados opcionais**

**Arquivo**: `client/src/pages/Frequencias.js`  
**Linhas**: ~1768-1808

**Verificar se há proteção adequada em**:
- `frequenciaAcumuladaAluno.porDisciplina` (linha ~1768)
- `frequenciaAcumuladaAluno.historicoDiario` (linha ~1815)

**Adicionar verificações** se necessário para evitar erros quando arrays estão vazios ou undefined.

---

## 📋 RESUMO DAS ALTERAÇÕES

| # | Arquivo | Linha | Tipo | Altera Dados? |
|---|---------|-------|------|---------------|
| 1 | `frequenciaController.js` | ~1256 | Backend | ❌ NÃO |
| 2 | `Frequencias.js` | ~1708 | Frontend | ❌ NÃO |
| 3 | `Frequencias.js` | ~1835 | Frontend | ❌ NÃO |
| 4 | `Frequencias.js` | Vários | Frontend | ❌ NÃO |

---

## 🎯 GARANTIAS

✅ **Nenhum dado será alterado** - Correções apenas na lógica de exibição  
✅ **Compatibilidade retroativa** - Funciona com dados existentes  
✅ **Sem migração necessária** - Mudanças apenas em runtime  
✅ **Sem perda de informação** - Todos os dados continuam acessíveis  

---

## 🧪 TESTES NECESSÁRIOS APÓS IMPLEMENTAÇÃO

1. ✅ Abrir página de Frequências
2. ✅ Selecionar uma turma
3. ✅ Clicar no ícone 📊 (Assessment) de histórico de um aluno
4. ✅ Verificar se o modal abre sem erros
5. ✅ Verificar se exibe:
   - Resumo geral com totais
   - Percentual de presença
   - Tabela por disciplina
   - Histórico diário com datas formatadas
6. ✅ Testar COM filtro de data (dataInicio e dataFim)
7. ✅ Testar SEM filtro de data (todos os registros)

---

## 🚀 IMPLEMENTAÇÃO

Total de arquivos: **2**  
Total de mudanças: **4 alterações**  
Tempo estimado: **5 minutos**  
Risco: **Baixo** (apenas ajustes de exibição)

---

**Aguardando autorização para implementar.** ✋
