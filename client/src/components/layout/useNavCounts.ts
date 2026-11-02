import { useMemo } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { buildOperations } from '../../game/operations.js';
import type { GameView } from '../../stores/useGameStore.js';
import type { ZoneId } from '../../navigation.js';

/** Counts shown as badges: only things that change and ask for the player's attention. */
export function useNavCounts() {
  const { player, processes, darkChatChannels, chatSeenCount, isChatOpen, storyChapters, missions, contracts, allServers } = useGameStore();

  const totalMessages = darkChatChannels.reduce((n, c) => n + (c.messages?.length || 0), 0);
  const unreadChat = isChatOpen ? 0 : Math.max(0, totalMessages - chatSeenCount);

  const ready = useMemo(() => (player
    ? buildOperations({ player, storyChapters, missions, contracts, servers: allServers }).filter(op => op.state === 'ready')
    : []), [player, storyChapters, missions, contracts, allServers]);
  const readyChapters = ready.filter(op => op.kind === 'story').length;
  const readyContracts = ready.length - readyChapters;
  const infections = player?.infections?.length || 0;

  const tab: Partial<Record<GameView, { count: number; action?: boolean }>> = {
    processes: { count: processes.length },
    missions: { count: ready.length, action: true },
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
