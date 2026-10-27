# 🎾 Tennis App — FATEC Olímpia (DSM)

> Aplicativo de gestão de aulas, acompanhamento de desempenho por fundamentos e ranking gamificado para professores e alunos de tênis.

---

## 👥 Equipe do Projeto

Duplas da Etapa 2:

| Integrante | Papel / Responsabilidade |
|:---|:---|
| **Luiz Henrique** | Coordenador Geral & Product Owner · Base do projeto |
| **Gabriel Castro & Eduardo** | Banco de dados e regras de acesso |
| **Túlio & Weslei** | Login e cadastro |
| **Gabriel Marini & Gabriel Sousa** | Visual e navegação |

---

## 📊 Gestão e Acompanhamento

- 📋 **Quadro de Tarefas (Jira):** [tennisappfatec.atlassian.net — projeto KAN](https://tennisappfatec.atlassian.net/jira/software/projects/KAN/boards/1)
- 🗺️ **Roadmap Geral:** [`Roadmap Completo — Projeto App de Tênis.pdf`](./docs/gestao/Roadmap%20Completo%20%E2%80%94%20Projeto%20App%20de%20T%C3%AAnis.pdf)
- 📁 **Índice da documentação:** [`docs/README.md`](./docs/README.md)
- 🤝 **Como contribuir (branches e PRs):** [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- 📱 **Como instalar e rodar o app:** [`app/README.md`](./app/README.md)

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|:---|:---|
| **Frontend (mobile)** | Flutter (Dart) |
| **Backend** | Supabase (Auth, API, Realtime) + Edge Functions em TypeScript |
| **Banco de Dados** | PostgreSQL (via Supabase), com Row Level Security |
| **Gestão** | Jira + Git/GitHub |

---

## 📂 Estrutura do Repositório

```text
Tennis_App/
├── README.md                     ← Este arquivo
├── CONTRIBUTING.md               ← Como trabalhar: branches, PRs e revisão
├── .gitignore
├── .github/                      ← Modelo de PR e verificação automática (análise e testes)
│
├── app/                          ← Código do aplicativo em Flutter (Etapa 2 em diante)
│                                    Pastas e como rodar: app/README.md
│
├── docs/                         ← Documentação do projeto (índice em docs/README.md)
│   ├── gestao/                   ← [Luiz] Roadmap e checagem cruzada dos entregáveis
│   ├── requisitos/               ← [Biel & Túlio] RFs, RNs, histórias de usuário e diagrama de casos de uso
│   ├── arquitetura/              ← [Pegador & Du] Stack, banco de dados e hospedagem
│   ├── design/                   ← Brandbook (versão de teste)
│   ├── prototipo/                ← Guia de teste do protótipo
│   ├── apresentacoes/            ← Slides e guia da apresentação de cada etapa
│   └── reunioes/                 ← Pautas e atas de reuniões
│
├── prototipo-supabase/           ← Protótipo funcional da Etapa 1 no Supabase (versão online)
│                                    Configuração e regras: prototipo-supabase/README.md
│
└── prototipo-local/              ← Mesmo protótipo com servidor local (plano B, sem internet)
                                     Como rodar: prototipo-local/README.md
```

> 🎾 **Protótipo online:** https://luizhenriqueperinif.github.io/Tennis_App/ (publicado a partir da branch `gh-pages`)

---

## 🚀 Etapas do Projeto

1. **Etapa 1: Planejamento & Fundação** ✅ — Requisitos, protótipos e decisões técnicas.
2. **Etapa 2: Estrutura & Base de Código (Fase Atual, até 27/11)** — Repositório configurado, banco criado, autenticação e rotas.
3. **Etapa 3: MVP — Funcionalidades Essenciais** — Aulas, presença, avaliação de desempenho e convites.
4. **Etapa 4: Ranking, Desafios & Comunidade** — Sistema de pontos, ranking por grupo e desafios.
5. **Etapa 5: Polimento, Testes & Entrega** — Testes de usabilidade, correções e apresentação FATEC.

---

## 📌 Padrão de Commits (Conventional Commits)

Recomendamos que a equipe use o seguinte padrão nas mensagens de commit:

- `feat:` Nova funcionalidade ou entrega de documento (ex.: `feat(requisitos): adiciona RF01 a RF15`)
- `docs:` Alterações na documentação (ex.: `docs: atualiza cronograma da etapa 1`)
- `style:` Ajustes de layout, design ou formatação (ex.: `style(figma): atualiza cores da tela home`)
- `fix:` Correção de bugs ou incoerências (ex.: `fix: corrige relacionamento 1:N no DER`)
- `refactor:` Refatoração de código ou reestruturação de arquivos
