import { useGameStore } from './stores/useGameStore.js';

type VpsPayoutPayload = {
  userId?: string;
  totalCollected?: number;
  player?: any;
  offlineCatchUp?: boolean;
  message?: string;
};

let attachedSocket: any = null;

const attachVpsListener = () => {
  const socket: any = useGameStore.getState().socket;
  if (!socket || socket === attachedSocket) return;
  attachedSocket = socket;

  socket.on('vps_payout_collected', (payload: VpsPayoutPayload) => {
    const state = useGameStore.getState();
    if (payload.userId && payload.userId !== state.currentUser?.id) return;

    if (payload.player) {
      useGameStore.setState({ player: payload.player });
    }

    if (payload.totalCollected && payload.totalCollected > 0) {
      useGameStore.getState().addToast(
        'Datacenter Cloud',
        payload.message || `+$${payload.totalCollected.toLocaleString()} USD em rendimento VPS.`,
        'success',
      );
    }
  });
};

const timer = window.setInterval(attachVpsListener, 500);
void timer;
attachVpsListener();
