# 📚 Índice da Documentação - SISTGESEDU

**Organização completa da documentação do Sistema de Gestão Escolar**

---

## 📖 Guias de Uso (`/guias/`)

Documentos voltados para usuários finais e administradores do sistema.

### Inicialização e Instalação
- **[COMO_EXECUTAR.md](guias/COMO_EXECUTAR.md)** - Passo a passo para inicializar o sistema (backend + frontend)
- **[GUIA_EXECUCAO.md](guias/GUIA_EXECUCAO.md)** - Guia completo com screenshots e troubleshooting
- **[INSTALACAO.md](guias/INSTALACAO.md)** - Instalação de dependências e configuração inicial
- **[DESENVOLVIMENTO.md](guias/DESENVOLVIMENTO.md)** - Workflow de desenvolvimento e boas práticas

### Funcionalidades
- **[IMPORTACAO_EXCEL.md](guias/IMPORTACAO_EXCEL.md)** - Como importar dados via CSV/Excel (alunos, turmas, avaliações, frequências)
- **[GUIA_FLUXO_TURMAS_ALUNOS.md](guias/GUIA_FLUXO_TURMAS_ALUNOS.md)** - Fluxo completo de cadastro de turmas e alunos
- **[CADASTRO_TURMAS_ALUNOS.md](guias/CADASTRO_TURMAS_ALUNOS.md)** - Detalhes do cadastro passo a passo
- **[CADASTRO_USUARIOS.md](guias/CADASTRO_USUARIOS.md)** - Como cadastrar usuários e definir permissões

### Publicação e Deploy
- **[COMO_PUBLICAR_GITHUB.md](guias/COMO_PUBLICAR_GITHUB.md)** - Como publicar o código no GitHub
- **[CONFIGURAR_REPOSITORIO_PUBLICO.md](guias/CONFIGURAR_REPOSITORIO_PUBLICO.md)** - Configurações de repositório público

---

## 🔧 Documentação Técnica (`/tecnica/`)

Documentos voltados para desenvolvedores e equipe técnica.

### API e Backend
- **[API_ENDPOINTS.md](tecnica/API_ENDPOINTS.md)** - Referência completa de todos os endpoints da API REST
- **[AUTENTICACAO_CONFIGURACOES.md](tecnica/AUTENTICACAO_CONFIGURACOES.md)** - Sistema de autenticação JWT e roles
- **[CONEXAO_BACKEND_FRONTEND.md](tecnica/CONEXAO_BACKEND_FRONTEND.md)** - Como o frontend se comunica com o backend

### Sistemas Principais
- **[SISTEMA_FREQUENCIA.md](tecnica/SISTEMA_FREQUENCIA.md)** - Documentação completa do sistema de frequência
- **[SISTEMA_AVALIACOES.md](tecnica/SISTEMA_AVALIACOES.md)** - Modelo de pontos de corte (PC1, PC2, PC3, EAC)
- **[SISTEMA_IMPORTACAO_AVALIACOES_FREQUENCIAS.md](tecnica/SISTEMA_IMPORTACAO_AVALIACOES_FREQUENCIAS.md)** - Detalhes da importação em lote
- **[FREQUENCIA_SIMPLIFICADA.md](tecnica/FREQUENCIA_SIMPLIFICADA.md)** - Simplificações no modelo de frequência

### Banco de Dados
- **[MONGODB_ATLAS.md](tecnica/MONGODB_ATLAS.md)** - Configuração e uso do MongoDB Atlas (cloud)
- **[SOLUCAO_MONGODB.md](tecnica/SOLUCAO_MONGODB.md)** - Troubleshooting de problemas comuns com MongoDB

### Temas e UI
- **[TEMA.md](tecnica/TEMA.md)** - Sistema de temas (dark/light)
- **[TEMA_IMPLEMENTADO.md](tecnica/TEMA_IMPLEMENTADO.md)** - Detalhes da implementação de temas
- **[TESTE_LOGO_ESCOLA.md](tecnica/TESTE_LOGO_ESCOLA.md)** - Testes de upload e exibição de logo

### Infraestrutura
- **[SCRIPTS.md](tecnica/SCRIPTS.md)** - Documentação dos scripts de manutenção
- **[ATUALIZACAO_NODE.md](tecnica/ATUALIZACAO_NODE.md)** - Como atualizar Node.js e dependências
- **[OTIMIZACOES.md](tecnica/OTIMIZACOES.md)** - Otimizações de performance implementadas
- **[GITHUB.md](tecnica/GITHUB.md)** - Uso do Git e GitHub no projeto
- **[RELATORIOS.md](tecnica/RELATORIOS.md)** - Sistema de geração de relatórios PDF
- **[RELATORIO_TECNICO_COMPLETO.md](tecnica/RELATORIO_TECNICO_COMPLETO.md)** - Relatório técnico consolidado do projeto

---

## 📋 Planos e Melhorias (`/planos/`)

Documentos de planejamento, implementação e melhorias futuras.

### Planos de Implementação
- **[PLANO_AJUSTE_RODAPE_CARD.md](planos/PLANO_AJUSTE_RODAPE_CARD.md)** - Ajuste de rodapé do card de frequência
- **[PLANO_AJUSTE_RODAPE_MODAL.md](planos/PLANO_AJUSTE_RODAPE_MODAL.md)** - Ajuste de rodapé do modal
- **[PLANO_CORRECAO_HISTORICO_FREQUENCIA.md](planos/PLANO_CORRECAO_HISTORICO_FREQUENCIA.md)** - Correções no histórico de frequência
- **[PLANO_HISTORICO_FREQUENCIA_DASHBOARD.md](planos/PLANO_HISTORICO_FREQUENCIA_DASHBOARD.md)** - Implementação de histórico no dashboard
- **[PLANO_MELHORIA_CARD_FREQUENCIA.md](planos/PLANO_MELHORIA_CARD_FREQUENCIA.md)** - Melhorias no card de exportação WhatsApp

### Melhorias Implementadas
- **[MELHORIAS_FREQUENCIAS.md](planos/MELHORIAS_FREQUENCIAS.md)** - Melhorias no sistema de frequência
- **[MELHORIAS_FREQUENCIAS_DASHBOARD.md](planos/MELHORIAS_FREQUENCIAS_DASHBOARD.md)** - Melhorias no dashboard de frequência

### Diagnósticos
- **[DIAGNOSTICO_PDF_V3.md](planos/DIAGNOSTICO_PDF_V3.md)** - Diagnóstico de problemas com geração de PDF

### Resumos
- **[RESUMO_FINAL.md](planos/RESUMO_FINAL.md)** - Resumo final do projeto
- **[RESUMO_IMPLEMENTACAO.md](planos/RESUMO_IMPLEMENTACAO.md)** - Resumo de implementações realizadas
- **[RESUMO_MELHORIAS.md](planos/RESUMO_MELHORIAS.md)** - Resumo de melhorias aplicadas

---

## 🔍 Como Navegar

### Para Usuários Iniciantes
1. Comece pelo **[README.md](../README.md)** (raiz do projeto)
2. Siga o **[Guia de Instalação](guias/INSTALACAO.md)**
3. Execute o sistema conforme **[Como Executar](guias/COMO_EXECUTAR.md)**
4. Explore as funcionalidades com os **[Guias de Uso](guias/)**

### Para Desenvolvedores
1. Leia o **[README.md](../README.md)** para visão geral
2. Consulte a **[Documentação Técnica](tecnica/)** para detalhes de implementação
3. Veja a **[Referência de API](tecnica/API_ENDPOINTS.md)** para integração
4. Confira os **[Planos de Melhoria](planos/)** para contribuir

### Para Administradores
1. Siga o **[Guia de Instalação](guias/INSTALACAO.md)** para deploy
2. Configure o banco com **[MongoDB Atlas](tecnica/MONGODB_ATLAS.md)**
3. Cadastre usuários conforme **[Cadastro de Usuários](guias/CADASTRO_USUARIOS.md)**
4. Importe dados usando **[Importação Excel](guias/IMPORTACAO_EXCEL.md)**

---

## 📊 Estatísticas da Documentação

| Categoria | Nº de Documentos |
|-----------|------------------|
| **Guias de Uso** | 10 |
| **Documentação Técnica** | 16 |
| **Planos e Melhorias** | 13 |
| **Total** | **39 documentos** |

---

## 🔄 Última Atualização

**Data:** 07 de Março de 2026  
**Versão do Sistema:** 2.10  
**Responsável:** RODRIGO GRILLO MOREIRA

---

<div align="center">

**Copyright © 2026 RODRIGO GRILLO MOREIRA**  
**Documentação mantida pela comunidade SISTGESEDU**

[⬆ Voltar ao README Principal](../README.md)

</div>
