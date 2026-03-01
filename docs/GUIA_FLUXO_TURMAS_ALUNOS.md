# 📚 Guia: Fluxo Correto de Cadastro de Turmas e Alunos

## 🎯 Fluxo Recomendado

### **PASSO 1: Criar Turmas**

1. Acesse a aba **"Turmas"**
2. Clique em **"Nova Turma"**
3. Preencha os dados:
   - Nome da Turma (ex: "1º Ano A")
   - Ano (ex: 2026)
   - Série (ex: "1º Ano")
   - Turno (Matutino, Vespertino, Noturno ou Integral)
   - Capacidade Máxima (ex: 35 alunos)
4. Clique em **"Salvar"**

> ✅ **A turma será criada VAZIA** - você não precisa ter alunos ainda!

**Repita** esse processo para todas as turmas necessárias (ex: 1º Ano A, 1º Ano B, 2º Ano A, etc.)

---

### **PASSO 2: Cadastrar Alunos**

Você tem **2 opções**:

#### **Opção A: Cadastro Individual**

1. Acesse a aba **"Alunos"**
2. Clique em **"Novo Aluno"**
3. Preencha os dados do aluno
4. **Selecione a turma** no dropdown (agora as turmas criadas irão aparecer!)
5. Preencha dados do responsável
6. Clique em **"Salvar"**

#### **Opção B: Importação em Lote (Excel/CSV)** ⭐ Recomendado

1. Acesse a aba **"Alunos"**
2. Clique em **"Novo Aluno"**
3. Vá para a aba **"Importar Arquivo"**
4. **Selecione uma turma** no dropdown "Template Personalizado por Turma"
5. Clique em **"Baixar Modelo Excel"** ou **"Baixar Modelo CSV"**
6. Preencha o arquivo com os dados dos alunos
7. Clique em **"Selecionar Arquivo"** e escolha o arquivo preenchido
8. Clique em **"Importar X Alunos"**

---

### **PASSO 3: Verificar Sincronização** 🔄

Após adicionar alunos:

1. Volte para a aba **"Turmas"**
2. Os **cards das turmas** mostrarão:
   - ✅ Número atualizado de alunos matriculados
   - ✅ Percentual de ocupação
   - ✅ Lista dos primeiros 3 alunos
   - ✅ Indicador visual (verde/amarelo/vermelho) de capacidade

**Isso acontece AUTOMATICAMENTE em tempo real!** 🎉

---

## 🚨 Alertas e Validações Implementadas

### **Quando NÃO há turmas cadastradas:**

- ❌ Não será possível selecionar turma no cadastro de aluno
- ⚠️ Alerta vermelho aparecerá na importação com instruções
- 💡 Mensagem orientará a criar turmas primeiro
- 🔒 Dropdown ficará desabilitado até que turmas sejam criadas

### **Quando turmas JÁ existem:**

- ✅ Dropdown mostra todas as turmas disponíveis
- ✅ Template pode ser baixado com turma pré-selecionada
- ✅ Importação valida se a turma existe
- ✅ Mensagens informativas sobre alunos sem turma

---

## 📊 Exemplo Prático

### **Cenário: Escola com 3 turmas**

**1. Criar Turmas:**
```
- 1º Ano A (Matutino, capacidade 30)
- 2º Ano A (Matutino, capacidade 32)
- 3º Ano A (Vespertino, capacidade 28)
```

**2. Importar Alunos para "1º Ano A":**
- Selecionar "1º Ano A" no dropdown
- Baixar template Excel
- Adicionar 25 alunos no arquivo
- Importar

**3. Resultado Automático:**
- Card da turma "1º Ano A" mostra: **25/30 alunos (83%)**
- Cor: 🟡 Amarelo (quase completo)
- Lista os primeiros 3 alunos
- Mostra "+ 22 outros alunos"

---

## 💡 Dicas Importantes

1. **Sempre crie turmas PRIMEIRO** antes de importar alunos
2. **Nomes das turmas devem ser únicos** para evitar confusão
3. **Use templates personalizados** para agilizar a importação
4. **Verifique a aba Turmas** após importar para confirmar sincronização
5. **Capacidade máxima** ajuda a controlar limite de alunos por turma

---

## 🔧 Resolução de Problemas

### **Problema: Dropdown de turmas está vazio**

**Causa:** Nenhuma turma cadastrada ainda  
**Solução:** Vá para aba Turmas e crie pelo menos uma turma

### **Problema: Alunos importados sem turma**

**Causa:** Nome da turma no Excel não confere exatamente  
**Solução:** Use template personalizado ou verifique nome exato da turma

### **Problema: Template não baixa**

**Causa:** Turma não selecionada no dropdown  
**Solução:** Selecione uma turma antes de clicar em "Baixar Modelo"

---

## ✅ Checklist de Verificação

Antes de importar alunos, confirme:

- [ ] Pelo menos uma turma foi criada
- [ ] As turmas aparecem na aba "Turmas" 
- [ ] O dropdown em Alunos > Importar está mostrando as turmas
- [ ] O template foi baixado com sucesso
- [ ] O arquivo Excel/CSV está preenchido corretamente
- [ ] Os nomes das turmas no arquivo conferem exatamente

---

**Última Atualização:** 01 de março de 2026  
**Versão:** 2.0 - Sistema com sincronização em tempo real
