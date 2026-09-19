# 🎾 Roadmap do Projeto — App de Tênis

> **Documento de Planejamento do Projeto**  
> **Equipe:** Luiz (Coordenador), Biel Cabeludo & Túlio, Wesley & Gabriel Marini (Teto), Gabriel Loiro (Pegador) & Du (Eduardo)  
> **Data de criação:** 19/09/2026  
> **Status:** ✅ Aprovado

---

## 📌 Sumário

1. [Visão Geral do Projeto](#-visão-geral-do-projeto)
2. [Escopo do MVP](#-escopo-do-mvp)
3. [Etapas do Projeto](#-etapas-do-projeto)
4. [Etapa 1 — Detalhamento por Dupla](#-etapa-1--planejamento--fundação-fase-atual)
5. [Checklist de Validação](#-checklist-de-validação--etapa-1-concluída)
6. [Prévia das Próximas Etapas](#-prévia-das-próximas-etapas)

---

## 🎯 Visão Geral do Projeto

Aplicativo de tênis voltado para **professores e alunos**, com foco em:

- Gestão de aulas e alunos pelo professor
- Acompanhamento de desempenho e evolução do aluno
- Sistema de ranking, desafios e comunidade entre alunos de um mesmo grupo

### Problema que resolve

Professores de tênis gerenciam alunos, aulas e avaliações manualmente (papel, WhatsApp, planilhas). Alunos não têm visibilidade da sua evolução nem motivação gamificada para continuar treinando.

### Solução

Um app que centraliza a gestão do professor e engaja o aluno com calendário de aulas, feedbacks estruturados, ranking e desafios entre colegas.

---

## 📋 Escopo do MVP

### Para o Professor

| Funcionalidade | Descrição |
|:---|:---|
| Cadastro de professor e aluno | Professor cria conta e cadastra alunos (ou gera código de convite) |
| Cadastro de aulas | Criar aulas com data, horário, tipo (individual/grupo) e vagas |
| Avaliação de desempenho | Avaliar o aluno em fundamentos (saque, forehand, backhand, voleio, movimentação) |
| Definição de nível | Classificar alunos em: Iniciante, Intermediário, Avançado, Semiprofissional |
| Registro de partidas | Registrar resultados de partidas entre alunos |
| Grupos (Teams) | Criar e gerenciar grupos de alunos (ex.: "Team João") |

### Para o Aluno

| Funcionalidade | Descrição |
|:---|:---|
| Calendário de aulas | Visualizar aulas do mês com detalhes |
| Confirmação de presença | Confirmar presença ou avisar ausência com antecedência |
| Acompanhamento de desempenho | Ver avaliações do professor, nível atual e evolução |
| Ranking do grupo | Ver sua posição no ranking entre os colegas do grupo |
| Desafio entre alunos | Desafiar outro aluno para uma partida e registrar resultado |
| Perfil | Dados pessoais, empunhadura, destro/canhoto, tempo de prática |

### Fora do MVP (fases futuras)

- Sistema de torneios com chaveamento automático
- Sistema de patentes para campeonatos
- Notificações push avançadas
- Chat entre alunos
- Integração com calendário do celular

---

## 🗺️ Etapas do Projeto

O projeto está dividido em **5 etapas progressivas**. Cada etapa só começa quando a anterior estiver concluída e validada pelo time.

| Etapa | Nome | Foco | Entregáveis |
|:---:|:---|:---|:---|
| **1** | Planejamento & Fundação | Requisitos, protótipos e decisões técnicas | Documento de requisitos, wireframes no Figma, stack definida e DER |
| **2** | Estrutura & Base de Código | Montar o esqueleto do projeto | Repositório configurado, banco criado, telas de login/cadastro funcionando |
| **3** | MVP — Funcionalidades Essenciais | Professor cadastra aulas, aluno vê calendário e confirma presença | Fluxo completo de aulas + avaliação de desempenho funcionando |
| **4** | Ranking, Desafios & Comunidade | Sistema de pontos, desafios entre alunos, grupos/teams | Ranking, registro de partidas e grupos do professor funcionando |
| **5** | Polimento, Testes & Entrega | Correção de bugs, ajustes visuais, documentação final | App testado, apresentação pronta, documentação acadêmica |

---

---

# 🔍 ETAPA 1 — Planejamento & Fundação (FASE ATUAL)

**Objetivo:** Sair desta etapa com **3 entregas concretas** que o time inteiro possa olhar e dizer *"beleza, agora eu sei exatamente o que vamos construir"*.

**Prazo sugerido:** 2 semanas

---

## 👑 Luiz — Coordenador / Product Owner

**Papel:** Dono do produto. Garante que as duplas estão alinhadas e que as entregas conversam entre si.

### Tarefas da Etapa 1:

- [ ] **1. Criar o repositório do projeto no GitHub**
  - Criar o repo e adicionar todos como colaboradores
  - Criar a estrutura de pastas:
    ```
    /docs
      /requisitos        ← Biel & Túlio
      /prototipos        ← Wesley & Teto
      /arquitetura       ← Gabriel Pegador & Du
    /src                 ← vazio até a Etapa 2
    README.md
    ```

- [ ] **2. Criar um quadro de tarefas (Kanban)**
  - Pode ser no **GitHub Projects** (grátis), Trello ou Notion
  - Colunas: `A Fazer` → `Fazendo` → `Revisão` → `Feito`
  - Criar os cards das tarefas de cada dupla

- [ ] **3. Fazer a ponte entre as duplas**
  - Marcar 1 reunião rápida no meio da etapa (15-20 min) para verificar:
    - Os requisitos fazem sentido para os protótipos?
    - As entidades batem com o modelo de banco?
  - No final da etapa, juntar tudo e validar coerência

- [ ] **4. Montar a apresentação da Etapa 1 para a FATEC** (se necessário)
  - Slides com: Problema → Solução → Equipe → Tecnologias → Cronograma

---

## 📋 Dupla 1: Biel Cabeludo & Túlio — Requisitos e Regras de Negócio

**Papel:** Traduzir a ideia em regras escritas tão claras que qualquer pessoa de fora entenderia o que o app faz.

### Entregável: Documento de Requisitos (`/docs/requisitos/requisitos.md`)

### Tarefas:

- [ ] **1. Listar os Requisitos Funcionais (RFs)**

  Escrever cada funcionalidade como uma frase clara: *"O sistema deve..."*. Separar por ator (Professor / Aluno / Sistema).

  **Exemplo:**

  | ID | Ator | Requisito |
  |:---|:---|:---|
  | RF01 | Professor | O sistema deve permitir que o professor crie uma conta com nome, e-mail, telefone e senha |
  | RF02 | Professor | O sistema deve permitir que o professor cadastre alunos informando nome, e-mail e nível inicial |
  | RF03 | Professor | O sistema deve permitir que o professor crie uma aula com data, horário, tipo (individual/grupo) e número de vagas |
  | RF04 | Professor | O sistema deve permitir que o professor registre a presença dos alunos na aula |
  | RF05 | Professor | O sistema deve permitir que o professor avalie o desempenho do aluno com notas em fundamentos e observações |
  | RF06 | Professor | O sistema deve permitir que o professor altere o nível do aluno |
  | RF07 | Professor | O sistema deve permitir que o professor registre o resultado de uma partida entre dois alunos |
  | RF08 | Aluno | O sistema deve permitir que o aluno visualize suas aulas do mês em formato de calendário |
  | RF09 | Aluno | O sistema deve permitir que o aluno confirme presença ou avise ausência em uma aula |
  | RF10 | Aluno | O sistema deve permitir que o aluno visualize seu histórico de avaliações e evolução |
  | RF11 | Aluno | O sistema deve permitir que o aluno desafie outro aluno para uma partida |
  | RF12 | Aluno | O sistema deve permitir que o aluno visualize o ranking do seu grupo |

  > **Meta:** Ter entre 15 e 25 requisitos funcionais no total.

- [ ] **2. Listar os Requisitos Não Funcionais (RNFs)**

  Qualidades e restrições do sistema:

  | ID | Categoria | Requisito |
  |:---|:---|:---|
  | RNF01 | Usabilidade | O sistema deve ser responsivo e funcionar em telas de celular (mobile-first) |
  | RNF02 | Segurança | As senhas devem ser armazenadas com hash (nunca em texto puro) |
  | RNF03 | Desempenho | As telas devem carregar em no máximo 3 segundos |
  | RNF04 | Disponibilidade | O sistema deve estar disponível 24/7 (hospedagem em nuvem) |

- [ ] **3. Definir as Regras de Negócio (RNs)**

  Decisões de produto que o time precisa bater o martelo:

  | ID | Regra |
  |:---|:---|
  | RN01 | O aluno só pode acessar o app se estiver vinculado a pelo menos um professor |
  | RN02 | O vínculo do aluno com o professor é feito por código de convite de 6 caracteres gerado pelo professor |
  | RN03 | O nível do aluno (Iniciante → Intermediário → Avançado → Semiprofissional) é definido exclusivamente pelo professor |
  | RN04 | Um desafio de partida só é válido entre alunos do mesmo grupo/professor |
  | RN05 | O resultado de uma partida precisa ser confirmado por ambos os jogadores. Se houver contestação, o professor decide |
  | RN06 | O aluno pode cancelar presença em uma aula com no mínimo X horas de antecedência |
  | RN07 | O ranking é calculado dentro do grupo do professor (não é global) |

  > **⚠️ IMPORTANTE:** Vocês precisam DECIDIR essas regras, não apenas listar. Conversem com o Luiz e batam o martelo em cada uma.

- [ ] **4. Escrever Histórias de Usuário (User Stories) — pelo menos 8**

  Formato: *"Como [ator], eu quero [ação] para [benefício]."*

  Exemplos:
  - *"Como professor, eu quero cadastrar meus alunos pelo app para não precisar anotar em papel."*
  - *"Como aluno, eu quero ver meu calendário de aulas do mês para me organizar."*
  - *"Como aluno, eu quero desafiar outro aluno para uma partida para subir no ranking do grupo."*
  - *"Como professor, eu quero ver o ranking dos meus alunos para identificar quem está evoluindo."*

- [ ] **5. Criar o Diagrama de Casos de Uso (UML)**

  Diagrama mostrando os atores (Professor, Aluno) e os casos de uso. Ferramenta: draw.io (gratuito) ou Lucidchart.

  ```
  Professor ──── Cadastrar Aluno
  Professor ──── Criar Aula
  Professor ──── Avaliar Aluno
  Professor ──── Registrar Partida
  Professor ──── Gerenciar Grupo
  Aluno ──────── Ver Calendário
  Aluno ──────── Confirmar Presença
  Aluno ──────── Ver Desempenho
  Aluno ──────── Desafiar Aluno
  Aluno ──────── Ver Ranking
  ```

---

## 🎨 Dupla 2: Wesley & Gabriel Marini (Teto) — Protótipos

**Papel:** Dar "cara" ao app. O time inteiro vai olhar os protótipos para entender como o sistema funciona na prática.

### Entregável: Protótipo navegável no Figma + link salvo em `/docs/prototipos/link-figma.md`

### Tarefas:

- [ ] **1. Desenhar o Fluxo de Navegação (User Flow)**

  Antes de abrir o Figma, desenhem o caminho do usuário no papel ou FigJam:

  **Fluxo do Professor:**
  ```
  Login → Dashboard do Professor
    ├── Meus Alunos → Ver aluno → Avaliar aluno
    ├── Minhas Aulas → Criar aula → Ver presença
    ├── Partidas → Registrar partida → Ver ranking
    └── Configurações → Código de convite
  ```

  **Fluxo do Aluno:**
  ```
  Login → Home do Aluno
    ├── Calendário → Detalhes da aula → Confirmar/Cancelar presença
    ├── Meu Desempenho → Histórico de avaliações → Evolução
    ├── Ranking → Ver posição → Desafiar aluno
    └── Meu Perfil → Dados pessoais, nível
  ```

- [ ] **2. Criar as Telas (Wireframes) no Figma**

  > **💡 Dica:** Usem wireframe (preto e branco, sem imagens, sem cores). A preocupação agora é com a POSIÇÃO dos elementos e a NAVEGAÇÃO, não com a beleza.

  **Telas obrigatórias — Professor (mínimo 6 telas):**

  | # | Tela | O que mostra |
  |:---|:---|:---|
  | P1 | Login / Cadastro | Campos de e-mail e senha, botão de entrar, link de "criar conta" |
  | P2 | Dashboard do Professor | Cards resumo: nº de alunos, próximas aulas da semana, partidas recentes |
  | P3 | Lista de Alunos | Lista com nome, nível (tag colorida), botão de "Avaliar" e "Ver perfil" |
  | P4 | Cadastro de Aula | Formulário: data, horário, tipo (individual/grupo), nº de vagas |
  | P5 | Avaliação do Aluno | Notas de 1-5 para cada fundamento + campo de observações |
  | P6 | Registro de Partida | Selecionar 2 alunos, informar sets e games, marcar vencedor |

  **Telas obrigatórias — Aluno (mínimo 5 telas):**

  | # | Tela | O que mostra |
  |:---|:---|:---|
  | A1 | Login / Primeiro acesso | Tela de login + tela de "inserir código do professor" |
  | A2 | Home do Aluno | Próxima aula, nível atual, posição no ranking |
  | A3 | Calendário de Aulas | Calendário mensal, dias com aula marcados, clicar no dia para ver detalhes |
  | A4 | Meu Desempenho | Última avaliação do professor, gráfico aranha/radar dos fundamentos, histórico |
  | A5 | Ranking do Grupo | Lista ordenada por pontos, com nome, nível e nº de vitórias |

- [ ] **3. Tornar o protótipo navegável**

  No Figma, conectem as telas com links clicáveis:
  - Botão "Meus Alunos" no Dashboard → abre a Lista de Alunos
  - Botão "Avaliar" na Lista → abre a tela de Avaliação
  - Etc.

- [ ] **4. Definir identidade visual básica**

  Mesmo com wireframe em preto e branco, já anotem:
  - **Paleta de cores:** 2-3 cores principais (sugestão: verde-esmeralda + azul-escuro + branco/cinza)
  - **Tipografia:** Fonte clean (Inter, Poppins ou Roboto — gratuitas no Google Fonts)
  - **Nome do app** (se já tiverem decidido)

---

## 💻 Dupla 3: Gabriel Loiro (Pegador) & Du (Eduardo) — Tecnologias e Banco de Dados

**Papel:** Definir COM QUÊ e ONDE o app vai ser construído, e desenhar a estrutura do banco de dados.

### Entregável 1: Documento de Arquitetura (`/docs/arquitetura/tecnologias.md`)
### Entregável 2: Modelo do Banco de Dados (`/docs/arquitetura/banco-de-dados.md`)

### Tarefas:

- [ ] **1. Escolher e justificar o Frontend**

  Responder: **O app vai ser mobile nativo, web ou híbrido?**

  | Opção | Tecnologia | Prós | Contras |
  |:---|:---|:---|:---|
  | Web Responsiva | React + TypeScript | Mais fácil de aprender, roda no navegador, deploy simples | Não fica na loja de apps, sem push notification nativo |
  | App Híbrido | React Native + Expo | Um código para iOS e Android, fica na loja, push notifications | Curva de aprendizado maior, precisa de emulador |
  | App Híbrido | Flutter + Dart | Performance excelente, UI bonita nativa | Linguagem Dart é menos conhecida, menos material em PT-BR |

  > **💡 Dica:** Se ninguém do time tem experiência com mobile, vão de **Web Responsiva (React)**. Podem fazer um PWA (Progressive Web App) que roda no navegador do celular e pode ser "instalado" na home screen.

- [ ] **2. Escolher e justificar o Backend**

  | Opção | Tecnologia | Prós | Contras |
  |:---|:---|:---|:---|
  | Backend Tradicional | Node.js + Express + TypeScript | Muito material online, mesmo idioma do front (JS/TS) | Precisam montar tudo do zero |
  | Backend com Framework | NestJS + TypeScript | Estrutura organizada, boas práticas inclusas | Curva de aprendizado um pouco maior |
  | Backend as a Service | Supabase (ou Firebase) | Auth, banco e API prontos, deploy instantâneo, plano grátis | Menos controle, dependência de plataforma |

  > **💡 Dica:** Para um time de estudantes, **Supabase** é uma excelente opção. Já vem com autenticação, banco PostgreSQL, e gera a API automaticamente. Economiza semanas de trabalho.

- [ ] **3. Escolher o Banco de Dados**

  | Opção | Tipo | Quando usar |
  |:---|:---|:---|
  | PostgreSQL | Relacional (SQL) | Dados estruturados com relacionamentos fortes. **✅ Recomendado para este projeto** |
  | MySQL | Relacional (SQL) | Similar ao PostgreSQL, mais comum em hospedagens compartilhadas |
  | MongoDB | Não-relacional (NoSQL) | Dados flexíveis sem esquema fixo. **❌ Não recomendado** — os dados de vocês são altamente relacionais |

- [ ] **4. Desenhar o Modelo Entidade-Relacionamento (DER/MER)**

  **Entidades obrigatórias para o MVP (7 tabelas):**

  ```
  ┌──────────────────┐
  │     USUARIO      │
  ├──────────────────┤
  │ id (PK)          │
  │ nome             │
  │ email (único)    │
  │ senha_hash       │
  │ tipo (professor/ │
  │       aluno)     │
  │ telefone         │
  │ created_at       │
  └────────┬─────────┘
           │
     ┌─────┴──────┐
     │            │
     ▼            ▼
  ┌────────┐  ┌────────────┐      ┌──────────────┐
  │ GRUPO  │  │    AULA    │      │   PRESENCA   │
  ├────────┤  ├────────────┤      ├──────────────┤
  │ id     │  │ id         │──1:N─│ id           │
  │ nome   │  │ professor_ │      │ aula_id (FK) │
  │ codigo_│  │   id (FK)  │      │ aluno_id(FK) │
  │ convite│  │ data       │      │ status       │
  │ prof_  │  │ horario    │      │ (confirmado/ │
  │ id(FK) │  │ tipo(ind/  │      │  falta/      │
  └───┬────┘  │   grupo)   │      │  cancelado)  │
      │       │ vagas      │      └──────────────┘
      │ 1:N   │ descricao  │
      │       └────────────┘
      ▼
  ┌────────────────┐
  │  ALUNO_GRUPO   │
  ├────────────────┤
  │ aluno_id (FK)  │
  │ grupo_id (FK)  │
  │ nivel          │
  │ (iniciante/    │
  │  intermediario/│
  │  avancado/     │
  │  semipro)      │
  │ pontos_ranking │
  └────────────────┘

  ┌──────────────────┐     ┌──────────────────┐
  │    AVALIACAO     │     │     PARTIDA      │
  ├──────────────────┤     ├──────────────────┤
  │ id (PK)          │     │ id (PK)          │
  │ professor_id(FK) │     │ jogador1_id (FK) │
  │ aluno_id (FK)    │     │ jogador2_id (FK) │
  │ data             │     │ placar           │
  │ saque (1-5)      │     │ vencedor_id (FK) │
  │ forehand (1-5)   │     │ status (pendente/│
  │ backhand (1-5)   │     │  confirmada/     │
  │ voleio (1-5)     │     │  contestada)     │
  │ movimentacao(1-5)│     │ data             │
  │ observacoes      │     │ grupo_id (FK)    │
  └──────────────────┘     └──────────────────┘
  ```

  > **⚠️ IMPORTANTE:** Essas 7 entidades (Usuario, Grupo, AlunoGrupo, Aula, Presenca, Avaliacao, Partida) cobrem 100% do MVP. Torneios e chaveamento ficam para a Etapa 4.

- [ ] **5. Desenhar o diagrama visual (DER) em uma ferramenta**

  Ferramentas gratuitas:
  - **dbdiagram.io** — escreve em texto e ele gera o diagrama (mais rápido)
  - **draw.io** (diagrams.net) — arrastar e soltar
  - **Lucidchart** — versão gratuita para estudantes

- [ ] **6. Documentar a justificativa da stack**

  Documento simples (1-2 páginas) respondendo:
  1. Qual tecnologia para o Frontend? **Por quê?**
  2. Qual tecnologia para o Backend? **Por quê?**
  3. Qual banco de dados? **Por quê?**
  4. Onde vai ser hospedado? (Vercel, Netlify, Railway, Supabase — todos têm plano grátis)
  5. Quais ferramentas de apoio? (Git/GitHub, Figma, dbdiagram.io)

---

---

## 🔄 Como as duplas devem se sincronizar

Existe uma ordem natural de trabalho entre as duplas:

```
[Biel & Túlio]  ── (Passa os Requisitos e Regras) ──►  [Wesley & Teto]
       │                                                      │
       │                                                      ▼
       └────── (Passa as Entidades) ──────────────►  [Gabriel Pegador & Du]
                                                     (Modelam o Banco e Stack)
```

1. **Biel e Túlio** definem os campos e regras primeiro (ex.: *"a aula precisa ter data, hora e alunos inscritos"*)
2. **Wesley e Teto** desenham a tela com esses campos no Figma
3. **Gabriel Pegador e Du** criam a tabela no banco com esses mesmos campos
4. **Luiz** garante que ninguém fique parado esperando o outro e consolida tudo

---

## ✅ Checklist de Validação — Etapa 1 Concluída?

Antes de avançar para a Etapa 2, o time inteiro deve responder **SIM** para todas:

- [ ] Temos uma lista de pelo menos 15 requisitos funcionais escritos?
- [ ] As regras de negócio estão decididas (não apenas listadas como perguntas)?
- [ ] O protótipo no Figma tem pelo menos 11 telas (6 professor + 5 aluno)?
- [ ] O protótipo é navegável (clicar nos botões leva para outra tela)?
- [ ] A stack foi escolhida e justificada por escrito?
- [ ] O DER tem pelo menos 7 entidades com relacionamentos claros?
- [ ] Todos do time sabem o que vai ser construído na Etapa 2?

---

## 🔮 Prévia das Próximas Etapas

### Etapa 2 — Estrutura & Base de Código
- Configurar o projeto com a stack escolhida
- Implementar autenticação (login/cadastro de professor e aluno)
- Criar o banco de dados com as tabelas do DER
- Montar a navegação básica do app (rotas/telas vazias)
- **Todos codificam nesta etapa**

### Etapa 3 — MVP Funcionalidades Essenciais
- Professor: CRUD de aulas, cadastro de alunos, avaliação de desempenho
- Aluno: calendário de aulas, confirmação de presença, ver avaliações
- Conexão professor-aluno via código de convite

### Etapa 4 — Ranking, Desafios & Comunidade
- Sistema de pontos e ranking por grupo
- Desafio entre alunos e registro de partidas
- Aprovação de resultado por ambos + contestação para o professor

### Etapa 5 — Polimento, Testes & Entrega
- Testes de usabilidade
- Correção de bugs
- Documentação técnica e acadêmica
- Apresentação final

---

> **📞 Dúvidas?** Falem com o Luiz (coordenador) ou consultem o mentor do projeto.
