import React from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { Cpu, Layers, HardDrive, Wifi, CheckCircle2, ArrowUpCircle, Zap, Globe, Shield, Snowflake } from 'lucide-react';

export const HardwareShopView: React.FC = () => {
  const { player, upgradeHardware } = useGameStore();

  if (!player) return null;

  const currentGpu = player.hardware.gpu || {
    level: 1,
    name: 'Vídeo Integrado HD Graphics (0.5 TFLOPS)',
    tflops: 0.5,
    miningMultiplier: 1.0,
    cost: 0,
  };

  const currentVpn = player.hardware.vpn || {
    level: 1,
    name: 'Tor Básico Comunitário (1 Nó)',
    nodesCount: 1,
    traceDelaySec: 0,
    encryptionType: 'TLS 1.2 Básico',
    cost: 0,
  };

  const currentCooling = player.hardware.cooling || {
    level: 1,
    name: 'Cooler Stock Básico (Air Cooler)',
    tempReductionPct: 0,
    maxSafeTasks: 2,
    cost: 0,
  };

  const hardwareTypes: Array<{
    type: 'cpu' | 'gpu' | 'ram' | 'hdd' | 'network' | 'vpn' | 'cooling';
    name: string;
    icon: React.ElementType;
    current: any;
    nextLevel: number;
    cost: number;
    benefits: string;
  }> = [
    {
      type: 'cooling',
      name: 'Sistema de Resfriamento & Thermal Cooling',
      icon: Snowflake,
      current: currentCooling,
      nextLevel: currentCooling.level + 1,
      cost: currentCooling.level === 1 ? 900 : currentCooling.level === 2 ? 2800 : currentCooling.level === 3 ? 7500 : 18000,
      benefits: 'Reduz a temperatura do PC (-25% a -100%) e evita superaquecimento (Thermal Throttling) ao executar múltiplas invasões e mineração simultâneas.',
    },
    {
      type: 'vpn',
      name: 'VPN & Roteamento Tor (Desacelera Polícia)',
      icon: Globe,
      current: currentVpn,
      nextLevel: currentVpn.level + 1,
      cost: currentVpn.level === 1 ? 800 : currentVpn.level === 2 ? 2500 : currentVpn.level === 3 ? 7000 : 18000,
      benefits: `Roteia conexões em camadas Onion secretas. Adiciona +${currentVpn.traceDelaySec}s de atraso contra rastreamento policial e cartéis. Próximo nível: +${currentVpn.level === 1 ? 25 : currentVpn.level === 2 ? 60 : currentVpn.level === 3 ? 120 : 240}s de proteção extra!`,
    },
    {
      type: 'cpu',
      name: 'Processador (CPU)',
      icon: Cpu,
      current: player.hardware.cpu,
      nextLevel: player.hardware.cpu.level + 1,
      cost: player.hardware.cpu.level === 1 ? 750 : player.hardware.cpu.level === 2 ? 2200 : player.hardware.cpu.level === 3 ? 6500 : 18000,
      benefits: 'Aumenta drasticamente a velocidade de quebra de senhas (Crack) e compilação de softwares.',
    },
    {
      type: 'gpu',
      name: 'Placa de Vídeo (GPU Dedicada)',
      icon: Zap,
      current: currentGpu,
      nextLevel: currentGpu.level + 1,
      cost: currentGpu.level === 1 ? 850 : currentGpu.level === 2 ? 2400 : currentGpu.level === 3 ? 6800 : 18000,
      benefits: 'Acelera a quebra de senhas por força bruta via GPU e multiplica o ganho em dólares de toda a sua mineração de criptomoedas.',
    },
    {
      type: 'ram',
      name: 'Memória RAM',
      icon: Layers,
      current: player.hardware.ram,
      nextLevel: player.hardware.ram.level + 1,
      cost: player.hardware.ram.level === 1 ? 600 : player.hardware.ram.level === 2 ? 1800 : player.hardware.ram.level === 3 ? 4500 : 12000,
      benefits: 'Permite executar mais tarefas simultâneas em segundo plano (2 → 3 → 5 → 8 → 14 processos).',
    },
    {
      type: 'hdd',
      name: 'Armazenamento (SSD)',
      icon: HardDrive,
      current: player.hardware.hdd,
      nextLevel: player.hardware.hdd.level + 1,
      cost: player.hardware.hdd.level === 1 ? 400 : player.hardware.hdd.level === 2 ? 1200 : player.hardware.hdd.level === 3 ? 3500 : 9000,
      benefits: 'Expande o espaço em disco para guardar mais softwares, mineradores e arquivos de missões.',
    },
    {
      type: 'network',
      name: 'Conexão de Rede (ISP / Fibra)',
      icon: Wifi,
      current: player.hardware.network,
      nextLevel: player.hardware.network.level + 1,
      cost: player.hardware.network.level === 1 ? 500 : player.hardware.network.level === 2 ? 1500 : player.hardware.network.level === 3 ? 4800 : 14000,
      benefits: 'Acelera o tempo de download/upload e fortalece o poder da sua Botnet em ataques DDoS.',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-gray-700" />
              <h1 className="text-base font-bold text-gray-900">Loja de Peças & Hardware</h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Melhore seu computador com CPUs, GPUs dedicadas e links gigabit para invadir servidores de elite.
            </p>
          </div>

          <div className="text-xs font-mono bg-gray-50 border border-gray-100 text-emerald-600 px-3.5 py-1.5 rounded-xl font-bold">
            SALDO DISPONÍVEL: ${player.cash.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Grid of Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hardwareTypes.map(item => {
          const Icon = item.icon;
          const isMax = item.current.level >= 5;
          const canAfford = player.cash >= item.cost;

          return (
            <div
              key={item.type}
              className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 border border-gray-100"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{item.name}</h3>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">{item.current.name}</div>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                    LVL {item.current.level}/5
                  </span>
                </div>

                <p className="text-xs text-gray-600 mt-3 leading-relaxed">{item.benefits}</p>
              </div>

              {/* Action Button & Cost */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                {isMax ? (
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Nível Máximo Atingido</span>
                  </div>
                ) : (
                  <>
                    <div className="font-mono text-xs">
                      <div className="text-[10px] text-gray-400">Custo do Upgrade</div>
                      <div className={`font-bold ${canAfford ? 'text-gray-900' : 'text-red-500'}`}>
                        ${item.cost.toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => upgradeHardware(item.type)}
                      disabled={!canAfford}
                      className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                        canAfford
                          ? 'bg-black hover:bg-gray-800 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      <span>Fazer Upgrade (Lvl {item.nextLevel})</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
