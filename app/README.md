# 📱 MatchPoint — app Flutter

Código do aplicativo (Flutter + Supabase). O passo a passo completo de instalação e de como rodar entra com o KAN-37.

## Rodar

```bash
cd app
flutter pub get
flutter run            # no emulador ou celular conectado
flutter run -d chrome  # no navegador, para quem não tem emulador
```

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
