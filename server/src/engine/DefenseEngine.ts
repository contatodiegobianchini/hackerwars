import { Player, InfectionItem, NpcInvasionEvent } from '../types/game.js';
import { v4 as uuidv4 } from 'uuid';
import { Server as SocketIOServer } from 'socket.io';

export class DefenseEngine {
  private activeInvasions: Map<string, NpcInvasionEvent> = new Map();
  private io: SocketIOServer | null = null;

  public setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  public getActiveInvasion(playerId: string): NpcInvasionEvent | undefined {
    return this.activeInvasions.get(playerId);
  }

  public scanAndCleanInfections(player: Player): { cleanedCount: number; infections: InfectionItem[]; message: string } {
    const av = player.software.find(s => s.type === 'antivirus');
    const avLevel = av ? av.version : 1.0;

    if (!player.infections) player.infections = [];

    const totalBefore = player.infections.length;
    if (totalBefore === 0) {
      return {
        cleanedCount: 0,
        infections: [],
        message: 'Varredura Concluída: Seu sistema está 100% limpo! Nenhuma ameaça ou vírus encontrado.',
      };
    }

    // Strictly: only cleans infections where avLevel >= inf.level
    const remaining: InfectionItem[] = [];
    let cleanedCount = 0;

    for (const inf of player.infections) {
      if (avLevel >= inf.level) {
        cleanedCount++;
      } else {
        remaining.push(inf);
      }
    }

    player.infections = remaining;

    if (cleanedCount > 0 && remaining.length === 0) {
      return {
        cleanedCount,
        infections: remaining,
        message: `Varredura Completa: ${cleanedCount} ameaça(s) neutralizada(s) e eliminada(s) pelo AegisScanner v${avLevel.toFixed(1)}!`,
      };
    } else if (cleanedCount > 0 && remaining.length > 0) {
      return {
        cleanedCount,
        infections: remaining,
        message: `Varredura Parcial: ${cleanedCount} vírus eliminados, mas ${remaining.length} malware(s) de nível superior ao seu Antivírus (v${avLevel.toFixed(1)}) resistiram. Evolua o AegisScanner em Meus Softwares!`,
      };
    } else {
      const highestThreat = Math.max(...remaining.map(i => i.level));
      return {
        cleanedCount: 0,
        infections: remaining,
        message: `Falha na Limpeza: Seu AegisScanner (v${avLevel.toFixed(1)}) é inferior ao nível dos vírus detectados (v${highestThreat.toFixed(1)}). Evolua seu Antivírus em Meus Softwares para conseguir removê-los!`,
      };
    }
  }

  public cleanSingleInfection(player: Player, infectionId: string): { success: boolean; message: string; infections: InfectionItem[] } {
    const av = player.software.find(s => s.type === 'antivirus');
    const avLevel = av ? av.version : 1.0;

    if (!player.infections) player.infections = [];
    const infIndex = player.infections.findIndex(i => i.id === infectionId);

    if (infIndex === -1) {
      return { success: false, message: 'Ameaça não encontrada ou já foi eliminada.', infections: player.infections };
    }

    const targetInf = player.infections[infIndex];
    if (avLevel < targetInf.level) {
      return {
        success: false,
        message: `Antivírus Insuficiente! O malware "${targetInf.name}" (Nível v${targetInf.level.toFixed(1)}) é superior ao seu AegisScanner (v${avLevel.toFixed(1)}). Evolua o Antivírus em Meus Softwares para conseguir removê-lo!`,
        infections: player.infections,
      };
    }

    const [removed] = player.infections.splice(infIndex, 1);
    return {
      success: true,
      message: `Ameaça "${removed.name}" (v${removed.level.toFixed(1)}) eliminada com sucesso pelo AegisScanner!`,
      infections: player.infections,
    };
  }

  public triggerNpcInvasion(player: Player): NpcInvasionEvent | null {
    if (this.activeInvasions.has(player.id)) return null;

    const npcNames = [
      { name: 'DarkSpecter', ip: '45.134.22.9', level: 1.5, bounty: 1800 },
      { name: 'ByteBandit_99', ip: '185.220.101.5', level: 2.2, bounty: 3200 },
      { name: 'Ghost_Phantom', ip: '91.200.12.88', level: 3.0, bounty: 6500 },
      { name: 'NullSec_Infiltrator', ip: '109.70.100.41', level: 3.8, bounty: 11000 },
    ];

    const pick = npcNames[Math.floor(Math.random() * npcNames.length)];
    const invasion: NpcInvasionEvent = {
      id: `inv-${uuidv4().substring(0, 8)}`,
      attackerName: pick.name,
      attackerIp: pick.ip,
      attackerLevel: pick.level,
      targetPlayerId: player.id,
      progress: 0,
      timeRemainingSec: 35,
      status: 'incoming',
      rewardCash: pick.bounty,
    };

    this.activeInvasions.set(player.id, invasion);

    if (this.io) {
      this.io.emit('npc_invasion_alert', { invasion, playerIp: player.ip });
    }

    // Countdown ticker
    const timer = setInterval(() => {
      const inv = this.activeInvasions.get(player.id);
      if (!inv || inv.status !== 'incoming') {
        clearInterval(timer);
        return;
      }

      inv.timeRemainingSec -= 1;
      inv.progress = Math.round(((35 - inv.timeRemainingSec) / 35) * 100);

      if (inv.timeRemainingSec <= 0) {
        clearInterval(timer);
        this.resolveInvasionBreach(player, inv);
      } else if (this.io) {
        this.io.emit('npc_invasion_tick', { invasion: inv });
      }
    }, 1000);

    return invasion;
  }

  public defendInvasion(player: Player, method: 'firewall' | 'honeypot' | 'killswitch'): {
    success: boolean;
    message: string;
    bountyCash?: number;
  } {
    const invasion = this.activeInvasions.get(player.id);
    if (!invasion || invasion.status !== 'incoming') {
      return { success: false, message: 'Nenhuma invasão ativa no momento.' };
    }

    if (method === 'honeypot') {
      const now = Date.now();
      const isActive = (player.honeypotActiveUntil && player.honeypotActiveUntil > now) || player.honeypotActive;
      if (!isActive) {
        return { success: false, message: 'Honeypot inativo! Arme o Honeypot na Central de Defesa (ativo por 10 min a cada 2 horas).' };
      }

      invasion.status = 'trapped';
      this.activeInvasions.delete(player.id);
      const bounty = invasion.rewardCash;
      player.cash += bounty;
      player.reputation += 150;

      if (this.io) {
        this.io.emit('npc_invasion_resolved', { invasion, outcome: 'trapped', bounty });
      }

      return {
        success: true,
        message: `ARMADILHA ATIVADA! O invasor ${invasion.attackerName} caiu no seu Honeypot! Rastreamento reverso gerou +$${bounty.toLocaleString()} USD e +150 REP!`,
        bountyCash: bounty,
      };
    } else if (method === 'firewall') {
      const fw = player.software.find(s => s.type === 'firewall');
      const fwLevel = fw ? fw.version : 1.0;

      if (fwLevel >= invasion.attackerLevel * 0.8) {
        invasion.status = 'blocked';
        this.activeInvasions.delete(player.id);
        player.reputation += 80;

        if (this.io) {
          this.io.emit('npc_invasion_resolved', { invasion, outcome: 'blocked' });
        }

        return {
          success: true,
          message: `Invasão Bloqueada! Seu Firewall AegisWall repeliu o ataque de ${invasion.attackerName}.`,
        };
      } else {
        return {
          success: false,
          message: `Falha no Firewall! A ferramenta do invasor (v${invasion.attackerLevel}) superou seu Firewall (v${fwLevel.toFixed(1)}). Use o Killswitch ou arme um Honeypot!`,
        };
      }
    } else {
      // Emergency Killswitch (costs $200 ISP reconnection fee)
      invasion.status = 'blocked';
      this.activeInvasions.delete(player.id);
      player.cash = Math.max(0, player.cash - 200);

      if (this.io) {
        this.io.emit('npc_invasion_resolved', { invasion, outcome: 'blocked' });
      }

      return {
        success: true,
        message: 'KILLSWITCH EXECUTADO: Conexão de rede cortada emergencialmente. Invasor desconectado (Custo de reinicialização: $200).',
      };
    }
  }

  private resolveInvasionBreach(player: Player, invasion: NpcInvasionEvent) {
    invasion.status = 'breached';
    this.activeInvasions.delete(player.id);

    const stolen = Math.min(player.cash, Math.round(player.cash * 0.15) + 350);
    player.cash -= stolen;

    if (!player.infections) player.infections = [];
    player.infections.push({
      id: `inf-${uuidv4().substring(0, 8)}`,
      name: `Trojan_${invasion.attackerName}`,
      type: 'trojan',
      level: invasion.attackerLevel,
      drainUsdPerMin: 25,
      detected: true,
    });

    if (this.io) {
      this.io.emit('npc_invasion_resolved', {
        invasion,
        outcome: 'breached',
        stolenCash: stolen,
        message: `ALERTA DE SEGURANÇA: ${invasion.attackerName} quebrou suas defesas, roubou $${stolen.toLocaleString()} e instalou um Trojan oculto! Execute o AegisScanner Antivirus imediatamente.`,
      });
    }
  }
}
