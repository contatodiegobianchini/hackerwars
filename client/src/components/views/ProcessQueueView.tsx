import React from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { Activity, Layers, Key, Download, Upload, Search, Sparkles, Trash2, Flame } from 'lucide-react';
import { ProcessType } from '../../types/game.js';

export const ProcessQueueView: React.FC = () => {
  const { player, processes, cancelProcess, setCurrentView } = useGameStore();

  if (!player) return null;

  const usedSlots = processes.length;
  const maxSlots = player.hardware.ram.maxTasks;

  const getProcessDetails = (type: ProcessType) => {
    switch (type) {
      case 'crack': return { label: 'Quebra de Senha (Cracking)', icon: Key };
      case 'download': return { label: 'Download de Arquivo', icon: Download };
      case 'upload': return { label: 'Upload / Instalação de Minerador', icon: Upload };
      case 'scan': return { label: 'Varredura de Portas', icon: Search };
      case 'compile': return { label: 'Pesquisa / Compilação de Software', icon: Sparkles };
      case 'wipelog': return { label: 'Limpeza de Logs de Acesso', icon: Trash2 };
      case 'ddos': return { label: 'Ataque DDoS (Negação de Serviço)', icon: Flame };
      default: return { label: type.toUpperCase(), icon: Activity };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & RAM Status */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-gray-700" />
              <h1 className="text-base font-bold text-gray-900">Fila de Processos em Execução</h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Tarefas rodando em segundo plano utilizando sua memória RAM e CPU.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl text-xs flex items-center space-x-3">
            <Layers className="w-4 h-4 text-gray-600 shrink-0" />
            <div>
              <div className="text-[11px] text-gray-500 font-mono">
                SLOTS DE RAM: <strong className="text-gray-900">{usedSlots} / {maxSlots} TAREFAS</strong>
              </div>
              {usedSlots >= maxSlots && (
                <button
                  onClick={() => setCurrentView('hardware')}
                  className="text-[10px] text-blue-600 hover:underline mt-0.5 block"
                >
                  + Fazer upgrade de RAM para rodar mais tarefas
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Process Cards */}
      <div className="space-y-3">
        {processes.length === 0 ? (
          <div className="bg-white text-gray-900 rounded-2xl p-12 text-center shadow-sm space-y-2">
            <Activity className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="font-bold text-gray-900 text-sm">Nenhuma tarefa ativa no momento</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Quando você quebrar senhas, baixar arquivos, instalar mineradores ou atacar com DDoS, o progresso aparecerá aqui em tempo real.
            </p>
          </div>
        ) : (
          processes.map(proc => {
            const info = getProcessDetails(proc.type);
            const Icon = info.icon;
            const remainingSec = Math.max(0, Math.ceil((proc.endTime - Date.now()) / 1000));

            return (
              <div
                key={proc.id}
                className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm flex flex-col space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="font-bold text-xs text-gray-900">{info.label}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {proc.targetFileName && <span>Alvo/Arquivo: <strong className="text-gray-900">{proc.targetFileName}</strong> • </span>}
                        {proc.targetIp && <span>IP: <strong className="text-gray-900">{proc.targetIp}</strong> • </span>}
                        <span>Restante: <strong className="text-gray-900 font-mono">~{remainingSec}s</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => cancelProcess(proc.id)}
                    className="text-xs text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 px-3 py-1 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-gray-500">
                    <span>Progresso</span>
                    <span className="font-bold text-gray-900">{proc.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 rounded-full ${
                        proc.type === 'ddos' ? 'bg-red-600' : 'bg-black'
                      }`}
                      style={{ width: `${proc.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
