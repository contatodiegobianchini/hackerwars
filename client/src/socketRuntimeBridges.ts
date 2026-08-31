import { useGameStore } from './stores/useGameStore.js';

let attachedSocket: any = null;

function attachRuntimeBridges(socket: any) {
  if (!socket || socket === attachedSocket) return;
  attachedSocket = socket;

  socket.on('police_trace_start', (data: any) => {
    const currentUserId = useGameStore.getState().currentUser?.id;
    if (data?.userId !== currentUserId || !data?.state) return;
    useGameStore.setState({ activeTrace: data.state });
  });

  socket.on('police_trace_tick', (data: any) => {
    const currentUserId = useGameStore.getState().currentUser?.id;
    if (data?.userId !== currentUserId || !data?.state) return;
    useGameStore.setState({ activeTrace: data.state });
  });

  socket.on('police_trace_stopped', (data: any) => {
    const currentUserId = useGameStore.getState().currentUser?.id;
    if (data?.userId !== currentUserId) return;
    useGameStore.setState({ activeTrace: null });
  });

  socket.on('target_disconnected', () => {
    useGameStore.setState({ activeTrace: null, activeConnection: null, currentView: 'my_server' });
  });

  socket.on('proxy_chain_updated', (res: any) => {
    const currentUserId = useGameStore.getState().currentUser?.id;
    const currentPlayer = useGameStore.getState().player;

    if (res?.player && currentUserId && res.player.id === currentUserId) {
      useGameStore.setState({ player: res.player });
    } else if (currentPlayer && Array.isArray(res?.activeProxyChain)) {
      useGameStore.setState({
        player: { ...currentPlayer, activeProxyChain: res.activeProxyChain },
      });
    }

    if (res?.message) {
      useGameStore.getState().addToast(
        'Rota Proxy',
        res.message,
        res.success ? 'success' : 'danger',
      );
    }
  });

  socket.on('file_operation_result', (res: any) => {
    const server = res?.server;
    if (!server) return;
    useGameStore.setState((state: any) => ({
      activeConnection: state.activeConnection?.ip === server.ip ? server : state.activeConnection,
      servers: state.servers.some((s: any) => s.ip === server.ip)
        ? state.servers.map((s: any) => s.ip === server.ip ? server : s)
        : [...state.servers, server],
      allServers: state.allServers.some((s: any) => s.ip === server.ip)
        ? state.allServers.map((s: any) => s.ip === server.ip ? server : s)
        : [...state.allServers, server],
    }));

    if (res?.message) {
      useGameStore.getState().addToast(
        'Operação de Arquivo',
        res.message,
        res.success ? 'success' : 'danger',
      );
    }
  });

  socket.on('log_edit_result', (res: any) => {
    const server = res?.server;
    if (server) {
      useGameStore.setState((state: any) => ({
        activeConnection: state.activeConnection?.ip === server.ip ? server : state.activeConnection,
        servers: state.servers.map((s: any) => s.ip === server.ip ? server : s),
        allServers: state.allServers.map((s: any) => s.ip === server.ip ? server : s),
      }));
    }

    if (res?.message) {
      useGameStore.getState().addToast(
        'Editor de Logs',
        res.message,
        res.success ? 'success' : 'danger',
      );
    }
  });
}

// The store creates the socket after authentication. Poll only until the first
// socket exists, then keep the listeners attached to that socket instance.
const bridgeTimer = window.setInterval(() => {
  const socket = useGameStore.getState().socket;
  if (socket) attachRuntimeBridges(socket);
}, 250);

window.addEventListener('beforeunload', () => window.clearInterval(bridgeTimer));
