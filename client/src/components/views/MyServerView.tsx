import React from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import {
  Server,
  Cpu,
  Layers,
  HardDrive,
  Wifi,
  Zap,
  Globe,
  FolderArchive,
  Target,
  ShieldAlert,
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const MyServerView: React.FC = () => {
  const { player, setCurrentView, allServers } = useGameStore();

  if (!player) return null;

  const usedStorage = player.hardware.hdd.usedMb;
  const totalStorage = player.hardware.hdd.capacityMb;
  const storagePercent = Math.min(100, Math.round((usedStorage / totalStorage) * 100));

  const gpu = player.hardware.gpu || {
    level: 1,
    name: 'Vídeo Integrado HD Graphics (0.5 TFLOPS)',
    tflops: 0.5,
    miningMultiplier: 1.0,
    cost: 0,
  };

  const activeMinerServers = (allServers.length > 0 ? allServers : [])
    .filter(s => s.activeMiners && s.activeMiners.some((m: any) => m.ownerId === player.id));

  const totalHashRate = activeMinerServers.reduce((acc, s) => {
    const miner = s.activeMiners.find((m: any) => m.ownerId === player.id);
    return acc + (miner ? miner.hashRate : 0);
  }, 0);

  const totalMinedUsdPer5s = activeMinerServers.reduce((acc, s) => {
    const miner = s.activeMiners.find((m: any) => m.ownerId === player.id);
    if (!miner) return acc;
    const cpuPower = s.hardware?.cpuPower || 2.0;
    const minerLevel = miner.minerLevel || 1.0;
    return acc + (cpuPower * minerLevel * 0.005 * (gpu.miningMultiplier || 1.0));
  }, 0);

  const estimatedUsdPerMin = totalMinedUsdPer5s * 12;
  const btcPrice = 68000;
  const estimatedBtcPerMin = estimatedUsdPerMin / btcPrice;

  return (
    <div className="space-y-4">
      {/* 1. User Profile Card */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-100">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
            <Server className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-gray-900">{player.username}</span>
              <span className="text-xs text-gray-500 font-medium">{player.rank}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              IP Local: <strong className="text-gray-900 font-semibold font-mono">{player.ip}</strong> • Reputação: <strong className="text-gray-900 font-semibold">{player.reputation} REP</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3 w-full sm:w-auto text-left sm:text-right">
          <div className="bg-gray-50 border border-gray-100 px-3 sm:px-4 py-2 rounded-xl flex-1 sm:flex-initial">
            <div className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">SALDO FIAT</div>
            <div className="text-xs sm:text-sm font-bold text-gray-900 font-mono mt-0.5">${player.cash.toLocaleString()}</div>
          </div>

          <div className="bg-gray-50 border border-gray-100 px-3 sm:px-4 py-2 rounded-xl flex-1 sm:flex-initial">
            <div className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">BITCOIN (BTC)</div>
            <div className="text-xs sm:text-sm font-bold text-gray-900 font-mono mt-0.5">{player.crypto?.toFixed(4) || 0} BTC</div>
          </div>
        </div>
      </div>

      {/* 2. Hardware 6-Column Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* VPN / Tor */}
        <div
          onClick={() => setCurrentView('hardware')}
          className="bg-white text-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">VPN / TOR</span>
            <Globe className="w-4 h-4 text-gray-700" />
          </div>
          <div className="text-base font-bold text-gray-900 font-mono mt-2">+{player.hardware.vpn?.traceDelaySec || 0}s Buffer</div>
          <div className="text-[11px] text-gray-500 mt-1 truncate">{player.hardware.vpn?.name || 'Tor Básico'}</div>
        </div>

        {/* Processor */}
        <div
          onClick={() => setCurrentView('hardware')}
          className="bg-white text-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">PROCESSADOR</span>
            <Cpu className="w-4 h-4 text-gray-700" />
          </div>
          <div className="text-base font-bold text-gray-900 font-mono mt-2">{player.hardware.cpu.clockSpeedGhz} GHz</div>
          <div className="text-[11px] text-gray-500 mt-1 truncate">{player.hardware.cpu.name}</div>
        </div>

        {/* GPU */}
        <div
          onClick={() => setCurrentView('hardware')}
          className="bg-white text-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">PLACA DE VÍDEO</span>
            <Zap className="w-4 h-4 text-gray-700" />
          </div>
          <div className="text-base font-bold text-gray-900 font-mono mt-2">{gpu.tflops} TFLOPS</div>
          <div className="text-[11px] text-gray-500 mt-1 truncate">{gpu.name}</div>
        </div>

        {/* RAM */}
        <div
          onClick={() => setCurrentView('hardware')}
          className="bg-white text-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">MEMÓRIA RAM</span>
            <Layers className="w-4 h-4 text-gray-700" />
          </div>
          <div className="text-base font-bold text-gray-900 font-mono mt-2">{player.hardware.ram.maxTasks} Tarefas</div>
          <div className="text-[11px] text-gray-500 mt-1">{player.hardware.ram.capacityGb} GB DDR4</div>
        </div>

        {/* Storage */}
        <div
          onClick={() => setCurrentView('hardware')}
          className="bg-white text-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">DISCO RÍGIDO</span>
            <HardDrive className="w-4 h-4 text-gray-700" />
          </div>
          <div className="text-base font-bold text-gray-900 font-mono mt-2">{usedStorage}/{totalStorage} MB</div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-gray-700 h-full rounded-full" style={{ width: `${storagePercent}%` }} />
          </div>
        </div>

        {/* Network */}
        <div
          onClick={() => setCurrentView('hardware')}
          className="bg-white text-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">CONEXÃO</span>
            <Wifi className="w-4 h-4 text-gray-700" />
          </div>
          <div className="text-base font-bold text-gray-900 font-mono mt-2">{player.hardware.network.speedMbps} Mbps</div>
          <div className="text-[11px] text-gray-500 mt-1 truncate">{player.hardware.network.name}</div>
        </div>
      </div>

      {/* 3. Mining Banner */}
      <div
        onClick={() => setCurrentView('crypto')}
        className="bg-white text-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-100"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs text-gray-900">
              Mineração de Cripto em Segundo Plano
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {activeMinerServers.length} Servidores infectados minerando ({totalHashRate.toFixed(1)} GH/s ativos)
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <span>
            {activeMinerServers.length > 0
              ? `+${estimatedBtcPerMin.toFixed(7)} BTC / min ($${estimatedUsdPerMin.toFixed(2)}/min)`
              : '0.0000000 BTC / min'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 4. Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Softwares */}
        <div
          onClick={() => setCurrentView('software')}
          className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
              <FolderArchive className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
              {player.software.length} Softwares
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">Softwares & Exploits</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Gerencie seus crackers, hashers, portscanners e botnets. Evolua versões usando tempo e dinheiro.
            </p>
          </div>
          <div className="flex items-center space-x-1 text-xs font-semibold text-gray-900 pt-1">
            <span>Acessar Softwares</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Targets & Known Servers */}
        <div
          onClick={() => setCurrentView('known_servers')}
          className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
              {player.discoveredIps.length} Alvos
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">Servidores Conhecidos</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Explore empresas, bancos e órgãos do governo descobertos na rede. Conecte-se para invadir ou minerar.
            </p>
          </div>
          <div className="flex items-center space-x-1 text-xs font-semibold text-gray-900 pt-1">
            <span>Ver Servidores</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
