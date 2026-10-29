import React from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { Activity } from 'lucide-react';

export const TaskProgressPopup: React.FC = () => {
  const { processes, currentView, setCurrentView } = useGameStore();

  if (processes.length === 0 || currentView === 'processes') return null;

  const currentTask = processes[0];
  const remainingSec = Math.max(0, Math.ceil((currentTask.endTime - Date.now()) / 1000));

  return (
    <div
      onClick={() => setCurrentView('processes')}
      className="fixed bottom-16 sm:bottom-5 right-3 sm:right-5 z-30 bg-white text-gray-900 border border-gray-200 rounded-2xl p-3.5 sm:p-4 shadow-xl cursor-pointer hover:shadow-2xl transition-all max-w-[calc(100vw-24px)] sm:max-w-xs w-full select-none"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-black animate-pulse" />
          <span className="text-xs font-bold text-gray-900">
            {processes.length > 1 ? `${processes.length} Tarefas em Andamento` : 'Tarefa em Execução'}
          </span>
        </div>
        <span className="text-[11px] font-mono text-gray-900 font-bold">{currentTask.progress}%</span>
      </div>

      <div className="text-[11px] text-gray-600 truncate mb-2 font-sans">
        {currentTask.targetFileName || currentTask.targetIp ? (
          <span>{currentTask.targetFileName || currentTask.targetIp}</span>
        ) : (
          <span>{currentTask.type.toUpperCase()}</span>
        )}
        <span className="text-gray-400 ml-1">(~{remainingSec}s)</span>
      </div>

      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-black h-full transition-all duration-200 rounded-full"
          style={{ width: `${currentTask.progress}%` }}
        />
      </div>
    </div>
  );
};
