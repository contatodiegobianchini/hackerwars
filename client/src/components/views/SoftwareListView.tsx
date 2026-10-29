import React from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import {
  FolderArchive,
  HardDrive,
  Sparkles,
  ShieldAlert,
  Cpu,
  Zap,
  Radio,
  FileCode,
  Lock,
  Trash2,
  Clock,
  DollarSign,
  RefreshCw,
  Eye
} from 'lucide-react';
import { SoftwareItem, SoftwareType, GameProcess } from '../../types/game.js';

export const getCompileCost = (version: number): number => {
  const steps = Math.max(0, Math.round((version - 1.0) * 10));
  return Math.round(50 + steps * 30 + Math.pow(steps, 1.32) * 15);
};

export const getBaseCompileSeconds = (version: number): number => {
  const steps = Math.max(0, Math.round((version - 1.0) * 10));
  return 60 + steps * 30;
};

export const formatCompileTime = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${secs}s`;
};

export const SoftwareListView: React.FC = () => {
  const { player, processes, startProcess, deleteLocalSoftware } = useGameStore();

  if (!player) return null;

  const usedStorage = player.hardware.hdd.usedMb;
  const totalStorage = player.hardware.hdd.capacityMb;
  const storagePercent = Math.min(100, Math.round((usedStorage / totalStorage) * 100));

  const getSoftwareInfo = (type: SoftwareType) => {
    switch (type) {
      case 'cracker':
        return {
          icon: Zap,
          desc: 'Ferramenta de invasão para quebrar senhas (Bruteforce). Seu nível deve ser MAIOR OU IGUAL ao Hasher do alvo.',
        };
      case 'hasher':
        return {
          icon: Lock,
          desc: 'Criptografia defensiva do seu servidor. Protege seus arquivos e acessos contra outros invasores.',
        };
      case 'firewall':
        return {
          icon: ShieldAlert,
          desc: 'Barreira de rede avançada. Protege seu sistema contra ataques DDoS e tentativas de varredura.',
        };
      case 'portscan':
        return {
          icon: Radio,
          desc: 'Scanner de portas e serviços abertos em servidores remotos na rede.',
        };
      case 'miner':
        return {
          icon: Cpu,
          desc: 'Minerador de criptomoedas para ser injetado em servidores vulneráveis e gerar renda passiva.',
        };
      case 'ddos':
        return {
          icon: Radio,
          desc: 'Controlador de Botnet para derrubar servidores remotos com tráfego massivo.',
        };
      case 'spyware':
        return {
          icon: Eye,
          desc: 'Trojan Keylogger de espionagem furtiva. Intercepta senhas bancárias e chaves privadas de Bitcoin dos alvos monitorados.',
        };
      default:
        return {
          icon: FileCode,
          desc: 'Arquivo de dados ou documento confidencial.',
        };
    }
  };

  const handleResearch = (soft: SoftwareItem) => {
    const isAlreadyCompiling = processes.some(
      p => p.type === 'compile' && (p.details?.softwareId === soft.id || p.targetFileId === soft.id) && p.status === 'running'
    );
    if (isAlreadyCompiling) {
      alert(`O software "${soft.name}" já está sendo compilado! Aguarde a conclusão da evolução atual.`);
      return;
    }

    const cost = getCompileCost(soft.version);
    if (player.cash < cost) {
      alert(`Saldo insuficiente! Necessário $${cost.toLocaleString()} para pesquisar esta versão.`);
      return;
    }

    startProcess('compile', {
      softwareId: soft.id,
      targetFileName: `${soft.name} (v${(soft.version + 0.1).toFixed(1)})`,
      details: { softwareId: soft.id }
    });
  };

  const handleDelete = (soft: SoftwareItem) => {
    if (confirm(`Deseja realmente excluir/desinstalar "${soft.name}" e liberar ${soft.sizeMb}MB?`)) {
      deleteLocalSoftware(soft.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Storage Bar */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <FolderArchive className="w-5 h-5 text-gray-700" />
              <h1 className="text-base font-bold text-gray-900">Meus Softwares Instalados</h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Pesquise novas versões das suas ferramentas usando poder de CPU/GPU e fundos em USD.
            </p>
          </div>

          {/* Disk space usage */}
          <div className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl text-xs flex items-center space-x-3">
            <HardDrive className="w-4 h-4 text-gray-600 shrink-0" />
            <div>
              <div className="flex justify-between font-mono text-[11px] text-gray-500 space-x-4">
                <span>ESPAÇO EM DISCO</span>
                <span className="font-bold text-gray-900">{usedStorage} / {totalStorage} MB</span>
              </div>
              <div className="w-36 bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-gray-700 h-full" style={{ width: `${storagePercent}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Software Inventory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {player.software.map(soft => {
          const info = getSoftwareInfo(soft.type);
          const Icon = info.icon;
          const nextVersion = (soft.version + 0.1).toFixed(1);
          const cost = getCompileCost(soft.version);
          const canAfford = player.cash >= cost;

          const baseSec = getBaseCompileSeconds(soft.version);
          const computePower = (player.hardware.cpu.clockSpeedGhz / 2.0) * 0.85 + ((player.hardware.gpu?.tflops || 0.5) / 10.0) * 0.15;
          const estimatedSec = Math.max(10, Math.round(baseSec / Math.max(0.6, computePower)));

          const activeProcess = processes.find(
            p => p.type === 'compile' && (p.details?.softwareId === soft.id || p.targetFileId === soft.id) && p.status === 'running'
          );
          const isCompiling = !!activeProcess;

          return (
            <div
              key={soft.id}
              className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 border border-gray-100"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm text-gray-900">{soft.name}</h3>
                        <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                          v{soft.version.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                        Tamanho: {soft.sizeMb} MB • Tipo: {soft.type.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mt-3 leading-relaxed">{info.desc}</p>
              </div>

              {/* Actions: Research & Delete */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => handleDelete(soft)}
                  className="text-xs text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-gray-100 transition flex items-center space-x-1"
                  title={`Excluir ${soft.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Excluir</span>
                </button>

                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="text-right text-[10px] sm:text-[11px] font-mono text-gray-500 flex flex-col items-end">
                    <div className="flex items-center space-x-0.5 justify-end">
                      <DollarSign className="w-3 h-3 text-gray-400" />
                      <span className={canAfford ? 'text-gray-900 font-bold' : 'text-red-500 font-bold'}>
                        ${cost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-0.5 text-gray-400 justify-end text-[9px] sm:text-[10px]">
                      <Clock className="w-3 h-3" />
                      <span>~{formatCompileTime(estimatedSec)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleResearch(soft)}
                    disabled={!canAfford || isCompiling}
                    className={`font-semibold text-xs px-2.5 sm:px-3.5 py-2 rounded-xl shadow-sm transition flex items-center space-x-1.5 ${
                      isCompiling
                        ? 'bg-amber-50 text-amber-900 border border-amber-300 cursor-not-allowed'
                        : canAfford
                          ? 'bg-black hover:bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isCompiling ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
                        <span className="truncate">Compilando ({activeProcess?.progress || 0}%)</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Evoluir v{nextVersion}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
