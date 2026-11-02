import { ProcessEngine } from './engine/ProcessEngine.js';
import { StoryEngine } from './engine/StoryEngine.js';

const processProto = ProcessEngine.prototype as any;
const storyProto = StoryEngine.prototype as any;

// Mission progress tracking and claim validation now live in MissionEngine
// (recordOperation/claimMission) and ProcessEngine.handleProcessCompletion, so
// they also run in `npm run dev`, which does not load these --import patches.

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

// Live hasher levels in chapter texts are now handled by StoryEngine.getChapters.

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

console.log('[story-mission] story perks patch loaded');
