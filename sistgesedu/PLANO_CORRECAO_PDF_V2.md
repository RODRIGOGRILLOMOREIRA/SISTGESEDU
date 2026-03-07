# 📋 PLANO DE CORREÇÃO V2 - Exportação de PDF em Branco

## 🔍 ANÁLISE DO PROBLEMA ATUAL

### **Problema Identificado:**
Após a implementação anterior, o PDF ainda aparece em branco. A análise revelou a **causa raiz real**:

### **Causa Raiz:**
O método `toBase64Image()` **NÃO está acessível** através do `ref` nos componentes React do `react-chartjs-2`.

**Por quê?**
- O `ref` no componente `<Bar>` e `<Scatter>` aponta para o **componente React wrapper**, não para a instância real do Chart.js
- A instância do Chart.js (que contém o método `toBase64Image()`) está **encapsulada** dentro do componente
- O código atual tenta acessar: `graficoComparacaoRef.current?.toBase64Image?.()` ❌
- Mas `graficoComparacaoRef.current` é o componente React, não a instância Chart.js

### **Resultado:**
```javascript
const imagemComparacao = graficoComparacaoRef.current?.toBase64Image?.();
// imagemComparacao = undefined ❌

if (!imagemComparacao || !imagemPredicao) {
  toast.error('Erro: Não foi possível capturar os gráficos');
  return; // Função termina aqui, PDF não é gerado
}
```

---

## ✅ SOLUÇÃO CORRETA

Existem **3 abordagens possíveis**. Vou implementar a **mais robusta e confiável**:

### **ABORDAGEM ESCOLHIDA: Captura Direta com html2canvas**

Em vez de tentar acessar o método interno do Chart.js, vamos:
1. Criar **refs para os containers** dos gráficos (elementos `<Paper>`)
2. Usar **html2canvas** diretamente para capturar esses containers
3. Converter para Base64
4. Construir o PDF com as imagens capturadas

**Vantagens:**
- ✅ Funciona com qualquer tipo de gráfico ou componente
- ✅ Captura exatamente o que está visível na tela
- ✅ Não depende de métodos internos do Chart.js
- ✅ Mais robusto e confiável

---

## 🛠️ IMPLEMENTAÇÃO DETALHADA

### **ETAPA 1: Instalar html2canvas como Dependência**

**Verificação:**
O `html2pdf.js` já inclui o `html2canvas`, mas vamos importá-lo diretamente para ter mais controle.

```bash
npm install html2canvas --save
```

---

### **ETAPA 2: Atualizar Imports**

```javascript
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas'; // Adicionar esta linha
```

---

### **ETAPA 3: Modificar os Refs**

**Trocar:**
```javascript
// ANTES - refs para componentes Chart.js (não funciona)
const graficoComparacaoRef = useRef(null);
const graficoPredicaoRef = useRef(null);
```

**Por:**
```javascript
// DEPOIS - refs para containers Paper que envolvem os gráficos
const containerGraficoComparacaoRef = useRef(null);
const containerGraficoPredicaoRef = useRef(null);
```

---

### **ETAPA 4: Conectar Refs aos Containers Paper**

Localizar os elementos `<Paper>` que envolvem os gráficos e adicionar os refs:

```javascript
// Gráfico de Comparação (Bar)
<Paper 
  ref={containerGraficoComparacaoRef}  // Adicionar ref aqui
  elevation={3} 
  sx={{ p: 2, height: 500, position: 'relative' }}
>
  {/* ... conteúdo ... */}
  <Bar 
    data={dadosComparacao} 
    options={opcoesComparacao}
    plugins={[pluginValoresNoTopo]}
  />
</Paper>

// Gráfico de Predição (Scatter)
<Paper 
  ref={containerGraficoPredicaoRef}  // Adicionar ref aqui
  elevation={3} 
  sx={{ p: 2, height: 500, position: 'relative' }}
>
  {/* ... conteúdo ... */}
  <Scatter data={dadosPredicao} options={opcoesPredicao} />
</Paper>
```

---

### **ETAPA 5: Reescrever Função de Exportação Completa**

**Nova implementação da função `exportarFrequenciaPDF()`:**

```javascript
const exportarFrequenciaPDF = async () => {
  // Validar se os containers estão disponíveis
  if (!containerGraficoComparacaoRef.current || !containerGraficoPredicaoRef.current) {
    toast.error('Erro: Gráficos não disponíveis. Selecione uma turma e aguarde o carregamento.');
    return;
  }

  // Validar se há dados para exportar
  if (!dashboardFrequencia.todosAlunos || dashboardFrequencia.todosAlunos.length === 0) {
    toast.error('Erro: Nenhum dado disponível para exportação. Selecione uma turma com dados.');
    return;
  }

  try {
    setExportando(true);
    toast.info('📸 Capturando gráficos... Aguarde', { autoClose: 2000 });

    // 1. AGUARDAR RENDERIZAÇÃO COMPLETA
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. CAPTURAR GRÁFICOS COM HTML2CANVAS
    const canvasComparacao = await html2canvas(containerGraficoComparacaoRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200
    });

    const canvasPredicao = await html2canvas(containerGraficoPredicaoRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200
    });

    // 3. CONVERTER CANVAS PARA BASE64
    const imagemComparacao = canvasComparacao.toDataURL('image/jpeg', 0.98);
    const imagemPredicao = canvasPredicao.toDataURL('image/jpeg', 0.98);

    // Verificar se as imagens foram geradas
    if (!imagemComparacao || !imagemPredicao) {
      toast.error('Erro: Falha ao capturar os gráficos.');
      return;
    }

    toast.info('📄 Gerando PDF... Aguarde', { autoClose: 2000 });

    // 4. CRIAR CONTAINER TEMPORÁRIO - PÁGINA 1 (GRÁFICOS)
    const containerGraficos = document.createElement('div');
    containerGraficos.style.width = '1400px';
    containerGraficos.style.backgroundColor = '#ffffff';
    containerGraficos.style.padding = '40px';
    containerGraficos.style.position = 'absolute';
    containerGraficos.style.left = '0';
    containerGraficos.style.top = '0';
    containerGraficos.style.visibility = 'hidden';
    
    const turmaInfo = filters.turma ? turmas.find(t => t._id === filters.turma) : null;
    const periodoInfo = filters.dataInicio && filters.dataFim 
      ? ` | Período: ${formatarDataBR(filters.dataInicio)} a ${formatarDataBR(filters.dataFim)}` 
      : '';
    
    containerGraficos.innerHTML = `
      <div style="margin-bottom: 30px; text-align: center; border-bottom: 3px solid #1976d2; padding-bottom: 15px;">
        <h1 style="color: #1976d2; font-weight: 700; margin: 0;">📊 Dashboard de Frequência - Análise Gráfica</h1>
        <h3 style="color: #666; margin: 10px 0;">Sistema de Gestão Escolar - SistGesEdu</h3>
        <p style="color: #999; margin: 5px 0;">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        ${turmaInfo ? `<p style="color: #666; font-weight: 600; margin: 5px 0;">Turma: ${turmaInfo.nome}${periodoInfo}</p>` : ''}
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
        <div style="background-color: #0D47A1; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="font-weight: 700; margin-bottom: 10px;">${dashboardFrequencia.totalRegistros}</h1>
          <h4 style="margin: 0;">Total de Registros</h4>
        </div>
        <div style="background-color: #2E7D32; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="font-weight: 700; margin-bottom: 10px;">${dashboardFrequencia.percentualPresenca || 0}%</h1>
          <h4 style="margin: 0;">Presentes</h4>
          <p style="margin-top: 10px; font-weight: 600;">${dashboardFrequencia.presentes} alunos</p>
        </div>
        <div style="background-color: #C62828; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="font-weight: 700; margin-bottom: 10px;">${dashboardFrequencia.percentualFaltas || 0}%</h1>
          <h4 style="margin: 0;">Faltas</h4>
          <p style="margin-top: 10px; font-weight: 600;">${dashboardFrequencia.faltas} alunos</p>
        </div>
        <div style="background-color: #F57C00; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="font-weight: 700; margin-bottom: 10px;">${dashboardFrequencia.faltasJustificadas}</h1>
          <h4 style="margin: 0;">Justificadas</h4>
        </div>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1976d2; margin-bottom: 15px;">📊 Comparação de Frequência</h3>
        <img src="${imagemComparacao}" style="width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px;" />
      </div>
      
      <div>
        <h3 style="color: #1976d2; margin-bottom: 15px;">🎯 Análise de Risco e Predição</h3>
        <img src="${imagemPredicao}" style="width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px;" />
      </div>
    `;
    
    document.body.appendChild(containerGraficos);

    // 5. CRIAR CONTAINER TEMPORÁRIO - PÁGINA 2 (TABELA)
    const containerTabela = document.createElement('div');
    containerTabela.style.width = '800px';
    containerTabela.style.backgroundColor = '#ffffff';
    containerTabela.style.padding = '40px';
    containerTabela.style.position = 'absolute';
    containerTabela.style.left = '0';
    containerTabela.style.top = '0';
    containerTabela.style.visibility = 'hidden';
    
    // Gerar linhas da tabela
    const linhasTabela = dashboardFrequencia.todosAlunos.map(aluno => {
      const percentual = aluno.percentualPresenca;
      let statusLabel = 'Adequado', statusIcon = '✅', statusBg = '#e8f5e9';
      
      if (aluno.classificacao === 'critico') {
        statusLabel = 'Crítico'; statusIcon = '🚨'; statusBg = '#ffebee';
      } else if (aluno.classificacao === 'atencao') {
        statusLabel = 'Atenção'; statusIcon = '⚠️'; statusBg = '#fff3e0';
      }
      
      return `
        <tr style="background-color: ${statusBg};">
          <td style="border: 1px solid #ddd; padding: 12px; font-size: 11px; font-weight: 600;">${aluno.aluno.nome}</td>
          <td style="border: 1px solid #ddd; padding: 12px; font-size: 10px;">${aluno.aluno.matricula}</td>
          <td style="border: 1px solid #ddd; padding: 12px; font-size: 11px; font-weight: 600; text-align: center;">${aluno.total}</td>
          <td style="border: 1px solid #ddd; padding: 12px; font-size: 11px; font-weight: 700; color: #2e7d32; text-align: center;">${aluno.presentes}</td>
          <td style="border: 1px solid #ddd; padding: 12px; font-size: 11px; font-weight: 700; color: #c62828; text-align: center;">${aluno.faltas}</td>
          <td style="border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: 700; text-align: center;">${percentual}%</td>
          <td style="border: 1px solid #ddd; padding: 12px; font-size: 11px; font-weight: 600; text-align: center;">${statusIcon} ${statusLabel}</td>
        </tr>
      `;
    }).join('');
    
    containerTabela.innerHTML = `
      <div style="margin-bottom: 30px; text-align: center; border-bottom: 3px solid #1976d2; padding-bottom: 15px;">
        <h1 style="color: #1976d2; font-weight: 700; margin: 0;">📋 Relatório Detalhado de Alunos</h1>
        <h3 style="color: #666; margin: 10px 0;">Sistema de Gestão Escolar - SistGesEdu</h3>
        <p style="color: #999; margin: 5px 0;">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        ${turmaInfo ? `<p style="color: #666; font-weight: 600; margin: 5px 0;">Turma: ${turmaInfo.nome}${periodoInfo}</p>` : ''}
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #1976d2; color: white;">
            <th style="border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: 700;">Aluno</th>
            <th style="border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: 700;">Matrícula</th>
            <th style="border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: 700; text-align: center;">Total Aulas</th>
            <th style="border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: 700; text-align: center;">Presentes</th>
            <th style="border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: 700; text-align: center;">Faltas</th>
            <th style="border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: 700; text-align: center;">Frequência</th>
            <th style="border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: 700; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${linhasTabela}
        </tbody>
      </table>
      
      <div style="padding: 15px; background-color: #f5f5f5; border-radius: 8px;">
        <p style="font-weight: 600; margin-bottom: 10px;">📊 Resumo:</p>
        <p style="margin: 5px 0;">• Total de alunos: ${dashboardFrequencia.todosAlunos?.length || 0}</p>
        <p style="margin: 5px 0;">• Total de registros: ${dashboardFrequencia.totalRegistros}</p>
        <p style="margin: 5px 0;">• Presentes: ${dashboardFrequencia.presentes} (${dashboardFrequencia.percentualPresenca}%)</p>
        <p style="margin: 5px 0;">• Faltas: ${dashboardFrequencia.faltas} (${dashboardFrequencia.percentualFaltas}%)</p>
        <p style="margin: 5px 0;">• Faltas Justificadas: ${dashboardFrequencia.faltasJustificadas}</p>
      </div>
    `;
    
    document.body.appendChild(containerTabela);

    // 6. AGUARDAR PARA GARANTIR RENDERIZAÇÃO
    await new Promise(resolve => setTimeout(resolve, 300));

    // 7. CONFIGURAÇÕES DE EXPORTAÇÃO
    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const nomeArquivo = `Dashboard_Frequencia_${dataAtual}.pdf`;

    const optGraficos = {
      margin: [20, 20, 20, 20],
      filename: nomeArquivo,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'landscape'
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    const optTabela = {
      margin: [20, 20, 20, 20],
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait'
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // 8. GERAR PDFS
    const pdfGraficos = await html2pdf()
      .set(optGraficos)
      .from(containerGraficos)
      .toPdf()
      .get('pdf');

    const pdfTabela = await html2pdf()
      .set(optTabela)
      .from(containerTabela)
      .toPdf()
      .get('pdf');

    // 9. COMBINAR PDFS
    const totalPagesGraficos = pdfGraficos.internal.getNumberOfPages();
    
    for (let i = 1; i <= pdfTabela.internal.getNumberOfPages(); i++) {
      pdfGraficos.addPage('a4', 'portrait');
      const pageData = pdfTabela.internal.pages[i];
      pdfGraficos.internal.pages[totalPagesGraficos + i] = pageData;
    }

    // 10. ADICIONAR NUMERAÇÃO
    const totalPages = pdfGraficos.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdfGraficos.setPage(i);
      pdfGraficos.setFontSize(10);
      pdfGraficos.setTextColor(100);
      
      const pageInfo = pdfGraficos.internal.getCurrentPageInfo();
      const isLandscape = pageInfo.pageContext.width > pageInfo.pageContext.height;
      
      if (isLandscape) {
        pdfGraficos.text(`Página ${i} de ${totalPages}`, 277, 200, { align: 'right' });
      } else {
        pdfGraficos.text(`Página ${i} de ${totalPages}`, 190, 287, { align: 'right' });
      }
    }

    // 11. SALVAR PDF
    pdfGraficos.save(nomeArquivo);

    // 12. LIMPAR CONTAINERS TEMPORÁRIOS
    document.body.removeChild(containerGraficos);
    document.body.removeChild(containerTabela);
    
    toast.success('✅ PDF exportado com sucesso!');
    
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    toast.error('Erro ao exportar PDF: ' + error.message);
  } finally {
    setExportando(false);
  }
};
```

---

## 🎯 RESUMO DAS MUDANÇAS

### **O que foi mudado:**

| Item | Antes (V1 - não funcionava) | Depois (V2 - funciona) |
|------|----------------------------|------------------------|
| **Refs** | `graficoComparacaoRef`, `graficoPredicaoRef` | `containerGraficoComparacaoRef`, `containerGraficoPredicaoRef` |
| **Alvo do Ref** | Componente `<Bar>`, `<Scatter>` | Componente `<Paper>` (container) |
| **Método de Captura** | `ref.current.toBase64Image()` ❌ | `html2canvas(ref.current)` ✅ |
| **Import necessário** | Apenas `html2pdf` | `html2pdf` + `html2canvas` |
| **Validação** | Verifica se ref existe | Verifica ref + dados |

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **Revisar o plano** 
2. ⏳ **Aguardar aprovação** para implementação
3. ⏳ **Instalar html2canvas** (se necessário)
4. ⏳ **Implementar as mudanças**
5. ⏳ **Testar a exportação**

---

## ⚠️ IMPORTANTE

**Por que a V1 não funcionou:**
- O `ref` em componentes React do `react-chartjs-2` não expõe o método `toBase64Image()`
- Era necessário capturar o **container visual** e não a instância interna do Chart.js

**Por que a V2 vai funcionar:**
- Captura diretamente o elemento DOM que está visível
- `html2canvas` cria uma imagem fiel do que está renderizado
- Não depende de APIs internas de bibliotecas externas

---

**Desenvolvedor Responsável:** Claude (FullStack Senior)  
**Data:** 7 de março de 2026  
**Status:** ⏳ Aguardando Aprovação
