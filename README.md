# 👑 Roleta da Rifa Tattoo (01 a 60) • Rossi Tattoo

Aplicação web completa, moderna e interativa de roleta para sorteio de rifas de tatuagem, inspirada na identidade visual oficial da **Rossi Tattoo** (fundo escuro, estética grunge/neon roxo e elementos de estúdio).

Pronta para ser hospedada gratuitamente no **GitHub Pages** com zero configuração de servidor!

---

## 📸 Recursos Principais

- **Roleta Dinâmica de 60 Números**:
  - Renderizada em HTML5 Canvas de alta resolução (compatível com telas Retina e 4K).
  - Animação cinematográfica de 7.5 segundos com desaceleração realista e suspense crescente.
  - Ponteiro articulado com física de ricochete a cada pino que passa.
- **Áudio Sintetizado 100% Procedural (Web Audio API)**:
  - Cliques mecânicos sincronizados com a velocidade da roleta.
  - Sub-grave de tensão no disparo.
  - Fanfarra triunfal com acordes de sintetizador e brilho metálico na revelação do ganhador.
  - Zero arquivos `.mp3` externos (nunca quebra no GitHub Pages!).
- **Tabela Interativa de Participantes (01 a 60)**:
  - 60 crachás circulares neon inspirados no panfleto da rifa.
  - Clique em qualquer número para cadastrar nome e WhatsApp/Instagram do comprador.
  - Salvamento automático no `localStorage` (pode atualizar a página que não perde nada!).
  - Botão de **Preenchimento Demo** (para testar em 1 clique).
  - Contador dinâmico de números vendidos.
- **Filtros Inteligentes para Lives**:
  - *Sortear apenas números comprados*: ideal se nem todos os 60 números forem vendidos até a hora da live.
  - *Excluir já sorteados*: evita repetições caso sorteie 1º e 2º prêmio.
- **Gerador Automático de Stories para Instagram (9:16)**:
  - Ao sair o ganhador, basta clicar em *"Baixar Story pro Instagram"*.
  - Cria instantaneamente uma imagem em 1080x1920 HD com a arte oficial, número sorteado e nome do vencedor pronta para postar nos stories do `@rossi.tattoo`!
- **Chuva de Confetes Neon**:
  - Efeito comemorativo vibrante em tons roxo, dourado e prata.
- **Modo Tela Cheia (⛶)**:
  - Para lives no Instagram ou transmissão via OBS Studio sem barras de navegador.

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
git init
git add .
git commit -m "feat: Roleta da Rifa Tattoo completa"
git branch -M main
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
3. Em **Build and deployment > Branch**, selecione a branch `main` (ou `master`) e a pasta `/(root)`.
4. Clique em **Save**.
5. Aguarde cerca de 1 a 2 minutos. O GitHub fornecerá o link público do seu site:
   `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`

---

## 💻 Como Rodar Localmente

Para abrir no computador antes de subir:
- Basta dar dois cliques no arquivo `index.html` para abrir diretamente no Chrome, Edge ou Firefox.
- Ou se preferir usar uma extensão como o *Live Server* do VS Code / Antigravity.

---

## 🎨 Personalização Fácil

- **Nome do Estúdio / Tatuador**: Pesquise por `Rossi.tattoo` no `index.html` e `script.js` e troque pelo nome desejado.
- **Valor da Rifa e Prêmio**: No `index.html`, você pode alterar facilmente os textos de `R$ 10,00` ou `1 TATTOO DA SUA ESCOLHA`.
- **Cores**: As variáveis principais de cores estão no topo do arquivo `style.css` (`--neon-purple`, `--neon-gold`, etc.).

---

Feito com 💜 para tatuadores e sorteios profissionais!
