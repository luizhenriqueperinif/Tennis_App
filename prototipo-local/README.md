# Protótipo funcional · MatchPoint

Protótipo para a apresentação da Etapa 1. Roda um servidor local com login de professor e aluno, e as ações de um aparecem na tela do outro em até 3 segundos.

Não substitui o app da Etapa 2 (Flutter + Supabase). Os dados ficam só na memória: ao fechar o servidor, tudo volta ao estado inicial.

## Como rodar

Precisa do **Node.js 18 ou mais novo**. Não tem `npm install`.

- **Windows:** dois cliques em `Iniciar.bat` (abre o navegador sozinho).
- **Terminal:** `node server.js` e abra http://localhost:3000

## Usuários de teste

| Perfil | E-mail | Senha |
|---|---|---|
| Professor (Carlos) | professor@matchpoint.app | prof123 |
| Aluno (João) | aluno@matchpoint.app | aluno123 |

A tela de login também tem botões para entrar direto com cada um.

**Para apresentar com os dois ao mesmo tempo**, abra duas janelas do navegador lado a lado. Cada aba guarda o próprio login.

## Roteiro sugerido para a apresentação

1. **Aluno:** confirma presença na próxima aula → **Professor:** a lista de presença atualiza sozinha.
2. **Aluno:** confirma o placar que o Pedro registrou → o Ranking atualiza (vitória +10).
3. **Professor → Partidas:** valida o placar em disputa entre João e Maria → o ranking do aluno muda.
4. **Professor → Alunos → João:** dá notas de 1 a 5 nos fundamentos → **Aluno → Desempenho** mostra a avaliação.
5. **Professor → Aulas:** cria uma aula → aparece na **Agenda** do aluno.
6. **Aluno → Início → Entrar em outra turma:** `XYZ789` (expirado, dá erro) e `INI456` (entra na Iniciante B).
7. **Aluno → Ranking:** desafia um colega. Tentar desafiar alguém de outra turma é bloqueado.

Para voltar ao começo, use "Reiniciar dados da demonstração" na tela de login.

## Regras de negócio implementadas

- **RN01:** pelo código de convite a entrada é direta. O código vale 7 dias e pode ser revogado.
- **RN04:** desafio só entre alunos da mesma turma.
- **RN05:** o adversário tem 24h para confirmar ou contestar. Sem resposta, o placar é confirmado automaticamente. Se houver contestação, o professor decide.
- **RN06:** confirmar ou cancelar presença até 4h antes. Quem não confirmou aparece como "Status incerto".
- **RN07:** limite de 1 a 6 alunos por aula.
- **RN08 e RN09:** vitória +10, derrota 0. Só contam partidas confirmadas.
- **RN10:** o professor pode lançar o placar direto.
- **RNF06:** cada perfil só executa as próprias ações, e o servidor recusa as dos outros.
