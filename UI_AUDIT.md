# Hacker Wars — sistema de interface

Direção visual: **lan house de madrugada com toque cyberpunk**. Fundo azul-noite e fósforo âmbar para tudo que o jogador pode fazer. Neon só em tensão e sucesso: magenta (`--sirene`) para rastreamento e perigo, ciano (`--neon-ciano`) para invasão e concluído. Efeitos: scanlines na faixa de rastreamento e um glitch curto quando uma senha é quebrada.

## Navegação

A interface segue o ciclo do jogo (descobrir → invadir → explorar → sumir → investir) em cinco zonas, definidas em `client/src/navigation.ts`:

| Zona | Telas (abas) |
| --- | --- |
| Início | Próximo passo, Processos, Guia do jogo |
| Rede | Alvos, Alvo conectado |
| Operações | Quadro, História |
| Base | Minha máquina, Software, Hardware, Defesa, Meus logs, Datacenter |
| Dinheiro | Banco, Cripto, Black Market, Clãs, Ranking |

- Computador: barra lateral com as zonas (`Sidebar`) e abas no topo do conteúdo (`ZoneTabs`).
- Celular: as mesmas cinco zonas na barra inferior (`MobileBottomNav`); terminal, áudio e sair ficam no menu ⋮.
- DarkIRC é um painel lateral (`ChatDrawer`) que abre sobre qualquer zona. `setCurrentView('dark_chat')` abre o painel.
- Terminal: botão no cabeçalho ou tecla `` ` ``.
- Selos só mostram o que pede atenção: processos ativos, contratos/capítulos prontos para entregar, infecções, mensagens novas (`useNavCounts`).

## Telas principais

- **Início** (`HomeView`): o "próximo passo" vem de `client/src/game/nextStep.ts` (função pura, testada em `nextStep.test.ts`). Ordem: recompensa pronta (desfecho de capítulo ou contrato cumprido) → objetivo do capítulo atual → contrato aceito → contrato novo ao alcance → varrer a rede. Quando falta algo (cracker fraco, disco cheio, sem spyware), o passo diz o quê e leva à tela que resolve.
- **Alvo** (`TargetServerView`): três etapas reais, numeradas: Invadir → Explorar → Sumir. Objetivos de capítulo e contratos que apontam para o alvo aparecem no topo; arquivos-objetivo ficam marcados. O DDoS fica num bloco separado, porque não depende de invasão.
- **Operações › Quadro** (`OperationsBoard`): uma lista só para capítulos da história, contratos e contratos do Syndicate, montada por `client/src/game/operations.ts` (testada em `operations.test.ts`). Cada linha mostra a situação (pronto, em andamento, disponível, bloqueado, concluído) e o que bloqueia antes de aceitar ("Precisa de cracker v22,0"). Ao abrir uma linha: briefing, checklist de objetivos e as ações (aceitar, entregar, conectar, evoluir cracker).
- **Faixa de rastreamento** (`TraceBar`): fica sob o cabeçalho em qualquer tela enquanto houver conexão, com tempo restante, proxies/VPN e o botão Desconectar.

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

4. Migração visual e de textos das demais telas; capítulo 1 como tutorial.
