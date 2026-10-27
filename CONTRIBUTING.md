# 🤝 Como contribuir

Regra principal: **ninguém commita direto na `main`**. Todo código entra por Pull Request (PR) revisado.

---

## 🔁 Passo a passo

1. **Pegue um card no Jira** e mova para **Em andamento**.
2. **Atualize a `main`** antes de começar:
   ```bash
   git switch main
   git pull
   ```
3. **Crie uma branch** com o número do card:
   ```bash
   git switch -c kan-45-tela-login
   ```
4. **Faça commits pequenos**, seguindo o [padrão de commits](./README.md#-padrão-de-commits-conventional-commits).
5. **Envie a branch** e abra o PR no GitHub:
   ```bash
   git push -u origin kan-45-tela-login
   ```
   O modelo do PR já vem preenchido. Complete o card, o que mudou e como testar.
6. **Mova o card para Em revisão** no Jira.
7. **Alguém de outra dupla revisa** o PR. Se pedirem mudanças, faça novos commits na mesma branch.
8. **Depois do merge**, mova o card para **Concluído** e apague a branch.

---

## 🌿 Nome das branches

Padrão: `kan-NN-descricao-curta`, tudo em minúsculas, sem acento e com hífens.

| ✅ Certo | ❌ Errado |
|:---|:---|
| `kan-45-tela-login` | `tela-login` (sem o card) |
| `kan-40-migracao-der` | `KAN-40 Migração` (maiúscula, espaço e acento) |
| `kan-51-go-router` | `gabriel` (nome de pessoa) |

Uma branch por card. Se o card for grande, divida em mais de um PR, cada um com uma parte que funcione.

---

## 📬 Pull Requests

- **Título:** começa com o número do card, como `KAN-45: tela de login`.
- **Tamanho:** pequeno. Um PR por subtarefa é mais fácil de revisar.
- **Revisão:** pelo menos 1 aprovação de alguém de **outra dupla**.
- **Verificação automática:** precisa estar verde (`flutter analyze` e `flutter test`). Ela começa a rodar com o KAN-39.
- **Merge:** quem abriu o PR faz o merge depois da aprovação.

---

## 🔒 Segurança

- **Chaves do Supabase nunca vão para o código.** A chave `service_role` fica só com o Luiz.
- Senhas, tokens e arquivos `.env` também ficam fora do Git.

---

## 🆘 Travou?

Travou por mais de um dia? Avise no grupo. Uma subtarefa parada segura a dupla seguinte.
