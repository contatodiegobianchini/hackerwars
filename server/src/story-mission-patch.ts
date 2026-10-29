import { GameWorld } from './engine/GameWorld.js';
import { MissionEngine } from './engine/MissionEngine.js';
import { ProcessEngine } from './engine/ProcessEngine.js';
import { StoryEngine } from './engine/StoryEngine.js';

const worldProto = GameWorld.prototype as any;
const missionProto = MissionEngine.prototype as any;
const processProto = ProcessEngine.prototype as any;
const storyProto = StoryEngine.prototype as any;

function progressFor(player: any): Record<string, boolean> {
  if (!player.missionProgress || typeof player.missionProgress !== 'object') player.missionProgress = {};
  return player.missionProgress;
}

function markProgress(player: any, key: string) {
  progressFor(player)[key] = true;
}

function markForAllMatchingMissions(player: any, type: string, targetIp: string, fileName?: string) {
  const active = player.activeMissions || [];
  for (const mission of active) {
    if (mission.targetIp !== targetIp) continue;
    if (type === 'download' && mission.type === 'steal_file') {
      if (!mission.requiredFileName || !fileName || mission.requiredFileName.toLowerCase() === fileName.toLowerCase()) {
        markProgress(player, `download:${targetIp}:${mission.requiredFileName || fileName || ''}`);
      }
    } else if (type === 'wipe_logs' && mission.type === 'wipe_server') {
      markProgress(player, `wipe_logs:${targetIp}`);
    } else if (type === 'bank_heist' && mission.type === 'hack_bank') {
      markProgress(player, `bank_heist:${targetIp}`);
    } else if (type === 'ddos' && mission.type === 'ddos_target') {
      markProgress(player, `ddos:${targetIp}`);
    } else if (type === 'spyware' && mission.type === 'plant_virus') {
      markProgress(player, `spyware:${targetIp}`);
    } else if (type === 'crack' && mission.targetIp === targetIp) {
      markProgress(player, `crack:${targetIp}`);
    }
  }
}

// Mission completion should reflect the actual operation that was completed, not
// only whether a server happened to be breached or a file exists somewhere.
const originalClaimMission = missionProto.claimMission;
missionProto.claimMission = function hardenedClaimMission(player: any, id: string) {
  player.activeMissions = player.activeMissions || [];
  const index = player.activeMissions.findIndex((m: any) => m.id === id);
  if (index === -1) return { success: false, message: 'Esta missão não está ativa para o seu jogador.' };

  const mission = player.activeMissions[index];
  const progress = progressFor(player);
  const crackDone = !!progress[`crack:${mission.targetIp}`] || player.hackedIps?.includes(mission.targetIp);
  const downloadDone = !!progress[`download:${mission.targetIp}:${mission.requiredFileName || ''}`] || (!!mission.requiredFileName && player.software?.some((s: any) => s.name?.toLowerCase() === mission.requiredFileName.toLowerCase()));
  const wipeDone = !!progress[`wipe_logs:${mission.targetIp}`];
  const heistDone = !!progress[`bank_heist:${mission.targetIp}`];
  const ddosDone = !!progress[`ddos:${mission.targetIp}`];
  const spywareDone = !!progress[`spyware:${mission.targetIp}`];

  let complete = false;
  switch (mission.type) {
    case 'steal_file': complete = downloadDone; break;
    case 'wipe_server': complete = wipeDone; break;
    case 'hack_bank': complete = heistDone; break;
    case 'ddos_target': complete = ddosDone; break;
    case 'plant_virus': complete = spywareDone; break;
    case 'trace_hacker': complete = crackDone; break;
    default: complete = crackDone;
  }

  if (!complete) {
    return { success: false, mission, message: `Objetivo ainda não concluído: ${mission.title}. Execute a operação exigida no alvo ${mission.targetIp} antes de coletar a recompensa.` };
  }

  player.cash += mission.rewardCash;
  if (!player.cryptoWallet) player.cryptoWallet = { btc: 0, eth: 0, doge: 0, shdw: 0, pepe: 0 };
  player.cryptoWallet.btc = Number(((player.cryptoWallet.btc || 0) + mission.rewardCrypto).toFixed(6));
  player.crypto = player.cryptoWallet.btc;
  player.reputation += mission.rewardRep;

  const completedMission = { ...mission, status: 'completed' };
  player.activeMissions.splice(index, 1);
  return {
    success: true,
    mission: completedMission,
    message: `Missão concluída! +$${mission.rewardCash.toLocaleString()} USD, +${mission.rewardCrypto} BTC e +${mission.rewardRep} REP.`,
  };
};

// Process completion is the authoritative point where the game knows the action
// really finished. Record mission progress here, including process types whose
// GameWorld methods historically received a shortened argument list.
const originalHandleProcessCompletion = processProto.handleProcessCompletion;
processProto.handleProcessCompletion = function patchedProcessCompletion(proc: any) {
  originalHandleProcessCompletion.call(this, proc);
  const player = this.gameWorld.getPlayer(proc.playerId);
  const server = proc.targetIp ? this.gameWorld.getServer(proc.targetIp) : undefined;
  if (!server) {
    if (proc.type === 'compile') return;
    return;
  }

  switch (proc.type) {
    case 'crack':
      if (server.security?.isBreached) markForAllMatchingMissions(player, 'crack', proc.targetIp);
      break;
    case 'download': {
      const file = proc.targetFileId ? server.files?.find((f: any) => f.id === proc.targetFileId) : undefined;
      if (file) markForAllMatchingMissions(player, 'download', proc.targetIp, file.name);
      break;
    }
    case 'wipelog':
      if (!server.logs?.some((l: any) => l.ip === player.ip)) markForAllMatchingMissions(player, 'wipe_logs', proc.targetIp);
      break;
    case 'ddos':
      if (server.isOnline === false) markForAllMatchingMissions(player, 'ddos', proc.targetIp);
      break;
    case 'plant_spyware':
      if (server.activeSpyware?.some((s: any) => s.ownerId === player.id)) markForAllMatchingMissions(player, 'spyware', proc.targetIp);
      break;
    case 'mass_bank_heist':
      markForAllMatchingMissions(player, 'bank_heist', proc.targetIp);
      break;
  }

  this.gameWorld.savePlayerState(proc.playerId);
};

// The story choices are expanded with additional perks. The perk is attached at
// completion time so existing chapter definitions remain backwards compatible.
const STORY_PERKS: Record<string, any> = {
  'c3-choice-a': { id: 'perk-silent-exfil', name: 'Exfiltração Silenciosa', description: 'Downloads concluídos 15% mais rápido.', faction: 'anonymous', icon: '🕶️' },
  'c3-choice-b': { id: 'perk-gray-broker', name: 'Corretor do Mercado Cinza', description: 'Operações no mercado negro concedem +10% de reputação.', faction: 'lone_wolf', icon: '🃏' },
  'c4-choice-a': { id: 'perk-industrial-ghost', name: 'Fantasma Industrial', description: 'Processos de upload são 15% mais rápidos.', faction: 'cartel', icon: '🏭' },
  'c4-choice-b': { id: 'perk-offshore-shield', name: 'Blindagem Offshore', description: 'Aumenta a eficiência dos desvios bancários em 8%.', faction: 'cartel', icon: '💳' },
  'c5-choice-a': { id: 'perk-zero-day-instinct', name: 'Instinto Zero-Day', description: 'Processos de quebra de senha são 15% mais rápidos.', faction: 'russian_bears', icon: '⚡' },
  'c5-choice-b': { id: 'perk-intel-broker', name: 'Corretor de Inteligência', description: 'Recompensas de REP de contratos recebem um pequeno bônus.', faction: 'russian_bears', icon: '📡' },
  'c6-choice-a': { id: 'perk-clean-hands', name: 'Mãos Limpas', description: 'Operações contra servidores bancários geram 10% mais reputação.', faction: 'anonymous', icon: '🧤' },
  'c6-choice-b': { id: 'perk-financial-ghost', name: 'Fantasma Financeiro', description: 'Transferências bancárias têm 10% menos risco narrativo.', faction: 'cartel', icon: '💸' },
  'c7-choice-a': { id: 'perk-orbital-sync', name: 'Sincronia Orbital', description: 'Ataques DDoS são executados 15% mais rápido.', faction: 'russian_bears', icon: '🛰️' },
  'c7-choice-b': { id: 'perk-warroom', name: 'War Room', description: 'Ganha +1 slot de processo simultâneo.', faction: 'russian_bears', icon: '🎖️' },
  'c8-choice-a': { id: 'perk-botnet-harvester', name: 'Colhedor de Botnet', description: 'Processos de DDoS recebem 10% de eficiência adicional.', faction: 'lone_wolf', icon: '🕸️' },
  'c8-choice-b': { id: 'perk-deep-cover', name: 'Deep Cover', description: 'Seu rastreamento policial começa com um pequeno atraso extra.', faction: 'anonymous', icon: '🫥' },
  'c9-choice-a': { id: 'perk-classified-access', name: 'Acesso Classificado', description: 'Quebras de senha e downloads são 10% mais rápidos.', faction: 'anonymous', icon: '🗂️' },
  'c9-choice-b': { id: 'perk-quantum-wallet', name: 'Carteira Quântica', description: 'Operações financeiras concedem um pequeno bônus de reputação.', faction: 'cartel', icon: '💎' },
};

const originalCompleteChapterChoice = storyProto.completeChapterChoice;
storyProto.completeChapterChoice = function patchedCompleteChapterChoice(player: any, servers: Map<string, any>, chapterId: string, choiceId: string) {
  const result = originalCompleteChapterChoice.call(this, player, servers, chapterId, choiceId);
  if (result?.success && result.choice && STORY_PERKS[choiceId] && !result.choice.rewardPerk) {
    result.choice = { ...result.choice, rewardPerk: STORY_PERKS[choiceId] };
  }
  return result;
};

// The story UI should always show the actual target defense level.
const originalGetChapters = storyProto.getChapters;
storyProto.getChapters = function patchedGetChapters(player: any, servers?: Map<string, any>) {
  const chapters = originalGetChapters.call(this, player, servers);
  const goolag = servers?.get('142.250.190.46');
  const hasher = goolag?.security?.hasherLevel;
  if (hasher !== undefined) {
    const chapter = chapters.find((c: any) => c.id === 'chap-5');
    const objective = chapter?.objectives?.find((o: any) => o.id === 'c5-obj-1');
    if (objective) objective.text = `Quebrar Hasher v${Number(hasher).toFixed(1)} de 142.250.190.46`;
    if (chapter) chapter.briefing = `O cluster do Goolag (142.250.190.46) monitora o histórico de todos os cidadãos da Terra. O servidor está protegido por um Hasher corporativo v${Number(hasher).toFixed(1)}. Invada o servidor e instale um cluster minerador.`;
  }
  return chapters;
};

// Apply a few high-value perk effects without making the new perks decorative.
const originalCalculateDuration = processProto.calculateDuration;
processProto.calculateDuration = function patchedCalculateDuration(playerId: string, type: any, params: any) {
  let duration = originalCalculateDuration.call(this, playerId, type, params);
  const player = this.gameWorld.getPlayer(playerId);
  const ids = new Set((player.unlockedStoryPerks || []).map((p: any) => p.id));
  if (type === 'download' && (ids.has('perk-silent-exfil') || ids.has('perk-classified-access'))) duration *= ids.has('perk-classified-access') ? 0.90 : 0.85;
  if (type === 'upload' && ids.has('perk-industrial-ghost')) duration *= 0.85;
  if (type === 'crack' && (ids.has('perk-zero-day-instinct') || ids.has('perk-classified-access'))) duration *= ids.has('perk-classified-access') ? 0.90 : 0.85;
  if (type === 'ddos' && (ids.has('perk-orbital-sync') || ids.has('perk-botnet-harvester'))) duration *= ids.has('perk-botnet-harvester') ? 0.90 : 0.85;
  return Math.max(1500, Math.round(duration));
};

// Add one extra process slot for the War Room perk.
const originalStartProcess = processProto.startProcess;
processProto.startProcess = function patchedStartProcess(playerId: string, type: any, params: any) {
  const player = this.gameWorld.getPlayer(playerId);
  const ids = new Set((player.unlockedStoryPerks || []).map((p: any) => p.id));
  const hadWarRoom = ids.has('perk-warroom');
  const originalRam = player.hardware?.ram?.maxTasks;
  if (hadWarRoom && player.hardware?.ram) player.hardware.ram.maxTasks = originalRam + 1;
  try {
    return originalStartProcess.call(this, playerId, type, params);
  } finally {
    if (hadWarRoom && player.hardware?.ram) player.hardware.ram.maxTasks = originalRam;
  }
};

console.log('[story-mission] mission progress + story perks + dynamic hasher patch loaded');
