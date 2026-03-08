# 🎓 SISTGESEDU - Sistema Completo de Gestão Escolar

<div align="center">

![Status](https://img.shields.io/badge/Status-Produção-success?style=for-the-badge)
![Versão](https://img.shields.io/badge/Versão-2.11-blue?style=for-the-badge)
![Licença](https://img.shields.io/badge/Licença-MIT-green?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)

**Sistema Completo e Moderno para Gestão Escolar**

Plataforma profissional para gestão educacional integrada

[🚀 Início Rápido](#-início-rápido) • [📚 Documentação](#-documentação) • [✨ Funcionalidades](#-funcionalidades) • [🛠️ Tecnologias](#️-tecnologias) • [📖 Guias](#-guias)

</div>

---

## 📋 Sobre o Projeto

**Copyright © 2026 RODRIGO GRILLO MOREIRA**  
**Licenciado sob MIT License**

O **SISTGESEDU** é um sistema profissional e completo para gestão escolar que integra:

- ✅ **Gestão Acadêmica**: Alunos, Turmas, Professores e Disciplinas
- ✅ **Sistema de Frequência**: Registro diário com justificativas e estatísticas
- ✅ **Sistema de Avaliações**: Modelo inovador com Pontos de Corte (PC1, PC2, PC3 + EAC)
- ✅ **Habilidades BNCC**: Rastreamento de desenvolvimento por competências
- ✅ **Dashboard Interativo**: Análises gráficas em tempo real com Chart.js
- ✅ **Importação em Lote**: CSV e Excel com validação inteligente
- ✅ **Relatórios PDF**: Boletins, históricos e mapas de desempenho
- ✅ **Sistema de Temas**: Modo claro e escuro com persistência
- ✅ **Autenticação JWT**: Sistema seguro com roles (admin, professor, coordenador)
- ✅ **Exportação WhatsApp**: Cards otimizados para compartilhamento mobile

### 🎯 Diferenciais

- **📱 Mobile-First**: Interface responsiva e otimizada para dispositivos móveis
- **⚡ Performance**: Paginação, cache e queries otimizadas no MongoDB
- **🎨 UX Moderna**: Material-UI com animações suaves e feedback visual
- **📊 Análises Avançadas**: Gráficos de evolução, predição de risco e comparações
- **🔒 Segurança**: JWT, bcrypt, validações em camadas
- **🌐 Cloud Ready**: MongoDB Atlas com backup automático

---

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js** 20.0.0 ou superior ([Download](https://nodejs.org/))
- **npm** 10.0.0 ou superior (incluído com Node.js)
- **MongoDB Atlas** (conta gratuita) ou MongoDB local
- **Git** para controle de versão

### Instalação e Execução

#### 1️⃣ Clone o Repositório

```bash
git clone https://github.com/RODRIGOGRILLOMOREIRA/SISTGESEDU.git
cd SISTGESEDU/sistgesedu
```

#### 2️⃣ Configure o Backend

```bash
cd server

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Crie um arquivo .env na pasta server com:
```

```env
MONGODB_URI=sua_connection_string_do_mongodb_atlas
JWT_SECRET=seu_secret_key_seguro_aqui
PORT=5000
NODE_ENV=development
```

```bash
# Inicializar banco de dados (seed)
npm run seed

# Criar turmas automaticamente (1º ao 9º ano)
npm run criar-turmas

# Iniciar servidor
npm run dev
```

**✅ Backend rodando em:** `http://localhost:5000`

#### 3️⃣ Configure o Frontend

```bash
# Em um novo terminal, vá para a pasta client
cd client

# Instalar dependências
npm install

# Criar arquivo .env com:
```

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_VERSION=2.11
```

```bash
# Iniciar aplicação React
npm start
```

**✅ Frontend rodando em:** `http://localhost:3000`

#### 4️⃣ Credenciais Padrão (Seed)

Após executar `npm run seed`, use:

| Email | Senha | Tipo |
|-------|-------|------|
| admin@escola.com | admin123 | Administrador |
| professor@escola.com | prof123 | Professor |
| coordenador@escola.com | coord123 | Coordenador |

### Comandos Úteis

#### Backend

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia servidor em produção |
| `npm run dev` | Inicia com nodemon (auto-reload) |
| `npm run seed` | Popula banco com dados iniciais |
| `npm run criar-turmas` | Cria turmas do 1º ao 9º ano |
| `npm run verificar` | Verifica saúde do banco de dados |
| `npm run resetar-frequencias` | ⚠️ Limpa todas as frequências |

#### Frontend

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia dev server (porta 3000) |
| `npm build` | Build para produção |
| `npm test` | Executa testes Jest |

---

## ✨ Funcionalidades

### 🎯 Gestão Acadêmica

#### 👨‍🎓 Alunos
- Cadastro completo (nome, matrícula, data nascimento, responsável)
- Matrícula única auto-gerada (formato: YYYYNNNN)
- Vínculo com turma e rastreamento de histórico
- Importação em lote via CSV/Excel
- Busca inteligente por nome ou matrícula
- Paginação e filtros avançados

#### 🏫 Turmas
- Criação por ano, série e turno (matutino/vespertino/noturno/integral)
- Capacidade máxima configurável (padrão: 35 alunos)
- Vínculo com disciplinas e professores
- Importação em lote
- Visualização de ocupação em tempo real

#### 👨‍🏫 Professores
- Cadastro com dados pessoais e profissionais
- Vinculação a múltiplas disciplinas
- Associação dinâmica com turmas por ano letivo
- Email único para login futuro

#### 📚 Disciplinas
- Cadastro com código único e carga horária
- Descrição detalhada
- Status ativo/inativo
- Vínculo com habilidades BNCC

### 📊 Sistema de Frequência

#### Registro de Presença
- ✅ **Individual**: Registro por aluno, data e período
- ✅ **Chamada de Turma**: Registro em lote (toda turma de uma vez)
- ✅ **Status**: Presente, Falta, Falta Justificada, Atestado
- ✅ **Períodos**: Matutino, Vespertino, Noturno, Integral
- ✅ **Justificativas**: Descrição, data e anexo (URL)
- ✅ **Importação**: CSV/Excel com busca inteligente

#### Análises e Relatórios
- 📈 **Percentual de Presença**: Por aluno, turma e período
- 📊 **Gráficos Comparativos**: Frequência por turma com cores dinâmicas
- 🎯 **Predição de Risco**: Scatter plot identificando alunos críticos
- 📅 **Histórico Diário**: Evolução temporal com exportação para WhatsApp
- 🔍 **Filtros Avançados**: Por turma, data, período, status
- 📱 **Card Mobile**: Exportação otimizada para compartilhamento

#### Dashboard de Frequência
- 📌 **Resumo Geral**: Total de registros, presenças, faltas
- 🎨 **Gráficos Interativos**: 
  - Barras horizontais com percentuais
  - Scatter plot com linhas de referência (80% e 60%)
  - Fullscreen com animação suave
- 🔄 **Auto-refresh**: Atualização automática a cada 30 segundos
- 🌈 **Tema Adaptável**: Cores ajustadas para dark/light mode

### 📝 Sistema de Avaliações

#### Modelo de Pontos de Corte
O sistema utiliza um modelo pedagógico inovador:

- **PC1** (Ponto de Corte 1): Nota de 0 a 3,0
- **PC2** (Ponto de Corte 2): Nota de 0 a 3,0
- **PC3** (Ponto de Corte 3): Nota de 0 a 4,0
- **EAC** (Estudos Autônomos Complementares): Nota de 0 a 10,0

**Cálculo da Média Trimestral**: `(PC1 + PC2 + PC3 + EAC) / 4`

#### Funcionalidades
- ✏️ **Lançamento de Notas**: Por trimestre e disciplina
- 🎯 **Habilidades BNCC**: Vínculo com cada ponto de corte
- 📊 **Média Anual**: Cálculo automático dos 3 trimestres
- 📈 **Gráficos de Evolução**: Comparação trimestral por aluno
- 📋 **Importação em Lote**: CSV/Excel com validação
- 🔢 **Pesos Personalizáveis**: Ajuste fino por avaliação
- 📄 **Boletim Individual**: PDF com histórico completo

### 🎯 Sistema de Habilidades (BNCC)

#### Estrutura
- **Código BNCC**: Identificador único da habilidade
- **Descrição**: Texto completo da competência
- **Disciplina**: Vínculo obrigatório
- **Ano/Trimestre**: Periodização pedagógica
- **Níveis de Desenvolvimento**:
  - 🔴 Não Desenvolvido
  - 🟡 Em Desenvolvimento
  - 🟢 Desenvolvido
  - 🔵 Plenamente Desenvolvido

#### Acompanhamento
- 📊 **Matriz de Habilidades**: Visualização consolidada por aluno
- 🔥 **Mapa de Calor**: Desempenho visual por turma
- 📈 **Relatórios**: Habilidades trabalhadas e não trabalhadas
- 📝 **Observações**: Notas pedagógicas por aluno

### 📊 Dashboard Interativo

#### Visão Geral
- 📌 **KPIs**: Alunos, Turmas, Avaliações, Frequências
- 📊 **Desempenho por Disciplina**: Gráfico de barras com médias
- 📈 **Evolução Trimestral**: Linha temporal de desempenho
- 🎯 **Alunos em Risco**: Identificação automática (frequência < 75% OU média < 6.0)
- 🏆 **Habilidades Desenvolvidas**: Contadores por nível

#### Gráficos Avançados
- **Chart.js**: Biblioteca profissional de gráficos
- **Interatividade**: Hover com detalhes, zoom, exportação PNG
- **Responsividade**: Adaptação automática ao tamanho da tela
- **Fullscreen**: Modais com visualização ampliada
- **Temas**: Cores adaptadas para modo claro/escuro

#### Filtros Modernos
- 🎨 **Design Premium**: Botões com gradientes vibrantes
- 🔵 **TODOS**: Visão geral sem filtros
- 🟢 **ADEQUADO**: Frequência ≥ 80% (verde)
- 🟡 **ATENÇÃO**: Frequência 60-79% (laranja)
- 🔴 **CRÍTICO**: Frequência < 60% (vermelho)
- 📊 **Contadores**: Badges com número de alunos

### 📄 Relatórios e Exportação

#### Tipos de Relatórios
- 📋 **Boletim Individual**: PDF completo do aluno
- 📊 **Desempenho de Turma**: Análise consolidada com gráficos
- 🎯 **Matriz de Habilidades**: Competências por aluno
- 🔥 **Mapa de Calor**: Visualização de desempenho coletivo
- 📝 **Habilidades Não Trabalhadas**: Lacunas pedagógicas

#### Tecnologias de Exportação
- **PDF**: html2pdf.js + html2canvas para documentos
- **PNG**: Captura de tela otimizada para WhatsApp
- **CSV/Excel**: XLSX para dados tabulares
- **Impressão**: Layouts otimizados para papel A4

#### Card de Histórico de Frequência (WhatsApp)
- 📱 **Mobile-Friendly**: Largura fixa de 600px
- 🎨 **Design Profissional**: Logo da escola + dados do aluno
- 📊 **Informações Completas**: Resumo, disciplinas, histórico diário
- 📸 **Alta Qualidade**: Resolução 3x (1800px) para telas Retina
- ⬇️ **Download Direto**: PNG pronto para compartilhamento
- 🏫 **Personalizado**: Nome e matrícula do aluno em destaque

### 📥 Importação de Dados

#### Formatos Suportados
- **CSV**: Comma-separated values (UTF-8)
- **Excel**: .xls e .xlsx (múltiplas planilhas)

#### Entidades Importáveis
- ✅ Alunos (com vínculo de turma)
- ✅ Turmas (criação em lote)
- ✅ Professores (com disciplinas)
- ✅ Disciplinas (códigos únicos)
- ✅ Frequências (registro em massa)
- ✅ Avaliações (notas por trimestre)
- ✅ Habilidades (BNCC completa)

#### Recursos de Importação
- 🔍 **Busca Inteligente**: Por matrícula/nome (alunos) ou código/nome (disciplinas)
- ✅ **Validação em Camadas**: Linha por linha com feedback detalhado
- 🔄 **Atualização**: Registros duplicados são atualizados automaticamente
- 📋 **Templates**: Disponíveis para download em cada módulo
- 💾 **Lote Grande**: Suporta mais de 5000 registros

### ⚙️ Configurações do Sistema

#### Dados da Escola
- 🏫 **Informações Básicas**: Nome, Logo (upload base64/URL), CNPJ, INEP
- 📍 **Endereço Completo**: Rua, número, bairro, cidade, estado, CEP
- 📞 **Contato**: Telefone comercial, celular, email, site
- 📱 **Redes Sociais**: Facebook, Instagram, Twitter
- 👤 **Gestão**: Nome do diretor e coordenador

#### Configurações Acadêmicas
- 📅 **Ano Letivo**: Configuração do ano corrente
- 📊 **Trimestre Atual**: Seleção do período ativo
- 📈 **Nota Mínima de Aprovação**: Padrão 6.0 (editável)
- 📉 **Frequência Mínima**: Padrão 75% (editável)

### 🎨 Sistema de Temas

#### Modo Escuro (Padrão)
- 🌙 **Cor Primária**: Verde Ciano (#00CED1)
- ⬛ **Background**: Preto (#0A0E14)
- 🎨 **Componentes**: Cards escuros com bordas sutis
- 👁️ **Contraste**: Otimizado para leitura prolongada

#### Modo Claro
- ☀️ **Cor Primária**: Marrom (#8B4513 - Saddle Brown)
- 🍯 **Background**: Mel (#F5DEB3 - Wheat/Honey)
- 🎨 **Componentes**: Cards claros com sombras marrons suaves
- 💡 **Brilho**: Tema quente e acolhedor, ideal para ambientes educacionais

#### Persistência
- 💾 **LocalStorage**: Preferência salva no navegador
- 🔄 **Auto-aplicação**: Carregamento automático na inicialização
- 🎯 **Toggle Rápido**: Botão no AppBar (ícone sol/lua)

### 🔒 Autenticação e Segurança

#### Sistema de Login
- 📧 **Email + Senha**: Credenciais únicas por usuário
- 🔐 **JWT**: Token com validade de 30 dias
- 🔒 **Hashs Bcrypt**: Salt 10 para segurança de senhas
- 🚫 **Proteção de Rotas**: Middleware em todas as rotas privadas

#### Papéis e Permissões
- 👑 **Admin**: Acesso total ao sistema
- 👨‍🏫 **Professor**: Gestão de turmas, avaliações e frequências
- 👨‍💼 **Coordenador**: Visualização e relatórios

#### Segurança Implementada
- ✅ Token Bearer em todas as requisições
- ✅ Validação em camadas (frontend + backend)
- ✅ Sanitização de inputs com express-validator
- ✅ CORS configurado para origem específica
- ✅ Senhas nunca retornadas nas respostas
- ✅ Soft delete (registros mantêm histórico)

---

## 🛠️ Tecnologias

### Frontend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **React** | 19.2.4 | Biblioteca para interfaces |
| **React Router** | 6.30.3 | Roteamento SPA |
| **Material-UI (MUI)** | 6.5.0 | Componentes UI prontos |
| **Emotion** | 11.14.0 | CSS-in-JS (MUI dependency) |
| **Chart.js** | 4.5.1 | Gráficos interativos |
| **React-ChartJS-2** | 5.3.1 | Wrapper React para Chart.js |
| **Axios** | 1.13.6 | Cliente HTTP |
| **React-Toastify** | 10.0.6 | Notificações Toast |
| **PapaParse** | 5.5.3 | Parser de CSV |
| **XLSX** | 0.18.5 | Manipulação de Excel |
| **html2pdf.js** | 0.14.0 | Geração de PDFs |
| **html2canvas** | 1.4.1 | Screenshots de DOM |

### Backend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Node.js** | 20+ | Runtime JavaScript |
| **Express** | 4.22.1 | Framework web |
| **MongoDB** | Atlas | Banco de dados NoSQL |
| **Mongoose** | 8.23.0 | ODM para MongoDB |
| **JWT** | 9.0.3 | Autenticação via token |
| **bcryptjs** | 2.4.3 | Hash de senhas |
| **express-validator** | 7.3.1 | Validação de dados |
| **cors** | 2.8.6 | Controle de CORS |
| **dotenv** | 16.6.1 | Variáveis de ambiente |
| **PDFKit** | 0.17.2 | Geração de PDFs no backend |
| **chartjs-node-canvas** | 5.0.0 | Gráficos server-side |

### Ferramentas e Padrões

- **Git**: Controle de versão
- **npm**: Gerenciador de pacotes
- **ESLint**: Linting de código
- **Prettier**: Formatação de código
- **REST API**: Arquitetura de APIs
- **JWT**: Padrão de autenticação
- **MVC**: Padrão arquitetural (backend)
- **Component-Based**: Arquitetura React (frontend)
- **Context API**: Gerenciamento de estado global
- **Custom Hooks**: Lógica reutilizável

---

## 📁 Estrutura do Projeto

```
sistgesedu/
├── client/                          # Frontend React
│   ├── public/
│   │   ├── index.html               # HTML principal
│   │   └── favicon.ico
│   ├── src/
│   │   ├── App.js                   # Configuração de rotas
│   │   ├── index.js                 # Entry point
│   │   ├── theme.js                 # Configuração de temas
│   │   ├── components/              # Componentes reutilizáveis
│   │   │   ├── Layout.js            # Layout principal com AppBar/Drawer
│   │   │   ├── PrivateRoute.js      # Proteção de rotas
│   │   │   ├── PageHeader.js        # Cabeçalho de páginas
│   │   │   ├── CardExportacaoFrequencia.js  # Card WhatsApp
│   │   │   └── ModalHistoricoFrequencia.js  # Modal de histórico
│   │   ├── context/                 # Context API
│   │   │   ├── AuthContext.js       # Autenticação
│   │   │   ├── SchoolContext.js     # Dados da escola
│   │   │   └── ThemeContext.js      # Tema dark/light
│   │   ├── hooks/                   # Custom hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useDebounce.js
│   │   │   └── index.js
│   │   ├── pages/                   # Páginas da aplicação
│   │   │   ├── Home.js              # Página inicial pública
│   │   │   ├── Login.js             # Login de usuários
│   │   │   ├── Register.js          # Registro de novos usuários
│   │   │   ├── Dashboard.js         # Dashboard principal
│   │   │   ├── Professores.js       # Gestão de professores
│   │   │   ├── Disciplinas.js       # Gestão de disciplinas
│   │   │   ├── Turmas.js            # Gestão de turmas
│   │   │   ├── Alunos.js            # Gestão de alunos
│   │   │   ├── Avaliacoes.js        # Sistema de avaliações
│   │   │   ├── Habilidades.js       # Gestão de habilidades BNCC
│   │   │   ├── Frequencias.js       # Registro de frequências
│   │   │   ├── Relatorios.js        # Geração de relatórios
│   │   │   └── Configuracoes.js     # Configurações do sistema
│   │   ├── services/                # Camada de serviços
│   │   │   ├── api.js               # Configuração Axios
│   │   │   └── index.js             # Serviços consolidados
│   │   ├── styles/                  # Estilos globais
│   │   │   └── index.css
│   │   └── utils/                   # Utilitários
│   │       ├── exportUtils.js       # Exportação de imagens
│   │       └── helpers.js           # Funções auxiliares
│   ├── package.json
│   └── .env.example
│
├── server/                          # Backend Node.js
│   ├── src/
│   │   ├── server.js                # Entry point do servidor
│   │   ├── config/
│   │   │   └── database.js          # Conexão MongoDB
│   │   ├── models/                  # Modelos Mongoose
│   │   │   ├── User.js              # Usuários
│   │   │   ├── Turma.js             # Turmas
│   │   │   ├── Aluno.js             # Alunos
│   │   │   ├── Professor.js         # Professores
│   │   │   ├── Disciplina.js        # Disciplinas
│   │   │   ├── Frequencia.js        # Frequências
│   │   │   ├── Avaliacao.js         # Avaliações
│   │   │   ├── Habilidade.js        # Habilidades
│   │   │   └── SchoolSettings.js    # Configurações
│   │   ├── controllers/             # Controladores (lógica de negócio)
│   │   │   ├── authController.js
│   │   │   ├── turmaController.js
│   │   │   ├── alunoController.js
│   │   │   ├── professorController.js
│   │   │   ├── disciplinaController.js
│   │   │   ├── frequenciaController.js
│   │   │   ├── avaliacaoController.js
│   │   │   ├── habilidadeController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── relatorioController.js
│   │   │   └── settingsController.js
│   │   ├── routes/                  # Definição de rotas
│   │   │   ├── auth.js
│   │   │   ├── turmas.js
│   │   │   ├── alunos.js
│   │   │   ├── professores.js
│   │   │   ├── disciplinas.js
│   │   │   ├── frequencias.js
│   │   │   ├── avaliacoes.js
│   │   │   ├── habilidades.js
│   │   │   ├── dashboard.js
│   │   │   ├── relatorios.js
│   │   │   └── settings.js
│   │   ├── middleware/              # Middlewares
│   │   │   └── auth.js              # Autenticação JWT + roles
│   │   └── utils/                   # Utilitários
│   │       └── helpers.js
│   ├── scripts/                     # Scripts de manutenção
│   │   ├── criar-turmas.js          # Cria turmas 1º-9º ano
│   │   ├── gerar-matriculas.js      # Gera matrículas automáticas
│   │   ├── resetar-frequencias.js   # Limpa frequências (⚠️ destrutivo)
│   │   ├── verificar-saude.js       # Audit do banco
│   │   ├── migrar-frequencia-simplificada.js  # Migração de dados
│   │   ├── limpar-alunos-removidos.js  # Remove alunos inativos
│   │   ├── verificar-frequencias.js  # Valida frequências
│   │   ├── debug-turma.js           # Debug detalhado de turma
│   │   └── verificar-collections.js  # Auditoria de collections
│   ├── seed.js                      # Seed básico
│   ├── seed-completo.js             # Seed com dados realistas
│   ├── teste-conexao.js             # Testa conexão MongoDB
│   ├── package.json
│   └── .env.example
│
├── docs/                            # Documentação completa
│   ├── guias/                       # Guias de uso
│   ├── tecnica/                     # Documentação técnica
│   ├── planos/                      # Planos de implementação
│   └── INDEX.md                     # Índice da documentação
│
├── exemplos/                        # Arquivos de exemplo
│   ├── alunos_exemplo.csv
│   ├── turmas_exemplo.csv
│   ├── avaliacoes_exemplo.csv
│   ├── frequencias_exemplo.csv
│   └── README.md
│
├── README.md                        # Este arquivo
├── CHANGELOG.md                     # Histórico de mudanças
├── LICENSE                          # Licença MIT
├── COPYRIGHT_HEADER.txt             # Header de copyright
└── .gitignore                       # Arquivos ignorados pelo Git
```

---

## 📚 Documentação

A documentação completa do sistema está organizada na pasta `docs/`:

### 📖 Guias de Uso

- **[COMO_EXECUTAR.md](docs/guias/COMO_EXECUTAR.md)** - Passo a passo para inicializar o sistema
- **[GUIA_EXECUCAO.md](docs/guias/GUIA_EXECUCAO.md)** - Guia detalhado com screenshots
- **[INSTALACAO.md](docs/guias/INSTALACAO.md)** - Instalação de dependências
- **[IMPORTACAO_EXCEL.md](docs/guias/IMPORTACAO_EXCEL.md)** - Como importar dados via CSV/Excel

### 🔧 Documentação Técnica

- **[API_ENDPOINTS.md](docs/tecnica/API_ENDPOINTS.md)** - Referência completa de endpoints
- **[SISTEMA_FREQUENCIA.md](docs/tecnica/SISTEMA_FREQUENCIA.md)** - Detalhes do sistema de frequência
- **[SISTEMA_AVALIACOES.md](docs/tecnica/SISTEMA_AVALIACOES.md)** - Modelo de pontos de corte
- **[CONEXAO_BACKEND_FRONTEND.md](docs/tecnica/CONEXAO_BACKEND_FRONTEND.md)** - Integração client-server
- **[MONGODB_ATLAS.md](docs/tecnica/MONGODB_ATLAS.md)** - Configuração do banco em nuvem
- **[AUTENTICACAO_CONFIGURACOES.md](docs/tecnica/AUTENTICACAO_CONFIGURACOES.md)** - Sistema de autenticação

### 📋 Índice Completo

Acesse **[docs/INDEX.md](docs/INDEX.md)** para visualizar todos os documentos disponíveis organizados por categoria.

---

## 🚀 Deploy e Produção

### Opções de Hospedagem

#### Frontend
- **Vercel** (Recomendado): Deploy automático via GitHub
- **Netlify**: CI/CD integrado
- **GitHub Pages**: Gratuito para repositórios públicos

#### Backend
- **Heroku**: Deploy fácil com Procfile
- **Railway**: Moderno e gratuito (tier inicial)
- **Render**: Deploy automático com GitHub
- **AWS EC2**: Controle total (requer configuração)

#### Banco de Dados
- **MongoDB Atlas**: Usado no projeto (cluster gratuito M0)
- **Backup Automático**: Configurado no Atlas
- **Réplicas**: Disponível em planos pagos

### Configuração de Produção

#### 1️⃣ Frontend (Vercel)

```bash
# Build de produção
cd client
npm run build

# Deploy
vercel --prod
```

**Variáveis de Ambiente:**
```env
REACT_APP_API_URL=https://seubackend.herokuapp.com/api
REACT_APP_VERSION=2.11
NODE_ENV=production
```

#### 2️⃣ Backend (Heroku)

```bash
# Criar app
heroku create sistgesedu-api

# Configurar variáveis
heroku config:set MONGODB_URI=your_connection_string
heroku config:set JWT_SECRET=your_secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

**Arquivo `Procfile`:**
```
web: node server/src/server.js
```

---

## 🔮 Roadmap e Melhorias Futuras

### 📅 Versão 3.0 (Planejado)

#### Novos Módulos
- [ ] **Sistema de Mensagens**: Chat interno entre professores, alunos e responsáveis
- [ ] **Portal do Aluno**: Área exclusiva para consulta de notas e frequências
- [ ] **Portal do Responsável**: Acompanhamento em tempo real via app
- [ ] **Sistema de Notificações**: Push notifications para eventos importantes
- [ ] **Biblioteca Digital**: Gestão de materiais didáticos e livros
- [ ] **Financeiro**: Controle de mensalidades e pagamentos
- [ ] **Transporte Escolar**: Gestão de rotas e veículos

#### Melhorias Técnicas
- [ ] **WebSockets**: Atualizações em tempo real sem refresh
- [ ] **PWA**: Progressive Web App instalável
- [ ] **Offline Mode**: Funcionamento sem internet (service workers)
- [ ] **Multi-tenancy**: Suporte a múltiplas escolas em uma única instância
- [ ] **i18n**: Internacionalização (múltiplos idiomas)
- [ ] **GraphQL**: API opcional para queries complexas
- [ ] **TypeScript**: Migração gradual para TS
- [ ] **Docker**: Containerização completa
- [ ] **Kubernetes**: Orquestração de containers

#### Experiência do Usuário
- [ ] **Onboarding**: Tutorial interativo para novos usuários
- [ ] **Atalhos de Teclado**: Navegação rápida (Ctrl+K)
- [ ] **Modo Acessível**: WCAG 2.1 compliance
- [ ] **Personalização**: Temas customizáveis por usuário
- [ ] **Widgets Arrastáveis**: Dashboard personalizável
- [ ] **Favoritos**: Acesso rápido a recursos frequentes
- [ ] **Histórico de Ações**: Auditoria completa de mudanças

#### Análises Avançadas
- [ ] **BI Dashboard**: Business Intelligence com Power BI/Metabase
- [ ] **Machine Learning**: Predição de desempenho e evasão
- [ ] **Análise Preditiva**: Identificação precoce de alunos em risco
- [ ] **Relatórios Personalizados**: Editor visual de relatórios
- [ ] **Comparações Históricas**: Evolução ano a ano
- [ ] **Benchmarking**: Comparação com outras escolas

#### Integrações
- [ ] **Google Classroom**: Sincronização de turmas e atividades
- [ ] **Zoom/Teams**: Integração para aulas online
- [ ] **WhatsApp Business API**: Envio automático de notificações
- [ ] **E-mail Marketing**: Campanhas segmentadas
- [ ] **Calendar**: Google Calendar / Outlook sincronização
- [ ] **Stripe/PayPal**: Pagamento de mensalidades online

### 🐛 Correções Conhecidas
- [ ] Otimizar carregamento de imagens grandes na logo
- [ ] Melhorar performance de listagens com +1000 registros
- [ ] Corrigir timezone em datas de importação CSV
- [ ] Adicionar loading states em todas operações assíncronas
- [ ] Implementar retry automático em falhas de requisição

### 💡 Sugestões da Comunidade
Abra uma [issue no GitHub](https://github.com/RODRIGOGRILLOMOREIRA/SISTGESEDU/issues) para sugerir melhorias!

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. Abra um **Pull Request**

### Diretrizes de Contribuição
- Siga o padrão de código existente (ESLint/Prettier)
- Adicione testes para novas funcionalidades
- Atualize a documentação quando necessário
- Descreva claramente as mudanças no PR

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License**.

```
MIT License

Copyright (c) 2026 RODRIGO GRILLO MOREIRA

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Rodrigo Grillo Moreira**

- GitHub: [@RODRIGOGRILLOMOREIRA](https://github.com/RODRIGOGRILLOMOREIRA)
- Email: rodrigo@example.com

---

## 🙏 Agradecimentos

- [React](https://reactjs.org/) - Biblioteca UI incrível
- [Material-UI](https://mui.com/) - Componentes prontos e elegantes
- [Chart.js](https://www.chartjs.org/) - Gráficos interativos poderosos
- [MongoDB](https://www.mongodb.com/) - Banco de dados flexível
- [Express](https://expressjs.com/) - Framework web minimalista
- Toda a comunidade open source! 🎉

---

## 📞 Suporte

Encontrou um bug ou precisa de ajuda?

- 🐛 **Issues**: [GitHub Issues](https://github.com/RODRIGOGRILLOMOREIRA/SISTGESEDU/issues)
- 📧 **Email**: rodrigo@example.com
- 📚 **Documentação**: [docs/INDEX.md](docs/INDEX.md)

---

<div align="center">

**Desenvolvido com ❤️ por Rodrigo Grillo Moreira**

⭐ Se este projeto foi útil, dê uma estrela no GitHub!

[⬆ Voltar ao topo](#-sistgesedu---sistema-completo-de-gestão-escolar)

</div>
