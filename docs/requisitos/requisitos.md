# 📋 Documento de Requisitos e Regras de Negócio

> **Responsáveis:** Biel Cabeludo & Túlio  
> **Etapa:** 1 — Planejamento & Fundação  
> **Status:** 🟡 Em Preenchimento  

---

## 1. Requisitos Funcionais (RFs)

*Mínimo 15 requisitos. Formato: "O sistema deve..."*

| ID | Ator | Descrição do Requisito | Prioridade |
|:---|:---|:---|:---:|
| RF01 | Professor | O sistema deve permitir que o professor crie uma conta com nome, e-mail, telefone e senha | Alta |
| RF02 | Aluno | O sistema deve permitir que o aluno visualize suas aulas do mês em formato de calendário | Alta |
| RF03 | | | |
| RF04 | | | |
| RF05 | | | |
| RF06 | | | |
| RF07 | | | |
| RF08 | | | |
| RF09 | | | |
| RF10 | | | |
| RF11 | | | |
| RF12 | | | |
| RF13 | | | |
| RF14 | | | |
| RF15 | | | |

---

## 2. Requisitos Não Funcionais (RNFs)

*Mínimo 4 requisitos. Qualidades de segurança, performance, usabilidade, etc.*

| ID | Categoria | Descrição do Requisito |
|:---|:---|:---|
| RNF01 | Usabilidade | O sistema deve ser responsivo e funcionar bem em telas de celular (mobile-first) |
| RNF02 | Segurança | As senhas devem ser armazenadas com hash criptográfico (bcrypt/argon2) |
| RNF03 | | |
| RNF04 | | |

---

## 3. Regras de Negócio (RNs)

*Decisões de funcionamento do sistema batidas com o coordenador Luiz.*

| ID | Regra de Negócio | Status da Decisão |
|:---|:---|:---:|
| RN01 | O aluno só acessa o app se vinculado a um professor/grupo | ✅ Aprovado |
| RN02 | Vínculo feito via código de convite de 6 caracteres gerado pelo professor | 🟡 A Definir |
| RN03 | Nível do aluno é definido pelo professor ou por pontos? | 🟡 A Definir |
| RN04 | Desafios de partida: podem ser entre grupos diferentes ou só mesmo grupo? | 🟡 A Definir |
| RN05 | Confirmação de resultado: o que acontece se um jogador contestar? | 🟡 A Definir |
| RN06 | Prazo mínimo para cancelamento de presença em aula sem penalidade | 🟡 A Definir |
| RN07 | Limite de vagas por aula em grupo | 🟡 A Definir |
| RN08 | Inatividade no ranking (perda de pontos após X dias sem jogar) | 🟡 A Definir |

---

## 4. Histórias de Usuário (User Stories)

*Pelo menos 8 histórias (4 do Professor e 4 do Aluno).*

1. **Como** professor, **eu quero** cadastrar meus alunos pelo app, **para** ter um histórico centralizado e organizado de cada um.
2. **Como** aluno, **eu quero** ver meu calendário de aulas do mês, **para** me programar e não faltar aos treinos.
3. **Como** [ator], **eu quero** [ação], **para** [benefício].
4. **Como** [ator], **eu quero** [ação], **para** [benefício].
5. **Como** [ator], **eu quero** [ação], **para** [benefício].
6. **Como** [ator], **eu quero** [ação], **para** [benefício].
7. **Como** [ator], **eu quero** [ação], **para** [benefício].
8. **Como** [ator], **eu quero** [ação], **para** [benefício].

---

## 5. Diagrama de Casos de Uso (UML)

*Cole abaixo o link do diagrama feito no draw.io ou anexe a imagem exportada.*

- **Link draw.io editável:** [Inserir Link Aqui]
- **Imagem do Diagrama:** `docs/requisitos/casos_de_uso.png`
