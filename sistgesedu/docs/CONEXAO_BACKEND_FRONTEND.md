# 🔌 Conexão Back End ↔️ Front End

## 📋 Resumo da Configuração

O sistema está configurado com **back end (Node.js/Express)** e **front end (React)** rodando em servidores separados que se comunicam via API REST.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      NAVEGADOR                              │
│                  http://localhost:3000                      │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │         REACT APP (Front End)                      │   │
│  │  • Components (UI)                                 │   │
│  │  • Pages                                           │   │
│  │  • Services (api.js)                              │   │
│  └────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         │ HTTP Requests (Axios)            │
│                         ▼                                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ CORS habilitado
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              SERVIDOR (Back End)                            │
│            http://localhost:5000/api                        │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │       EXPRESS API (Node.js)                        │   │
│  │  • Routes                                          │   │
│  │  • Controllers                                     │   │
│  │  • Models                                          │   │
│  │  • Middleware (Auth, CORS)                        │   │
│  └────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         │ Mongoose                          │
│                         ▼                                   │
│  ┌────────────────────────────────────────────────────┐   │
│  │       MONGODB ATLAS (Banco de Dados)               │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## ⚙️ Configuração Atual

### Back End (Servidor)
**Arquivo:** `server/src/server.js`
- **Porta:** 5000
- **URL Base:** http://localhost:5000
- **API Base:** http://localhost:5000/api
- **CORS:** Configurado para aceitar requisições de http://localhost:3000

**Arquivo:** `server/.env`
```env
PORT=5000
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
```

### Front End (Cliente)
**Arquivo:** `client/src/services/api.js`
- **URL da API:** http://localhost:5000/api (via variável de ambiente)
- **Biblioteca HTTP:** Axios
- **Autenticação:** JWT via Header Authorization

**Arquivo:** `client/.env`
```env
REACT_APP_API_URL=http://localhost:5000/api
PORT=3000
```

## 🔐 Fluxo de Autenticação

```
1. Login/Register
   Front End → POST /api/auth/login → Back End
   
2. Back End valida e retorna JWT Token
   Back End → { token, user } → Front End
   
3. Front End armazena token no localStorage
   localStorage.setItem('token', token)
   
4. Requisições subsequentes incluem token
   Front End → GET /api/alunos
   Header: Authorization: Bearer <token>
   
5. Back End valida token em cada requisição
   Middleware auth verifica JWT → Permite acesso
```

## 📡 Comunicação entre Front e Back

### Configuração do Axios (`client/src/services/api.js`)

```javascript
import axios from 'axios';

// Cria instância do axios com URL base
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Adiciona token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

// Interceptor: Trata erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redireciona para login se não autorizado
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### CORS no Back End (`server/src/server.js`)

```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

## 📂 Estrutura de Endpoints

### Autenticação
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/validate` - Validar token

### Recursos (Requer Autenticação)
- `GET/POST/PUT/DELETE /api/alunos` - Alunos
- `GET/POST/PUT/DELETE /api/professores` - Professores
- `GET/POST/PUT/DELETE /api/turmas` - Turmas
- `GET/POST/PUT/DELETE /api/disciplinas` - Disciplinas
- `GET/POST/PUT/DELETE /api/avaliacoes` - Avaliações
- `GET/POST/PUT/DELETE /api/frequencias` - Frequências
- `GET/POST/PUT/DELETE /api/habilidades` - Habilidades
- `GET /api/dashboard` - Dashboard
- `GET /api/relatorios` - Relatórios
- `GET/PUT /api/settings` - Configurações

## 🧪 Testando a Conexão

### 1. Testar Back End Diretamente
```powershell
# No navegador ou com curl
http://localhost:5000
# Deve retornar: { "message": "API do Sistema Escolar está funcionando!" }
```

### 2. Testar Endpoint da API
```powershell
# Com PowerShell
Invoke-RestMethod -Uri http://localhost:5000/api/auth/validate -Method POST
```

### 3. Verificar no Front End
- Abra o console do navegador (F12)
- Vá para a aba "Network"
- Faça login no sistema
- Observe as requisições para http://localhost:5000/api

## 🐛 Troubleshooting

### Erro: "Network Error" no Front End
**Causa:** Back end não está rodando
**Solução:** Inicie o servidor com `cd server && npm run dev`

### Erro: "CORS policy"
**Causa:** CORS não configurado ou origem incorreta
**Solução:** Verifique se `CORS_ORIGIN=http://localhost:3000` está no `server/.env`

### Erro: 401 Unauthorized
**Causa:** Token inválido ou expirado
**Solução:** Faça logout e login novamente

### Front End não conecta à API
**Causa:** Variável de ambiente não configurada
**Solução:** 
1. Verifique se `client/.env` existe
2. Confirme se tem `REACT_APP_API_URL=http://localhost:5000/api`
3. Reinicie o servidor React com `npm start`

### Porta 5000 ou 3000 já em uso
**Windows:**
```powershell
# Ver processos usando a porta
Get-NetTCPConnection -LocalPort 5000

# Matar processo
Stop-Process -Id <PID> -Force
```

## 📝 Notas Importantes

1. **Variáveis de Ambiente React:** Prefixo `REACT_APP_` é obrigatório
2. **Reiniciar após alterar .env:** Alterações em `.env` requerem restart do servidor
3. **CORS em Produção:** Configure origens específicas, não use `*`
4. **HTTPS em Produção:** Use HTTPS para ambos os servidores
5. **Proxy Alternativo:** O `package.json` do cliente tem `"proxy": "http://localhost:5000"` como fallback

## 🚀 Próximos Passos

- [ ] Configurar variáveis de ambiente para produção
- [ ] Implementar rate limiting
- [ ] Adicionar logs de requisições
- [ ] Configurar HTTPS para produção
- [ ] Implementar refresh token
- [ ] Adicionar documentação Swagger/OpenAPI

## 📚 Referências

- [Axios Documentation](https://axios-http.com/)
- [Express CORS](https://expressjs.com/en/resources/middleware/cors.html)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
