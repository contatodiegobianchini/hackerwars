# ⚡ HackerWars

Jogo de simulação hacker multiplayer, em tempo real, que roda no navegador. Inspirado em *Hacker Experience*, *Uplink* e *Hacknet*: você quebra senhas, invade servidores, rouba arquivos, apaga seus rastros e foge da polícia, enquanto outros jogadores disputam o mesmo mundo.

**Para quem é:** quem curte jogos de hacking e estratégia (e quer jogar de graça, direto no navegador), e quem estuda um projeto fullstack em tempo real com React, Node, Socket.IO e Postgres, com regras de jogo testadas.

---

## 🎮 O que dá para fazer no jogo

- **Invadir**: varra a rede, descubra alvos, quebre a senha (o tempo depende do Hasher do alvo, do seu cracker e da sua CPU) e ganhe acesso root.
- **Explorar**: baixe arquivos, implante spyware, instale mineradores de cripto e execute o mega-assalto em bancos.
- **Sumir**: cada ação deixa rastro e esquenta o rastreio da polícia. Apague os logs, use proxies ou alguém vai atrás de você (a senha é trocada, multa, batida policial ou sicários do cartel).
- **Contratos**: um quadro que se renova (2 h de validade), com contratos de nível baixo a elite, um "golpe do dia" e estrelas de estilo por não ser rastreado e não deixar rastros.
- **História e facções**: capítulos com escolhas que mudam a reputação com as facções, mais contratos do Syndicate.
- **Segredos**: pistas escondidas em arquivos levam a servidores que nunca aparecem em varreduras, com cofres e crackers de prêmio.
- **Um mundo que reage**: servidores muito invadidos recebem patches (ficam mais difíceis) e o acesso root expira se você some por muito tempo.
- **Evolução**: hardware, softwares (pesquisa e compilação), clãs, ranking, mercado negro e cripto com preços que oscilam.
- **CyberCoins (opcional)**: moeda premium vendida pelo Stripe que só compra velocidade (acelerar processos e Turbo 2x). Não compra dinheiro nem vantagem de combate.

## 🛠️ Feito com

- **Cliente**: React 18, Vite, TypeScript, Tailwind CSS, Zustand, Socket.IO client.
- **Servidor**: Node.js, Express, Socket.IO, TypeScript, motor de tarefas em tempo real, Postgres (cliente próprio estilo PostgREST em `server/src/database/pg-client.ts`), Stripe Checkout para as CyberCoins.
- **Testes**: `node:test` via `tsx` (regras de missões, rastreio, contratos, segredos, patches e CyberCoins).

## 🚀 Como rodar

Pré-requisitos: Node.js 20 ou mais novo, npm e um Postgres (o jeito mais fácil é o Docker).

```bash
# 1. dependências
npm run install:all

# 2. banco local (as tabelas são criadas no primeiro boot)
docker run --name hackerwars-db -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:16

# 3. variáveis de ambiente: copie os exemplos e ajuste JWT_SECRET e ADMIN_PASSWORD
cp server/.env.example server/.env
cp client/.env.example client/.env.local

# 4. carregue as variáveis do servidor no shell e suba tudo (servidor + cliente)
set -a; source server/.env; set +a
npm run dev
```

- Cliente: <http://localhost:5173>. Servidor: <http://localhost:10000> (porta definida por `PORT`).
- O servidor não lê arquivos `.env` sozinho, por isso o `source` no passo 4. Ele recusa subir sem `DATABASE_URL`, `JWT_SECRET` (32+ caracteres) e `ADMIN_PASSWORD` (20+ caracteres).
- A loja de CyberCoins fica desligada sem `STRIPE_SECRET_KEY`. Para testar, use chaves de teste do Stripe (`sk_test_...`).

### Testes e build

```bash
npm test                  # testes do servidor e da lógica pura do cliente
npm --prefix server run build
npm --prefix client run build
```

---

## 🗺️ Planos

O que já foi feito e o que vem a seguir está em [ROADMAP.md](ROADMAP.md).

## 🔒 Segurança

Veja [SECURITY.md](SECURITY.md). Nunca versione chaves: `.env*` está no `.gitignore` e os exemplos usam só valores de mentira.

## 📄 Licença

[MIT](LICENSE).

---

### 3. Deploy na ShardCloud (processo único: API + Socket.IO + client)

O arquivo `.shardcloud` já está configurado. No primeiro boot, `scripts/shardcloud-start.mjs` faz o build (`npm run build:all`, com `VITE_API_URL=` vazio para o client usar a mesma origem) e inicia `server/dist/serve-client.js`.

1. Suba o projeto (zip/Git) na ShardCloud. Ajuste `SUBDOMAIN` e `MEMORY` no `.shardcloud` se precisar (o build precisa de ~1GB; depois pode reduzir).
2. Configure as variáveis de ambiente no painel:
   - `DATABASE_URL` (connection string do Postgres, ex.: banco criado na própria ShardCloud). As tabelas são criadas automaticamente no primeiro boot.
   - `JWT_SECRET` (mín. 32 caracteres), `ADMIN_PASSWORD` (mín. 20 caracteres)
   - `FRONTEND_ORIGIN` = URL pública do app (ex.: `https://hackerwars.shardweb.app`) — necessário para o CORS dos POSTs.
   - CyberCoins (opcional, a loja fica desativada sem elas): `STRIPE_SECRET_KEY` (comece com a chave de teste `sk_test_...`), `STRIPE_WEBHOOK_SECRET` (`whsec_...`, do endpoint `https://SEU-APP/api/shop/webhook` com os eventos `checkout.session.completed` e `checkout.session.async_payment_succeeded`) e `PUBLIC_URL` (URL pública do app, usada nos redirecionamentos do checkout).
3. A porta vem de `PORT` (o servidor já respeita).
