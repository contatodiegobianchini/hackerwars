# Hacker Wars — sistema de interface

Direção visual: **lan house de madrugada**. Fundo azul-noite, fósforo âmbar para tudo que o jogador pode fazer, sirene (vermelho/azul) só para polícia e perigo, verde só para concluído.

## Navegação

A interface segue o ciclo do jogo (descobrir → invadir → explorar → sumir → investir) em cinco zonas, definidas em `client/src/navigation.ts`:

| Zona | Telas (abas) |
| --- | --- |
| Início | Visão geral, Processos, Guia do jogo |
| Rede | Alvos, Alvo conectado |
| Operações | História, Contratos |
| Base | Software, Hardware, Defesa, Meus logs, Datacenter |
| Dinheiro | Banco, Cripto, Black Market, Clãs, Ranking |

- Computador: barra lateral com as zonas (`Sidebar`) e abas no topo do conteúdo (`ZoneTabs`).
- Celular: as mesmas cinco zonas na barra inferior (`MobileBottomNav`); terminal, áudio e sair ficam no menu ⋮.
- DarkIRC é um painel lateral (`ChatDrawer`) que abre sobre qualquer zona. `setCurrentView('dark_chat')` abre o painel.
- Terminal: botão no cabeçalho ou tecla `` ` ``.
- Selos só mostram o que pede atenção: processos ativos, contratos/capítulos prontos para entregar, infecções, mensagens novas (`useNavCounts`).

## Tokens e tipografia

- Tokens em `client/src/styles/tokens.css` (`--madrugada`, `--painel`, `--fosforo`, `--sirene`…). Os nomes antigos (`--signal-*`, `--text-*`) continuam valendo como apelidos.
- Fontes: Big Shoulders Display (títulos), Instrument Sans (texto), JetBrains Mono (só IPs, hashes, valores e terminal).

## Telas antigas (Tailwind)

`tailwind.config.js` remapeia as cores **por tipo de utilitário**: `bg-white` vira painel escuro, `text-gray-900` vira texto claro, bordas viram divisórias discretas, `bg-black` vira o botão principal em âmbar. Assim as telas escritas para cartões claros funcionam no tema escuro sem CSS por tela. Em código novo, prefira os componentes `Cyber*` e os tokens.

## Regras

- Tudo em português, com frases normais (sem caixa-alta decorativa nem separadores `//`).
- Toda tela vazia diz o que fazer para enchê-la.
- Uma ação mantém o mesmo nome do botão à notificação.

## Próximas fases

2. Início com "próximo passo" e tela do alvo em etapas com faixa de rastreamento.
3. Quadro único de operações (História + Contratos + Syndicate); DDoS como ação separada.
4. Migração visual e de textos das demais telas; capítulo 1 como tutorial.
