# Sistema de Gestão Escolar

Sistema completo de gestão escolar desenvolvido com TypeScript, React e Node.js.

## 🚀 Tecnologias

### Backend
- **Node.js** com Express
- **TypeScript** para type-safety
- **Prisma ORM** para gerenciamento do banco de dados
- **Mongo DB** como banco de dados
- **Zod** para validação de dados

### Frontend
- **React 18** com TypeScript
- **Vite** como bundler
- **React Router** para navegação
- **Axios** para requisições HTTP
- **Lucide React** para ícones

## 📋 Funcionalidades

- ✅ Gestão de Alunos
- ✅ Gestão de Professores
- ✅ Gestão de Turmas
- ✅ Gestão de Disciplinas
- ✅ Lançamento de Notas
- ✅ Controle de Frequência
- ✅ Dashboard com estatísticas

## 🏗️ Estrutura do Projeto

```
PROJETO SISTEMA DE GESTÃO ESCOLAR/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── lib/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── lib/
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── tsconfig.json
```

## 🔧 Instalação

### Backend

1. Entre na pasta do backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo `.env`:
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas credenciais do banco de dados.

4. Execute as migrations do Prisma:
```bash
npm run prisma:migrate
```

5. Inicie o servidor:
```bash
npm run dev
```

O backend estará rodando em `http://localhost:3333`

### Frontend

1. Entre na pasta do frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

## 📊 Banco de Dados

O sistema utiliza PostgreSQL. Certifique-se de ter o PostgreSQL instalado e rodando.

### Estrutura das Tabelas

- **alunos**: Dados dos estudantes
- **professores**: Dados dos docentes
- **turmas**: Informações das turmas/classes
- **disciplinas**: Matérias lecionadas
- **matriculas**: Vínculo aluno-turma
- **notas**: Notas dos alunos por disciplina
- **frequencias**: Registro de presença/ausência

## 🔐 Variáveis de Ambiente

### Backend (.env)
```
DATABASE_URL="postgresql://usuario:senha@localhost:5432/gestao_escolar?schema=public"
PORT=3333
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3333/api
```

## 📝 API Endpoints

### Alunos
- `GET /api/alunos` - Lista todos os alunos
- `GET /api/alunos/:id` - Busca aluno por ID
- `POST /api/alunos` - Cria novo aluno
- `PUT /api/alunos/:id` - Atualiza aluno
- `DELETE /api/alunos/:id` - Remove aluno

### Professores
- `GET /api/professores` - Lista todos os professores
- `GET /api/professores/:id` - Busca professor por ID
- `POST /api/professores` - Cria novo professor
- `PUT /api/professores/:id` - Atualiza professor
- `DELETE /api/professores/:id` - Remove professor

### Turmas
- `GET /api/turmas` - Lista todas as turmas
- `GET /api/turmas/:id` - Busca turma por ID
- `POST /api/turmas` - Cria nova turma
- `PUT /api/turmas/:id` - Atualiza turma
- `DELETE /api/turmas/:id` - Remove turma

### Disciplinas
- `GET /api/disciplinas` - Lista todas as disciplinas
- `GET /api/disciplinas/:id` - Busca disciplina por ID
- `POST /api/disciplinas` - Cria nova disciplina
- `PUT /api/disciplinas/:id` - Atualiza disciplina
- `DELETE /api/disciplinas/:id` - Remove disciplina

### Notas
- `GET /api/notas` - Lista todas as notas
- `GET /api/notas/aluno/:alunoId` - Busca notas de um aluno
- `POST /api/notas` - Lança nova nota
- `PUT /api/notas/:id` - Atualiza nota
- `DELETE /api/notas/:id` - Remove nota

### Frequências
- `GET /api/frequencias` - Lista todas as frequências
- `GET /api/frequencias/aluno/:alunoId` - Busca frequências de um aluno
- `POST /api/frequencias` - Registra frequência
- `PUT /api/frequencias/:id` - Atualiza frequência
- `DELETE /api/frequencias/:id` - Remove frequência

## 🛠️ Scripts Disponíveis

### Backend
- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run build` - Compila o projeto
- `npm start` - Inicia o servidor em produção
- `npm run prisma:generate` - Gera o Prisma Client
- `npm run prisma:migrate` - Executa as migrations
- `npm run prisma:studio` - Abre o Prisma Studio

### Frontend
- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza o build de produção

## 📦 Próximos Passos

- [ ] Implementar autenticação e autorização
- [ ] Adicionar formulários de criação/edição
- [ ] Implementar paginação nas listagens
- [ ] Adicionar filtros e busca
- [ ] Criar relatórios em PDF
- [ ] Implementar notificações
- [ ] Adicionar testes unitários e de integração
- [ ] Deploy em produção

## 📄 Licença

Este projeto está sob a licença ISC.
