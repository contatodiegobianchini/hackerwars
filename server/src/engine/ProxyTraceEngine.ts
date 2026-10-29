import { PoliceTraceState, ProxyHop, VirtualServer } from '../types/game.js';
import { Server as SocketIOServer } from 'socket.io';

export class ProxyTraceEngine {
  private activeTraces: Map<string, { timer: NodeJS.Timeout; state: PoliceTraceState }> = new Map();
  private io: SocketIOServer | null = null;

  public setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  public isHighRiskTarget(target: VirtualServer): boolean {
    return target.type === 'government' || target.type === 'bank' || target.type === 'corporate' || target.type === 'cartel';
  }

  public startTraceIfNeeded(
    userId: string,
    target: VirtualServer,
    proxyHops: ProxyHop[],
    vpnDelaySec: number = 0,
    onTraceComplete: (target: VirtualServer) => void
  ): PoliceTraceState | null {
    this.stopTrace(userId);

    if (!this.isHighRiskTarget(target)) return null;

    // Base trace time: 40s. Each proxy hop adds +18s. VPN plan adds vpnDelaySec (+25s, +60s, +120s, +240s)!
    const totalSeconds = 40 + (proxyHops.length * 18) + vpnDelaySec;
    let secondsRemaining = totalSeconds;

    const state: PoliceTraceState = {
      isActive: true,
      targetIp: target.ip,
      targetName: target.hostname,
      progressPercent: 0,
      totalSeconds,
      secondsRemaining,
      hops: proxyHops,
      dangerLevel: 'LOW',
    };

    const timer = setInterval(() => {
      secondsRemaining -= 1;
      const progress = Math.min(100, Math.round(((totalSeconds - secondsRemaining) / totalSeconds) * 100));

      state.secondsRemaining = Math.max(0, secondsRemaining);
      state.progressPercent = progress;

      if (progress < 35) state.dangerLevel = 'LOW';
      else if (progress < 70) state.dangerLevel = 'MEDIUM';
      else if (progress < 90) state.dangerLevel = 'HIGH';
      else state.dangerLevel = 'CRITICAL';

      if (this.io) {
        this.io.emit('police_trace_tick', { userId, state });
      }

      if (secondsRemaining <= 0) {
        this.stopTrace(userId);
        onTraceComplete(target);
      }
    }, 1000);

    this.activeTraces.set(userId, { timer, state });

    if (this.io) {
      this.io.emit('police_trace_start', { userId, state });
    }

    return state;
  }

  public stopTrace(userId: string) {
    const existing = this.activeTraces.get(userId);
    if (existing) {
      clearInterval(existing.timer);
      this.activeTraces.delete(userId);

      if (this.io) {
        this.io.emit('police_trace_stopped', { userId });
      }
    }
  }

  public getTraceState(userId: string): PoliceTraceState | undefined {
    return this.activeTraces.get(userId)?.state;
  }
}
