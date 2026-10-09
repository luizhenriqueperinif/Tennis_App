# 🎾 Tennis App — FATEC Olímpia (DSM)

> Aplicativo de gestão de aulas, acompanhamento de desempenho por fundamentos e ranking gamificado para professores e alunos de tênis.

---

## 👥 Equipe do Projeto

| Integrante | Papel / Responsabilidade |
|:---|:---|
| **👑 Luiz Henrique** | Coordenador Geral & Product Owner |
| **📋 Biel Cabeludo & Túlio** | Engenharia de Requisitos & Regras de Negócio |
| **🎨 Wesley & Gabriel Marini (Teto)** | UI/UX Design & Prototipagem (Figma) |
| **💻 Gabriel Loiro (Pegador) & Du (Eduardo)** | Arquitetura de Software & Banco de Dados |

---

## 📊 Gestão e Acompanhamento

- 📋 **Quadro de Tarefas (Jira):** [tennisappfatec.atlassian.net — projeto KAN](https://tennisappfatec.atlassian.net/jira/software/projects/KAN/boards/1)
- 🗺️ **Roadmap Geral:** [`Roadmap Completo — Projeto App de Tênis.pdf`](./Roadmap%20Completo%20%E2%80%94%20Projeto%20App%20de%20T%C3%AAnis.pdf)

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
├── README.md                                       ← Este arquivo
├── Roadmap Completo — Projeto App de Tênis.pdf     ← Roadmap das 5 etapas do projeto
├── .gitignore                                      ← Arquivos ignorados pelo Git
│
└── docs/                                           ← Documentação do projeto
    ├── Requisitos_RegrasDeNegocio.docx.pdf         ← [Biel & Túlio] RFs, RNFs, RNs, histórias e casos de uso
    ├── Arquivo de pesquisas - Tecnologias e BD.pdf ← [Pegador & Du] Comparativo e justificativa da stack
    └── reunioes/                                   ← Pautas e atas de reuniões
        └── Reuniao_Alinhamento_Etapa1_09_Out_26.pdf
```

> A pasta `src/`, com o código-fonte da aplicação, será criada na Etapa 2.

---

## 🚀 Etapas do Projeto

1. **Etapa 1: Planejamento & Fundação (Fase Atual)** — Requisitos, protótipos e decisões técnicas.
2. **Etapa 2: Estrutura & Base de Código** — Repositório configurado, banco criado, autenticação e rotas.
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

---

## 📞 Suporte e Contato

Dúvidas ou decisões urgentes devem ser alinhadas diretamente com o coordenador **Luiz Henrique** ou através do canal do grupo.
