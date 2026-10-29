import { GameWorld } from './engine/GameWorld.js';

const gameWorldPrototype = GameWorld.prototype as any;
const originalToggleProxyHop = gameWorldPrototype.toggleProxyHop;

/**
 * Only allow proxy nodes that the current player has actually compromised.
 * This keeps the mechanic meaningful and prevents arbitrary IPs from being
 * inserted into activeProxyChain.
 */
gameWorldPrototype.toggleProxyHop = function validatedToggleProxyHop(userId: string, hopIp: string) {
  const player = this.getOrCreatePlayer(userId);
  const cleanIp = typeof hopIp === 'string' ? hopIp.trim() : '';

  if (!cleanIp) {
    return { success: false, activeProxyChain: player.activeProxyChain || [], message: 'Nó de proxy inválido.' };
  }

  if (cleanIp === player.ip) {
    return { success: false, activeProxyChain: player.activeProxyChain || [], message: 'Seu próprio servidor não pode ser usado como proxy.' };
  }

  // Removing an existing node remains allowed even if its state later changed.
  const existingIndex = (player.activeProxyChain || []).indexOf(cleanIp);
  if (existingIndex !== -1) {
    return originalToggleProxyHop.call(this, userId, cleanIp);
  }

  const server = this.getServer(cleanIp);
  if (!server) {
    return { success: false, activeProxyChain: player.activeProxyChain || [], message: 'Servidor de proxy não encontrado.' };
  }

  if (!server.isOnline) {
    return { success: false, activeProxyChain: player.activeProxyChain || [], message: 'Este servidor está offline e não pode atuar como proxy.' };
  }

  if (!server.security?.isBreached) {
    return { success: false, activeProxyChain: player.activeProxyChain || [], message: 'Você precisa obter acesso ROOT ao servidor antes de usá-lo como proxy.' };
  }

  if (!Array.isArray(player.hackedIps) || !player.hackedIps.includes(server.ip)) {
    return { success: false, activeProxyChain: player.activeProxyChain || [], message: 'Este servidor ainda não faz parte dos seus alvos comprometidos.' };
  }

  return originalToggleProxyHop.call(this, userId, cleanIp);
};

console.log('[proxy] validated proxy node patch loaded');
