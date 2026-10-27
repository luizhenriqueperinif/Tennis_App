# 📱 MatchPoint — app Flutter

Código do aplicativo (Flutter + Supabase). O passo a passo completo de instalação e de como rodar entra com o KAN-37.

## Configurar o Supabase

Os dados de conexão não ficam no código. Na pasta `app/`, copie o `config.example.json` para `config.json` e preencha com a URL do projeto e a chave **publishable** (peça ao Luiz). O `config.json` está no `.gitignore` e nunca vai para o GitHub.

> ⚠️ Só a chave **publishable** (`sb_publishable_...`) vai no app. A chave `service_role` nunca.

## Rodar

```bash
cd app
flutter pub get
flutter run --dart-define-from-file=config.json            # emulador ou celular
flutter run -d chrome --dart-define-from-file=config.json  # navegador
```

No VS Code, o **Run (F5)** já passa o `config.json` sozinho (configuração em `.vscode/launch.json`).

A tela provisória mostra se a conexão deu certo: **Supabase conectado**. Sem o `config.json`, o app abre e avisa que o Supabase não foi configurado.

Antes de abrir um PR:

```bash
flutter analyze
flutter test
```

## Pastas

```text
lib/
├── main.dart          ← ponto de entrada
├── app.dart           ← raiz do app (tema e rotas)
├── core/              ← o que todo o app usa
│   ├── tema/          ← cores, fontes e componentes base (KAN-50)
│   ├── rotas/         ← go_router e redirecionamento por perfil (KAN-51)
│   └── supabase/      ← conexão com o Supabase (KAN-35)
└── features/          ← uma pasta por parte do app
    ├── autenticacao/  ← login, cadastro, recuperar senha e sessão (KAN-45 a 49)
    ├── professor/     ← telas do professor (KAN-52)
    └── aluno/         ← telas do aluno (KAN-53)
```

Dentro de cada pasta de `features/`, separe as telas em `telas/` e os widgets reaproveitáveis em `widgets/`.
Os testes ficam em `test/`, espelhando as pastas de `lib/`.
