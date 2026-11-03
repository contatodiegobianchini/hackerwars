import type { Player, SoftwareItem, VirtualServer } from '../types/game.js';

/**
 * Hidden servers reachable only through clues inside downloaded files (idea from
 * Hacknet: exploring pays). Each hidden server has a one-time "loot" file, often
 * a better cracker, and a clue to the next one. They never show up in scans,
 * target lists or the contract board.
 */

type HiddenSpec = {
  ip: string; hostname: string; type: VirtualServer['type']; description: string;
  hasher: number; firewall: number; cpu: number; files: SoftwareItem[];
};

const file = (id: string, name: string, sizeMb: number, extra: Partial<SoftwareItem>): SoftwareItem => ({
  id, name, type: 'warez', version: 1, sizeMb, isInstalled: false, ...extra,
});
const cracker = (id: string, version: number): SoftwareItem => ({
  id, name: `CrackMaster_v${version.toFixed(1)}.crc`, type: 'cracker', version, sizeMb: 12 + Math.round(version), isInstalled: false,
});

const HIDDEN: HiddenSpec[] = [
  {
    ip: '10.66.6.1', hostname: 'roteador-do-ze.local', type: 'personal', hasher: 0.5, firewall: 0.5, cpu: 0.4,
    description: 'Roteador coberto de farinha atrás do forno da pizzaria. Ninguém trocou a senha de fábrica.',
    files: [
      file('sec-ze-gorjeta', 'cofre_de_gorjetas.dat', 2, { loot: { cash: 2000, rep: 100 }, content: 'Planilha das gorjetas que o Zé esconde da Receita. Agora são suas.' }),
      file('sec-ze-juninho', 'historico_do_juninho.txt', 1, { clueIp: '45.33.12.88', content: 'Histórico de navegação: o Juninho acessou 45.33.12.88 quarenta e sete vezes ontem. Servidor de Minecraft? Às 3 da manhã?' }),
    ],
  },
  {
    ip: '45.33.12.88', hostname: 'mine-do-juninho.net', type: 'personal', hasher: 2, firewall: 1.5, cpu: 1.2,
    description: 'Servidor de Minecraft que o Juninho hospeda usando a luz da pizzaria.',
    files: [
      file('sec-jn-diamantes', 'diamantes_lavados.mca', 3, { loot: { cash: 5000, btc: 0.02, rep: 200 }, content: 'Mapa com 64 pilhas de diamante. O Juninho vendia por PIX.' }),
      cracker('sec-jn-crc', 4),
      file('sec-jn-tio', 'conversa_com_o_tio.txt', 1, { clueIp: '104.18.23.250', content: 'Tio Beto (TI da Cola-Coca): "pode hospedar os mods no FTP velho da firma, 104.18.23.250. Ninguém lembra que esse servidor existe."' }),
    ],
  },
  {
    ip: '104.18.23.250', hostname: 'ftp-esquecido.colacoca.corp', type: 'corporate', hasher: 6, firewall: 4, cpu: 2.4,
    description: 'Servidor FTP de 2009 que a Cola-Coca esqueceu ligado no porão.',
    files: [
      file('sec-cc-beta', 'formula_versao_beta_2009.pdf', 6, { loot: { cash: 15000, btc: 0.05, rep: 600 }, content: 'A fórmula da Cola-Coca Zero Açúcar Zero Gás Zero Gosto. Nunca lançada, por motivos óbvios.' }),
      cracker('sec-cc-crc', 10),
      file('sec-cc-email', 'email_do_estagiario.eml', 1, { clueIp: '203.0.113.77', content: 'Assunto: sala secreta do Goolag. "O CEO guarda as buscas dele em 203.0.113.77. Apaga esse e-mail depois de ler." Ele não apagou.' }),
    ],
  },
  {
    ip: '203.0.113.77', hostname: 'sala-secreta.goolag.com', type: 'corporate', hasher: 14, firewall: 10, cpu: 4,
    description: 'Servidor pessoal do CEO do Goolag, fora de todos os inventários da empresa.',
    files: [
      file('sec-gl-buscas', 'buscas_do_ceo_3h_da_manha.csv', 8, { loot: { cash: 40000, btc: 0.15, rep: 1500 }, content: '"como parecer humano em reunião", "robô pode ter férias", "goolag é confiável?"' }),
      cracker('sec-gl-crc', 20),
      file('sec-gl-convite', 'convite_area52.txt', 1, { clueIp: '198.51.100.52', content: 'Confraternização anual da Área 52. Endereço: 198.51.100.52. Não comente com ninguém da Área 51.' }),
    ],
  },
  {
    ip: '198.51.100.52', hostname: 'area-52.fbi-gov.sec', type: 'government', hasher: 26, firewall: 20, cpu: 8,
    description: 'Não existe. Nunca existiu. Pare de procurar.',
    files: [
      file('sec-a52-verdade', 'a_area_52_existe.dat', 20, { loot: { cash: 120000, btc: 0.5, rep: 5000 }, content: 'Parabéns: você achou a Área 52. A Área 51 era só distração. Assinado: o estagiário.' }),
    ],
  },
];

/** Clues planted on regular servers that start the trail. */
export const CLUE_FILES: Array<{ hostIp: string; file: SoftwareItem }> = [
  { hostIp: '192.168.10.15', file: file('sec-ze-postit', 'post-it_do_roteador.txt', 1, { clueIp: '10.66.6.1', content: 'Zé, NÃO JOGA FORA!!! O roteador novo da pizzaria tá no 10.66.6.1. Senha: pizza123. Ass: Juninho' }) },
  { hostIp: '138.68.22.45', file: file('sec-mit-lista', 'servidores_de_jogo_dos_alunos.txt', 1, { clueIp: '45.33.12.88', content: 'Servidores de jogo da galera do laboratório: ... mine-do-juninho.net (45.33.12.88), o do moleque da pizzaria, senha fraquíssima.' }) },
];

export const HIDDEN_IPS = new Set(HIDDEN.map(h => h.ip));

export function buildHiddenServer(spec: HiddenSpec): VirtualServer {
  return {
    id: `srv-secret-${spec.ip.replace(/\./g, '-')}`,
    ip: spec.ip,
    hostname: spec.hostname,
    domain: spec.hostname,
    type: spec.type,
    isOnline: true,
    hidden: true,
    hardware: { cpuPower: spec.cpu, ramGb: 2, hddMb: 2000, networkMbps: 50 },
    security: { hasherLevel: spec.hasher, firewallLevel: spec.firewall, password: 'secreta', isBreached: false, openPorts: [] },
    files: spec.files.map(f => ({ ...f })),
    logs: [],
    activeMiners: [],
    rewardCash: 0,
    rewardRep: Math.round(spec.hasher * 40 + 50),
    description: spec.description,
  };
}

/**
 * Makes sure the hidden servers and the clue files exist in the world (also in
 * a database created before this feature). Returns the servers that changed.
 */
export function ensureSecrets(servers: Map<string, VirtualServer>): VirtualServer[] {
  const changed: VirtualServer[] = [];
  for (const spec of HIDDEN) {
    const existing = servers.get(spec.ip);
    if (!existing) {
      const server = buildHiddenServer(spec);
      servers.set(server.ip, server);
      changed.push(server);
    } else if (!existing.hidden) {
      existing.hidden = true;
      changed.push(existing);
    }
  }
  for (const { hostIp, file: clue } of CLUE_FILES) {
    const host = servers.get(hostIp);
    if (host && !(host.files || []).some(f => f.name === clue.name)) {
      host.files = [...(host.files || []), { ...clue }];
      changed.push(host);
    }
  }
  return changed;
}

export interface SecretResult { discoveredIp?: string; discoveredHost?: string; clueText?: string; loot?: { cash: number; btc: number; rep: number }; fileName: string; }

/** Applies a secret file the player just downloaded: reveals the next server and pays loot once. */
export function applySecretDownload(player: Player, server: VirtualServer, downloaded: SoftwareItem, servers: Map<string, VirtualServer>): SecretResult | null {
  if (!downloaded.clueIp && !downloaded.loot) return null;
  player.secretsFound = player.secretsFound || [];
  const key = `${server.ip}:${downloaded.name}`;
  const result: SecretResult = { fileName: downloaded.name };

  if (downloaded.clueIp) {
    result.clueText = downloaded.content;
    if (!player.discoveredIps.includes(downloaded.clueIp)) {
      player.discoveredIps.push(downloaded.clueIp);
      result.discoveredIp = downloaded.clueIp;
      result.discoveredHost = servers.get(downloaded.clueIp)?.hostname;
    }
  }
  if (downloaded.loot && !player.secretsFound.includes(key)) {
    const loot = { cash: downloaded.loot.cash || 0, btc: downloaded.loot.btc || 0, rep: downloaded.loot.rep || 0 };
    player.cash += loot.cash;
    if (player.bankAccounts?.[0]) player.bankAccounts[0].balance = player.cash;
    if (loot.btc) {
      player.cryptoWallet = player.cryptoWallet || { btc: 0 };
      player.cryptoWallet.btc = Number(((player.cryptoWallet.btc || 0) + loot.btc).toFixed(6));
      player.crypto = player.cryptoWallet.btc;
    }
    player.reputation += loot.rep;
    result.loot = loot;
  }
  if (!player.secretsFound.includes(key)) player.secretsFound.push(key);
  return result.discoveredIp || result.loot || result.clueText ? result : null;
}

export const SECRET_TOTAL = HIDDEN.reduce((n, h) => n + h.files.filter(f => f.loot).length, 0);
