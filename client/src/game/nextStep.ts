import type { Mission, Player, StoryChapter, VirtualServer } from '../types/game.js';
import type { GameView } from '../stores/useGameStore.js';
import { HUNT_KIND_TEXT } from './traceHeat.js';

/** What a button on the home screen does. */
export type StepAction =
  | { kind: 'connect'; ip: string }
  | { kind: 'view'; view: GameView }
  | { kind: 'claim'; missionId: string };

export interface StepButton { label: string; action: StepAction; }

export interface NextStep {
  /** Where this step comes from, e.g. "Capítulo 2 · Darknet Nexus". */
  context: string;
  /** The action, written as an instruction. */
  title: string;
  detail?: string;
  /** Why the player cannot do it yet, when something is missing. */
  blocker?: string;
  primary: StepButton;
  secondary?: StepButton;
  /** Live countdown shown with the step (ms timestamp). */
  deadline?: number;
}

export interface Suggestion { mission: Mission; server?: VirtualServer; }

type Need = 'crack' | 'download' | 'spyware' | 'wipe' | 'ddos' | 'heist';

const MISSION_NEED: Record<Mission['type'], Need> = {
  steal_file: 'download',
  wipe_server: 'wipe',
  hack_bank: 'heist',
  plant_virus: 'spyware',
  ddos_target: 'ddos',
  trace_hacker: 'crack',
};

const OBJECTIVE_NEED: Record<string, Need> = {
  crack: 'crack', scan: 'crack', download: 'download', spyware: 'spyware',
  wipe_logs: 'wipe', ddos: 'ddos', bank_heist: 'heist',
};

const fmtVersion = (v: number) => `v${v.toFixed(1).replace('.', ',')}`;
const money = (v: number) => `US$ ${v.toLocaleString('pt-BR')}`;

export const crackerVersion = (player: Player) => player.software.find(s => s.type === 'cracker')?.version ?? 1;

export const shortChapterTitle = (chapter: StoryChapter) => chapter.title.replace(/^Cap[íi]tulo\s+\d+\s*:\s*/i, '');

/** Builds the concrete step for one objective on one target. */
function planTarget(player: Player, servers: VirtualServer[], ip: string, need: Need, context: string, fileName?: string): NextStep {
  const server = servers.find(s => s.ip === ip);
  const name = server?.hostname || ip;
  const breached = player.hackedIps.includes(ip);
  const connect: StepButton = { label: 'Conectar ao alvo', action: { kind: 'connect', ip } };

  if (need !== 'ddos' && !breached) {
    const hasher = server?.security.hasherLevel ?? 0;
    const cracker = crackerVersion(player);
    if (server && cracker < hasher) {
      return {
        context,
        title: `Quebre a senha de ${name}`,
        detail: `O alvo é protegido por um Hasher ${fmtVersion(hasher)}.`,
        blocker: `Seu cracker é ${fmtVersion(cracker)}. Evolua até ${fmtVersion(hasher)} para conseguir invadir.`,
        primary: { label: 'Evoluir cracker', action: { kind: 'view', view: 'software' } },
        secondary: { label: 'Ver o alvo', action: { kind: 'connect', ip } },
      };
    }
    return {
      context,
      title: `Quebre a senha de ${name}`,
      detail: server ? `Hasher ${fmtVersion(hasher)} contra o seu cracker ${fmtVersion(cracker)}: dá para invadir.` : undefined,
      primary: connect,
    };
  }

  switch (need) {
    case 'download': {
      const file = server?.files?.find(f => f.name.toLowerCase() === fileName?.toLowerCase());
      const free = player.hardware.hdd.capacityMb - player.software.reduce((n, s) => n + s.sizeMb, 0);
      if (file && file.sizeMb > free) {
        return {
          context,
          title: `Baixe ${fileName} de ${name}`,
          blocker: `O arquivo tem ${file.sizeMb} MB e seu disco só tem ${Math.max(0, free)} MB livres.`,
          primary: { label: 'Comprar mais disco', action: { kind: 'view', view: 'hardware' } },
          secondary: { label: 'Apagar software', action: { kind: 'view', view: 'software' } },
        };
      }
      return { context, title: `Baixe ${fileName || 'o arquivo'} de ${name}`, detail: file ? `${file.sizeMb} MB.` : undefined, primary: connect };
    }
    case 'spyware':
      if (!player.software.some(s => s.type === 'spyware')) {
        return {
          context,
          title: `Implante um spyware em ${name}`,
          blocker: 'Você não tem nenhum spyware instalado.',
          primary: { label: 'Procurar no Black Market', action: { kind: 'view', view: 'black_market' } },
        };
      }
      return { context, title: `Implante um spyware em ${name}`, primary: connect };
    case 'wipe':
      return { context, title: `Apague seus rastros nos logs de ${name}`, primary: connect };
    case 'ddos':
      return { context, title: `Derrube ${name} com um ataque DDoS`, detail: 'Não precisa invadir antes.', primary: connect };
    case 'heist':
      return { context, title: `Execute o mega-assalto em ${name}`, detail: 'A polícia federal reage na hora: tenha dinheiro para o suborno ou VPN boa.', primary: connect };
    default:
      return { context, title: `Invada ${name}`, primary: connect };
  }
}

export interface NextStepInput {
  player: Player;
  storyChapters: StoryChapter[];
  missions: Mission[];
  servers: VirtualServer[];
}

/** Picks the single most useful thing the player can do now. */
export function computeNextStep({ player, storyChapters, missions, servers }: NextStepInput): NextStep {
  const active = player.activeMissions || [];

  // 0. Tracks left behind with a deadline running: the most urgent thing.
  const hunt = [...(player.pendingHunts || [])].sort((a, b) => a.dueAt - b.dueAt)[0];
  if (hunt) {
    return {
      context: 'Rastros deixados',
      title: `Apague seus logs em ${hunt.hostname}`,
      detail: `Seu IP ficou registrado. Quando o prazo acabar, ${HUNT_KIND_TEXT[hunt.kind]}.`,
      deadline: hunt.dueAt,
      primary: { label: 'Voltar e apagar', action: { kind: 'connect', ip: hunt.ip } },
    };
  }

  // 1. Rewards waiting: a chapter decision or a finished contract.
  const readyChapter = storyChapters.find(c => c.unlocked && !c.isCompleted && c.objectives.length > 0 && c.objectives.every(o => o.completed));
  if (readyChapter) {
    return {
      context: `Capítulo ${readyChapter.chapterNumber} · ${readyChapter.factionName}`,
      title: `Escolha o desfecho de "${shortChapterTitle(readyChapter)}"`,
      detail: 'Todos os objetivos foram cumpridos. A escolha define sua reputação com as facções.',
      primary: { label: 'Decidir agora', action: { kind: 'view', view: 'campaign' } },
    };
  }
  const readyMission = active.find(m => player.missionProgress?.[m.id]);
  if (readyMission) {
    return {
      context: `Contrato · ${readyMission.employer}`,
      title: `Entregue "${readyMission.title}"`,
      detail: `Recompensa: ${money(readyMission.rewardCash)}, ${readyMission.rewardCrypto} BTC e ${readyMission.rewardRep} de reputação.`,
      primary: { label: 'Receber recompensa', action: { kind: 'claim', missionId: readyMission.id } },
    };
  }

  // 2. The campaign chapter in progress.
  const chapter = storyChapters.find(c => c.unlocked && !c.isCompleted);
  const chapterStep = (() => {
    if (!chapter) return null;
    const objective = chapter.objectives.find(o => !o.completed);
    if (!objective) return null;
    const step = planTarget(player, servers, objective.targetIp, OBJECTIVE_NEED[objective.type] || 'crack',
      `Capítulo ${chapter.chapterNumber} · ${shortChapterTitle(chapter)}`, objective.targetFileName);
    return step;
  })();
  if (chapterStep && !chapterStep.blocker) return chapterStep;

  // 3. A contract already accepted.
  for (const mission of active) {
    const step = planTarget(player, servers, mission.targetIp, MISSION_NEED[mission.type], `Contrato · ${mission.employer}`, mission.requiredFileName);
    if (!step.blocker) return step;
  }

  // 4. The chapter step, even if blocked: it tells the player what to work towards.
  if (chapterStep) return chapterStep;

  // 5. A new contract the player can do with the current tools.
  const suggestion = suggestContracts({ player, storyChapters, missions, servers }, 1)[0];
  if (suggestion) {
    return {
      context: `Contrato · ${suggestion.mission.employer}`,
      title: `Aceite "${suggestion.mission.title}"`,
      detail: `Paga ${money(suggestion.mission.rewardCash)} e seu equipamento atual dá conta.`,
      primary: { label: 'Ver contratos', action: { kind: 'view', view: 'missions' } },
    };
  }

  return {
    context: 'Rede',
    title: 'Varra a rede atrás de novos alvos',
    detail: 'Alvos com Hasher abaixo do seu cracker podem ser invadidos agora.',
    primary: { label: 'Ver alvos', action: { kind: 'view', view: 'known_servers' } },
  };
}

/** Contracts not accepted yet that the player can complete with the current cracker. */
export function suggestContracts({ player, missions, servers }: NextStepInput, limit = 3): Suggestion[] {
  const taken = new Set([...(player.activeMissions || []).map(m => m.id), ...(player.completedMissionIds || [])]);
  const cracker = crackerVersion(player);
  return missions
    .filter(m => !taken.has(m.id))
    .map(mission => ({ mission, server: servers.find(s => s.ip === mission.targetIp) }))
    .filter(({ mission, server }) => mission.type === 'ddos_target' || player.hackedIps.includes(mission.targetIp) || (server ? server.security.hasherLevel <= cracker : false))
    .sort((a, b) => b.mission.rewardCash - a.mission.rewardCash)
    .slice(0, limit);
}
