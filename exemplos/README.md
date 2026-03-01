# 📁 Arquivos de Exemplo para Importação

Esta pasta contém arquivos CSV de exemplo que podem ser usados para importar dados em massa no sistema.

## 📋 Arquivos Disponíveis

### 1. `turmas_exemplo.csv`
Arquivo de exemplo com 12 turmas pré-configuradas.

**Colunas:**
- `nome` - Nome da turma (ex: "1º Ano A")
- `ano` - Ano letivo (ex: 2026)
- `serie` - Série/ano escolar (ex: "1º Ano")
- `turno` - Turno da turma: matutino, vespertino, noturno, integral
- `capacidadeMaxima` - Número máximo de alunos (ex: 35)

### 2. `alunos_exemplo.csv`
Arquivo de exemplo com 15 alunos pré-configurados.

**Colunas:**
- `nome` - Nome completo do aluno
- `matricula` - Número de matrícula único (ex: "2026001")
- `dataNascimento` - Data no formato AAAA-MM-DD (ex: "2010-05-15")
- `turma` - Nome exato da turma cadastrada (ex: "1º Ano A")
- `responsavel_nome` - Nome completo do responsável
- `responsavel_telefone` - Telefone de contato
- `responsavel_email` - Email do responsável

### 3. `avaliacoes_exemplo.csv` ✨ SISTEMA DE PONTOS DE CORTE
Arquivo de exemplo com avaliações no **novo sistema de Pontos de Corte (PC1, PC2, EAC)**.

**Colunas Obrigatórias:**
- `matricula_aluno` - Matrícula do aluno (ex: "2026001")
- `aluno_nome` - Nome completo do aluno
- `turma_nome` - Nome da turma
- `codigo_disciplina` - Código da disciplina (ex: "MAT", "POR")
- `disciplina_nome` - Nome da disciplina
- `trimestre` - 1, 2 ou 3
- `ano` - Ano letivo (ex: 2026)

**Colunas de Pontos de Corte (Notas de 0 a 10):**
- `pc1_nota` - Nota do PC1 (0 a 10, ex: 8,5)
- `pc1_data` - Data do PC1 no formato AAAA-MM-DD
- **`pc1_habilidades`** 🎯 - Códigos das habilidades BNCC separados por vírgula (Ex: EF06MA01,EF06MA02)
- `pc2_nota` - Nota do PC2 (0 a 10, ex: 7,5)
- `pc2_data` - Data do PC2 no formato AAAA-MM-DD
- **`pc2_habilidades`** 🎯 - Códigos das habilidades trabalhadas no PC2
- `eac_nota` - Nota do EAC (0 a 10, ex: 9,0)
- `eac_data` - Data do EAC no formato AAAA-MM-DD
- **`eac_habilidades`** 🎯 - Códigos das habilidades trabalhadas no EAC
- `observacoes` - Observações sobre o desempenho do aluno

**🎯 Como Preencher Múltiplas Habilidades:**
Você pode incluir VÁRIAS habilidades em cada ponto de corte. Exemplos válidos:
- Uma habilidade: `EF06MA01`
- Duas habilidades: `EF06MA01,EF06MA02`
- Três ou mais: `EF06MA01,EF06MA02,EF06MA03,EF06MA04`
- Com espaços: `EF06MA01, EF06MA02, EF06MA03` (espaços serão removidos automaticamente)
- Com ponto e vírgula: `EF06MA01;EF06MA02;EF06MA03`

**📊 Como Funciona o Sistema de Pontos de Corte:**
- **PC1** (Ponto de Corte 1): Primeira avaliação do trimestre - nota de 0 a 10
- **PC2** (Ponto de Corte 2): Segunda avaliação do trimestre - nota de 0 a 10
- **Média Final**: (PC1 + PC2) / 2 (média aritmética simples)
- **EAC** (Exame de Aprendizagem Complementar): Avaliação recuperativa - nota de 0 a 10
- **Nota Final do Trimestre**: Maior valor entre Média Final ou EAC

**🎨 Classificação por Cores:**
- 🟢 **Verde (Adequado)**: 10,0 a 8,0
- 🔵 **Azul (Proficiente)**: 7,9 a 6,0
- 🟡 **Amarelo (Em Alerta)**: 5,9 a 4,0
- 🔴 **Vermelho (Intervenção Imediata)**: Abaixo de 4,0

**💡 Exemplo Prático:**
```csv
matricula_aluno: 2026001
pc1_nota: 9.0
pc1_habilidades: EF06MA01,EF06MA02
pc2_nota: 9.5
pc2_habilidades: EF06MA03,EF06MA04,EF06MA05
eac_nota: 9.8
eac_habilidades: EF06MA01,EF06MA02,EF06MA03
Resultado: Média Final = 9.25 (9.0+9.5)/2, EAC = 9.8
Nota Final = 9.8 (maior entre 9.25 e 9.8)
Classificação: Verde (Adequado) ✅
```

### 4. `frequencias_exemplo.csv` ✨ NOVO
Arquivo de exemplo com registros de frequência (presença/falta) dos alunos.

**Colunas Obrigatórias:**
- `matricula_aluno` ou `aluno_nome` - Matrícula ou nome do aluno
- `codigo_disciplina` ou `disciplina_nome` - Código ou nome da disciplina
- `turma_nome` - Nome da turma
- `data` - Data da aula no formato AAAA-MM-DD

**Colunas Opcionais:**
- `status` - presente, falta, falta-justificada, atestado (padrão: presente)
- **`status_codigo`** 🚀 - **P**, **F**, **FJ**, **A** (códigos rápidos para status - RECOMENDADO)
- `periodo` - matutino, vespertino, noturno, integral
- `observacao` - Observações sobre a frequência

**🚀 Códigos de Status Rápidos:**
Para facilitar o preenchimento, use a coluna `status_codigo` em vez de escrever por extenso:
- **P** = Presente
- **F** = Falta
- **FJ** = Falta Justificada
- **A** = Atestado
- **Vazio** = Presente (padrão)

💡 **Dica:** Deixe a célula vazia para marcar como presente! Isso torna a marcação de frequência muito mais rápida.

## 🚀 Como Usar

### Importar Turmas:
1. Acesse o sistema e vá em **Turmas**
2. Clique em **Nova Turma**
3. Selecione a aba **Importar Arquivo**
4. Clique em **Selecionar Arquivo CSV** e escolha `turmas_exemplo.csv`
5. Revise os dados e clique em **Importar**

### Importar Alunos:
1. **IMPORTANTE:** Certifique-se de que as turmas já foram cadastradas primeiro
2. Acesse o sistema e vá em **Alunos**
3. Clique em **Novo Aluno**
4. Selecione a aba **Importar Arquivo**
5. **RECOMENDADO:** Selecione uma turma específica para baixar um template personalizado com o nome da turma já preenchido 🆕
6. Clique em **Selecionar Arquivo CSV** e escolha `alunos_exemplo.csv` ou o template personalizado
7. Revise os dados e clique em **Importar**

### Importar Avaliações (Sistema de Pontos de Corte): ✨ NOVO
1. **IMPORTANTE:** Certifique-se de que turmas, alunos e disciplinas já foram cadastrados
2. Acesse o sistema e vá em **Avaliações**
3. **Selecione os filtros:**
   - Escolha a **Turma**
   - Escolha a **Disciplina**
   - Selecione o **Trimestre** (1, 2 ou 3)
   - Defina o **Ano** letivo
4. Clique no botão **Importar Avaliações**
5. Na aba **Gerar Template**:
   - Clique em **Baixar Template Excel** (recomendado) ou **Baixar Template CSV**
   - O template já virá com todos os alunos da turma preenchidos
   - Uma aba adicional no Excel terá a lista de habilidades disponíveis para a disciplina
6. **Preencha o template:**
   - Insira as notas de PC1 (0-10), PC2 (0-10) e EAC (0-10) com uma casa decimal (ex: 8,5)
   - Preencha as datas no formato YYYY-MM-DD
   - **Para habilidades:** copie os códigos da aba de instruções e cole separados por vírgula (ex: EF06MA01,EF06MA02,EF06MA03)
   - Adicione observações se necessário
7. Na aba **Importar Arquivo**:
   - Clique para selecionar o arquivo preenchido
   - Revise o preview dos dados
   - Clique em **Importar X Avaliações**
8. O sistema irá:
   - Criar novas avaliações para alunos que ainda não têm
   - Atualizar avaliações existentes para o mesmo trimestre/ano
   - Calcular automaticamente a nota final: (PC1 + PC2) / 2 ou EAC (o maior valor)
   - Aplicar classificação por cores: Verde (10-8.0), Azul (7.9-6.0), Amarelo (5.9-4.0), Vermelho (<4.0)
   - Vincular as habilidades BNCC informadas

### Importar Avaliações (Notas):
1. **IMPORTANTE:** Certifique-se de que alunos, turmas e disciplinas já foram cadastrados
2. Acesse o sistema e vá em **Avaliações**
3. Clique no botão **Importar**
4. **RECOMENDADO:** Selecione uma turma e disciplina específicas para baixar um template personalizado com todos os alunos e habilidades disponíveis
5. Clique em **Selecionar Arquivo** e escolha `avaliacoes_exemplo.csv` ou o template personalizado
6. Revise os dados e clique em **Importar**

### Importar Frequências:
1. **IMPORTANTE:** Certifique-se de que alunos, turmas e disciplinas já foram cadastrados
2. Acesse o sistema e vá em **Frequências**
3. Clique no botão **Importar**
4. **RECOMENDADO:** Selecione uma turma e disciplina específicas para baixar um template personalizado com todos os alunos
5. Clique em **Selecionar Arquivo** e escolha `frequencias_exemplo.csv` ou o template personalizado
6. **Use os códigos rápidos** (P, F, FJ, A) ou deixe vazio para marcar como presente
7. Revise os dados e clique em **Importar**

## ✏️ Criar Seus Próprios Arquivos

Você pode criar seus próprios arquivos CSV usando:
- Microsoft Excel
- Google Sheets
- LibreOffice Calc
- Qualquer editor de texto

### Dicas Importantes:
- Use vírgula (,) como separador
- Primeira linha deve conter os nomes das colunas
- Salve no formato CSV (UTF-8)
- Não deixe linhas em branco
- Para turmas, use turnos válidos: matutino, vespertino, noturno, integral
- Para alunos, o nome da turma deve corresponder exatamente ao nome cadastrado
- Para avaliações e frequências, você pode usar matrícula OU nome do aluno
- Para avaliações e frequências, você pode usar código OU nome da disciplina
- Notas devem ser de 0 a 10
- Status de frequência: presente, falta, falta-justificada, atestado
- **🚀 Para frequências, use códigos P, F, FJ, A na coluna status_codigo para rapidez**
- **Para marcar todos como presentes, deixe a coluna status_codigo vazia**

### Baixar Templates Vazios:
O sistema oferece a opção de baixar templates vazios diretamente:
1. Em cada módulo (Turmas, Alunos, Avaliações, Frequências)
2. Clique no botão **Importar**
3. Clique em **Baixar Template CSV** ou **Baixar Template Excel**

## ⚠️ Erros Comuns

### Geral:
- **Formato de data inválido:** Use sempre AAAA-MM-DD (ex: 2026-03-15)
- **CSV mal formatado:** Certifique-se de usar vírgula como separador

### Turmas:
- **Turno inválido:** Use apenas: matutino, vespertino, noturno ou integral (tudo minúsculo)

### Alunos:
- **Turma não encontrada:** O nome da turma no CSV deve estar exatamente igual ao nome cadastrado
- **Matrícula duplicada:** Cada matrícula deve ser única no sistema

### Avaliações (Sistema de Pontos de Corte):
- **Aluno/Disciplina/Turma não encontrados:** Certifique-se de que os dados correspondem exatamente aos cadastrados
- **PC1/PC2/EAC fora do limite:** Todas as notas devem ser de 0 a 10 (com uma casa decimal, ex: 8,5)
- **Trimestre inválido:** Use 1, 2 ou 3
- **Formato de data inválido:** Use YYYY-MM-DD (ex: 2026-03-15)
- **Habilidades não encontradas:** Verifique se os códigos das habilidades estão cadastrados para aquela disciplina
- **Múltiplas habilidades:** Separe sempre por vírgula ou ponto e vírgula (ex: EF06MA01,EF06MA02)
- **Classificação automática:** Verde (10-8.0), Azul (7.9-6.0), Amarelo (5.9-4.0), Vermelho (<4.0)

### Frequências:
- **Status inválido:** Use: presente, falta, falta-justificada, atestado OU use códigos P, F, FJ, A
- **Código de status inválido:** Use apenas P, F, FJ ou A na coluna status_codigo
- **Data inválida:** Use o formato AAAA-MM-DD
- **Registros duplicados:** Para a mesma data/aluno/disciplina, o registro existente será atualizado

## 📊 Suporte para Excel

Além de CSV, o sistema também aceita arquivos Excel (.xlsx):
- Mesma estrutura de colunas do CSV
- Primeira linha com nomes das colunas
- Dados nas linhas seguintes
- Baixe os templates Excel diretamente no sistema

## 📞 Suporte

Em caso de dúvidas ou problemas na importação, verifique:
1. O formato do arquivo CSV ou Excel
2. Se todas as colunas obrigatórias estão preenchidas
3. Se não há caracteres especiais que possam causar erros
4. Os logs de erro exibidos pelo sistema
5. Se os dados referenciados (turmas, alunos, disciplinas) já existem no sistema
