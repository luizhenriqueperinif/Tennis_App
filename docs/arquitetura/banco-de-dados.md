# 🗄️ Modelo Conceitual e Lógico de Banco de Dados (DER)

> **Responsáveis:** Gabriel Loiro (Pegador) & Du (Eduardo)  
> **Etapa:** 1 — Planejamento & Fundação  
> **Status:** 🟡 Em Modelagem  

---

## 1. Diagrama Entidade-Relacionamento (DER Visual)

- **Link Editável (dbdiagram.io / draw.io):** [Inserir Link Aqui]
- **Imagem do DER:** `docs/arquitetura/der_diagrama.png`

---

## 2. Dicionário de Dados das Entidades (Mapeamento do MVP)

### 1. `Usuario`
Armazena contas de professores e alunos.
- `id`: Identificador único (PK)
- `nome`: Nome completo
- `email`: E-mail único de login
- `senha_hash`: Senha criptografada
- `tipo`: 'professor' ou 'aluno'
- `telefone`: Contato WhatsApp
- `created_at`: Data de cadastro

### 2. `Grupo`
- `id`: PK
- `nome`: Nome do grupo (ex.: Team João)
- `codigo_convite`: Código de acesso de 6 caracteres
- `professor_id`: FK para `Usuario`

### 3. `AlunoGrupo` (Tabela Associativa N:N)
- `id`: PK
- `aluno_id`: FK para `Usuario`
- `grupo_id`: FK para `Grupo`
- `nivel`: 'iniciante', 'intermediario', 'avancado', 'semiprofissional'
- `pontos_ranking`: Pontuação atual

### 4. `Aula`
- `id`: PK
- `professor_id`: FK para `Usuario`
- `data`: Data da aula
- `horario_inicio`: Horário
- `horario_fim`: Horário
- `tipo`: 'individual' ou 'grupo'
- `vagas`: Quantidade máxima de vagas

### 5. `Presenca`
- `id`: PK
- `aula_id`: FK para `Aula`
- `aluno_id`: FK para `Usuario`
- `status`: 'confirmado', 'falta', 'cancelado'

### 6. `Avaliacao`
- `id`: PK
- `professor_id`: FK para `Usuario`
- `aluno_id`: FK para `Usuario`
- `data`: Data da avaliação
- `saque`: Nota 1-5
- `forehand`: Nota 1-5
- `backhand`: Nota 1-5
- `voleio`: Nota 1-5
- `movimentacao`: Nota 1-5
- `observacoes`: Texto livre

### 7. `Partida`
- `id`: PK
- `jogador1_id`: FK para `Usuario`
- `jogador2_id`: FK para `Usuario`
- `placar_set1`: Ex. "6x4"
- `placar_set2`: Ex. "7x5"
- `placar_set3`: Opcional
- `vencedor_id`: FK para `Usuario`
- `status`: 'pendente', 'confirmada', 'contestada'
- `grupo_id`: FK para `Grupo`
