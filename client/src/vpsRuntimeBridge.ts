import { useGameStore } from './stores/useGameStore.js';

type VpsPayload = {
  success?: boolean;
  message?: string;
  player?: any;
  totalCollected?: number;
  userId?: string;
  offlineCatchUp?: boolean;
};

let attachedSocket: any = null;

const attachVpsListener = () => {
  const socket: any = useGameStore.getState().socket;
  if (!socket || socket === attachedSocket) return;
  attachedSocket = socket;

  socket.on('vps_action_result', (payload: VpsPayload) => {
    if (payload.player) useGameStore.setState({ player: payload.player });
    useGameStore.getState().addToast(
      payload.success ? 'Datacenter Cloud' : 'Falha no Datacenter',
      payload.message || 'Operação concluída.',
      payload.success ? 'success' : 'danger',
    );
  });

  socket.on('vps_payout_collected', (payload: VpsPayload) => {
    const state = useGameStore.getState();
    if (payload.userId && payload.userId !== state.currentUser?.id) return;

    if (payload.player) {
      useGameStore.setState({ player: payload.player });
    }

    if (payload.totalCollected && payload.totalCollected > 0) {
      useGameStore.getState().addToast(
        'Rendimento VPS',
        payload.message || `+$${payload.totalCollected.toLocaleString()} USD creditados automaticamente.`,
        'success',
      );
    }
  });
};

window.setInterval(attachVpsListener, 500);
attachVpsListener();
