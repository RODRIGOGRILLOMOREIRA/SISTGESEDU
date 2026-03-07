# 📋 Plano de Ajuste - Rodapé do Card de Frequência

**Data:** 07/03/2026  
**Sistema:** SISTGESEDU  
**Componente:** CardExportacaoFrequencia  
**Tipo:** Ajuste de texto

---

## 🎯 Objetivo

Simplificar o rodapé do card de exportação de histórico de frequência.

---

## 📝 Alteração Solicitada

### ❌ **ATUAL:**
```
SISTGESEDU
Sistema de Gerenciamento Escolar · Licença Apache 2.0
```

### ✅ **NOVO:**
```
SISTGESEDU
Licença MIT 2026
```

---

## 🔧 Implementação

### Arquivo a ser modificado:
- `client/src/components/CardExportacaoFrequencia.js`

### Seção:
- **Rodapé** (final do componente)

### Alteração específica:

**Linha a modificar:**
```javascript
// ANTES
<Typography 
  variant="caption" 
  sx={{ 
    color: '#666',
    fontSize: '11px'
  }}
>
  Sistema de Gerenciamento Escolar · Licença Apache 2.0
</Typography>

// DEPOIS
<Typography 
  variant="caption" 
  sx={{ 
    color: '#666',
    fontSize: '11px'
  }}
>
  Licença MIT 2026
</Typography>
```

---

## ✅ Impacto

- ✅ **Apenas visual** - sem impacto funcional
- ✅ **Um único arquivo** modificado
- ✅ **Texto mais limpo** e objetivo
- ✅ **Mantém marca SISTGESEDU** em destaque

---

## 🧪 Teste Recomendado

Após a alteração:
1. Recarregar a página
2. Exportar um histórico de frequência
3. Verificar que o rodapé da imagem mostra:
   - **SISTGESEDU** (em destaque)
   - **Licença MIT 2026** (em texto menor)

---

## ⏱️ Tempo Estimado

- **1 minuto** (alteração trivial)

---

**Aguardando aprovação para implementar! ✅**
