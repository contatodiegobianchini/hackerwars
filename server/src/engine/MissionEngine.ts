import { Mission, MissionDifficulty, MissionType } from '../types/game.js';
import { v4 as uuidv4 } from 'uuid';

export class MissionEngine {
  private availableMissions: Mission[] = [];

  constructor() {
    this.seedDefaultMissions();
  }

  private seedDefaultMissions() {
    this.availableMissions = [
      {
        id: 'mis-1',
        title: 'O Molho Secreto do Zé',
        employer: 'Pizzarias Rivais S.A.',
        description: 'A Pizzaria do Zé (192.168.10.15) tem o molho mais viciante da cidade. Conecte-se ao servidor dele perto do forno, quebre a senha root e baixe a receita secreta (receita_secreta_molho_especial.txt).',
        type: 'steal_file',
        targetIp: '192.168.10.15',
        targetDomain: 'pizzaria-ze.com',
        requiredFileName: 'receita_secreta_molho_especial.txt',
        rewardCash: 500,
        rewardCrypto: 0.008,
        rewardRep: 60,
        difficulty: 'Easy',
        status: 'available',
      },
      {
        id: 'mis-2',
        title: 'A Fórmula Secreta da Cola-Coca',
        employer: 'Pepsi-Syndicate',
        description: 'A Cola-Coca (104.18.23.99) guarda a fórmula do refrigerante trancada a sete chaves desde 1886. Invada o servidor deles, quebre a senha Hasher v1.8 e faça o download de formula_secreta_colacoca_2026.pdf!',
        type: 'steal_file',
        targetIp: '104.18.23.99',
        targetDomain: 'colacoca.corp',
        requiredFileName: 'formula_secreta_colacoca_2026.pdf',
        rewardCash: 1800,
        rewardCrypto: 0.025,
        rewardRep: 150,
        difficulty: 'Medium',
        status: 'available',
      },
      {
        id: 'mis-3',
        title: 'Salvar a Série Cancelada da Netflicks',
        employer: 'Fãs Revoltados Anonymous',
        description: 'A Netflicks (54.239.28.85) cancelou mais uma série excelente no auge. Infiltre-se no catálogo deles e resgate o roteiro da segunda temporada (roteiro_cancelado_temporada2.docx).',
        type: 'steal_file',
        targetIp: '54.239.28.85',
        targetDomain: 'netflicks.tv',
        requiredFileName: 'roteiro_cancelado_temporada2.docx',
        rewardCash: 2400,
        rewardCrypto: 0.035,
        rewardRep: 220,
        difficulty: 'Medium',
        status: 'available',
      },
      {
        id: 'mis-4',
        title: 'Projeto PearPhone 20 Sem Carregador',
        employer: 'Android Fans Guild',
        description: 'A Pear Inc. (17.253.144.10) está desenhando o novo PearPhone 20 que custará R$ 25.000 e virá sem carregador, sem caixa e sem tela. Baixe a planta (pearphone_20_blueprint.cad).',
        type: 'steal_file',
        targetIp: '17.253.144.10',
        targetDomain: 'pear.tech',
        requiredFileName: 'pearphone_20_blueprint.cad',
        rewardCash: 4500,
        rewardCrypto: 0.08,
        rewardRep: 400,
        difficulty: 'Hard',
        status: 'available',
      },
      {
        id: 'mis-5',
        title: 'Apagar Histórico Vergonhoso do Goolag',
        employer: 'Político Anônimo',
        description: 'Um figurão fez pesquisas constrangedoras às 3h da manhã no Goolag (142.250.190.46). Obtenha acesso root e limpe TODOS os registros de logs de acesso do servidor!',
        type: 'wipe_server',
        targetIp: '142.250.190.46',
        targetDomain: 'goolag.com',
        rewardCash: 6000,
        rewardCrypto: 0.12,
        rewardRep: 500,
        difficulty: 'Hard',
        status: 'available',
      },
      {
        id: 'mis-6',
        title: 'Mineração Espacial no Foguete da Space-Y',
        employer: 'Crypto Whale Syndicate',
        description: 'O cluster da Space-Y (94.130.82.11) tem superprocessadores de 8.0 GHz. Invada o servidor do foguete e roube os rascunhos de tweets do bilionário (tweets_nao_publicados_do_bilionario.txt).',
        type: 'steal_file',
        targetIp: '94.130.82.11',
        targetDomain: 'space-y.mars',
        requiredFileName: 'tweets_nao_publicados_do_bilionario.txt',
        rewardCash: 9500,
        rewardCrypto: 0.18,
        rewardRep: 750,
        difficulty: 'Hard',
        status: 'available',
      },
      {
        id: 'mis-7',
        title: 'Arquivo Confidencial: Alienígenas da Área 51',
        employer: 'Illuminati Leaks',
        description: 'O FBI (198.51.100.24) esconde provas definitivas sobre aliens na Área 51. Invada o servidor de segurança máxima e baixe o arquivo planos_area_51_aliens.dat. CUIDADO COM OS LOGS!',
        type: 'steal_file',
        targetIp: '198.51.100.24',
        targetDomain: 'fbi-gov.sec',
        requiredFileName: 'planos_area_51_aliens.dat',
        rewardCash: 25000,
        rewardCrypto: 0.50,
        rewardRep: 2500,
        difficulty: 'Elite',
        status: 'available',
      },
      {
        id: 'mis-8',
        title: 'O Grande Golpe no MegaBank Global',
        employer: 'Robin Hood Cyber',
        description: 'Invada o nó blindado do MegaBank (12.189.44.10) e quebre as defesas de Hasher v4.2 para drenar contas secretas offshore.',
        type: 'hack_bank',
        targetIp: '12.189.44.10',
        targetDomain: 'megabank.global',
        rewardCash: 35000,
        rewardCrypto: 0.75,
        rewardRep: 3500,
        difficulty: 'Elite',
        status: 'available',
      },
    ];
  }

  public getAvailableMissions(): Mission[] {
    return this.availableMissions.filter(m => m.status === 'available');
  }

  public getMissionById(id: string): Mission | undefined {
    return this.availableMissions.find(m => m.id === id);
  }

  public acceptMission(id: string): Mission | null {
    const mission = this.availableMissions.find(m => m.id === id);
    if (mission && mission.status === 'available') {
      mission.status = 'active';
      return mission;
    }
    return null;
  }

  public completeMission(id: string): Mission | null {
    const mission = this.availableMissions.find(m => m.id === id);
    if (mission && mission.status === 'active') {
      mission.status = 'completed';
      return mission;
    }
    return null;
  }

  public generateRandomMission(): Mission {
    const difficulties: MissionDifficulty[] = ['Easy', 'Medium', 'Hard'];
    const types: MissionType[] = ['steal_file', 'wipe_server', 'plant_virus'];
    const employers = [
      'Guerrilha da Pizza',
      'Anti-Pear Resistance',
      'Meme Cartel',
      'NullByte Syndicate',
      'RedTeam Anonymous'
    ];

    const diff = difficulties[Math.floor(Math.random() * difficulties.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const emp = employers[Math.floor(Math.random() * employers.length)];
    const ip = `${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 250 + 2)}`;

    const rewardMultiplier = diff === 'Easy' ? 1 : diff === 'Medium' ? 2.5 : 5;
    const mission: Mission = {
      id: `mis-${uuidv4().substring(0, 8)}`,
      title: `Operação Secreta // ${emp}`,
      employer: emp,
      description: `Contrato de espionagem cibernética no host ${ip}. Cumpra os objetivos e não esqueça de limpar os logs.`,
      type,
      targetIp: ip,
      rewardCash: Math.round(750 * rewardMultiplier),
      rewardCrypto: Number((0.015 * rewardMultiplier).toFixed(4)),
      rewardRep: Math.round(120 * rewardMultiplier),
      difficulty: diff,
      status: 'available',
    };

    this.availableMissions.push(mission);
    return mission;
  }
}
