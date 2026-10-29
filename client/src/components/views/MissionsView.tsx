import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { Target, DollarSign, Bitcoin, Award, CheckCircle2, ExternalLink } from 'lucide-react';
import { MissionDifficulty } from '../../types/game.js';

export const MissionsView: React.FC = () => {
  const {
    player,
    missions,
    acceptMission,
    claimMission,
    connectToTarget,
    allServers
  } = useGameStore();

  const [tab, setTab] = useState<'available' | 'active'>('available');

  if (!player) return null;

  const activeMissions = player.activeMissions || [];
  const availableMissions = missions.filter(m => !activeMissions.some(am => am.id === m.id));

  const getDifficultyBadge = (diff: MissionDifficulty) => {
    switch (diff) {
      case 'Easy': return { label: 'Fácil', bg: 'bg-emerald-100 text-emerald-800' };
      case 'Medium': return { label: 'Médio', bg: 'bg-blue-100 text-blue-800' };
      case 'Hard': return { label: 'Difícil', bg: 'bg-amber-100 text-amber-800' };
      case 'Elite': return { label: 'Elite', bg: 'bg-purple-100 text-purple-800' };
      default: return { label: diff, bg: 'bg-gray-100 text-gray-700' };
    }
  };

  const isMissionCompletable = (mission: any) => {
    if (mission.type === 'steal_file' && mission.requiredFileName) {
      return player.software.some(s => s.name === mission.requiredFileName);
    }
    if (mission.type === 'wipe_server') {
      const srv = allServers.find(s => s.ip === mission.targetIp);
      return srv ? srv.logs.length === 0 : false;
    }
    if (mission.type === 'hack_bank') {
      const srv = allServers.find(s => s.ip === mission.targetIp);
      return srv ? srv.security.isBreached : false;
    }
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Header & Tabs */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-gray-700" />
              <h1 className="text-base font-bold text-gray-900">Quadro de Contratos & Missões</h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Complete objetivos anônimos para ganhar dinheiro, criptomoedas e subir no Ranking Hacker.
            </p>
          </div>

          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setTab('available')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                tab === 'available' ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Disponíveis ({availableMissions.length})
            </button>
            <button
              onClick={() => setTab('active')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                tab === 'active' ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Em Andamento ({activeMissions.length})
            </button>
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {tab === 'available' ? (
          availableMissions.length === 0 ? (
            <div className="bg-white text-gray-900 rounded-2xl p-12 text-center text-xs text-gray-500">
              Todos os contratos foram aceitos. Novos contratos surgirão em breve!
            </div>
          ) : (
            availableMissions.map(m => {
              const diff = getDifficultyBadge(m.difficulty);

              return (
                <div
                  key={m.id}
                  className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          CONTRATANTE: {m.employer}
                        </div>
                        <h3 className="font-bold text-sm text-gray-900 mt-0.5">{m.title}</h3>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${diff.bg}`}>
                        {diff.label}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">{m.description}</p>

                    <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500 font-mono">
                      <span>ALVO:</span>
                      <strong className="text-gray-900">{m.targetIp}</strong>
                      {m.targetDomain && <span className="text-gray-400">({m.targetDomain})</span>}
                    </div>
                  </div>

                  {/* Rewards and Accept Button */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs font-mono">
                      <div className="flex items-center space-x-1 text-emerald-600 font-bold">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>${m.rewardCash.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-amber-600 font-bold">
                        <Bitcoin className="w-3.5 h-3.5" />
                        <span>{m.rewardCrypto} BTC</span>
                      </div>
                      <div className="flex items-center space-x-1 text-blue-600 font-bold">
                        <Award className="w-3.5 h-3.5" />
                        <span>+{m.rewardRep} REP</span>
                      </div>
                    </div>

                    <button
                      onClick={() => acceptMission(m.id)}
                      className="bg-black hover:bg-gray-800 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-sm transition"
                    >
                      Aceitar Contrato
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : (
          activeMissions.length === 0 ? (
            <div className="bg-white text-gray-900 rounded-2xl p-12 text-center text-xs text-gray-500">
              Nenhuma missão em andamento no momento. Vá para a aba "Disponíveis" e aceite um contrato!
            </div>
          ) : (
            activeMissions.map(m => {
              const diff = getDifficultyBadge(m.difficulty);
              const ready = isMissionCompletable(m);

              return (
                <div
                  key={m.id}
                  className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          EM ANDAMENTO • {m.employer}
                        </div>
                        <h3 className="font-bold text-sm text-gray-900 mt-0.5">{m.title}</h3>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${diff.bg}`}>
                        {diff.label}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">{m.description}</p>

                    <div className="mt-3 flex items-center space-x-3 text-xs">
                      <button
                        onClick={() => connectToTarget(m.targetIp)}
                        className="text-blue-600 hover:underline flex items-center space-x-1 font-mono"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Conectar ao Alvo ({m.targetIp})</span>
                      </button>
                    </div>
                  </div>

                  {/* Claim Button */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs font-mono">
                      <span className="text-emerald-600 font-bold">+${m.rewardCash.toLocaleString()}</span>
                      <span className="text-amber-600 font-bold">+{m.rewardCrypto} BTC</span>
                      <span className="text-blue-600 font-bold">+{m.rewardRep} REP</span>
                    </div>

                    <button
                      onClick={() => claimMission(m.id)}
                      className={`font-semibold text-xs px-4 py-2 rounded-xl transition shadow-sm flex items-center space-x-1.5 ${
                        ready
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{ready ? 'Entregar & Coletar Recompensa!' : 'Verificar Status'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
};
