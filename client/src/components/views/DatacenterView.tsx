import React from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import {
  HardDrive,
  Server,
  Cpu,
  Wifi,
  Zap,
  Flame,
  Radio,
  ArrowUpCircle,
  DollarSign,
  PlusCircle,
  ShieldCheck
} from 'lucide-react';
import { PlayerVps, VpsModuleType } from '../../types/game.js';

export const DatacenterView: React.FC = () => {
  const {
    player,
    vpsCatalog,
    rentVps,
    setVpsModule,
    upgradeVpsModule
  } = useGameStore();

  const [secondsRemaining, setSecondsRemaining] = React.useState<number>(60 - (Math.floor(Date.now() / 1000) % 60));

  React.useEffect(() => {
    const timer = setInterval(() => {
      const secLeft = 60 - (Math.floor(Date.now() / 1000) % 60);
      setSecondsRemaining(secLeft);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!player) return null;

  const vpsList = player.vpsList || [];

  // Calculate estimated total revenue per minute across all VPS
  const estimatedMinYield = vpsList.reduce((acc, v) => {
    if (v.activeModule === 'mining_rig') {
      return acc + Math.round(v.cpuPower * v.moduleLevel * 30 + 50);
    } else if (v.activeModule === 'phishing_honeypot') {
      return acc + Math.round((v.networkMbps / 15) * v.moduleLevel * 1.5 + 135);
    } else if (v.activeModule === 'botnet_amplifier') {
      return acc + Math.round(v.cpuPower * v.moduleLevel * 20 + 80);
    }
    return acc;
  }, 0);

  const totalHistoricalGenerated = vpsList.reduce((acc, v) => acc + (v.passivelyGeneratedUsd || 0), 0);

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-gray-700" />
              <h1 className="text-base font-bold text-gray-900">Datacenter Cloud & Servidores VPS</h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Alugue instâncias em nuvem de alta velocidade. O sistema recolhe e credita o saldo <strong>automaticamente a cada 1 minuto</strong>!
            </p>
          </div>

          <div className="text-xs font-mono bg-gray-50 border border-gray-100 text-emerald-600 px-3.5 py-1.5 rounded-xl font-bold">
            SALDO DISPONÍVEL: ${player.cash.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 1-Minute Automated Revenue Collection Banner */}
      {vpsList.length > 0 && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  RECOLHIMENTO AUTOMÁTICO (1 MINUTO)
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <div className="text-xs text-zinc-300 mt-0.5 font-mono">
                Rendimento Estimado: <strong className="text-emerald-400 font-bold">+${estimatedMinYield.toLocaleString()} USD / min</strong> • Total Histórico: <strong className="text-white font-bold">${totalHistoricalGenerated.toLocaleString()} USD</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-emerald-900/60 border border-emerald-500/40 px-4 py-2 rounded-xl text-xs font-mono text-center">
              <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Depósito Automático em</div>
              <div className="text-base font-bold text-white mt-0.5">{secondsRemaining}s</div>
            </div>

            <div className="bg-[#142318] border border-emerald-500/30 text-emerald-400 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Autocoleta Ativa</span>
            </div>
          </div>
        </div>
      )}

      {/* Rented VPS List */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
          Meus Servidores Virtuais Ativos ({vpsList.length}/6)
        </div>

        {vpsList.length === 0 ? (
          <div className="bg-white text-gray-900 rounded-2xl p-8 text-center text-xs text-gray-500 border border-gray-100 space-y-2">
            <Server className="w-8 h-8 text-gray-400 mx-auto" />
            <div className="font-bold text-gray-900">Nenhum servidor VPS contratado ainda.</div>
            <div>Escolha um dos planos de datacenter abaixo para ativar módulos de renda passiva e poder de rede!</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vpsList.map(vps => {
              const upgradeCost = vps.moduleLevel * 800 + 400;
              const canAffordUpgrade = player.cash >= upgradeCost;

              return (
                <div
                  key={vps.id}
                  className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 border border-gray-100"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm text-gray-900">{vps.name}</div>
                        <div className="text-xs font-mono text-gray-400 mt-0.5">{vps.ip} • {vps.location}</div>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-black text-white px-2 py-0.5 rounded-md uppercase">
                        {vps.tier}
                      </span>
                    </div>

                    {/* Specs */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs font-mono text-gray-600">
                      <div>CPU: <strong className="text-gray-900">{vps.cpuPower} GHz</strong></div>
                      <div>Rede: <strong className="text-gray-900">{vps.networkMbps} Mbps</strong></div>
                    </div>

                    {/* Module Selector */}
                    <div className="mt-4 space-y-1.5">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Módulo em Execução</div>
                      <div className="grid grid-cols-3 gap-1 text-[10px] font-semibold">
                        <button
                          onClick={() => setVpsModule(vps.id, 'mining_rig')}
                          className={`py-1.5 rounded-lg border transition ${
                            vps.activeModule === 'mining_rig'
                              ? 'bg-black text-white border-black font-bold'
                              : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                          }`}
                        >
                          ⛏️ Minerador
                        </button>
                        <button
                          onClick={() => setVpsModule(vps.id, 'botnet_amplifier')}
                          className={`py-1.5 rounded-lg border transition ${
                            vps.activeModule === 'botnet_amplifier'
                              ? 'bg-black text-white border-black font-bold'
                              : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                          }`}
                        >
                          💥 Botnet
                        </button>
                        <button
                          onClick={() => setVpsModule(vps.id, 'phishing_honeypot')}
                          className={`py-1.5 rounded-lg border transition ${
                            vps.activeModule === 'phishing_honeypot'
                              ? 'bg-black text-white border-black font-bold'
                              : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                          }`}
                        >
                          🎣 Phishing
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 bg-gray-50 p-2.5 rounded-xl text-xs font-mono flex items-center justify-between text-gray-600">
                      <span>Rendimento Gerado:</span>
                      <strong className="text-emerald-600">+${vps.passivelyGeneratedUsd.toLocaleString()} USD</strong>
                    </div>
                  </div>

                  {/* Upgrade Module */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-xs font-mono text-gray-500">
                      Módulo: <strong className="text-gray-900">Lvl {vps.moduleLevel}</strong>
                    </div>

                    <button
                      onClick={() => upgradeVpsModule(vps.id)}
                      disabled={!canAffordUpgrade}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center space-x-1 ${
                        canAffordUpgrade
                          ? 'bg-black hover:bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      <span>Upgrade (${upgradeCost.toLocaleString()})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Catalog: Rent New VPS */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
          Catálogo de Servidores Cloud Dedicados
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(vpsCatalog.length > 0 ? vpsCatalog : [
            {
              tier: 'micro' as const,
              name: 'Instância Cloud Micro (Frankfurt)',
              location: 'Alemanha (DE)',
              cost: 1200,
              cpuPower: 4.0,
              networkMbps: 500,
              desc: 'Servidor virtual em datacenter europeu de baixa latência.',
            },
            {
              tier: 'beast' as const,
              name: 'Servidor Dedicado Beast (Tóquio)',
              location: 'Japão (JP)',
              cost: 4500,
              cpuPower: 8.0,
              networkMbps: 2000,
              desc: 'Hardware de alta densidade computacional com uplink de 2 Gbps.',
            },
            {
              tier: 'quantum' as const,
              name: 'Cluster Quântico Subterrâneo (Islândia)',
              location: 'Islândia (IS)',
              cost: 14000,
              cpuPower: 20.0,
              networkMbps: 10000,
              desc: 'Cluster alimentado por energia geotérmica com infraestrutura militar.',
            }
          ]).map(spec => {
            const canAfford = player.cash >= spec.cost;

            return (
              <div
                key={spec.tier}
                className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 border border-gray-100"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                      <Server className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                      {spec.location}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-gray-900 mt-3">{spec.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{spec.desc}</p>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs font-mono text-gray-600">
                    <div>CPU: <strong className="text-gray-900">{spec.cpuPower} GHz</strong></div>
                    <div>Link: <strong className="text-gray-900">{spec.networkMbps} Mbps</strong></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="font-mono text-xs">
                    <div className="text-[10px] text-gray-400">Preço de Locação</div>
                    <div className={`font-bold ${canAfford ? 'text-gray-900' : 'text-red-500'}`}>
                      ${spec.cost.toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => rentVps(spec.tier as any)}
                    disabled={!canAfford || vpsList.length >= 6}
                    className={`text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center space-x-1.5 ${
                      canAfford && vpsList.length < 6
                        ? 'bg-black hover:bg-gray-800 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Contratar VPS</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
