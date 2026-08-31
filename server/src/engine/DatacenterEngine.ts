import { Player, PlayerVps, VpsModuleType } from '../types/game.js';
import { v4 as uuidv4 } from 'uuid';

export const VPS_CATALOG = [
  {
    tier: 'micro' as const,
    name: 'Instância Cloud Micro (Frankfurt)',
    location: 'Alemanha (DE)',
    cost: 5000,
    cpuPower: 4.0,
    networkMbps: 500,
    desc: 'Servidor virtual em datacenter europeu de baixa latência. Ideal para mineração inicial ou amplificador leve.',
  },
  {
    tier: 'beast' as const,
    name: 'Servidor Dedicado Beast (Tóquio)',
    location: 'Japão (JP)',
    cost: 25000,
    cpuPower: 8.0,
    networkMbps: 2000,
    desc: 'Hardware de alta densidade computacional com uplink de 2 Gbps. Gera altos volumes de phishing e mineração.',
  },
  {
    tier: 'quantum' as const,
    name: 'Cluster Quântico Subterrâneo (Islândia)',
    location: 'Islândia (IS)',
    cost: 100000,
    cpuPower: 20.0,
    networkMbps: 10000,
    desc: 'Cluster alimentado por energia geotérmica com infraestrutura militar e link laser de 10 Gbps.',
  },
];

export class DatacenterEngine {
  public getCatalog() {
    return VPS_CATALOG;
  }

  public rentVps(player: Player, tier: 'micro' | 'beast' | 'quantum'): { success: boolean; vps?: PlayerVps; message: string } {
    const spec = VPS_CATALOG.find(s => s.tier === tier);
    if (!spec) return { success: false, message: 'Plano de VPS não encontrado.' };
    if (player.cash < spec.cost) return { success: false, message: `Saldo insuficiente ($${spec.cost.toLocaleString()} necessário para locação).` };
    if (!player.vpsList) player.vpsList = [];
    if (player.vpsList.length >= 6) return { success: false, message: 'Limite de 6 servidores VPS atingido!' };

    player.cash -= spec.cost;
    const randomIp = `185.${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250 + 2)}`;
    const vps: PlayerVps = {
      id: `vps-${uuidv4().substring(0, 8)}`,
      name: spec.name,
      ip: randomIp,
      location: spec.location,
      tier: spec.tier,
      costMonthly: spec.cost,
      cpuPower: spec.cpuPower,
      networkMbps: spec.networkMbps,
      activeModule: 'mining_rig',
      moduleLevel: 1,
      passivelyGeneratedUsd: 0,
      ...({ lastYieldAt: Date.now() } as any),
    };
    player.vpsList.push(vps);
    return { success: true, vps, message: `VPS "${spec.name}" (${randomIp}) ativado no Datacenter com sucesso!` };
  }

  public setVpsModule(player: Player, vpsId: string, moduleType: VpsModuleType): { success: boolean; message: string } {
    if (!player.vpsList) return { success: false, message: 'Nenhum servidor VPS encontrado.' };
    const vps = player.vpsList.find(v => v.id === vpsId);
    if (!vps) return { success: false, message: 'VPS não encontrado.' };
    vps.activeModule = moduleType;
    return { success: true, message: `Módulo de ${moduleType.toUpperCase()} ativado no VPS (${vps.ip}).` };
  }

  public upgradeVpsModule(player: Player, vpsId: string): { success: boolean; message: string } {
    if (!player.vpsList) return { success: false, message: 'Nenhum servidor VPS encontrado.' };
    const vps = player.vpsList.find(v => v.id === vpsId);
    if (!vps) return { success: false, message: 'VPS não encontrado.' };
    const cost = vps.moduleLevel * 800 + 400;
    if (player.cash < cost) return { success: false, message: `Saldo insuficiente ($${cost.toLocaleString()} necessário para upgrade).` };
    player.cash -= cost;
    vps.moduleLevel += 1;
    return { success: true, message: `Módulo do VPS (${vps.ip}) atualizado para Nível ${vps.moduleLevel}!` };
  }

  public setModule(player: Player, vpsId: string, moduleType: VpsModuleType): { success: boolean; message: string } {
    return this.setVpsModule(player, vpsId, moduleType);
  }

  public upgradeModule(player: Player, vpsId: string): { success: boolean; message: string } {
    return this.upgradeVpsModule(player, vpsId);
  }

  public calculateMinuteYield(vps: PlayerVps): number {
    if (vps.activeModule === 'mining_rig') return Math.round(vps.cpuPower * vps.moduleLevel * 30 + 50);
    if (vps.activeModule === 'phishing_honeypot') return Math.round((vps.networkMbps / 15) * vps.moduleLevel * 1.5 + Math.random() * 150 + 60);
    if (vps.activeModule === 'botnet_amplifier') return Math.round(vps.cpuPower * vps.moduleLevel * 20 + 80);
    return 0;
  }

  public collectAutomaticMinuteYield(player: Player): { totalCollected: number; vpsYields: { vpsId: string; name: string; amount: number }[] } {
    if (!player.vpsList || player.vpsList.length === 0) return { totalCollected: 0, vpsYields: [] };
    let totalCollected = 0;
    const vpsYields: { vpsId: string; name: string; amount: number }[] = [];
    for (const vps of player.vpsList) {
      const amount = this.calculateMinuteYield(vps);
      if (amount > 0) {
        player.cash += amount;
        vps.passivelyGeneratedUsd = (vps.passivelyGeneratedUsd || 0) + amount;
        vpsYields.push({ vpsId: vps.id, name: vps.name, amount });
        totalCollected += amount;
      }
    }
    return { totalCollected, vpsYields };
  }
}
