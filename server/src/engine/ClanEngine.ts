import { Clan, TerritoryNode, SoftwareItem } from '../types/game.js';
import { v4 as uuidv4 } from 'uuid';

export class ClanEngine {
  private clans: Map<string, Clan> = new Map();
  private territoryNodes: TerritoryNode[] = [
    {
      id: 'node-dns',
      name: 'Root DNS Internacional (1.1.1.1)',
      ip: '1.1.1.1',
      type: 'DNS_ROOT',
      controllingClanId: 'clan-fsoc',
      controllingClanTag: 'FSOC',
      defensePower: 8500,
      bonusDescription: '+15% de velocidade em portscans e conexões remotas.',
    },
    {
      id: 'node-sat',
      name: 'Satélite Financeiro de Wall Street',
      ip: '12.80.190.55',
      type: 'FINANCIAL_SATELLITE',
      controllingClanId: 'clan-null',
      controllingClanTag: 'NULL',
      defensePower: 14000,
      bonusDescription: '+20% de lucro extra em transferências e heists bancários.',
    },
    {
      id: 'node-dark',
      name: 'DarkNet Relay Central (TOR-Node-01)',
      ip: '185.220.101.5',
      type: 'DARKNET_HUB',
      controllingClanId: 'clan-anon',
      controllingClanTag: 'ANON',
      defensePower: 6000,
      bonusDescription: '15% de desconto em todas as lootboxes do Black Market.',
    },
    {
      id: 'node-core',
      name: 'Cluster Quântico do CERN (Genebra)',
      ip: '128.141.208.50',
      type: 'QUANTUM_CORE',
      controllingClanId: undefined,
      defensePower: 22000,
      bonusDescription: '+25% de hash rate em todas as fazendas de mineração de membros.',
    },
  ];

  constructor() {
    this.seedDefaultClans();
  }

  private seedDefaultClans() {
    const defaultClans: Clan[] = [
      {
        id: 'clan-fsoc',
        name: 'fsociety',
        tag: 'FSOC',
        description: 'Coletivo anônimo focado em derrubar megacorporações como Pear e Cola-Coca.',
        leaderId: 'npc-elliot',
        leaderName: 'mr_robot',
        vaultCash: 45000,
        vaultBtc: 1.85,
        totalReputation: 12500,
        members: [
          { playerId: 'npc-elliot', username: 'mr_robot', role: 'Leader', reputationContributed: 8000, joinedAt: Date.now() - 10000000 },
          { playerId: 'npc-darlene', username: 'darlene', role: 'Officer', reputationContributed: 4500, joinedAt: Date.now() - 8000000 },
        ],
        sharedSoftware: [
          { id: 'clan-soft-1', name: 'fsociety_fcrack_v3.5', type: 'cracker', version: 3.5, sizeMb: 45, isInstalled: true, rarity: 'rare' },
        ],
        controlledNodes: ['node-dns'],
      },
      {
        id: 'clan-anon',
        name: 'Anonymous',
        tag: 'ANON',
        description: 'Legião descentralizada lutando pela liberdade de informação no ciberespaço.',
        leaderId: 'npc-anon-1',
        leaderName: 'CommanderX',
        vaultCash: 32000,
        vaultBtc: 1.20,
        totalReputation: 9800,
        members: [
          { playerId: 'npc-anon-1', username: 'CommanderX', role: 'Leader', reputationContributed: 6000, joinedAt: Date.now() - 5000000 },
        ],
        sharedSoftware: [
          { id: 'clan-soft-2', name: 'Anonymous_LowOrbit_v3.2', type: 'ddos', version: 3.2, sizeMb: 50, isInstalled: true, rarity: 'rare' },
        ],
        controlledNodes: ['node-dark'],
      },
      {
        id: 'clan-null',
        name: 'NullSec Syndicate',
        tag: 'NULL',
        description: 'Sindicato de cibercriminosos do mercado negro especializados em heists multimilionários.',
        leaderId: 'npc-null-1',
        leaderName: 'ShadowOverlord',
        vaultCash: 120000,
        vaultBtc: 5.40,
        totalReputation: 24000,
        members: [
          { playerId: 'npc-null-1', username: 'ShadowOverlord', role: 'Leader', reputationContributed: 18000, joinedAt: Date.now() - 15000000 },
        ],
        sharedSoftware: [
          { id: 'clan-soft-3', name: 'Titan_BankHeist_v4.2', type: 'exploit', version: 4.2, sizeMb: 60, isInstalled: true, rarity: 'epic' },
        ],
        controlledNodes: ['node-sat'],
      },
    ];

    defaultClans.forEach(c => this.clans.set(c.id, c));
  }

  public getClans(): Clan[] {
    return Array.from(this.clans.values());
  }

  public getClan(clanId: string): Clan | undefined {
    return this.clans.get(clanId);
  }

  public getTerritoryNodes(): TerritoryNode[] {
    return this.territoryNodes;
  }

  public createClan(leaderId: string, leaderName: string, name: string, tag: string, description: string): { success: boolean; clan?: Clan; message: string } {
    const cleanTag = tag.trim().toUpperCase().substring(0, 5);
    const cleanName = name.trim();

    if (Array.from(this.clans.values()).some(c => c.tag === cleanTag || c.name.toLowerCase() === cleanName.toLowerCase())) {
      return { success: false, message: 'Já existe um clã com este nome ou TAG!' };
    }

    const newClan: Clan = {
      id: `clan-${uuidv4().substring(0, 8)}`,
      name: cleanName,
      tag: cleanTag,
      description,
      leaderId,
      leaderName,
      vaultCash: 0,
      vaultBtc: 0,
      totalReputation: 100,
      members: [
        { playerId: leaderId, username: leaderName, role: 'Leader', reputationContributed: 100, joinedAt: Date.now() }
      ],
      sharedSoftware: [],
      controlledNodes: [],
    };

    this.clans.set(newClan.id, newClan);
    return { success: true, clan: newClan, message: `Clã [${cleanTag}] ${cleanName} fundado com sucesso!` };
  }

  public joinClan(playerId: string, username: string, clanId: string): { success: boolean; clan?: Clan; message: string } {
    const clan = this.clans.get(clanId);
    if (!clan) return { success: false, message: 'Clã não encontrado.' };

    if (clan.members.some(m => m.playerId === playerId)) {
      return { success: false, message: 'Você já é membro deste clã!' };
    }

    clan.members.push({
      playerId,
      username,
      role: 'Member',
      reputationContributed: 0,
      joinedAt: Date.now(),
    });

    return { success: true, clan, message: `Você juntou-se ao clã [${clan.tag}] ${clan.name}!` };
  }

  public leaveClan(playerId: string, clanId: string): { success: boolean; message: string } {
    const clan = this.clans.get(clanId);
    if (!clan) return { success: false, message: 'Clã não encontrado.' };

    clan.members = clan.members.filter(m => m.playerId !== playerId);
    return { success: true, message: `Você saiu do clã [${clan.tag}].` };
  }

  public depositVault(clanId: string, amountUsd: number, amountBtc: number): { success: boolean; clan?: Clan; message: string } {
    const clan = this.clans.get(clanId);
    if (!clan) return { success: false, message: 'Clã não encontrado.' };

    clan.vaultCash += amountUsd;
    clan.vaultBtc = Number((clan.vaultBtc + amountBtc).toFixed(6));
    clan.totalReputation += Math.round(amountUsd / 20);

    return { success: true, clan, message: `Doação de $${amountUsd.toLocaleString()} depositada no cofre do clã!` };
  }

  public attackTerritoryNode(clanId: string, nodeId: string, attackPower: number): { success: boolean; message: string; conquered: boolean } {
    const clan = this.clans.get(clanId);
    const node = this.territoryNodes.find(n => n.id === nodeId);
    if (!clan || !node) return { success: false, message: 'Nó ou clã inválido.', conquered: false };

    if (node.controllingClanId === clanId) {
      return { success: false, message: 'Seu clã já controla este nó territorial!', conquered: false };
    }

    // Success chance based on attack power vs defense
    const chance = Math.min(90, Math.max(10, Math.round((attackPower / (attackPower + node.defensePower * 0.5)) * 100)));
    const roll = Math.random() * 100;

    if (roll <= chance) {
      // Conquered!
      node.controllingClanId = clan.id;
      node.controllingClanTag = clan.tag;
      if (!clan.controlledNodes.includes(node.id)) {
        clan.controlledNodes.push(node.id);
      }
      clan.totalReputation += 500;

      return {
        success: true,
        conquered: true,
        message: `VITÓRIA NA GUERRA DE CLÃS! [${clan.tag}] conquistou o nó territorial "${node.name}" (${chance}% chance)! Bônus de clã ativado.`,
      };
    } else {
      return {
        success: true,
        conquered: false,
        message: `Ataque ao nó "${node.name}" falhou (${chance}% de chance). As defesas do nó resistiram à invasão.`,
      };
    }
  }
}
