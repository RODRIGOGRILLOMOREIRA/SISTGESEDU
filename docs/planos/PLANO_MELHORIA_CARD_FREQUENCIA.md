# 📋 Plano de Melhoria - Card de Histórico de Frequência

**Data:** 07/03/2026  
**Sistema:** SISTGESEDU  
**Componente:** ModalHistoricoFrequencia  

---

## 🎯 Objetivos

### Problema Atual
- Card está sendo baixado como arquivo (PNG) que precisa ser **aberto manualmente**
- Usuário precisa fazer dois passos: baixar → abrir arquivo
- Dificulta compartilhamento rápido via WhatsApp

### Solução Proposta
1. **Download direto como imagem PNG** pronta para visualização
2. **Responsividade mobile** (compatível com tela de celular)
3. **Cabeçalho visual** com logo da escola, nome e matrícula do aluno
4. **Layout otimizado** para compartilhamento rápido

---

## 🔧 Alterações Técnicas Planejadas

### 1️⃣ **Criar Novo Card de Exportação** (componente visual dedicado)

**Arquivo:** `client/src/components/CardExportacaoFrequencia.js` *(NOVO)*

**Características:**
- ✅ Dimensões otimizadas para mobile (largura máxima 600px)
- ✅ Cabeçalho destacado com:
  - Logo da escola (lado esquerdo)
  - Nome completo do aluno
  - Número de matrícula
  - Data de geração
- ✅ Design limpo e profissional
- ✅ Cores e espaçamento adequados para leitura em mobile
- ✅ Rodapé com marca SISTGESEDU + licença Apache 2.0

**Estrutura do Card:**
```
┌─────────────────────────────────────┐
│  [LOGO]    Nome da Escola           │
│                                     │
│  👤 Aluno: [Nome Completo]          │
│  📋 Matrícula: [XXXXX]              │
│  📅 Data: DD/MM/AAAA                │
├─────────────────────────────────────┤
│  📊 RESUMO GERAL                    │
│  ┌───┬───┬───┬───┐                 │
│  │ T │ P │ F │ J │                 │
│  │ X │ X │ X │ X │                 │
│  └───┴───┴───┴───┘                 │
│  🎯 XX% de Presença                │
├─────────────────────────────────────┤
│  📚 POR DISCIPLINA                  │
│  [Tabela simplificada]              │
├─────────────────────────────────────┤
│  📅 HISTÓRICO (últimos 10)          │
│  [Tabela compacta]                  │
├─────────────────────────────────────┤
│  SISTGESEDU · Apache 2.0            │
└─────────────────────────────────────┘
```

---

### 2️⃣ **Melhorar Função de Exportação**

**Arquivo:** `client/src/utils/exportUtils.js`

**Melhorias:**

#### A) Função `exportToImage` atualizada
```javascript
// ANTES: scale: 2
// DEPOIS: scale: 3 (melhor qualidade no mobile)

// ADICIONAR: configurações para mobile-friendly
{
  scale: 3,
  useCORS: true,
  logging: false,
  backgroundColor: '#ffffff',
  width: 600, // Largura fixa mobile-friendly
  windowWidth: 600,
  windowHeight: 'auto'
}
```

#### B) Nova função `exportCardAsDirectImage`
```javascript
/**
 * Exporta card e abre diretamente em nova aba
 * @param {string} elementId - ID do card
 * @param {string} fileName - Nome do arquivo
 */
export const exportCardAsDirectImage = async (elementId, fileName) => {
  const canvas = await html2canvas(/* ... */);
  
  // Converte para PNG e abre em nova aba
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    
    // Opção 1: Abrir em nova aba
    window.open(url, '_blank');
    
    // Opção 2: Download automático
    downloadFile(blob, fileName);
  }, 'image/png', 1.0);
};
```

---

### 3️⃣ **Atualizar ModalHistoricoFrequencia**

**Arquivo:** `client/src/components/ModalHistoricoFrequencia.js`

**Alterações:**

#### A) Importar contexto da escola
```javascript
import { useSchool } from '../context/SchoolContext';
```

#### B) Obter dados da escola
```javascript
const { schoolSettings } = useSchool();
```

#### C) Adicionar card invisível para exportação
```javascript
{/* Card oculto apenas para exportação */}
<Box 
  id="card-exportacao-whatsapp" 
  sx={{ 
    position: 'absolute', 
    left: '-9999px',
    width: '600px'
  }}
>
  <CardExportacaoFrequencia
    aluno={aluno}
    frequenciaData={frequenciaData}
    schoolSettings={schoolSettings}
  />
</Box>
```

#### D) Atualizar handler de exportação
```javascript
const handleExport = async () => {
  try {
    setExporting(true);
    
    const nomeAluno = aluno.nome || 'Aluno';
    const nomeArquivo = `frequencia-${nomeAluno
      .replace(/\s+/g, '-')
      .toLowerCase()}.png`;
    
    // Exportar CARD OTIMIZADO (não o modal)
    await exportCardAsDirectImage('card-exportacao-whatsapp', nomeArquivo);
    
    toast.success('✅ Imagem gerada! Pronta para WhatsApp', {
      autoClose: 3000
    });
    
  } catch (error) {
    console.error('Erro:', error);
    toast.error('Erro ao gerar imagem');
  } finally {
    setExporting(false);
  }
};
```

---

### 4️⃣ **Adicionar Logo da Escola**

**Integração com SchoolContext:**

```javascript
// O contexto já fornece: schoolSettings.logo
// Basta usar no CardExportacaoFrequencia

{schoolSettings?.logo && (
  <img 
    src={schoolSettings.logo} 
    alt="Logo da Escola"
    style={{
      maxHeight: '60px',
      maxWidth: '100px',
      objectFit: 'contain'
    }}
  />
)}
```

---

## 📱 Responsividade Mobile

### Estratégia:

1. **Largura fixa**: 600px (ideal para mobile e WhatsApp)
2. **DPI aumentado**: scale: 3 (alta resolução)
3. **Fonte legível**: mínimo 14px
4. **Espaçamento adequado**: padding consistente
5. **Cores contrastantes**: fundo branco, textos escuros
6. **Tabelas simplificadas**: máximo 4 colunas

### Breakpoints:
```javascript
// Tamanhos de fonte por dispositivo
Mobile: 14px - 18px (corpo), 20px - 24px (títulos)
Desktop: 12px - 16px (corpo), 18px - 22px (títulos)
```

---

## 📊 Dados Exibidos no Card

### Cabeçalho:
- ✅ Logo da escola (max 60px altura)
- ✅ Nome da escola
- ✅ Nome completo do aluno
- ✅ Matrícula do aluno
- ✅ Data de geração (DD/MM/AAAA)

### Resumo Geral:
- ✅ Total de registros
- ✅ Presenças
- ✅ Faltas
- ✅ Justificadas
- ✅ Percentual de presença (destaque visual)

### Frequência por Disciplina:
- ✅ Nome da disciplina
- ✅ Total, Presentes, Faltas, Percentual
- ✅ Cores indicativas (verde/amarelo/vermelho)

### Histórico Diário:
- ✅ Últimos 10 registros
- ✅ Data, Presentes, Faltas, Percentual
- ✅ Formato compacto

### Rodapé:
- ✅ Marca "SISTGESEDU"
- ✅ Licença Apache 2.0
- ✅ Data de geração

---

## 🚀 Comportamento de Exportação

### Opções Implementadas:

**Opção 1: Download Direto** (RECOMENDADO)
```javascript
// Usuário clica no botão WhatsApp
// → Imagem é gerada
// → Download automático inicia
// → Arquivo salvo em Downloads/
// → Usuário abre galeria/downloads e compartilha
```

**Opção 2: Nova Aba + Download**
```javascript
// Imagem abre em nova aba do navegador
// + Download automático
// Vantagem: visualização imediata
```

**Opção 3: Visualização Prévia**
```javascript
// Abre modal com preview da imagem
// Botões: "Baixar" | "Compartilhar"
```

### 💡 **Recomendação:** Opção 1 (download direto)
- Mais rápido
- Menos passos para o usuário
- Padrão esperado de sistemas mobile

---

## 🎨 Estilo Visual

### Paleta de Cores:
- **Sucesso (Presença):** `#4caf50` (verde)
- **Erro (Falta):** `#f44336` (vermelho)
- **Aviso (Justificada):** `#ff9800` (laranja)
- **Primária:** `#1976d2` (azul)
- **Fundo:** `#ffffff` (branco)
- **Texto:** `#212121` (cinza escuro)

### Tipografia:
- **Família:** 'Roboto', sans-serif (Material-UI padrão)
- **Peso:** 400 (normal), 600 (semibold), 700 (bold)

---

## ✅ Checklist de Implementação

### Fase 1: Estrutura
- [ ] Criar `CardExportacaoFrequencia.js`
- [ ] Definir layout responsivo (600px)
- [ ] Adicionar cabeçalho com logo e dados do aluno
- [ ] Implementar seção de resumo geral
- [ ] Adicionar tabela de disciplinas (simplificada)
- [ ] Adicionar histórico diário (últimos 10)
- [ ] Adicionar rodapé com marca

### Fase 2: Exportação
- [ ] Atualizar `exportUtils.js`
- [ ] Criar função `exportCardAsDirectImage`
- [ ] Ajustar qualidade (scale: 3)
- [ ] Configurar dimensões mobile (600px)
- [ ] Testar download direto

### Fase 3: Integração
- [ ] Importar `CardExportacaoFrequencia` no modal
- [ ] Renderizar card oculto (off-screen)
- [ ] Passar props (aluno, frequenciaData, schoolSettings)
- [ ] Atualizar handler `handleExport`
- [ ] Integrar contexto `useSchool`

### Fase 4: Testes
- [ ] Testar exportação com logo
- [ ] Testar sem logo (fallback)
- [ ] Testar em diferentes tamanhos de tela
- [ ] Validar qualidade da imagem no mobile
- [ ] Testar compartilhamento no WhatsApp
- [ ] Verificar compatibilidade cross-browser

---

## 🔍 Testes Recomendados

### Cenários de Teste:

1. **Com logo da escola definida**
   - ✅ Logo aparece no cabeçalho
   - ✅ Imagem exporta corretamente

2. **Sem logo da escola**
   - ✅ Layout se ajusta (apenas texto)
   - ✅ Exportação funciona

3. **Aluno com muitas disciplinas** (>5)
   - ✅ Tabela não quebra layout
   - ✅ Scroll na tabela ou limitação

4. **Aluno com poucos registros** (<3)
   - ✅ Layout se ajusta bem
   - ✅ Sem espaços vazios excessivos

5. **Mobile**
   - ✅ Visualização no celular (após download)
   - ✅ Texto legível
   - ✅ Imagem em alta resolução

6. **WhatsApp**
   - ✅ Compartilhamento direto
   - ✅ Preview correto no app
   - ✅ Qualidade mantida

---

## 📦 Arquivos Modificados

### Novos:
- `client/src/components/CardExportacaoFrequencia.js` ✨

### Modificados:
- `client/src/components/ModalHistoricoFrequencia.js` 🔧
- `client/src/utils/exportUtils.js` 🔧

### Inalterados:
- `client/src/context/SchoolContext.js` ✅ (já pronto)
- Backend (nenhuma alteração necessária) ✅

---

## ⏱️ Estimativa de Tempo

| Tarefa | Tempo Estimado |
|--------|----------------|
| Criar CardExportacaoFrequencia | 45 min |
| Estilizar layout responsivo | 30 min |
| Atualizar exportUtils.js | 20 min |
| Integrar no ModalHistoricoFrequencia | 25 min |
| Testes e ajustes | 40 min |
| **TOTAL** | **~2h30min** |

---

## 🎁 Benefícios da Solução

✅ **Usabilidade:** Um clique → imagem pronta  
✅ **Mobile-First:** Design otimizado para celular  
✅ **Profissional:** Logo da escola + layout limpo  
✅ **WhatsApp-Ready:** Fácil compartilhamento  
✅ **Alta Qualidade:** Resolução 3x (retina)  
✅ **Informativo:** Todos os dados relevantes  
✅ **Branding:** Marca SISTGESEDU visível  

---

## ❓ Perguntas para Aprovação

Antes de implementar, preciso confirmar:

1. **Comportamento de exportação preferido:**
   - [ ] Opção 1: Download direto automático (RECOMENDADO)
   - [ ] Opção 2: Abrir em nova aba + download
   - [ ] Opção 3: Modal de preview antes do download

2. **Conteúdo do histórico diário:**
   - [ ] Últimos 10 registros
   - [ ] Últimos 15 registros
   - [ ] Todos os registros do período

3. **Tabela de disciplinas:**
   - [ ] Todas as disciplinas
   - [ ] Limitar a 5 principais
   - [ ] Scroll se necessário

4. **Formato do nome do arquivo:**
   - [ ] `frequencia-[nome-aluno].png`
   - [ ] `historico-[matricula]-[data].png`
   - [ ] Outro formato: _______________

---

## 📝 Notas Adicionais

- O card será renderizado invisível (off-screen) apenas para exportação
- Não afeta o modal principal (continua funcionando normalmente)
- Logo da escola vem do SchoolContext (já integrado)
- Compatível com Apache 2.0 (código aberto mantido)

---

**Aguardando aprovação para iniciar implementação! 🚀**

**Desenvolvido por:** GitHub Copilot  
**Sistema:** SISTGESEDU  
**Licença:** Apache 2.0  
