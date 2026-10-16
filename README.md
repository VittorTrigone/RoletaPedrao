# 👑 Roleta da Rifa Tattoo (01 a 60) • Rossi Tattoo

Aplicação web completa, moderna e interativa de roleta para sorteio de rifas de tatuagem, inspirada na identidade visual oficial da **Rossi Tattoo** (fundo escuro, estética grunge/neon roxo e elementos de estúdio).

Pronta para ser hospedada gratuitamente no **GitHub Pages** e 100% responsiva para celulares!

---

## 📱 Recursos Principais

- **100% Otimizado para Celulares e Computadores**:
  - Layout mobile-first responsivo e fluido, com tamanho ideal para telas de smartphones (iPhone, Android) e transmissões ao vivo.
- **🔒 Sorteio Único Definitivo (Uso Único e Imutável na Nuvem)**:
  - **Funciona apenas 1 VEZ e NUNCA MAIS**: Criada para garantir 100% de honestidade e transparência na rifa, sem margem para desconfiança ou manipulação.
  - **Sincronização Global via Google Cloud Firestore**: Ao girar, o resultado é cravado imediatamente na nuvem. Ninguém no mundo consegue girar novamente, mesmo abrindo em outro computador, celular ou guia anônima.
  - **Blindagem Anti-Fraude**: Regras de segurança do Google Firestore no padrão *write-once* (`allow create: if true; allow update, delete: if false`). Uma vez criado, o resultado é permanente e não pode ser sobrescrito nem alterado.
  - **Proteção Anti-F5**: Se alguém tentar recarregar a página (F5) no meio do giro ou depois, a roleta já carrega travada diretamente no número sorteado com o botão desativado exibindo `🔒 SORTEIO REALIZADO 🔒`.
- **Roleta Dinâmica de 60 Números (01 a 60)**:
  - Todos os 60 números ativos no giro!
  - Renderizada em HTML5 Canvas de alta resolução (compatível com telas Retina e 4K).
  - Animação cinematográfica de ~7 segundos com desaceleração realista e suspense crescente.
  - Ponteiro articulado no topo com física de ricochete a cada número que passa.
  - Placar ao vivo no topo mostrando o número apontado em tempo real.
- **Áudio Sintetizado 100% Procedural (Web Audio API)**:
  - Cliques mecânicos sincronizados com a rotação da roleta.
  - Sub-grave de tensão no disparo.
  - Fanfarra triunfal com acordes de sintetizador na revelação do ganhador.
  - Zero arquivos `.mp3` externos (nunca quebra no GitHub Pages!).
- **Gerador Automático de Stories para Instagram (9:16)**:
  - Ao sair o ganhador, basta clicar em *"Baixar Story pro Instagram"*.
  - Cria instantaneamente uma imagem em 1080x1920 HD com o número vencedor e a arte oficial da Rossi Tattoo pronta para postar nos stories!
- **Chuva de Confetes Neon e Modo Tela Cheia (⛶)**:
  - Para lives no Instagram ou transmissão via OBS sem nenhuma barra do navegador atrapalhando.

---

## 🚀 Como Hospedar no GitHub Pages (Passo a Passo)

Como o projeto é 100% estático (HTML, CSS e JavaScript puros), ele funciona nativamente no GitHub Pages:

### 1. Criar o Repositório no GitHub
1. Acesse [github.com/new](https://github.com/new) e faça login.
2. Nomeie o repositório (exemplo: `roleta-rifa-tattoo` ou `rifa-rossi-tattoo`).
3. Deixe marcado como **Public**.
4. Clique em **Create repository**.

### 2. Enviar os Arquivos
Você pode subir os arquivos pelo Git no terminal ou arrastando diretamente no navegador:

#### Opção A: Pelo Terminal (Git)
No diretório do projeto:
```bash
git add .
git commit -m "feat: Roleta mobile first pura de 60 números"
git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
git push -u origin main
```

#### Opção B: Pelo Navegador
1. Na página do seu repositório vazio no GitHub, clique em **uploading an existing file**.
2. Arraste todos os arquivos da pasta:
   - `index.html`
   - `style.css`
   - `script.js`
   - `audio.js`
   - `wheel.js`
   - Pasta `assets/` (com `bg.jpg`)
3. Clique em **Commit changes**.

### 3. Ativar o GitHub Pages
1. No seu repositório no GitHub, clique na aba **Settings** (Configurações).
2. No menu lateral esquerdo, clique em **Pages**.
3. Em **Build and deployment > Branch**, selecione a branch `main` e a pasta `/(root)`.
4. Clique em **Save**.
5. Aguarde cerca de 1 a 2 minutos. O GitHub fornecerá o link público do seu site:
   `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`

---

## 💻 Como Rodar Localmente

Para abrir no celular ou computador:
- Basta dar dois cliques no arquivo `index.html` para abrir diretamente no Chrome, Safari, Edge ou Firefox.

---

Feito com 💜 para Rossi Tattoo e sorteios ao vivo no Instagram!
