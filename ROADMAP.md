# Roadmap

Visão: um mundo hacker compartilhado em que cada ação tem consequência e jogar é divertido do primeiro minuto.

## Já feito

- Missões, facções e alvos revisados: conclusão por jogador, sem farm infinito, objetivos conferidos de verdade.
- Interface nova ("lan house de madrugada" com toque neon): cinco zonas de navegação, tela de próximo passo, quadro único de operações, DarkIRC em painel lateral, visual no celular.
- Rastreio da polícia por calor de cada ação, com proxies que protegem os logs.
- Caças: deixar rastros nos logs gera consequência com prazo (senha trocada, multa, batida, cartel).
- Quadro de contratos que se renova, golpe do dia, estrelas de estilo e sequência diária.
- Segredos: pistas em arquivos que levam a 5 servidores escondidos com cofres e crackers.
- Catálogo de 38 alvos de nível baixo e médio, varredura que segue o seu cracker e mais contratos médios.
- Mundo que reage: patches em servidores muito invadidos e troca de senha por inatividade.
- CyberCoins: pacotes pelo Stripe Checkout e gasto só em velocidade (acelerar processo, Turbo 2x).

## Próximos passos

Estimativas em horas de trabalho focado de uma pessoa, já contando testes e revisão. Total planejado: **cerca de 68 horas**, em oito frentes. A ordem abaixo é a prioridade sugerida.

### 1. PvP: o mundo dos outros jogadores (13 h)
- [ ] **Vingança** (4 h): quem foi invadido vê o IP do invasor nos logs que ele deixou, ganha um alvo de retaliação e um bônus ao devolver o golpe.
- [ ] **Recompensas por jogadores** (4 h): colocar um preço pela cabeça de alguém, escrow do dinheiro, pagamento a quem cumprir e expiração com reembolso.
- [ ] **Guerra de facções** (5 h): placar semanal por facção, objetivos coletivos, território (servidores que rendem para quem domina) e prêmios no fim da guerra.

### 2. Temporadas (10 h)
- [ ] **Reinício de ranking** (4 h): snapshot do ranking, reset controlado de reputação e dinheiro com o que se mantém (hardware, software) bem definido.
- [ ] **Recompensas de temporada** (3 h): títulos, molduras e CyberCoins de bônus para o topo, entregues uma única vez.
- [ ] **Eventos e modificadores** (3 h): semanas com regra especial (rastreio mais lento, bancos mais ricos, patches mais rápidos).

### 3. Interface, fase 4 (11 h)
- [ ] **Migrar telas antigas** (6 h): Banco, Cripto, Clãs, Hardware, Defesa e Mercado Negro para o sistema visual novo, removendo o remapeamento de cores do Tailwind.
- [ ] **Capítulo 1 como tutorial guiado** (3 h): passos com destaque na tela, sem texto longo, terminando no primeiro contrato.
- [ ] **Acessibilidade e teclado** (2 h): foco visível, navegação por teclado nas listas, contraste conferido e `prefers-reduced-motion` para scanlines e glitch.

### 4. CyberCoins em produção (6 h)
- [ ] **Stripe real** (2 h): chaves de produção, webhook em produção, teste de pagamento aprovado, recusado e reembolsado.
- [ ] **Termos e política** (2 h): termos de uso, política de reembolso e aviso de moeda virtual, linkados na loja.
- [ ] **Histórico e antifraude** (2 h): extrato de compras e gastos no jogo, limite de compra por dia e trava para contestações (chargeback).

### 5. Qualidade e testes (10 h)
- [ ] **Testes ponta a ponta** (5 h): Playwright cobrindo cadastro, primeira invasão, contrato completo, rastreio e compra de CyberCoins com o Stripe em modo de teste.
- [ ] **Teste de carga** (3 h): centenas de jogadores simulados no motor de processos e nos tickers, com meta de latência.
- [ ] **Integração contínua** (2 h): GitHub Actions rodando `tsc`, testes e builds do cliente e do servidor em cada PR.

### 6. Equilíbrio e telemetria (6 h)
- [ ] **Eventos de jogo anônimos** (3 h): registrar tempo até a primeira invasão, contratos concluídos e abandono por tela, sem dados pessoais.
- [ ] **Ajuste dos números** (3 h): patches, troca de senha, rastreio, preços e recompensas revisados com esses dados.

### 7. Conteúdo (8 h)
- [ ] **Nova trilha de segredos** (3 h): segunda cadeia de pistas com 5 servidores e charadas diferentes.
- [ ] **Capítulos novos da história** (3 h): dois capítulos com escolhas que afetam as facções.
- [ ] **Alvos temáticos** (2 h): mais servidores com personalidade (escola, prefeitura, cartório) e arquivos que contam histórias.

### 8. Infraestrutura e segurança (4 h)
- [ ] **Limite de taxa nos sockets** (2 h): por jogador e por tipo de evento, contra spam e automação.
- [ ] **Backup do banco e restauração** (1 h): rotina documentada e testada.
- [ ] **Observabilidade** (1 h): logs estruturados e alerta quando um ticker falha.

| Frente | Horas |
|---|---|
| PvP | 13 |
| Temporadas | 10 |
| Interface, fase 4 | 11 |
| CyberCoins em produção | 6 |
| Qualidade e testes | 10 |
| Equilíbrio e telemetria | 6 |
| Conteúdo | 8 |
| Infraestrutura e segurança | 4 |
| **Total** | **68** |
