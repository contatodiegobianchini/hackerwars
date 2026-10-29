import React from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { FileText, ShieldCheck } from 'lucide-react';

export const MyLogsView: React.FC = () => {
  const { player } = useGameStore();

  if (!player) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-gray-700" />
          <h1 className="text-base font-bold text-gray-900">Registros de Conexão Local (Meus Logs)</h1>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          Histórico de eventos, conexões e inicialização do seu próprio computador ({player.ip}).
        </p>
      </div>

      {/* Logs List */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm space-y-3 font-mono text-xs">
        {player.logs.map(log => (
          <div
            key={log.id}
            className="bg-gray-50 border border-gray-100 p-3.5 rounded-xl flex items-center justify-between"
          >
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">
                <span>[{log.formattedTime}]</span> • IP Origem: <strong className="text-gray-900">{log.ip}</strong>
              </div>
              <div className="text-gray-800 font-sans">{log.action}</div>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
