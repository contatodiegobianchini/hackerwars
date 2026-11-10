import { PoliceTraceState, ProxyHop, VirtualServer } from '../types/game.js';
import { Server as SocketIOServer } from 'socket.io';

export class ProxyTraceEngine {
  private activeTraces: Map<string, { timer: NodeJS.Timeout; state: PoliceTraceState }> = new Map();
  private io: SocketIOServer | null = null;

  public setSocketServer(io: SocketIOServer) {
    this.io = io;

    // Tie the trace lifecycle to the player's authenticated socket.
    // Explicit target disconnects and closed browser connections both stop it.
    io.on('connection', (socket) => {
      const stopForSocketUser = () => {
        const userId = socket.data?.user?.userId;
        if (typeof userId === 'string' && userId.length > 0) {
          this.stopTrace(userId);
        }
      };

      socket.on('disconnect_target', stopForSocketUser);
      socket.on('disconnect', stopForSocketUser);
    });
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
      // Read from the shared state: addHeat() may have shortened the clock.
      secondsRemaining = state.secondsRemaining - 1;
      const progress = Math.min(100, Math.round(((totalSeconds - secondsRemaining) / totalSeconds) * 100));

      state.secondsRemaining = Math.max(0, secondsRemaining);
      state.progressPercent = progress;

      if (progress < 35) state.dangerLevel = 'LOW';
      else if (progress < 70) state.dangerLevel = 'MEDIUM';
      else if (progress < 90) state.dangerLevel = 'HIGH';
      else state.dangerLevel = 'CRITICAL';

      if (this.io) {
        // Clone state so clients receive an immutable snapshot for each tick.
        this.io.emit('police_trace_tick', { userId, state: { ...state } });
      }

      if (secondsRemaining <= 0) {
        this.stopTrace(userId);
        onTraceComplete(target);
      }
    }, 1000);

    this.activeTraces.set(userId, { timer, state });

    if (this.io) {
      this.io.emit('police_trace_start', { userId, state: { ...state } });
    }

    return state;
  }

  /**
   * Speeds up the trace running against this player on this target. Returns the
   * seconds actually removed (0 when no trace is running there).
   */
  public addHeat(userId: string, targetIp: string, seconds: number, label: string): number {
    const active = this.activeTraces.get(userId);
    if (!active || active.state.targetIp !== targetIp || seconds <= 0) return 0;
    const before = active.state.secondsRemaining;
    active.state.secondsRemaining = Math.max(1, before - seconds);
    const removed = before - active.state.secondsRemaining;
    active.state.progressPercent = Math.min(100, Math.round(((active.state.totalSeconds - active.state.secondsRemaining) / active.state.totalSeconds) * 100));
    active.state.lastHeat = { label, seconds: removed, at: Date.now() };
    if (this.io) this.io.emit('police_trace_tick', { userId, state: { ...active.state } });
    return removed;
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
