import { Mission, MissionDifficulty, MissionType, Player, VirtualServer } from '../types/game.js';
import { GameWorld } from './GameWorld.js';
import { v4 as uuidv4 } from 'uuid';

export type MissionOperation = 'crack' | 'download' | 'wipe_logs' | 'ddos' | 'spyware' | 'bank_heist';

/** Which completed operation satisfies each mission type. */
const MISSION_OPERATION: Record<MissionType, MissionOperation> = {
  steal_file: 'download',
  wipe_server: 'wipe_logs',
  hack_bank: 'bank_heist',
  ddos_target: 'ddos',
  plant_virus: 'spyware',
  trace_hacker: 'crack',
};

export class MissionEngine {
  private availableMissions: Mission[] = [];

  constructor() {
    this.seedDefaultMissions();
    this.installLegacySocketCompatibility();
  }

  private installLegacySocketCompatibility() {
    // The socket layer historically passed Player objects to GameWorld methods
    // that expect a userId string. Normalize those calls here so campaign and
    // faction actions keep working without duplicating game logic.
    const proto = GameWorld.prototype as any;
    if (proto.__missionCompatibilityInstalled) return;

    const originalSetFactionAlignment = proto.setFactionAlignment;
    const originalSubmitStoryChoice = proto.submitStoryChoice;
    const originalSendDarkChatMessage = proto.sendDarkChatMessage;

    proto.setFactionAlignment = function (userOrPlayer: string | Player, faction: any) {
      const userId = typeof userOrPlayer === 'string' ? userOrPlayer : userOrPlayer?.id;
      return originalSetFactionAlignment.call(this, userId, faction);
    };

    proto.submitStoryChoice = function (userOrPlayer: string | Player, chapterId: string, choiceId: string) {
      const userId = typeof userOrPlayer === 'string' ? userOrPlayer : userOrPlayer?.id;
      return originalSubmitStoryChoice.call(this, userId, chapterId, choiceId);
    };

    proto.sendDarkChatMessage = function (userOrPlayer: string | Player, channelId: string, text: string) {
      const userId = typeof userOrPlayer === 'string' ? userOrPlayer : userOrPlayer?.id;
      return originalSendDarkChatMessage.call(this, userId, channelId, text);
    };

    proto.__missionCompatibilityInstalled = true;
  }

  private seedDefaultMissions() {
    this.availableMissions = [
      {
        id: 'mis-1', title: 'O Molho Secreto do Zé', employer: 'Pizzarias Rivais S.A.',
        description: 'A Pizzaria do Zé (192.168.10.15) tem o molho mais viciante da cidade. Conecte-se ao servidor dele perto do forno, quebre a senha root e baixe a receita secreta (receita_secreta_molho_especial.txt).',
        type: 'steal_file', targetIp: '192.168.10.15', targetDomain: 'pizzaria-ze.com', requiredFileName: 'receita_secreta_molho_especial.txt',
        rewardCash: 500, rewardCrypto: 0.008, rewardRep: 60, difficulty: 'Easy', status: 'available',
      },
      {
        id: 'mis-2', title: 'A Fórmula Secreta da Cola-Coca', employer: 'Pepsi-Syndicate',
        description: 'A Cola-Coca (104.18.23.99) guarda a fórmula do refrigerante trancada a sete chaves desde 1886. Invada o servidor deles, quebre a senha protegida pelo Hasher corporativo e faça o download de formula_secreta_colacoca_2026.pdf!',
        type: 'steal_file', targetIp: '104.18.23.99', targetDomain: 'colacoca.corp', requiredFileName: 'formula_secreta_colacoca_2026.pdf',
        rewardCash: 1800, rewardCrypto: 0.025, rewardRep: 150, difficulty: 'Medium', status: 'available',
      },
      {
        id: 'mis-3', title: 'Salvar a Série Cancelada da Netflicks', employer: 'Fãs Revoltados Anonymous',
        description: 'A Netflicks (54.239.28.85) cancelou mais uma série excelente no auge. Infiltre-se no catálogo deles e resgate o roteiro da segunda temporada (roteiro_cancelado_temporada2.docx).',
        type: 'steal_file', targetIp: '54.239.28.85', targetDomain: 'netflicks.tv', requiredFileName: 'roteiro_cancelado_temporada2.docx',
        rewardCash: 2400, rewardCrypto: 0.035, rewardRep: 220, difficulty: 'Medium', status: 'available',
      },
      {
        id: 'mis-4', title: 'Projeto PearPhone 20 Sem Carregador', employer: 'Android Fans Guild',
        description: 'A Pear Inc. (17.253.144.10) está desenhando o novo PearPhone 20 que custará R$ 25.000 e virá sem carregador, sem caixa e sem tela. Baixe a planta (pearphone_20_blueprint.cad).',
        type: 'steal_file', targetIp: '17.253.144.10', targetDomain: 'pear.tech', requiredFileName: 'pearphone_20_blueprint.cad',
        rewardCash: 4500, rewardCrypto: 0.08, rewardRep: 400, difficulty: 'Hard', status: 'available',
      },
      {
        id: 'mis-5', title: 'Apagar Histórico Vergonhoso do Goolag', employer: 'Político Anônimo',
        description: 'Um figurão fez pesquisas constrangedoras às 3h da manhã no Goolag (142.250.190.46). Obtenha acesso root e execute a limpeza de TODOS os registros de logs de acesso do servidor!',
        type: 'wipe_server', targetIp: '142.250.190.46', targetDomain: 'goolag.com',
        rewardCash: 6000, rewardCrypto: 0.12, rewardRep: 500, difficulty: 'Hard', status: 'available',
      },
      {
        id: 'mis-6', title: 'Mineração Espacial no Foguete da Space-Y', employer: 'Crypto Whale Syndicate',
        description: 'O cluster da Space-Y (94.130.82.11) tem superprocessadores de 8.0 GHz. Invada o servidor do foguete e roube os rascunhos de tweets do bilionário (tweets_nao_publicados_do_bilionario.txt).',
        type: 'steal_file', targetIp: '94.130.82.11', targetDomain: 'space-y.mars', requiredFileName: 'tweets_nao_publicados_do_bilionario.txt',
        rewardCash: 9500, rewardCrypto: 0.18, rewardRep: 750, difficulty: 'Hard', status: 'available',
      },
      {
        id: 'mis-7', title: 'Arquivo Confidencial: Alienígenas da Área 51', employer: 'Illuminati Leaks',
        description: 'O FBI (198.51.100.24) esconde provas definitivas sobre aliens na Área 51. Invada o servidor de segurança máxima e baixe o arquivo planos_area_51_aliens.dat. CUIDADO COM OS LOGS!',
        type: 'steal_file', targetIp: '198.51.100.24', targetDomain: 'fbi-gov.sec', requiredFileName: 'planos_area_51_aliens.dat',
        rewardCash: 25000, rewardCrypto: 0.50, rewardRep: 2500, difficulty: 'Elite', status: 'available',
      },
      {
        id: 'mis-8', title: 'O Grande Golpe no MegaBank Global', employer: 'Robin Hood Cyber',
        description: 'Invada o nó blindado do MegaBank (12.189.44.10) quebre as defesas do Hasher e execute o Mega-Assalto à database central para drenar as contas offshore.',
        type: 'hack_bank', targetIp: '12.189.44.10', targetDomain: 'megabank.global',
        rewardCash: 35000, rewardCrypto: 0.75, rewardRep: 3500, difficulty: 'Elite', status: 'available',
      },
    ];
  }

  public getAvailableMissions(): Mission[] {
    return this.availableMissions.filter(m => m.status === 'available');
  }

  public getMissionById(id: string): Mission | undefined {
    return this.availableMissions.find(m => m.id === id);
  }

  /**
   * Missions still offered to a given player: the shared catalog minus the
   * contracts that player already delivered (missions are one-shot per player).
   */
  public getPlayerMissions(player?: Player): Mission[] {
    const completed = new Set(player?.completedMissionIds || []);
    return this.getAvailableMissions().filter(m => !completed.has(m.id));
  }

  public acceptMission(player: Player, id: string): { success: boolean; mission?: Mission; message: string } {
    const mission = this.getMissionById(id);
    if (!mission || mission.status !== 'available') return { success: false, message: 'Missão não encontrada ou indisponível.' };
    player.activeMissions = player.activeMissions || [];
    player.completedMissionIds = player.completedMissionIds || [];
    if (player.completedMissionIds.includes(id)) return { success: false, message: 'Você já concluiu este contrato.' };
    if (player.activeMissions.some(m => m.id === id)) return { success: false, message: 'Você já possui esta missão em andamento.' };
    const activeMission: Mission = { ...mission, status: 'active', acceptedAt: Date.now() };
    player.activeMissions.push(activeMission);
    // Progress only counts for operations finished after the contract was accepted.
    if (player.missionProgress) delete player.missionProgress[id];
    return { success: true, mission: activeMission, message: `Contrato "${mission.title}" aceito com sucesso.` };
  }

  /**
   * Records a successfully completed operation against every active mission of
   * the player whose target and objective match. Called from process completion.
   */
  public recordOperation(player: Player, op: MissionOperation, targetIp: string, fileName?: string): boolean {
    let changed = false;
    if (!player.operationLog || typeof player.operationLog !== 'object') player.operationLog = {};
    player.operationLog[`${op}:${targetIp}`] = Date.now();

    for (const mission of player.activeMissions || []) {
      if (mission.targetIp !== targetIp) continue;
      if (MISSION_OPERATION[mission.type] !== op) continue;
      if (op === 'download' && mission.requiredFileName) {
        if (!fileName || fileName.toLowerCase() !== mission.requiredFileName.toLowerCase()) continue;
      }
      if (!player.missionProgress || typeof player.missionProgress !== 'object') player.missionProgress = {};
      if (!player.missionProgress[mission.id]) {
        player.missionProgress[mission.id] = true;
        changed = true;
      }
    }
    return changed;
  }

  private isMissionComplete(player: Player, mission: Mission): boolean {
    if (player.missionProgress?.[mission.id]) return true;
    // Missions accepted before progress tracking existed (no acceptedAt) fall back
    // to the legacy per-target markers written by the old completion patch.
    if (mission.acceptedAt) return false;
    const legacy = (player.missionProgress || {}) as Record<string, boolean>;
    switch (mission.type) {
      case 'steal_file':
        return !!legacy[`download:${mission.targetIp}:${mission.requiredFileName || ''}`];
      case 'wipe_server': return !!legacy[`wipe_logs:${mission.targetIp}`];
      case 'hack_bank': return !!legacy[`bank_heist:${mission.targetIp}`];
      case 'ddos_target': return !!legacy[`ddos:${mission.targetIp}`];
      case 'plant_virus': return !!legacy[`spyware:${mission.targetIp}`];
      case 'trace_hacker': return player.hackedIps.includes(mission.targetIp);
      default: return false;
    }
  }

  public claimMission(player: Player, id: string): { success: boolean; mission?: Mission; message: string } {
    player.activeMissions = player.activeMissions || [];
    const index = player.activeMissions.findIndex(m => m.id === id);
    if (index === -1) return { success: false, message: 'Esta missão não está ativa para o seu jogador.' };
    const mission = player.activeMissions[index];
    if (!this.isMissionComplete(player, mission)) {
      return { success: false, mission, message: `Objetivo ainda não concluído: ${mission.title}. Execute a operação exigida no alvo ${mission.targetIp} depois de aceitar o contrato.` };
    }
    player.cash += mission.rewardCash;
    if (!player.cryptoWallet) player.cryptoWallet = { btc: 0, eth: 0, doge: 0, shdw: 0, pepe: 0 };
    player.cryptoWallet.btc = Number(((player.cryptoWallet.btc || 0) + mission.rewardCrypto).toFixed(6));
    player.crypto = player.cryptoWallet.btc;
    player.reputation += mission.rewardRep;
    const completedMission: Mission = { ...mission, status: 'completed' };
    player.activeMissions.splice(index, 1);
    player.completedMissionIds = player.completedMissionIds || [];
    if (!player.completedMissionIds.includes(id)) player.completedMissionIds.push(id);
    if (player.missionProgress) delete player.missionProgress[id];
    return { success: true, mission: completedMission, message: `Missão concluída! +$${mission.rewardCash.toLocaleString()} USD, +${mission.rewardCrypto} BTC e +${mission.rewardRep} REP.` };
  }

  public completeMission(id: string): Mission | null {
    const mission = this.availableMissions.find(m => m.id === id);
    if (mission && mission.status === 'active') {
      mission.status = 'completed';
      return mission;
    }
    return null;
  }

  /**
   * Generates a contract against a real server of the world so it can actually
   * be completed. Returns null when no suitable target exists.
   */
  public generateRandomMission(servers: VirtualServer[]): Mission | null {
    const pick = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
    const candidates = servers.filter(s => s && s.ip && s.type !== 'honeypot');
    if (candidates.length === 0) return null;

    const options: Array<{ type: MissionType; server: VirtualServer; fileName?: string }> = [];
    for (const server of candidates) {
      const files = (server.files || []).filter(f => f?.name);
      if (files.length > 0) options.push({ type: 'steal_file', server, fileName: pick(files).name });
      options.push({ type: 'wipe_server', server });
      options.push({ type: 'plant_virus', server });
      if (server.type === 'bank') options.push({ type: 'hack_bank', server });
    }
    const choice = pick(options);
    const { server } = choice;

    const hasher = server.security?.hasherLevel || 1;
    const diff: MissionDifficulty = hasher < 5 ? 'Easy' : hasher < 15 ? 'Medium' : hasher < 30 ? 'Hard' : 'Elite';
    const rewardMultiplier = diff === 'Easy' ? 1 : diff === 'Medium' ? 2.5 : diff === 'Hard' ? 5 : 10;
    const employers = ['Guerrilha da Pizza', 'Anti-Pear Resistance', 'Meme Cartel', 'NullByte Syndicate', 'RedTeam Anonymous'];
    const emp = pick(employers);
    const objective: Record<MissionType, string> = {
      steal_file: `baixe o arquivo ${choice.fileName}`,
      wipe_server: 'apague todos os logs de acesso',
      plant_virus: 'implante um Spyware',
      hack_bank: 'execute o Mega-Assalto à database central',
      ddos_target: 'derrube o servidor com um DDoS',
      trace_hacker: 'obtenha acesso ROOT',
    };

    const mission: Mission = {
      id: `mis-${uuidv4().substring(0, 8)}`,
      title: `Operação Secreta // ${emp}`,
      employer: emp,
      description: `Contrato de espionagem cibernética contra ${server.hostname} (${server.ip}): invada o servidor e ${objective[choice.type]}. Não esqueça de limpar os seus rastros.`,
      type: choice.type,
      targetIp: server.ip,
      targetDomain: server.domain,
      requiredFileName: choice.fileName,
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
