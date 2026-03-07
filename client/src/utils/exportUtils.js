/**
 * Utilitários de Exportação
 * 
 * Funções para exportar elementos DOM como imagens PNG
 * para compartilhamento via WhatsApp
 * 
 * @author SISTGESEDU
 * @date 2026-03-07
 */

import html2canvas from 'html2canvas';

/**
 * Exporta um elemento DOM como imagem PNG
 * @param {string} elementId - ID do elemento a ser capturado
 * @param {string} fileName - Nome do arquivo de saída
 * @returns {Promise<Blob>} - Blob da imagem gerada
 */
export const exportToImage = async (elementId, fileName = 'export.png') => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error(`Elemento com ID "${elementId}" não encontrado`);
  }
  
  console.log('📸 Iniciando captura do elemento:', elementId);
  console.log('📏 Dimensões:', element.offsetWidth, 'x', element.offsetHeight);
  
  // Captura o elemento com html2canvas em alta qualidade otimizada para mobile
  const canvas = await html2canvas(element, {
    scale: 3, // Qualidade máxima (3x resolução - ideal para Retina/mobile)
    useCORS: true, // Permite imagens de outros domínios (logo da escola)
    allowTaint: true, // Permite imagens cross-origin
    logging: false, // Desabilita logs do html2canvas
    backgroundColor: '#ffffff', // Fundo branco
    width: 600, // Largura fixa mobile-friendly
    height: element.scrollHeight, // Altura dinâmica
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0
  });
  
  console.log('✅ Canvas gerado:', canvas.width, 'x', canvas.height);
  
  // Converte canvas para Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        console.log('✅ Blob gerado:', blob.size, 'bytes');
        resolve(blob);
      } else {
        reject(new Error('Falha ao gerar imagem'));
      }
    }, 'image/png', 1.0); // PNG com qualidade máxima
  });
};

/**
 * Realiza o download de um arquivo (blob)
 * @param {Blob} blob - Blob do arquivo
 * @param {string} fileName - Nome do arquivo
 */
export const downloadFile = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Limpeza
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Prepara mensagem formatada para WhatsApp
 * @param {string} alunoNome - Nome do aluno
 * @param {number} percentual - Percentual de frequência
 * @param {object} resumo - Resumo de dados
 * @returns {string} - Mensagem formatada
 */
export const prepareWhatsAppMessage = (alunoNome, percentual, resumo) => {
  return (
    `📊 *Histórico de Frequência - SISTGESEDU*\n\n` +
    `👤 Aluno: ${alunoNome}\n` +
    `📈 Frequência: ${percentual}%\n` +
    `✅ Presenças: ${resumo.presentes}\n` +
    `❌ Faltas: ${resumo.faltas}\n` +
    `⚠️ Justificadas: ${resumo.justificadas}\n` +
    `📚 Total de Registros: ${resumo.total}\n\n` +
    `_Imagem com detalhes em anexo_`
  );
};
