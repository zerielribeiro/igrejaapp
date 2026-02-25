# ⛪ Igreja App — Sistema de Gestão Eclesiástica

<p align="center">
  <strong>Plataforma completa para administração de igrejas e comunidades religiosas</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## 📋 Sobre o Projeto

O **Igreja App** é um sistema multi-tenant de gestão eclesiástica que permite a múltiplas igrejas gerenciarem seus membros, finanças, chamadas (presença) e relatórios de forma independente e segura.

Cada instituição possui seu próprio *slug* de acesso (ex: `/igreja-batista-central/dashboard`), garantindo **isolamento total de dados** entre as congregações.

---

## ✨ Funcionalidades

### 🏠 Dashboard
- Visão geral com indicadores-chave (membros ativos, frequência, finanças)
- Gráficos de evolução mensal de presença
- Alertas de aniversariantes e membros ausentes
- Resumo financeiro com receitas vs despesas

### 👥 Gestão de Membros
- Cadastro completo (nome, CPF, telefone, e-mail, endereço)
- Classificação por faixa etária (Criança, Jovem, Adulto)
- Controle de status (Ativo, Inativo, Visitante)
- Registro de data de batismo e ingresso
- Busca e filtros por sala/grupo

### 💰 Módulo Financeiro
- Registro de entradas (dízimos, ofertas, doações, campanhas)
- Registro de saídas (aluguel, energia, manutenção, missões)
- Resumo financeiro com saldo e gráficos
- Histórico de transações com filtros por categoria

### 📋 Chamada / Presença
- Registro de presença por sala/grupo
- Seleção de data e sala
- Marcação individual de presentes e ausentes
- Registro de visitantes
- Sessões finalizadas com contagem automática

### 📊 Relatórios
- Evolução mensal de frequência (gráfico de linhas)
- Comparativo por sala/grupo (gráfico de barras)
- Ranking individual de frequência dos membros
- Filtros por período e sala

### ⚙️ Configurações
- Gestão de usuários e permissões (Admin, Secretário, Tesoureiro, Pastor)
- Gestão de salas/grupos da igreja
- Permissões por cargo (RBAC)

### 🛡️ Super Admin (Painel Master)
- Login dedicado com autenticação separada (`/superadmin/login`)
- Dashboard com estatísticas globais (total de igrejas, membros, planos)
- Lista de igrejas com nome do administrador e e-mail de contato
- Ativar/Desativar igrejas remotamente
- Alteração de senha do Super Admin
- Busca por igreja, administrador ou e-mail

### 🔒 Segurança
- Proteção de rotas por autenticação
- Isolamento de dados por `church_id` (multi-tenant)
- Bloqueio de acesso para igrejas inativas
- Tela dedicada de "Igreja Inativa" com contato de suporte
- Validação de senha para Super Admin
- Guard de rota no painel Super Admin

---

## 🛠️ Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| **Next.js** | 16.x | Framework fullstack React |
| **React** | 19.x | Biblioteca de UI |
| **TypeScript** | 5.x | Tipagem estática |
| **Tailwind CSS** | 4.x | Estilização com classes utilitárias |
| **Shadcn/UI** | latest | Componentes de interface (Button, Card, Table, Dialog, etc.) |
| **Recharts** | 2.x | Gráficos e visualizações |
| **Lucide React** | latest | Ícones |
| **Sonner** | 2.x | Notificações toast |
| **next-themes** | 0.4.x | Suporte a tema claro/escuro |

---

## 🚀 Instalação e Execução

### Pré-requisitos

- **Node.js** 18+ 
- **npm** 9+

### Instalação

```bash
# Clone o repositório
git clone git@github.com:zerielribeiro/igrejaapp.git

# Entre na pasta do projeto
cd igrejaapp

# Instale as dependências
npm install
```

### Execução

```bash
# Servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm start
```

O app estará disponível em: **http://localhost:3000**

---

## 🔑 Credenciais de Acesso (Demo)

### Super Admin
| Campo | Valor |
|---|---|
| URL | `/superadmin/login` |
| E-mail | `zeriel@gmail.com` |
| Senha | `admin123` |

### Igreja Batista Central (Admin)
| Campo | Valor |
|---|---|
| URL | `/igreja-batista-central/login` |
| E-mail | `carlos@igrejabatista.com` |
| Senha | qualquer valor (demo) |

### Comunidade Nova Vida (Admin)
| Campo | Valor |
|---|---|
| URL | `/nova-vida/login` |
| E-mail | `roberto@novavida.com` |
| Senha | qualquer valor (demo) |

---

## 📂 Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx                      # Landing page
│   ├── register/                     # Registro de nova igreja
│   ├── superadmin/
│   │   ├── login/page.tsx            # Login do Super Admin
│   │   └── page.tsx                  # Painel Super Admin
│   └── [slug]/                       # Rotas multi-tenant
│       ├── login/page.tsx            # Login da igreja
│       ├── dashboard/page.tsx        # Dashboard principal
│       ├── membros/page.tsx          # Gestão de membros
│       ├── financeiro/page.tsx       # Módulo financeiro
│       ├── chamada/page.tsx          # Controle de presença
│       ├── relatorios/page.tsx       # Relatórios e gráficos
│       ├── configuracoes/page.tsx    # Configurações
│       └── layout.tsx                # Layout com sidebar
├── components/
│   ├── ui/                           # Componentes Shadcn/UI
│   ├── sidebar.tsx                   # Navegação lateral
│   └── route-guard.tsx               # Proteção de rotas
├── lib/
│   ├── auth-context.tsx              # Estado global (AuthContext)
│   ├── types.ts                      # Interfaces TypeScript
│   ├── mock-data.ts                  # Dados de demonstração
│   └── utils.ts                      # Utilitários
└── middleware.ts                     # Middleware Next.js
```

---

## 🏗️ Arquitetura

### Multi-Tenancy
Cada igreja é isolada por `church_id`. O sistema usa o slug da URL para identificar a instituição e filtrar todos os dados correspondentes.

### Persistência
Os dados são armazenados no `localStorage` do navegador, permitindo que o app funcione como demo standalone sem necessidade de backend.

### Autenticação
O `AuthContext` gerencia sessões, login/logout, e expõe funções CRUD para todas as entidades. O `RouteGuard` protege as rotas verificando:
1. Autenticação do usuário
2. Pertencimento ao slug correto
3. Status ativo da igreja

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  Feito com ❤️ para a comunidade eclesiástica brasileira
</p>
