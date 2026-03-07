# 📋 PLANO DE CORREÇÃO - Exportação de PDF em Branco

## 🔍 ANÁLISE DO PROBLEMA

### **Problema Identificado:**
Os PDFs gerados no Dashboard (Dashboard Geral e Dashboard de Frequências) aparecem em branco, sem os gráficos e imagens que deveriam ser exibidos.

### **Causa Raiz:**
O código atual possui **containers ocultos para exportação** (com `position: absolute; left: -9999px`) que tentam renderizar gráficos duplicados do Chart.js. No entanto:

1. **Gráficos Canvas Não São Capturados Corretamente:**
   - Os elementos `<canvas>` do Chart.js não são renderizados quando estão fora da viewport
   - O `html2canvas` (usado internamente pelo `html2pdf.js`) não consegue capturar canvas posicionados fora da tela
   - Os gráficos precisam estar visíveis e totalmente renderizados para serem capturados

2. **Timing de Renderização:**
   - Os gráficos dentro dos containers ocultos podem não estar completamente renderizados quando o PDF é gerado
   - Chart.js precisa de tempo para desenhar os gráficos no canvas

3. **Duplicação Ineficiente:**
   - O código cria instâncias duplicadas dos gráficos (uma visível, outra oculta)
   - Isso desperdiça recursos e causa inconsistências
   - Os gráficos ocultos podem não receber os mesmos dados ou configurações

4. **Compatibilidade do html2canvas:**
   - A biblioteca `html2canvas` tem limitações conhecidas com elementos canvas dinâmicos
   - Elementos com `display: none` ou posicionados fora da tela não são renderizados

---

## ✅ SOLUÇÃO PROPOSTA

### **Estratégia Geral:**
Em vez de tentar capturar containers ocultos com gráficos duplicados, vamos:
1. Usar os gráficos **visíveis** que já estão renderizados na tela
2. Converter os canvas dos gráficos para **imagens Base64** usando `chartInstance.toBase64Image()`
3. Criar **containers temporários** com essas imagens e outros elementos
4. Gerar o PDF a partir desses containers temporários
5. Limpar os containers após a exportação

---

## 🛠️ IMPLEMENTAÇÃO DETALHADA

### **ETAPA 1: Adicionar Refs aos Gráficos Visíveis**

**Ação:** Criar refs para cada gráfico (Bar, Pie, Scatter, Line) exibido na interface

```javascript
// Adicionar no início do componente Dashboard
const graficoComparacaoRef = useRef(null);
const graficoPredicaoRef = useRef(null);
const graficoDesempenhoRef = useRef(null);
const graficoAprovacaoRef = useRef(null);
const graficoEvolucaoRef = useRef(null);
```

---

### **ETAPA 2: Conectar Refs aos Componentes Chart.js**

**Ação:** Atribuir os refs aos componentes de gráficos usando a propriedade `ref`

```javascript
// Exemplo para gráfico de barra
<Bar ref={graficoDesempenhoRef} data={chartDataDesempenho} options={chartOptionsBar} />

// Exemplo para gráfico de pizza
<Pie ref={graficoAprovacaoRef} data={chartDataAprovacao} options={chartOptionsPie} />
```

---

### **ETAPA 3: Reescrever a Função de Exportação**

**Ação:** Substituir a função `exportarFrequenciaPDF` por uma nova implementação que:
1. Aguarda a renderização completa dos gráficos
2. Converte os canvas para imagens Base64
3. Cria containers temporários com HTML estruturado
4. Gera o PDF em múltiplas páginas
5. Limpa os containers temporários

**Implementação:**

```javascript
const exportarFrequenciaPDF = async () => {
  try {
    setExportando(true);
    toast.info('Gerando PDF... Aguarde alguns segundos', { autoClose: 2000 });

    // 1. AGUARDAR RENDERIZAÇÃO DOS GRÁFICOS
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. CONVERTER CANVAS PARA IMAGENS BASE64
    const imagemComparacao = graficoComparacaoRef.current?.toBase64Image?.();
    const imagemPredicao = graficoPredicaoRef.current?.toBase64Image?.();

    if (!imagemComparacao || !imagemPredicao) {
      toast.error('Erro: Gráficos não estão prontos para exportação');
      return;
    }

    // 3. CRIAR CONTAINER TEMPORÁRIO - PÁGINA 1 (GRÁFICOS)
    const containerGraficos = document.createElement('div');
    containerGraficos.style.width = '1400px';
    containerGraficos.style.backgroundColor = '#ffffff';
    containerGraficos.style.padding = '40px';
    containerGraficos.style.position = 'absolute';
    containerGraficos.style.left = '0';
    containerGraficos.style.top = '0';
    containerGraficos.style.visibility = 'hidden';
    
    containerGraficos.innerHTML = `
      <div style="margin-bottom: 30px; text-align: center; border-bottom: 3px solid #1976d2; padding-bottom: 15px;">
        <h1 style="color: #1976d2; font-weight: 700; margin: 0;">📊 Dashboard de Frequência - Análise Gráfica</h1>
        <h3 style="color: #666; margin: 10px 0;">Sistema de Gestão Escolar - SistGesEdu</h3>
        <p style="color: #999; margin: 5px 0;">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        ${filters.turma ? `
          <p style="color: #666; font-weight: 600; margin: 5px 0;">
            Turma: ${turmas.find(t => t._id === filters.turma)?.nome}
            ${filters.dataInicio && filters.dataFim ? 
              ` | Período: ${formatarDataBR(filters.dataInicio)} a ${formatarDataBR(filters.dataFim)}` 
              : ''}
          </p>
        ` : ''}
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
        <img src="${imagemComparacao}" style="width: 100%; height: auto;" />
      </div>
      
      <div>
        <img src="${imagemPredicao}" style="width: 100%; height: auto;" />
      </div>
    `;
    
    document.body.appendChild(containerGraficos);

    // 4. CRIAR CONTAINER TEMPORÁRIO - PÁGINA 2 (TABELA)
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
        ${filters.turma ? `
          <p style="color: #666; font-weight: 600; margin: 5px 0;">
            Turma: ${turmas.find(t => t._id === filters.turma)?.nome}
            ${filters.dataInicio && filters.dataFim ? 
              ` | Período: ${formatarDataBR(filters.dataInicio)} a ${formatarDataBR(filters.dataFim)}` 
              : ''}
          </p>
        ` : ''}
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

    // 5. AGUARDAR PARA GARANTIR RENDERIZAÇÃO
    await new Promise(resolve => setTimeout(resolve, 300));

    // 6. CONFIGURAÇÕES DE EXPORTAÇÃO
    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const nomeArquivo = `Dashboard_Frequencia_${dataAtual}.pdf`;

    const optGraficos = {
      margin: [20, 20, 20, 20],
      filename: nomeArquivo,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1400
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
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait'
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // 7. GERAR PDFS
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

    // 8. COMBINAR PDFS
    const totalPagesGraficos = pdfGraficos.internal.getNumberOfPages();
    
    for (let i = 1; i <= pdfTabela.internal.getNumberOfPages(); i++) {
      pdfGraficos.addPage('a4', 'portrait');
      const pageData = pdfTabela.internal.pages[i];
      pdfGraficos.internal.pages[totalPagesGraficos + i] = pageData;
    }

    // 9. ADICIONAR NUMERAÇÃO
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

    // 10. SALVAR PDF
    pdfGraficos.save(nomeArquivo);

    // 11. LIMPAR CONTAINERS TEMPORÁRIOS
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

### **ETAPA 4: Remover Containers Ocultos**

**Ação:** Remover completamente os containers ocultos que atualmente tentam renderizar gráficos duplicados

- Remover o `<Box ref={graficosExportRef}>` com `position: 'absolute', left: '-9999px'`
- Remover o `<Box ref={tabelaExportRef}>` com `position: 'absolute', left: '-9999px'`
- Remover as declarações de `graficosExportRef` e `tabelaExportRef` (já não são necessárias)

---

### **ETAPA 5: Atualizar Validações**

**Ação:** Ajustar as validações na função de exportação para verificar os novos refs

```javascript
// Remover esta validação antiga:
if (!graficosExportRef.current || !tabelaExportRef.current) {
  toast.error('Erro ao exportar: conteúdo não encontrado');
  return;
}

// Adicionar nova validação:
if (!graficoComparacaoRef.current || !graficoPredicaoRef.current) {
  toast.error('Erro: Gráficos não estão disponíveis. Selecione uma turma e aguarde o carregamento.');
  return;
}
```

---

## 🎯 BENEFÍCIOS DA SOLUÇÃO

1. ✅ **Gráficos Capturados Corretamente:** Conversão para imagem Base64 garante que os gráficos apareçam no PDF
2. ✅ **Melhor Performance:** Elimina a duplicação de gráficos, economizando recursos
3. ✅ **Código Mais Limpo:** Remove containers ocultos desnecessários
4. ✅ **Maior Confiabilidade:** Usa gráficos já renderizados e visíveis
5. ✅ **Compatibilidade:** Solução funciona em todos os navegadores modernos
6. ✅ **Fácil Manutenção:** Código mais simples e direto

---

## 📝 NOTAS TÉCNICAS

### **Por que `toBase64Image()` funciona:**
- Converte o canvas do gráfico diretamente para uma string Base64
- A imagem resultante pode ser incorporada no HTML como `data:image/png;base64,...`
- O html2canvas consegue renderizar imagens Base64 perfeitamente

### **Por que containers temporários:**
- Permite construir o conteúdo do PDF programaticamente com HTML
- Os containers são anexados ao DOM, renderizados, capturados e depois removidos
- Usa `visibility: hidden` em vez de `display: none` para manter a renderização

### **Sobre múltiplas páginas:**
- Página 1 (Paisagem): Gráficos e estatísticas visuais
- Página 2 (Retrato): Tabela detalhada de alunos
- As páginas são combinadas em um único PDF
- Numeração é adicionada automaticamente

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **Revisar o plano** com o desenvolvedor responsável
2. ⏳ **Aguardar aprovação** para implementação
3. ⏳ **Implementar as mudanças** conforme descrito
4. ⏳ **Testar a exportação** em diferentes cenários
5. ⏳ **Validar qualidade do PDF** gerado

---

## ⚠️ CONSIDERAÇÕES IMPORTANTES

- **Teste com diferentes navegadores:** Chrome, Firefox, Edge
- **Teste com diferentes tamanhos de dados:** Poucas turmas vs. muitas turmas
- **Verifique a qualidade das imagens:** Ajuste o parâmetro `scale` se necessário
- **Monitore o desempenho:** A conversão de múltiplos gráficos pode levar alguns segundos
- **Trate erros adequadamente:** Adicione try-catch em todas as etapas críticas

---

**Desenvolvedor Responsável:** Claude (FullStack Senior)  
**Data:** 7 de março de 2026  
**Status:** ⏳ Aguardando Aprovação
