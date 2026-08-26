import { DarkChatChannel, DarkChatMessage, FactionType, Player } from '../types/game.js';
import { v4 as uuidv4 } from 'uuid';

export class DarkChatEngine {
  private channels: Map<string, DarkChatChannel> = new Map();

  constructor() {
    this.seedInitialChannels();
  }

  private seedInitialChannels() {
    const defaultChannels: DarkChatChannel[] = [
      {
        id: 'chan-anon',
        name: '#anonymous-resistance',
        faction: 'anonymous',
        description: 'Canal Criptografado da Resistência Hacktivista. Focado em expor a verdade.',
        avatar: '🎭',
        unreadCount: 2,
        messages: [
          {
            id: 'msg-anon-1',
            channelId: 'chan-anon',
            sender: 'Mr. Robot',
            role: 'Comandante fsociety',
            avatar: '🎭',
            text: 'Saudações. Se você está neste canal, você rejeitou as mentiras corporativas. Nosso primeiro objetivo é o servidor da Pizzaria do Zé (192.168.10.15).',
            timestamp: Date.now() - 3600000,
            actionButton: {
              label: '🚀 Conectar à Pizzaria (192.168.10.15)',
              actionType: 'connect',
              targetIp: '192.168.10.15',
            }
          },
          {
            id: 'msg-anon-2',
            channelId: 'chan-anon',
            sender: 'Darlene',
            role: 'Especialista em Exploits',
            avatar: '👩‍💻',
            text: 'Quebre a senha root, faça o download da receita secreta e publique na Darknet. Nunca esqueça de apagar seus logs!',
            timestamp: Date.now() - 1800000,
          }
        ]
      },
      {
        id: 'chan-bear',
        name: '#kremlin-bears',
        faction: 'russian_bears',
        description: 'Rede Clandestina de Ciberguerra e Armamento Militar Zero-Day.',
        avatar: '🐻',
        unreadCount: 1,
        messages: [
          {
            id: 'msg-bear-1',
            channelId: 'chan-bear',
            sender: 'Comandante Vladimir',
            role: 'Líder Bear Squad',
            avatar: '🐻',
            text: 'Atenção operador. Estamos de olho no cluster da Cola-Coca (104.18.23.99) e no uplink orbital da Space-Y (94.130.82.11). Quem dominar essas redes receberá tecnologia militar.',
            timestamp: Date.now() - 4000000,
            actionButton: {
              label: '🚀 Conectar à Cola-Coca (104.18.23.99)',
              actionType: 'connect',
              targetIp: '104.18.23.99',
            }
          }
        ]
      },
      {
        id: 'chan-cartel',
        name: '#sinaloa-narco-net',
        faction: 'cartel',
        description: 'Comunicações Clandestinas do Narco-Cyber Cartel. Foco em lucros massivos e desvios.',
        avatar: '💀',
        unreadCount: 1,
        messages: [
          {
            id: 'msg-cartel-1',
            channelId: 'chan-cartel',
            sender: 'Don Alejandro',
            role: 'Chefe do Cartel',
            avatar: '💀',
            text: 'Buenas tardes. O MegaBank Global (64.233.160.1) e as contas corporativas da Pear Inc (17.253.144.10) guardam centenas de milhares de dólares. Implante seu Spyware e drene os fundos!',
            timestamp: Date.now() - 2500000,
            actionButton: {
              label: '🏦 Conectar ao MegaBank (64.233.160.1)',
              actionType: 'connect',
              targetIp: '64.233.160.1',
            }
          }
        ]
      },
      {
        id: 'chan-broker',
        name: '#darknet-shadow-broker',
        faction: 'lone_wolf',
        description: 'Leilões de Zero-Days, chantagens e contratos para mercenários independentes.',
        avatar: '🐺',
        unreadCount: 1,
        messages: [
          {
            id: 'msg-broker-1',
            channelId: 'chan-broker',
            sender: 'The Shadow Broker',
            role: 'Corretor Clandestino',
            avatar: '🐺',
            text: 'Sem lealdade, sem remorso. Se você quer dominar o Supercomputador Quântico da NASA (198.118.192.50) e a IA Ômega, você deve jogar todas as facções umas contra as outras.',
            timestamp: Date.now() - 5000000,
            actionButton: {
              label: '🚀 Conectar ao Servidor Rival (185.165.170.88)',
              actionType: 'connect',
              targetIp: '185.165.170.88',
            }
          }
        ]
      }
    ];

    defaultChannels.forEach(c => this.channels.set(c.id, c));
  }

  public getChannels(): DarkChatChannel[] {
    return Array.from(this.channels.values());
  }

  public addMessage(
    channelId: string,
    sender: string,
    role: string,
    avatar: string,
    text: string,
    actionButton?: DarkChatMessage['actionButton']
  ): DarkChatMessage {
    const channel = this.channels.get(channelId);
    const newMsg: DarkChatMessage = {
      id: `msg-${uuidv4().slice(0, 8)}`,
      channelId,
      sender,
      role,
      avatar,
      text,
      timestamp: Date.now(),
      actionButton,
    };

    if (channel) {
      channel.messages.push(newMsg);
      channel.unreadCount += 1;
    }

    return newMsg;
  }

  public sendContractorReaction(
    trigger: 'crack' | 'download' | 'spyware' | 'wipe_logs' | 'bank_heist' | 'ddos',
    targetIp: string,
    targetHostname: string,
    playerFaction: FactionType
  ): DarkChatMessage | null {
    let channelId = 'chan-anon';
    let sender = 'Mr. Robot';
    let role = 'Líder Anonymous';
    let avatar = '🎭';

    if (playerFaction === 'russian_bears') {
      channelId = 'chan-bear';
      sender = 'Comandante Vladimir';
      role = 'Comandante Russo';
      avatar = '🐻';
    } else if (playerFaction === 'cartel') {
      channelId = 'chan-cartel';
      sender = 'Don Alejandro';
      role = 'Chefe do Cartel';
      avatar = '💀';
    } else if (playerFaction === 'lone_wolf') {
      channelId = 'chan-broker';
      sender = 'The Shadow Broker';
      role = 'Corretor Clandestino';
      avatar = '🐺';
    }

    let text = '';
    let actionButton: DarkChatMessage['actionButton'] | undefined = undefined;

    switch (trigger) {
      case 'crack':
        text = `💥 Excelente invasão em ${targetHostname} (${targetIp})! O acesso ROOT foi conquistado. Agora execute o payload ou implante o spyware antes que o tráfego anômalo seja notado!`;
        break;
      case 'download':
        text = `💾 Arquivos confidenciais exfiltrados com sucesso de ${targetHostname}! Apague imediatamente todos os registros de logs para manter seu anonimato.`;
        break;
      case 'spyware':
        text = `🕵️ Trojan Spyware implantado em ${targetHostname}! O keylogger está monitorando teclas e credenciais de contas bancárias e carteiras de Bitcoin. Fique atento às notificações!`;
        break;
      case 'wipe_logs':
        text = `🧹 Limpeza de logs concluída em ${targetHostname}! Seus rastros digitais foram vaporizados. A polícia não tem pistas da sua localização.`;
        break;
      case 'bank_heist':
        text = `🚨 MEGA-ASSALTO EXECUTADO! Os fundos foram desviados para nossas contas offshore! ⚠️ ATENÇÃO: O FBI DEFLAGROU UM MANDADO DE PRISÃO IMEDIATO! DEFENDAM-SE!`;
        break;
      case 'ddos':
        text = `⚡ O ataque DDoS derrubou ${targetHostname}! Os serviços do alvo estão offline e a infraestrutura foi neutralizada com sucesso!`;
        break;
    }

    return this.addMessage(channelId, sender, role, avatar, text, actionButton);
  }
}
