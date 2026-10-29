# ⚡ HACKER WARS // CYBER-OS (Inspirado no clássico Hacker Experience & Hacker Wars)

Um jogo de simulação e estratégia hacker fullstack em tempo real. Opere um sistema operacional virtual cyberpunk com janelas flutuantes, terminal interativo, simulação de rede com servidores NPC, economia de criptomoedas e mineração passiva, contratos da dark web, invasões a bancos e um sistema de rastreamento por logs.

---

## 🎮 Principais Mecânicas do Jogo

1. **Terminal Hacker Interativo (CLI)**
   - Comandos: `scan`, `connect <ip>`, `crack`, `ls`, `download <file>`, `upload <file>`, `rm <file>`, `wipelog`, `ps`, `kill <pid>`, `hw`, `bank`, `crypto`, `ipscan`, `help`.
   - Histórico de comandos (setas Cima/Baixo) e retorno em cores no estilo CRT/Matrix.

2. **Loop de Invasão & Exploração (Hacking Loop)**
   - **Varredura de Portas (NetScan)**: Descobre portas abertas e versões do Hasher/Firewall no alvo.
   - **Quebra de Senhas (CrackMaster)**: Duração calculada dinamicamente baseada no `Hasher do Alvo / Cracker do Jogador / CPU Power`.
   - **Acesso ROOT**: Permite baixar segredos industriais, transferir fundos bancários, apagar logs e instalar mineradores.

3. **Gestão e Evolução de Softwares**
   - Softwares categorizados: `.crc` (Crackers), `.hsh` (Hashers), `.fw` (Firewalls), `.scn` (Scanners), `.miner` (Mineradores de Cripto), `.dat` (Arquivos/Documentos sigilosos).
   - **Pesquisa & Compilação**: Evolua o nível dos seus softwares (+0.1 por compilação) para superar as defesas de alvos de alta segurança.

4. **Editor e Limpeza de Logs de Acesso (Crítico!)**
   - Toda conexão, download e quebra de senha grava uma entrada com o IP de origem no servidor alvo.
   - Servidores do governo (ex: FBI/FCB) aplicam multas e retaliação se você deixar seu IP nos logs por muito tempo!
   - Execute **Limpeza de Logs** ou edite os registros para mascarar seu IP e escapar sem deixar rastros.

5. **Economia Financeira & Fazenda de Mineração de Cripto**
   - **Invasão a Bancos**: Descubra contas vulneráveis e transfira fundos para sua conta anônima.
   - **Gráfico de Cotação em Tempo Real**: Compre e venda Bitcoin (BTC) aproveitando oscilações de mercado.
   - **Mineração Distribuída**: Faça upload do seu minerador em servidores hackeados com processadores potentes para obter renda passiva contínua a cada 5 segundos!

6. **Hardware & Gerenciador de Tarefas (Processos)**
   - **CPU**: Acelera a velocidade de todas as tarefas de processamento e quebra de senhas.
   - **RAM**: Define a quantidade máxima de processos executados em paralelo (2 a 14 tarefas simultâneas).
   - **HDD**: Expande o armazenamento local de arquivos e ferramentas.
   - **Rede / Fibra (ISP)**: Aumenta a taxa de transferência em downloads e uploads.

7. **Quadro de Missões & Contratos Darknet**
   - Roubo de teses confidenciais, infiltração em laboratórios de IA (Cyberdyne), limpeza de rastros e invasão ao Banco Central Global.
   - Recompensas em Dinheiro ($ USD), Criptomoedas (BTC) e Pontos de Reputação (REP) para subir no Ranking Mundial.

8. **Mapa Visual de Rede Radar & Navegador Web**
   - Radar espacial interativo com nós descobertos e atalhos rápidos de conexão.
   - Navegador com páginas navegáveis: `whois.net`, `hackertasks.onion`, `darknet.market`, portais bancários e alerta de procurados da polícia.

---

## 🛠️ Stack Tecnológica

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Lucide Icons, Canvas API, Web Audio API (Efeitos sonoros retro sintetizados sem dependência externa), Zustand, Canvas Confetti.
- **Backend**: Node.js, Express, Socket.io, TypeScript, Motor de Tarefas em Tempo Real (Tick engine), Simulação Econômica e Procedural de IPs.

---

## 🚀 Como Executar o Jogo

### 1. Iniciar em Modo de Desenvolvimento (Frontend + Backend juntos)

```bash
npm run dev
```

- O backend iniciará em `http://localhost:3001`
- O frontend iniciará em `http://localhost:5173`

Abra seu navegador em [http://localhost:5173](http://localhost:5173) para jogar!

### 2. Build de Produção

```bash
npm run build
npm start
```
