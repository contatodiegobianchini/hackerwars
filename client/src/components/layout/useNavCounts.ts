import { useGameStore } from '../../stores/useGameStore.js';
import type { GameView } from '../../stores/useGameStore.js';
import type { ZoneId } from '../../navigation.js';

/** Counts shown as badges: only things that change and ask for the player's attention. */
export function useNavCounts() {
  const { player, processes, darkChatChannels, chatSeenCount, isChatOpen, storyChapters } = useGameStore();

  const totalMessages = darkChatChannels.reduce((n, c) => n + (c.messages?.length || 0), 0);
  const unreadChat = isChatOpen ? 0 : Math.max(0, totalMessages - chatSeenCount);

  const readyContracts = (player?.activeMissions || []).filter(m => player?.missionProgress?.[m.id]).length;
  const readyChapters = storyChapters.filter(c => c.unlocked && !c.isCompleted && c.objectives.length > 0 && c.objectives.every(o => o.completed)).length;
  const infections = player?.infections?.length || 0;

  const tab: Partial<Record<GameView, { count: number; action?: boolean }>> = {
    processes: { count: processes.length },
    missions: { count: readyContracts, action: true },
    campaign: { count: readyChapters, action: true },
    antivirus: { count: infections, action: true },
  };

  const zone: Partial<Record<ZoneId, { count: number; alert?: boolean }>> = {
    inicio: { count: processes.length },
    operacoes: { count: readyContracts + readyChapters },
    base: { count: infections, alert: true },
  };

  return { unreadChat, tab, zone };
}
