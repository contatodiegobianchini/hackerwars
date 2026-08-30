import { GameProcess, ProcessType, VirtualServer, SoftwareItem } from '../types/game.js';
import { GameWorld } from './GameWorld.js';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

export const getCompileCost = (version: number): number => {
  const steps = Math.max(0, Math.round((version - 1.0) * 10));
  return Math.round(50 + steps * 30 + Math.pow(steps, 1.32) * 15);
};

export const getBaseCompileSeconds = (version: number): number => {
  const steps = Math.max(0, Math.round((version - 1.0) * 10));
  return 60 + steps * 30;
};

export class ProcessEngine {
  private processes: Map<string, GameProcess> = new Map();
  private gameWorld: GameWorld;
  private io: SocketIOServer | null = null;

  constructor(gameWorld: GameWorld) {
    this.gameWorld = gameWorld;
    this.startProcessLoop();
  }

  public setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  public getActiveProcesses(playerId: string): GameProcess[] {
    return Array.from(this.processes.values()).filter(p => p.playerId === playerId);
  }

  public startProcess(
    playerId: string,
    type: ProcessType,
    params: {
      targetIp?: string;
      targetFileId?: string;
      targetFileName?: string;
      softwareId?: string;
      details?: any;
    }
  ): { success: boolean; process?: GameProcess; message?: string } {
    const player = this.gameWorld.getPlayer(playerId);
    const activeForPlayer = this.getActiveProcesses(playerId);

    let maxTasks = player.hardware.ram.maxTasks;
    if (player.unlockedStoryPerks?.some(p => p.id === 'perk-quantum-multitask')) maxTasks += 2;
    if (player.unlockedStoryPerks?.some(p => p.id === 'perk-singularity-god')) maxTasks = 999;

    if (activeForPlayer.length >= maxTasks) {
      return {
        success: false,
        message: `Memória RAM insuficiente! Máximo de ${maxTasks} tarefas simultâneas atingido. Faça um upgrade de RAM na Loja de Hardware.`,
      };
    }

    if (type === 'crack' && params.targetIp) {
      const target = this.gameWorld.getServer(params.targetIp);
      if (!target) return { success: false, message: 'Servidor alvo não encontrado.' };

      const cracker = player.software.find(s => s.type === 'cracker');
      const crackerVer = cracker ? cracker.version : 1.0;
      const hasherVer = target.security.hasherLevel;

      if (crackerVer < hasherVer) {
        return {
          success: false,
          message: `Invasão Bloqueada: O algoritmo Hasher do alvo (v${hasherVer.toFixed(1)}) é mais forte que seu Cracker (v${crackerVer.toFixed(1)}). Pesquise e evolua seu Cracker antes de tentar invadir!`,
        };
      }
    }

    if (type === 'plant_spyware' && params.targetIp) {
      const target = this.gameWorld.getServer(params.targetIp);
      if (!target) return { success: false, message: 'Servidor alvo não encontrado.' };
      if (!target.security.isBreached) return { success: false, message: 'Você precisa obter acesso ROOT (Crack) antes de implantar o Spyware!' };
      const spyware = player.software.find(s => s.type === 'spyware');
      if (!spyware) return { success: false, message: 'Você não possui nenhum software Spyware instalado!' };
    }

    if (type === 'mass_bank_heist' && params.targetIp) {
      const target = this.gameWorld.getServer(params.targetIp);
      if (!target) return { success: false, message: 'Servidor alvo não encontrado.' };
      if (target.type !== 'bank') return { success: false, message: 'Este servidor não é uma instituição financeira bancária!' };
      if (!target.security.isBreached) return { success: false, message: 'Você precisa obter acesso ROOT no servidor bancário antes de infiltrar a database central!' };
    }

    if (type === 'download' && params.targetIp) {
      const target = this.gameWorld.getServer(params.targetIp);
      if (!target) return { success: false, message: 'Servidor alvo não encontrado.' };
      if (!target.security.isBreached) return { success: false, message: 'Acesso negado: quebre a senha do servidor antes de baixar arquivos.' };
      if (params.targetFileId && !target.files.some(f => f.id === params.targetFileId)) {
        return { success: false, message: 'Arquivo alvo não encontrado no servidor.' };
      }
    }

    if (type === 'compile' && params.softwareId) {
      const soft = player.software.find(s => s.id === params.softwareId);
      if (!soft) return { success: false, message: 'Software não encontrado.' };

      const isAlreadyCompiling = activeForPlayer.some(
        p => p.type === 'compile' && (p.details?.softwareId === params.softwareId || p.targetFileId === params.softwareId) && p.status === 'running'
      );
      if (isAlreadyCompiling) {
        return { success: false, message: `O software "${soft.name}" já está sendo compilado! Aguarde a conclusão da evolução atual.` };
      }

      const cost = getCompileCost(soft.version);
      if (player.cash < cost) {
        return { success: false, message: `Saldo insuficiente para evoluir ${soft.name}! Necessário $${cost.toLocaleString()} USD.` };
      }

      player.cash -= cost;
      this.gameWorld.savePlayerState(playerId);
    }

    const durationMs = this.calculateDuration(playerId, type, params);
    const now = Date.now();
    const details = params.details && typeof params.details === 'object' ? { ...params.details } : {};

    // Keep important identifiers in both the normalized fields and details so completion
    // cannot silently lose the target when callers use either payload shape.
    if (params.softwareId && !details.softwareId) details.softwareId = params.softwareId;

    const process: GameProcess = {
      id: `proc-${uuidv4().substring(0, 8)}`,
      type,
      playerId,
      targetIp: params.targetIp,
      targetFileId: params.targetFileId,
      targetFileName: params.targetFileName,
      progress: 0,
      startTime: now,
      endTime: now + durationMs,
      durationMs,
      status: 'running',
      details,
    };

    this.processes.set(process.id, process);
    this.broadcastProcesses(playerId);

    return { success: true, process };
  }

  public cancelProcess(processId: string, playerId: string): boolean {
    const proc = this.processes.get(processId);
    if (proc && proc.playerId === playerId) {
      this.processes.delete(processId);
      this.broadcastProcesses(playerId);
      return true;
    }
    return false;
  }

  private calculateDuration(playerId: string, type: ProcessType, params: any): number {
    const player = this.gameWorld.getPlayer(playerId);
    const cpuSpeed = player.hardware.cpu.clockSpeedGhz;
    const gpuTflops = player.hardware.gpu?.tflops || 0.5;
    const netSpeed = player.hardware.network.speedMbps;

    switch (type) {
      case 'crack': {
        const target = params.targetIp ? this.gameWorld.getServer(params.targetIp) : null;
        const targetDefense = target ? target.security.hasherLevel : 1.0;
        const playerCracker = player.software.find(s => s.type === 'cracker');
        const crackerVersion = playerCracker ? playerCracker.version : 1.0;
        const computePower = cpuSpeed + gpuTflops * 0.15;
        let timeSec = ((targetDefense / crackerVersion) * 6.0) / (computePower / 2);
        if (player.unlockedStoryPerks?.some(p => p.id === 'perk-military-overclock')) timeSec *= 0.65;
        return Math.max(2000, Math.round(timeSec * 1000));
      }
      case 'scan': {
        const playerScanner = player.software.find(s => s.type === 'portscan');
        const scanVer = playerScanner ? playerScanner.version : 1.0;
        const timeSec = (4.0 / scanVer) / (netSpeed / 10);
        return Math.max(1500, Math.round(timeSec * 1000));
      }
      case 'download': {
        const target = params.targetIp ? this.gameWorld.getServer(params.targetIp) : null;
        const file = target?.files.find(f => f.id === params.targetFileId);
        const sizeMb = file ? file.sizeMb : 20;
        const downloadSec = (sizeMb / (netSpeed / 8)) * 1.2;
        return Math.max(2000, Math.round(downloadSec * 1000));
      }
      case 'upload': {
        const soft = player.software.find(s => s.id === params.softwareId);
        const sizeMb = soft ? soft.sizeMb : 15;
        const uploadSec = (sizeMb / ((netSpeed * 0.5) / 8)) * 1.2;
        return Math.max(2000, Math.round(uploadSec * 1000));
      }
      case 'compile': {
        const soft = player.software.find(s => s.id === params.softwareId);
        const version = soft ? soft.version : 1.0;
        const baseSec = getBaseCompileSeconds(version);
        const computePower = (cpuSpeed / 2.0) * 0.85 + (gpuTflops / 10.0) * 0.15;
        const finalSec = Math.max(10, Math.round(baseSec / Math.max(0.6, computePower)));
        return finalSec * 1000;
      }
      case 'wipelog': return Math.max(2000, Math.round(4000 / (cpuSpeed / 2)));
      case 'antivirus_scan': {
        const av = player.software.find(s => s.type === 'antivirus');
        const avVer = av ? av.version : 1.0;
        return Math.max(2500, Math.round((6000 / avVer) / (cpuSpeed / 2)));
      }
      case 'ddos': {
        const target = params.targetIp ? this.gameWorld.getServer(params.targetIp) : null;
        const targetNet = target ? target.hardware.networkMbps : 100;
        const botnet = player.software.find(s => s.type === 'ddos');
        const botnetPower = botnet ? botnet.version * netSpeed : netSpeed;
        const timeSec = Math.max(4, Math.round((targetNet / botnetPower) * 8));
        return Math.max(3500, timeSec * 1000);
      }
      case 'plant_spyware': return Math.max(3000, Math.round(5000 / (cpuSpeed / 2)));
      case 'mass_bank_heist': return Math.max(8000, Math.round(12000 / (cpuSpeed / 2)));
      default: return 4000;
    }
  }

  private startProcessLoop() {
    setInterval(() => {
      const now = Date.now();
      let hasUpdates = false;
      const playerIds = new Set<string>();

      for (const [id, proc] of this.processes.entries()) {
        if (proc.status !== 'running') continue;
        playerIds.add(proc.playerId);
        const elapsed = now - proc.startTime;
        const rawProgress = Math.min(100, Math.round((elapsed / proc.durationMs) * 100));

        if (proc.progress !== rawProgress) {
          proc.progress = rawProgress;
          hasUpdates = true;
        }

        if (elapsed >= proc.durationMs) {
          proc.progress = 100;
          proc.status = 'completed';
          this.handleProcessCompletion(proc);
          this.processes.delete(id);
          hasUpdates = true;
        }
      }

      if (hasUpdates) playerIds.forEach(pId => this.broadcastProcesses(pId));
    }, 200);
  }

  private handleProcessCompletion(proc: GameProcess) {
    let resultMessage = '';
    const userId = proc.playerId;

    switch (proc.type) {
      case 'crack':
        if (proc.targetIp) {
          const ok = this.gameWorld.onPasswordCracked(userId, proc.targetIp);
          resultMessage = ok
            ? `Acesso ROOT obtido com sucesso em ${proc.targetIp}!`
            : `Falha ao conceder acesso ROOT em ${proc.targetIp}. O servidor não está mais disponível.`;
        }
        break;
      case 'scan':
        if (proc.targetIp) {
          this.gameWorld.portScan(userId, proc.targetIp);
          resultMessage = `Scan de portas concluído para ${proc.targetIp}.`;
        }
        break;
      case 'download':
        if (proc.targetIp && proc.targetFileId) {
          const res = this.gameWorld.downloadFile(userId, proc.targetIp, proc.targetFileId);
          resultMessage = res.success ? `Download concluído: ${res.file?.name}` : (res.message || 'Falha no download');
        }
        break;
      case 'upload':
        if (proc.targetIp && (proc.details?.softwareId || proc.targetFileId)) {
          const softwareId = proc.details?.softwareId || proc.targetFileId;
          const res = this.gameWorld.uploadFile(userId, proc.targetIp, softwareId);
          resultMessage = res.message || 'Upload concluído';
        }
        break;
      case 'compile':
        if (proc.details?.softwareId || proc.targetFileId) {
          const softwareId = proc.details?.softwareId || proc.targetFileId;
          const res = this.gameWorld.compileSoftware(userId, softwareId);
          resultMessage = res.success
            ? (res.message || 'Compilação concluída!')
            : (res.message || 'Falha ao atualizar o software.');
        } else {
          resultMessage = 'Compilação concluída, mas o software alvo não foi identificado.';
        }
        break;
      case 'wipelog':
        if (proc.targetIp) {
          this.gameWorld.wipeRemoteLogs(proc.targetIp);
          resultMessage = `Todos os logs em ${proc.targetIp} foram apagados.`;
        }
        break;
      case 'ddos':
        if (proc.targetIp) {
          const res = this.gameWorld.ddosAttack(userId, proc.targetIp);
          resultMessage = res.message;
        }
        break;
      case 'antivirus_scan': {
        const player = this.gameWorld.getPlayer(userId);
        const res = this.gameWorld.defenseEngine.scanAndCleanInfections(player);
        this.gameWorld.savePlayerState(userId);
        resultMessage = res.message;
        break;
      }
      case 'plant_spyware':
        if (proc.targetIp) {
          const res = this.gameWorld.plantSpyware(userId, proc.targetIp);
          resultMessage = res.message;
        }
        break;
      case 'mass_bank_heist':
        if (proc.targetIp) {
          const res = this.gameWorld.executeMassBankHeist(userId, proc.targetIp);
          resultMessage = res.message;
        }
        break;
    }

    const player = this.gameWorld.getPlayer(userId);
    const targetServer = proc.targetIp ? this.gameWorld.getServer(proc.targetIp) : undefined;
    const targetHostname = targetServer ? targetServer.hostname : (proc.targetIp || 'Servidor Remoto');

    if (['crack', 'download', 'plant_spyware', 'wipelog', 'mass_bank_heist', 'ddos'].includes(proc.type)) {
      const triggerType = proc.type === 'wipelog' ? 'wipe_logs' : proc.type === 'mass_bank_heist' ? 'bank_heist' : proc.type as any;
      this.gameWorld.notifyContractorTrigger(player, triggerType, proc.targetIp || '', targetHostname);
    }

    if (this.io) {
      this.io.to(userId).emit('process_completed', {
        process: proc,
        message: resultMessage,
        player,
        server: targetServer,
      });
    }
  }

  private broadcastProcesses(playerId: string) {
    if (this.io) {
      const active = this.getActiveProcesses(playerId);
      this.io.to(playerId).emit('processes_updated', active);
    }
  }
}
