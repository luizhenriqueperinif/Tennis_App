# Protótipo funcional · MatchPoint (Supabase)

A mesma demonstração do `prototipo-local/`, mas com os dados no Supabase: login de verdade (Supabase Auth), banco PostgreSQL com RLS e atualização em tempo real (Realtime). Abre em qualquer navegador ou celular, sem rodar servidor.

O `prototipo-local/` continua funcionando como plano B, sem internet.

**Link:** https://luizhenriqueperinif.github.io/Tennis_App/

Para atualizar o site, copie o conteúdo de `public/` para a branch `gh-pages` e faça o push. O GitHub Pages publica sozinho. Quando mudar o `app.css` ou o `app.js`, troque também o número `?v=` no `index.html`, senão quem já abriu o site continua com a versão antiga guardada no navegador.

## Estrutura

```text
prototipo-supabase/
├── supabase/schema.sql   ← tabelas, RLS, regras de negócio (funções) e dados da demonstração
└── public/               ← o site (HTML, CSS e JS puro + supabase-js pelo CDN)
```

## Como configurar (uma vez)

1. No painel do Supabase, em **Authentication > Users**, crie `professor@matchpoint.app` e `aluno@matchpoint.app` com **Auto Confirm**.
2. Em **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**. Pode rodar de novo quando quiser: o script apaga e recria tudo.
3. Abra o site (`public/index.html` publicado, ou localmente com `npx serve public`).

As senhas dos usuários de teste ficam com o coordenador. Os botões da tela de login só preenchem o e-mail.

## Como os dados ficam protegidos

- A URL e a chave **publicável** do projeto ficam no `app.js`. Isso é esperado: elas não dão acesso a nada sozinhas.
- O RLS está ligado em todas as tabelas. Cada usuário só **lê** o que é das próprias turmas, e o código de convite só o professor vê.
- Não existe política de escrita. Toda alteração passa por uma função do banco (`presenca`, `placar_confirmar`, `criar_aula`...), que confere o perfil e aplica as regras de negócio. Sem login, nada é lido nem alterado.

## Regras de negócio no banco

- **RN01:** entrada direta pelo código de convite (vale 7 dias e pode ser revogado).
- **RN04:** desafio só entre alunos da mesma turma.
- **RN05:** o adversário tem 24h para confirmar ou contestar. Sem resposta, o placar é confirmado automaticamente (`aplicar_prazos`). Contestação vira disputa e o professor decide.
- **RN06:** confirmar ou cancelar presença até 4h antes da aula.
- **RN07:** de 1 a 6 alunos por aula.
- **RN08 e RN09:** vitória +10, derrota 0, só partidas confirmadas (view `v_ranking`).
- **RN10:** o professor lança o placar direto.

## Roteiro da apresentação

Antes de começar, entre como professor e clique em **Reiniciar dados da demonstração** (no fim da tela inicial). Isso deixa a próxima aula a cerca de 8h, para a regra das 4h permitir confirmar presença.

O roteiro é o mesmo do `prototipo-local/README.md`, com professor e aluno em duas janelas lado a lado.
