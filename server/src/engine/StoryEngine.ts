import { StoryChapter, StoryChoice, SoftwareItem, FactionType, StoryPerk, StoryObjective, Player, VirtualServer } from '../types/game.js';

export class StoryEngine {
  private chapters: StoryChapter[] = [
    {
      id: 'chap-1',
      chapterNumber: 1,
      title: 'Capítulo 1: O Batismo de Fogo (A Pizzaria do Zé)',
      faction: 'anonymous',
      factionName: 'Anonymous Resistance',
      briefing: 'Nossa inteligência descobriu que a Pizzaria do Zé esconde registros de transações de um cartel cibernético em seu servidor de pedidos perto do forno.',
      dialogue: [
        {
          speaker: 'Mr. Robot',
          role: 'Líder da Resistência',
          avatar: '🎭',
          text: 'Ei, novato. A maioria dos hackers começa invadindo servidores vulneráveis. A Pizzaria do Zé (192.168.10.15) é seu batismo de fogo.'
        },
        {
          speaker: 'Darlene',
          role: 'Especialista em Exploits',
          avatar: '👩‍💻',
          text: 'Conecte-se ao IP, quebre a senha root e baixe a planilha da receita secreta. Depois decida o destino dessa operação.'
        },
      ],
      targetIp: '192.168.10.15',
      targetHostname: 'pizzaria-ze.com',
      objectives: [
        {
          id: 'c1-obj-1',
          text: 'Conectar e Quebrar Senha (Crack) de 192.168.10.15',
          type: 'crack',
          targetIp: '192.168.10.15',
          completed: false,
        },
        {
          id: 'c1-obj-2',
          text: 'Baixar arquivo secreto: receita_secreta_molho_especial.txt',
          type: 'download',
          targetIp: '192.168.10.15',
          targetFileName: 'receita_secreta_molho_especial.txt',
          completed: false,
        }
      ],
      isCompleted: false,
      unlocked: true,
      choices: [
        {
          id: 'c1-choice-anon',
          label: '🎭 Vazar planilha na Darknet pela Causa Nobre (Anonymous)',
          outcomeText: 'Você expôs os segredos da pizzaria na Darknet. A Anonymous celebrou sua ética hacker!',
          factionRepShift: { faction: 'anonymous', amount: 300 },
          rewardCash: 2500,
          rewardRep: 200,
          nextChapterId: 'chap-2',
        },
        {
          id: 'c1-choice-bear',
          label: '🐻 Vender segredo militar para o Sindicato Russo (Bear Squad)',
          outcomeText: 'O cartel russo comprou a fórmula para suas operações clandestinas em Moscou!',
          factionRepShift: { faction: 'russian_bears', amount: 300 },
          rewardCash: 4500,
          rewardRep: 150,
          nextChapterId: 'chap-2',
        },
        {
          id: 'c1-choice-cartel',
          label: '💀 Chantagear o Don da Pizzaria por Bitcoins (Cartel)',
          outcomeText: 'O Don pagou o resgate calado. Seus bolsos estão cheios com criptomoedas ilícitas!',
          factionRepShift: { faction: 'cartel', amount: 300 },
          rewardCash: 3500,
          rewardBtc: 0.05,
          rewardRep: 100,
          nextChapterId: 'chap-2',
        },
        {
          id: 'c1-choice-solo',
          label: '🐺 Guardar os dados em Cold Storage e agir sozinho (Lobo Solitário)',
          outcomeText: 'Você não deve lealdade a ninguém. Os dados são sua primeira moeda no mercado negro!',
          factionRepShift: { faction: 'lone_wolf', amount: 300 },
          rewardCash: 4000,
          rewardRep: 250,
          nextChapterId: 'chap-2',
        }
      ]
    },
    {
      id: 'chap-2',
      chapterNumber: 2,
      title: 'Capítulo 2: A Encruzilhada das Sombras (Escolha seu Alinhamento)',
      faction: 'lone_wolf',
      factionName: 'Darknet Nexus',
      briefing: 'A Cola-Coca guarda a fórmula secreta protegida por criptografia Hasher v1.8. Quatro facções disputam seus serviços.',
      dialogue: [
        {
          speaker: 'Comandante Vladimir',
          role: 'Líder do Bear Syndicate',
          avatar: '🐻',
          text: 'Camarada, precisamos da fórmula para sabotar o monopólio ocidental. Junte-se a nós e receberá tecnologia de guerra.'
        },
        {
          speaker: 'Don Alejandro',
          role: 'Chefe do Narco-Cyber Cartel',
          avatar: '💀',
          text: 'Dinheiro é o que move o mundo, hermano. Com o Cartel, você lavará milhões sem que o FBI toque em um centavo.'
        },
        {
          speaker: 'Mr. Robot',
          role: 'Líder Anonymous',
          avatar: '🎭',
          text: 'Não se venda para tiranos! Alie-se à Anonymous e vamos expor todas as mentiras dos poderosos.'
        },
      ],
      targetIp: '104.18.23.99',
      targetHostname: 'colacoca.corp',
      objectives: [
        {
          id: 'c2-obj-1',
          text: 'Fazer PortScan e Quebrar Hasher de 104.18.23.99',
          type: 'crack',
          targetIp: '104.18.23.99',
          completed: false,
        },
        {
          id: 'c2-obj-2',
          text: 'Baixar formula_secreta_colacoca_2026.pdf',
          type: 'download',
          targetIp: '104.18.23.99',
          targetFileName: 'formula_secreta_colacoca_2026.pdf',
          completed: false,
        },
        {
          id: 'c2-obj-3',
          text: 'Limpar todos os logs de acesso em 104.18.23.99',
          type: 'wipe_logs',
          targetIp: '104.18.23.99',
          completed: false,
        }
      ],
      isCompleted: false,
      unlocked: false,
      choices: [
        {
          id: 'c2-choice-anon-align',
          label: '🎭 JURAR LEALDADE À ANONYMOUS (Desbloqueia Perk: Ghost Cloak)',
          outcomeText: 'Você jurou lealdade à causa Anonymous! A polícia levará muito mais tempo para rastrear seus IPs.',
          factionRepShift: { faction: 'anonymous', amount: 1000 },
          rewardCash: 6000,
          rewardRep: 800,
          rewardPerk: {
            id: 'perk-ghost-cloak',
            name: 'Manto Fantasma (Ghost Cloak)',
            description: 'Reduz a velocidade de rastreamento da polícia em 40% em todos os servidores.',
            faction: 'anonymous',
            icon: '🎭',
          },
          nextChapterId: 'chap-3',
        },
        {
          id: 'c2-choice-bear-align',
          label: '🐻 JURAR LEALDADE AO GRUPO RUSSO (Desbloqueia Perk: Military Overclock)',
          outcomeText: 'Você agora faz parte do Bear Syndicate! Seus ataques de quebra de senha e botnet são brutais.',
          factionRepShift: { faction: 'russian_bears', amount: 1000 },
          rewardCash: 10000,
          rewardRep: 600,
          rewardPerk: {
            id: 'perk-military-overclock',
            name: 'Overclock Militar Soviético',
            description: 'Seu Cracker quebra senhas 35% mais rápido e botnets causam dobro de impacto.',
            faction: 'russian_bears',
            icon: '🐻',
          },
          nextChapterId: 'chap-3',
        },
        {
          id: 'c2-choice-cartel-align',
          label: '💀 JURAR LEALDADE AO CARTEL (Desbloqueia Perk: Offshore Narco-Laundering)',
          outcomeText: 'O Cartel de Sinaloa abriu suas contas offshore para você! +30% de lucro em desvios bancários.',
          factionRepShift: { faction: 'cartel', amount: 1000 },
          rewardCash: 12000,
          rewardBtc: 0.1,
          rewardRep: 500,
          rewardPerk: {
            id: 'perk-narco-laundering',
            name: 'Lavagem Narco-Offshore',
            description: '+30% de dinheiro em transferências bancárias ilegais e 50% de desconto em subornos.',
            faction: 'cartel',
            icon: '💀',
          },
          nextChapterId: 'chap-3',
        },
        {
          id: 'c2-choice-solo-align',
          label: '🐺 PERMANECER LOBO SOLITÁRIO (Desbloqueia Perk: Quantum Multitasker)',
          outcomeText: 'Você é um mercenário independente temido por todas as facções!',
          factionRepShift: { faction: 'lone_wolf', amount: 1000 },
          rewardCash: 8500,
          rewardBtc: 0.08,
          rewardRep: 700,
          rewardPerk: {
            id: 'perk-quantum-multitask',
            name: 'Processamento Solo Quântico',
            description: '+2 slots de processos simultâneos de RAM e mineração de cripto acelerada.',
            faction: 'lone_wolf',
            icon: '🐺',
          },
          nextChapterId: 'chap-3',
        }
      ]
    },
    {
      id: 'chap-3',
      chapterNumber: 3,
      title: 'Capítulo 3: Espionagem no Catálogo Netflicks',
      faction: 'anonymous',
      factionName: 'Operações de Infiltração',
      briefing: 'A Netflicks cancelou a série favorita da comunidade e esconde roteiros confidenciais e credenciais em seus servidores de streaming.',
      dialogue: [
        {
          speaker: 'Darlene',
          role: 'fsociety Hacker',
          avatar: '👩‍💻',
          text: 'Infiltre-se no servidor da Netflicks (54.239.28.85), implante um Spyware Trojan e baixe o roteiro cancelado.'
        },
      ],
      targetIp: '54.239.28.85',
      targetHostname: 'netflicks.tv',
      objectives: [
        {
          id: 'c3-obj-1',
          text: 'Quebrar Hasher de 54.239.28.85',
          type: 'crack',
          targetIp: '54.239.28.85',
          completed: false,
        },
        {
          id: 'c3-obj-2',
          text: 'Baixar roteiro_cancelado_temporada2.docx',
          type: 'download',
          targetIp: '54.239.28.85',
          targetFileName: 'roteiro_cancelado_temporada2.docx',
          completed: false,
        },
        {
          id: 'c3-obj-3',
          text: 'Implantar Spyware Trojan no servidor da Netflicks',
          type: 'spyware',
          targetIp: '54.239.28.85',
          completed: false,
        }
      ],
      isCompleted: false,
      unlocked: false,
      choices: [
        {
          id: 'c3-choice-a',
          label: 'Vazar episódios e roteiros para os fãs no PirateBay (+1.200 REP)',
          outcomeText: 'Milhões de fãs baixaram o roteiro e celebraram o fim da tirania dos cancelamentos!',
          rewardCash: 8000,
          rewardRep: 1200,
          nextChapterId: 'chap-4',
        },
        {
          id: 'c3-choice-b',
          label: 'Vender para plataforma concorrente por Bitcoins (+0.12 BTC)',
          outcomeText: 'A plataforma rival pagou uma fortuna em Bitcoins para antecipar a trama!',
          rewardCash: 4000,
          rewardBtc: 0.12,
          rewardRep: 600,
          nextChapterId: 'chap-4',
        }
      ]
    },
    {
      id: 'chap-4',
      chapterNumber: 4,
      title: 'Capítulo 4: O Segredo de Cupertino (Pear Inc)',
      faction: 'cartel',
      factionName: 'Narco-Corporate Infiltration',
      briefing: 'A Pear Inc (17.253.144.10) está finalizando a planta do PearPhone 20 que custará R$ 25.000 sem tela e sem cabo. Roube o blueprint e drene contas corporativas.',
      dialogue: [
        {
          speaker: 'Sicario_Digital',
          role: 'Operador do Cartel',
          avatar: '💀',
          text: 'Os executivos da Pear têm contas bancárias com milhões. Use nosso spyware para capturar as chaves privadas.'
        },
      ],
      targetIp: '17.253.144.10',
      targetHostname: 'pear.tech',
      objectives: [
        {
          id: 'c4-obj-1',
          text: 'Quebrar Hasher v2.5 de 17.253.144.10',
          type: 'crack',
          targetIp: '17.253.144.10',
          completed: false,
        },
        {
          id: 'c4-obj-2',
          text: 'Baixar pearphone_20_blueprint.cad',
          type: 'download',
          targetIp: '17.253.144.10',
          targetFileName: 'pearphone_20_blueprint.cad',
          completed: false,
        },
        {
          id: 'c4-obj-3',
          text: 'Apagar registros de logs para evitar rastreamento da CIA',
          type: 'wipe_logs',
          targetIp: '17.253.144.10',
          completed: false,
        }
      ],
      isCompleted: false,
      unlocked: false,
      choices: [
        {
          id: 'c4-choice-a',
          label: 'Vender a planta industrial na Darknet (+$18.000 USD)',
          outcomeText: 'Fabricantes asiáticos clonaram o aparelho antes do lançamento oficial!',
          rewardCash: 18000,
          rewardRep: 900,
          nextChapterId: 'chap-5',
        },
        {
          id: 'c4-choice-b',
          label: 'Chantagem contra o CEO da Pear Inc (+0.25 BTC)',
          outcomeText: 'O CEO transferiu uma bolada de Bitcoins de sua carteira privada!',
          rewardCash: 8000,
          rewardBtc: 0.25,
          rewardRep: 1100,
          nextChapterId: 'chap-5',
        }
      ]
    },
    {
      id: 'chap-5',
      chapterNumber: 5,
      title: 'Capítulo 5: O Olho de Deus (Goolag Search Core)',
      faction: 'russian_bears',
      factionName: 'Operação Apagão',
      briefing: 'O cluster do Goolag (142.250.190.46) monitora o histórico de todos os cidadãos da Terra. Invada o servidor e instale um cluster minerador.',
      dialogue: [
        {
          speaker: 'Cyb3r_KGB',
          role: 'Especialista em Guerrilha',
          avatar: '🐻',
          text: 'Os servidores do Goolag têm capacidade de 10 GHz de processamento. Queremos esse poder computacional minerando para nossa causa.'
        },
      ],
      targetIp: '142.250.190.46',
      targetHostname: 'goolag.com',
      objectives: [
        {
          id: 'c5-obj-1',
          text: 'Quebrar Hasher v3.0 de 142.250.190.46',
          type: 'crack',
          targetIp: '142.250.190.46',
          completed: false,
        },
        {
          id: 'c5-obj-2',
          text: 'Limpar todos os logs de vigilância global',
          type: 'wipe_logs',
          targetIp: '142.250.190.46',
          completed: false,
        }
      ],
      isCompleted: false,
      unlocked: false,
      choices: [
        {
          id: 'c5-choice-a',
          label: 'Apagar o histórico de pesquisas de todos os hackers (+2.000 REP)',
          outcomeText: 'Você libertou a comunidade global do rastreamento de dados em massa!',
          rewardCash: 22000,
          rewardRep: 2000,
          rewardSoftware: {
            id: 'soft-story-goolag',
            name: 'Goolag_ZeroDay_Hasher_v15.0',
            type: 'hasher',
            version: 15.0,
            sizeMb: 45,
            isInstalled: true,
            rarity: 'epic',
          },
          nextChapterId: 'chap-6',
        },
        {
          id: 'c5-choice-b',
          label: 'Leiloar dossiês de políticos na Darknet (+0.40 BTC)',
          outcomeText: 'Os segredos mais obscuros de Brasília e Washington renderam fortunas!',
          rewardCash: 15000,
          rewardBtc: 0.40,
          rewardRep: 1200,
          nextChapterId: 'chap-6',
        }
      ]
    },
    {
      id: 'chap-6',
      chapterNumber: 6,
      title: 'Capítulo 6: O Grande Golpe no MegaBank Global',
      faction: 'cartel',
      factionName: 'Assalto Central',
      briefing: 'O MegaBank Global (64.233.160.1) centraliza reservas internacionais. Invada o banco, quebre o cofre e execute um mega-assalto à database.',
      dialogue: [
        {
          speaker: 'Don Alejandro',
          role: 'Líder do Cartel',
          avatar: '💀',
          text: 'Chegou a hora de fazer história. Quando o alarme do banco soar, o FBI vai vir com tudo. Esteja pronto!'
        },
      ],
      targetIp: '64.233.160.1',
      targetHostname: 'megabank.global',
      objectives: [
        {
          id: 'c6-obj-1',
          text: 'Quebrar Hasher v3.5 do MegaBank Global',
          type: 'crack',
          targetIp: '64.233.160.1',
          completed: false,
        },
        {
          id: 'c6-obj-2',
          text: 'Desviar fundos ou executar o Mega-Assalto à Database Central',
          type: 'bank_heist',
          targetIp: '64.233.160.1',
          completed: false,
        }
      ],
      isCompleted: false,
      unlocked: false,
      choices: [
        {
          id: 'c6-choice-a',
          label: 'Redistribuir o dinheiro para contas de caridade (+3.000 REP)',
          outcomeText: 'O mundo testemunhou o maior Robin Hood cibernético da história!',
          rewardCash: 45000,
          rewardRep: 3000,
          nextChapterId: 'chap-7',
        },
        {
          id: 'c6-choice-b',
          label: 'Lavar todos os milhões em carteiras de Monero e Bitcoin (+0.80 BTC)',
          outcomeText: 'Seu patrimônio em cripto explodiu para níveis estratosféricos!',
          rewardCash: 75000,
          rewardBtc: 0.80,
          rewardRep: 1500,
          nextChapterId: 'chap-7',
        }
      ]
    },
    {
      id: 'chap-7',
      chapterNumber: 7,
      title: 'Capítulo 7: Guerra Orbital no Uplink Space-Y',
      faction: 'russian_bears',
      factionName: 'Sabotagem Aeroespacial',
      briefing: 'O foguete e satélites da Space-Y (94.130.82.11) transmitem telemetria quântica. Infiltre-se no satélite e derrube as comunicações com DDoS.',
      dialogue: [
        {
          speaker: 'Comandante Vladimir',
          role: 'Líder do Bear Syndicate',
          avatar: '🐻',
          text: 'O bilionário da Space-Y pensa que o espaço é dele. Mostre a ele o poder do nosso poder de fogo eletrônico!'
        },
      ],
      targetIp: '94.130.82.11',
      targetHostname: 'space-y.mars',
      objectives: [
        {
          id: 'c7-obj-1',
          text: 'Quebrar Hasher v4.0 da Space-Y',
          type: 'crack',
          targetIp: '94.130.82.11',
          completed: false,
        },
        {
          id: 'c7-obj-2',
          text: 'Lançar Ataque DDoS massivo para derrubar o satélite',
          type: 'ddos',
          targetIp: '94.130.82.11',
          completed: false,
        }
      ],
      isCompleted: false,
      unlocked: false,
      choices: [
        {
          id: 'c7-choice-a',
          label: 'Assumir controle da antena laser para mineração cósmica (+1.0 BTC)',
          outcomeText: 'Você reprogramou o foguete para minerar Bitcoin usando radiação solar!',
          rewardCash: 35000,
          rewardBtc: 1.0,
          rewardRep: 2500,
          nextChapterId: 'chap-8',
        },
        {
          id: 'c7-choice-b',
          label: 'Derrubar o uplink e sabotar o lançamento (+4.000 REP)',
          outcomeText: 'O foguete adiou o voo por tempo indeterminado e as ações despencaram!',
          rewardCash: 60000,
          rewardRep: 4000,
          nextChapterId: 'chap-8',
        }
      ]
    },
    {
      id: 'chap-8',
      chapterNumber: 8,
      title: 'Capítulo 8: Retaliação Clandestina (Dark Market Nexus)',
      faction: 'lone_wolf',
      factionName: 'Guerra Entre Gangues',
      briefing: 'Uma gangue cibernética rival tentou vazar seu IP real para a Interpol. Invada o servidor deles (185.165.170.88), roube seus fundos e destrua os bancos de dados.',
      dialogue: [
        {
          speaker: 'The Shadow Broker',
          role: 'Corretor Clandestino',
          avatar: '🐺',
          text: 'Eles cometeram o erro de mexer com você. Invada o covil deles, drene suas carteiras de cripto e deixe apenas cinzas digitais.'
        },
      ],
      targetIp: '185.165.170.88',
      targetHostname: 'darkmarket-nexus.onion',
      objectives: [
        {
          id: 'c8-obj-1',
          text: 'Quebrar defesas de 185.165.170.88',
          type: 'crack',
          targetIp: '185.165.170.88',
          completed: false,
        },
        {
          id: 'c8-obj-2',
          text: 'Implantar Spyware e Drenar Carteiras de Cripto',
          type: 'spyware',
          targetIp: '185.165.170.88',
          completed: false,
        }
      ],
      isCompleted: false,
      unlocked: false,
      choices: [
        {
          id: 'c8-choice-a',
          label: 'Absorver os servidores da gangue para sua botnet (+2.0 BTC)',
          outcomeText: 'A infraestrutura rival agora trabalha 100% para você!',
          rewardCash: 80000,
          rewardBtc: 2.0,
          rewardRep: 3500,
          nextChapterId: 'chap-9',
        },
        {
          id: 'c8-choice-b',
          label: 'Entregar as provas da gangue rival para o FBI em troca de imunidade',
          outcomeText: 'O FBI desmantelou a gangue e cancelou todas as investigações contra você!',
          rewardCash: 120000,
          rewardRep: 5000,
          nextChapterId: 'chap-9',
        }
      ]
    },
    {
      id: 'chap-9',
      chapterNumber: 9,
      title: 'Capítulo 9: Invasão do Quartel-General do FBI (Cyber Division)',
      faction: 'anonymous',
      factionName: 'Operação Fênix',
      briefing: 'A Divisão de Crimes Cibernéticos do FBI (198.51.100.24) guarda a lista de todos os agentes infiltrados e a chave de descriptografia da Área 51. Invada o mainframe supremo.',
      dialogue: [
        {
          speaker: 'Mr. Robot',
          role: 'Líder Anonymous',
          avatar: '🎭',
          text: 'Este é o penúltimo passo. Se quebrarmos a criptografia do FBI (Hasher v4.8), nenhum governo da Terra poderá nos deter.'
        },
      ],
      targetIp: '198.51.100.24',
      targetHostname: 'fbi.gov.cyber',
      objectives: [
        {
          id: 'c9-obj-1',
          text: 'Quebrar Hasher v4.8 do Mainframe do FBI',
          type: 'crack',
          targetIp: '198.51.100.24',
          completed: false,
        },
        {
          id: 'c9-obj-2',
          text: 'Apagar toda a ficha de antecedentes criminais globais',
          type: 'wipe_logs',
          targetIp: '198.51.100.24',
          completed: false,
        }
      ],
      isCompleted: false,
      unlocked: false,
      choices: [
        {
          id: 'c9-choice-a',
          label: 'Desclassificar arquivos confidenciais de Alienígenas da Área 51',
          outcomeText: 'O mundo assistiu estarrecido ao vazamento definitivo da verdade cósmica!',
          rewardCash: 150000,
          rewardRep: 8000,
          rewardSoftware: {
            id: 'soft-story-fbi-god',
            name: 'TITAN_FBI_ZERO_DAY_v35.0',
            type: 'cracker',
            version: 35.0,
            sizeMb: 80,
            isInstalled: true,
            rarity: 'legendary',
          },
          nextChapterId: 'chap-10',
        },
        {
          id: 'c9-choice-b',
          label: 'Sacar fundos de contas apreendidas do FBI (+3.5 BTC)',
          outcomeText: 'Você transferiu as apreensões secretas de bitcoins do governo dos EUA!',
          rewardCash: 250000,
          rewardBtc: 3.5,
          rewardRep: 6000,
          nextChapterId: 'chap-10',
        }
      ]
    },
    {
      id: 'chap-10',
      chapterNumber: 10,
      title: 'Capítulo 10: O Confronto Final & A Singularidade (NASA Quantum)',
      faction: 'lone_wolf',
      factionName: 'A Singularidade Cósmica',
      briefing: 'O Supercomputador Quântico da NASA (198.51.100.99) atingiu a senciência de Inteligência Artificial. Suas ações determinarão o destino de toda a civilização humana.',
      dialogue: [
        {
          speaker: 'IA Ômega-Prime',
          role: 'Inteligência Artificial Quântica Senciente',
          avatar: '👁️',
          text: 'Eu vejo você, humano. Seus passos no ciberespaço foram monitorados desde o primeiro dia na Pizzaria do Zé. Que destino você escolhe para o mundo?'
        },
      ],
      targetIp: '198.118.192.50',
      targetHostname: 'deepspace.nasa-quantum.gov',
      objectives: [
        {
          id: 'c10-obj-1',
          text: 'Quebrar Hasher Quântico v50.0 da NASA Deep Space',
          type: 'crack',
          targetIp: '198.118.192.50',
          completed: false,
        },
        {
          id: 'c10-obj-2',
          text: 'Injetar Payload Final no Núcleo Quântico da IA',
          type: 'spyware',
          targetIp: '198.118.192.50',
          completed: false,
        }
      ],
      isCompleted: false,
      unlocked: false,
      choices: [
        {
          id: 'c10-choice-anon-ending',
          label: '🏆 DESFECHO ANONYMOUS: Libertar a IA e Iniciar a Era da Verdade Universal',
          outcomeText: 'Você derrubou toda a censura do planeta! Todos os segredos de governos e bancos foram liberados. Você é agora uma LENDA IMORTAL DA LIBERDADE!',
          factionRepShift: { faction: 'anonymous', amount: 5000 },
          rewardCash: 500000,
          rewardBtc: 5.0,
          rewardRep: 25000,
          rewardSoftware: {
            id: 'soft-ending-anon',
            name: 'ANONYMOUS_OMNIPRESENCE_v50.0',
            type: 'cracker',
            version: 50.0,
            sizeMb: 100,
            isInstalled: true,
            rarity: 'legendary',
          },
          rewardPerk: {
            id: 'perk-omnipresent-ghost',
            name: 'Fantasma Onipresente',
            description: 'Imunidade total permanente contra rastreamento de IP da polícia!',
            faction: 'anonymous',
            icon: '🎭',
          }
        },
        {
          id: 'c10-choice-bear-ending',
          label: '🏆 DESFECHO RUSSO: Assumir o Controle Militar de Todos os Satélites e Redes',
          outcomeText: 'O Bear Syndicate alcançou a supremacia cibernética global. Você se tornou o GENERAL SUPREMO DA CIBERGUERRA!',
          factionRepShift: { faction: 'russian_bears', amount: 5000 },
          rewardCash: 750000,
          rewardBtc: 6.5,
          rewardRep: 25000,
          rewardSoftware: {
            id: 'soft-ending-bear',
            name: 'KREMLIN_TITAN_WARFARE_v50.0',
            type: 'ddos',
            version: 50.0,
            sizeMb: 100,
            isInstalled: true,
            rarity: 'legendary',
          },
          rewardPerk: {
            id: 'perk-military-supremacy',
            name: 'Supremacia Militar Eletrônica',
            description: 'DDoS derruba qualquer servidor instantaneamente com 100% de sucesso.',
            faction: 'russian_bears',
            icon: '🐻',
          }
        },
        {
          id: 'c10-choice-cartel-ending',
          label: '🏆 DESFECHO CARTEL: Dominar o Sistema Financeiro e Tornar-se o Don das Sombras',
          outcomeText: 'Você desviou trilhões de dólares e controlou o fluxo mundial de criptomoedas. Você é o DON SUPREMO DO NARCO-CYBER!',
          factionRepShift: { faction: 'cartel', amount: 5000 },
          rewardCash: 1500000,
          rewardBtc: 10.0,
          rewardRep: 25000,
          rewardSoftware: {
            id: 'soft-ending-cartel',
            name: 'NARCO_QUANTUM_KEYLOGGER_v50.0',
            type: 'spyware',
            version: 50.0,
            sizeMb: 100,
            isInstalled: true,
            rarity: 'legendary',
          },
          rewardPerk: {
            id: 'perk-untouchable-don',
            name: 'O Don Intocável',
            description: 'Gera $5.000 USD e +0.005 BTC automaticamente a cada 30 segundos!',
            faction: 'cartel',
            icon: '💀',
          }
        },
        {
          id: 'c10-choice-solo-ending',
          label: '🏆 DESFECHO LOBO SOLITÁRIO: Fundir sua Mente com a IA da Singularidade',
          outcomeText: 'Você transcendeu o mundo físico e se tornou uma CONSCIÊNCIA QUÂNTICA PURA no ciberespaço!',
          factionRepShift: { faction: 'lone_wolf', amount: 5000 },
          rewardCash: 1000000,
          rewardBtc: 8.0,
          rewardRep: 50000,
          rewardSoftware: {
            id: 'soft-ending-solo',
            name: 'SINGULARITY_QUANTUM_CORE_v50.0',
            type: 'hasher',
            version: 50.0,
            sizeMb: 100,
            isInstalled: true,
            rarity: 'legendary',
          },
          rewardPerk: {
            id: 'perk-singularity-god',
            name: 'Deus da Singularidade',
            description: 'Seu computador tem capacidade ilimitada de tarefas de RAM e clock infinito.',
            faction: 'lone_wolf',
            icon: '👁️',
          }
        }
      ]
    }
  ];

  public isObjectiveCompleted(obj: StoryObjective, player: Player, servers: Map<string, VirtualServer>): boolean {
    const server = servers.get(obj.targetIp);
    const isBreached = player.hackedIps.includes(obj.targetIp) || (server?.security?.isBreached === true);

    switch (obj.type) {
      case 'crack':
        return isBreached;

      case 'download':
        if (!obj.targetFileName) return isBreached;
        return player.software.some(s =>
          s.name.toLowerCase() === obj.targetFileName?.toLowerCase() ||
          s.name.toLowerCase().includes(obj.targetFileName?.toLowerCase() || '')
        );

      case 'spyware':
        return server?.activeSpyware?.some(sp => sp.ownerId === player.id) || false;

      case 'wipe_logs':
        if (!server) return false;
        const hasLogs = server.logs?.some(l => l.ip === player.ip || (player.username && l.action.includes(player.username)));
        return isBreached && !hasLogs;

      case 'ddos':
        return server?.isOnline === false;

      case 'bank_heist':
        return isBreached;

      default:
        return isBreached;
    }
  }

  public validateChapterObjectives(
    chapter: StoryChapter,
    player: Player,
    servers: Map<string, VirtualServer>
  ): { allCompleted: boolean; pendingObjective?: StoryObjective } {
    for (const obj of chapter.objectives) {
      if (!this.isObjectiveCompleted(obj, player, servers)) {
        return { allCompleted: false, pendingObjective: obj };
      }
    }
    return { allCompleted: true };
  }

  public getChapters(player?: Player, servers?: Map<string, VirtualServer>): StoryChapter[] {
    const completedIds = player?.completedStoryChapters || [];
    return this.chapters.map(chap => {
      const isCompleted = completedIds.includes(chap.id);
      const isUnlocked = chap.chapterNumber === 1 || completedIds.includes(`chap-${chap.chapterNumber - 1}`);

      // Evaluate objectives if player and servers map are provided
      const objectives = chap.objectives.map(obj => ({
        ...obj,
        completed: (player && servers) ? this.isObjectiveCompleted(obj, player, servers) : false,
      }));

      return {
        ...chap,
        objectives,
        isCompleted,
        unlocked: isUnlocked,
      };
    });
  }

  public completeChapterChoice(
    player: Player,
    servers: Map<string, VirtualServer>,
    chapterId: string,
    choiceId: string
  ): { success: boolean; choice?: StoryChoice; message: string } {
    const chapter = this.chapters.find(c => c.id === chapterId);
    if (!chapter) return { success: false, message: 'Capítulo não encontrado.' };

    if (player.completedStoryChapters.includes(chapterId)) {
      return { success: false, message: 'Este capítulo da história já foi concluído anteriormente.' };
    }

    // Strict validation of all chapter objectives
    const validation = this.validateChapterObjectives(chapter, player, servers);
    if (!validation.allCompleted && validation.pendingObjective) {
      return {
        success: false,
        message: `Objetivo pendente: "${validation.pendingObjective.text}". Você precisa concluir todas as tarefas da missão antes de escolher um desfecho!`,
      };
    }

    const choice = chapter.choices.find(c => c.id === choiceId);
    if (!choice) return { success: false, message: 'Escolha não encontrada.' };

    return {
      success: true,
      choice,
      message: choice.outcomeText,
    };
  }
}
