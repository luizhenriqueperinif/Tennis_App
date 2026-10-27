# 📱 MatchPoint — app Flutter

Código do aplicativo (Flutter + Supabase). Este guia leva do computador zerado até o app aberto no emulador, no Windows. Prazo para todo mundo estar rodando: **06/11** (KAN-36).

Siga na ordem. Se travar, veja **Problemas comuns** no fim antes de pedir ajuda.

---

## 0. Seu computador aguenta?

| Item | Mínimo | Ideal |
|:---|:---|:---|
| Memória RAM | 8 GB | 16 GB |
| Espaço livre | 16 GB | 30 GB, em SSD |
| Sistema | Windows 10 ou 11, 64 bits | igual |

Com 8 a 12 GB de RAM funciona, mas feche Discord e abas do navegador antes de abrir o emulador. Se não der para usar o emulador, veja **Sem emulador**, na seção 6.

---

## 1. Flutter

1. Instale o [VS Code](https://code.visualstudio.com/) e, nele, a extensão **Flutter** (da Dart Code).
2. Aperte `Ctrl+Shift+P`, digite **Flutter: New Project** e clique em **Download SDK** quando ela avisar que não achou o Flutter.
3. Quando pedir a pasta, escolha **`C:\src`**. ⚠️ Nunca uma pasta dentro de `C:\Users\Seu Nome`: se o seu nome de usuário tem espaço, o Flutter dá problema.
4. Aceite quando ela perguntar se pode adicionar o Flutter ao PATH.
5. Feche e abra o terminal e confira: `flutter --version`.

---

## 2. Android Studio

O Android Studio serve para instalar o SDK do Android e o emulador. O código continua sendo escrito no VS Code.

1. Baixe em [developer.android.com/studio](https://developer.android.com/studio) e instale.
2. Na primeira abertura, escolha a instalação **Custom** e, em **Android SDK Location**, use **`C:\Android\Sdk`**. Isso evita o problema do espaço no nome de usuário. Se você já instalou no lugar padrão, veja **Problemas comuns**.
3. Na tela inicial, abra **More Actions > SDK Manager > aba SDK Tools**, marque **Android SDK Command-line Tools (latest)** e clique em **Apply**.
4. Em **More Actions > Virtual Device Manager**, confira se já existe um emulador. Se não existir, crie um: um Pixel com uma imagem recente do Android.

---

## 3. Ajustes do Windows

1. **Modo de desenvolvedor:** vá em Configurações > Sistema > Para desenvolvedores e ative. Sem ele, os pacotes do Flutter dão erro.
2. **Licenças do Android:** no terminal, rode `flutter doctor --android-licenses` e responda `y` em tudo.

---

## 4. Conferir

```bash
flutter doctor
```

Precisa aparecer ✓ em **Flutter**, **Android toolchain** e **Chrome**. O item **Visual Studio** pode ficar com ✗: ele só serve para gerar app de Windows.

---

## 5. Baixar o projeto e configurar o Supabase

```bash
git clone https://github.com/luizhenriqueperinif/Tennis_App.git
cd Tennis_App/app
flutter pub get
```

Os dados de conexão não ficam no código. Na pasta `app/`, copie o `config.example.json` para `config.json` e preencha com a URL do projeto e a chave **publishable** (o Luiz manda no grupo). O `config.json` está no `.gitignore` e nunca vai para o GitHub.

> ⚠️ Só a chave **publishable** (`sb_publishable_...`) vai no app. A chave `service_role` nunca.

---

## 6. Rodar

Abra a pasta `Tennis_App` no VS Code, escolha o dispositivo no canto inferior direito e aperte **F5**. O `config.json` já é passado sozinho (configuração em `.vscode/launch.json`).

Pelo terminal, dentro de `app/`:

```bash
flutter run --dart-define-from-file=config.json            # emulador ou celular
flutter run -d chrome --dart-define-from-file=config.json  # navegador
```

A tela provisória mostra se a conexão deu certo: **Supabase conectado**. Sem o `config.json`, o app abre e avisa que o Supabase não foi configurado.

> ⏳ A **primeira** vez no Android demora bastante (no computador do Luiz, uns 25 minutos), porque o Gradle baixa tudo. As próximas levam poucos minutos.

**Sem emulador:**
- **Tem celular Android:** ative as Opções do desenvolvedor e a **Depuração USB** no celular, ligue no cabo e ele aparece como dispositivo no VS Code.
- **Não tem:** rode no Chrome para o dia a dia e peça para alguém da dupla testar no Android antes do PR.

**Antes de abrir um PR** (o GitHub roda os mesmos comandos e bloqueia o PR se falharem):

```bash
flutter analyze
flutter test
```

---

## 🆘 Problemas comuns

**`Android SDK location currently contains spaces`**
O SDK foi instalado dentro de `C:\Users\Seu Nome`. Feche o Android Studio e, no PowerShell:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" kill-server
New-Item -ItemType Directory -Force C:\Android | Out-Null
Move-Item "$env:LOCALAPPDATA\Android\Sdk" C:\Android\Sdk
[Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Android\Sdk', 'User')
flutter config --android-sdk C:\Android\Sdk
```

Depois, no Android Studio, vá em **SDK Manager** e troque o **Android SDK Location** para `C:\Android\Sdk`.

**`cmdline-tools component is missing`**
Falta a peça do passo 2.3: SDK Manager > SDK Tools > **Android SDK Command-line Tools (latest)**.

**`Android sdkmanager did not install NDK ...`**
O Gradle não conseguiu instalar o NDK sozinho. Instale a versão que aparece no erro, por exemplo `28.2.13676358`, num terminal **cmd** (não no PowerShell):

```bat
C:\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat --install "ndk;28.2.13676358"
```

São uns 2 GB. Depois, rode o app de novo.

**Emulador fica preto ou não termina de ligar**
Quase sempre é falta de memória. Feche outros programas e o Gradle que fica rodando depois de compilar (no Gerenciador de Tarefas, os processos **OpenJDK / java**). No Android Studio, abra **Device Manager > ⋮ > Cold Boot Now**. Se continuar, edite o emulador e baixe a RAM dele para 2 GB.

**`Building with plugins requires symlink support`**
Falta ativar o Modo de desenvolvedor, do passo 3.1.

---

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

Para o fluxo de branches e PRs, veja o [`CONTRIBUTING.md`](../CONTRIBUTING.md).
