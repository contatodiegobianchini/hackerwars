import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Award,
  DollarSign,
  Sparkles,
  ArrowRight,
  Terminal,
  Target,
  MessageSquare,
  ShieldAlert,
  Zap,
  Flame,
  Bitcoin,
  Radio,
  FileText
} from 'lucide-react';
import { StoryChapter, StoryChoice, FactionType, StoryObjective } from '../../types/game.js';

export const CampaignView: React.FC = () => {
  const {
    player,
    storyChapters,
    servers,
    allServers,
    submitStoryChoice,
    connectToTarget,
    setCurrentView,
    setFactionAlignment
  } = useGameStore();

  const [selectedChapterId, setSelectedChapterId] = useState<string>('chap-1');

  if (!player) return null;

  const currentChapter = storyChapters.find(c => c.id === selectedChapterId) || storyChapters[0];
  const factionRep = player.factionReputation || { anonymous: 0, russian_bears: 0, cartel: 0, lone_wolf: 0 };
  const currentAlignment = player.activeFactionAlignment || 'anonymous';
  const unlockedPerks = player.unlockedStoryPerks || [];
  const completedCount = player.completedStoryChapters?.length || 0;

  const isObjectiveMet = (obj: StoryObjective): boolean => {
    if (obj.completed) return true;

    const targetServer = allServers.find(s => s.ip === obj.targetIp) || servers.find(s => s.ip === obj.targetIp);
    const isBreached = player.hackedIps.includes(obj.targetIp) || !!targetServer?.security?.isBreached;

    switch (obj.type) {
      case 'crack':
        return isBreached;
      case 'download':
        if (!obj.targetFileName) return isBreached;
        return player.software.some(s =>
          s.name.toLowerCase() === obj.targetFileName?.toLowerCase() ||
          s.name.toLowerCase().includes(obj.targetFileName?.toLowerCase() || '')
        );
      case 'spyware':
        return !!targetServer?.activeSpyware?.some(sp => sp.ownerId === player.id);
      case 'wipe_logs':
        if (!targetServer) return false;
        const hasLogs = targetServer.logs?.some(l => l.ip === player.ip || (player.username && l.action.includes(player.username)));
        return isBreached && !hasLogs;
      case 'ddos':
        return targetServer?.isOnline === false;
      case 'bank_heist':
        return isBreached;
      default:
        return isBreached;
    }
  };

  const areAllObjectivesCompleted = currentChapter
    ? currentChapter.objectives.every(obj => isObjectiveMet(obj))
    : false;

  return (
    <div className="space-y-4 select-none">
      {/* Top Narrative Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-zinc-900 text-white rounded-3xl p-6 shadow-xl border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-2xl shrink-0">
              ⚔️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white">Modo Campanha // A Guerra Invisível do Ciberespaço</h1>
                <span className="text-[10px] font-mono font-bold bg-white/20 text-white px-2 py-0.5 rounded-full uppercase">
                  10 CAPÍTULOS • 4 DESFECHOS
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Escolha seu caminho entre a Anonymous, o Sindicato Russo, o Narco-Cartel ou Mercenário Solo.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentView('dark_chat')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg transition flex items-center space-x-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Abrir DarkIRC Chat</span>
            </button>
          </div>
        </div>

        {/* Faction Alignment Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-800">
          <div className={`p-3 rounded-2xl border transition ${
            currentAlignment === 'anonymous' ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-300' : 'bg-zinc-900/60 border-zinc-800 text-gray-400'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span>🎭 Anonymous</span>
              <span>{factionRep.anonymous} REP</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Hacktivismo & Verdade</div>
          </div>

          <div className={`p-3 rounded-2xl border transition ${
            currentAlignment === 'russian_bears' ? 'bg-red-950/40 border-red-600/70 text-red-300' : 'bg-zinc-900/60 border-zinc-800 text-gray-400'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span>🐻 Sindicato Russo</span>
              <span>{factionRep.russian_bears} REP</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Ciberguerra & Zero-Days</div>
          </div>

          <div className={`p-3 rounded-2xl border transition ${
            currentAlignment === 'cartel' ? 'bg-amber-950/40 border-amber-600/70 text-amber-300' : 'bg-zinc-900/60 border-zinc-800 text-gray-400'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span>💀 Narco-Cartel</span>
              <span>{factionRep.cartel} REP</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Lavagem & Assaltos</div>
          </div>

          <div className={`p-3 rounded-2xl border transition ${
            currentAlignment === 'lone_wolf' ? 'bg-purple-950/40 border-purple-600/70 text-purple-300' : 'bg-zinc-900/60 border-zinc-800 text-gray-400'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span>🐺 Lobo Solitário</span>
              <span>{factionRep.lone_wolf} REP</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Singularidade Quântica</div>
          </div>
        </div>

        {/* Unlocked Perks Showcase */}
        {player.unlockedStoryPerks && player.unlockedStoryPerks.length > 0 && (
          <div className="pt-4 mt-4 border-t border-zinc-800/80">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Vantagens & Perks Desbloqueados
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {player.unlockedStoryPerks.map(perk => (
                <div
                  key={perk.id}
                  className="bg-zinc-800/50 border border-zinc-700/70 p-2.5 rounded-xl flex items-center space-x-2.5"
                >
                  <span className="text-lg">{perk.icon || '⭐'}</span>
                  <div className="truncate">
                    <div className="text-xs font-bold text-purple-300 truncate">{perk.name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{perk.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chapters Grid Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {storyChapters.map(chap => {
          const isSelected = selectedChapterId === chap.id;
          const isCompleted = chap.isCompleted;
          const isLocked = !chap.unlocked;

          return (
            <div
              key={chap.id}
              onClick={() => {
                if (!isLocked) setSelectedChapterId(chap.id);
              }}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                isSelected
                  ? 'bg-black text-white border-black shadow-md'
                  : isLocked
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-900 border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase ${
                  isSelected ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  CAP. {chap.chapterNumber}
                </span>

                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>

              <div className="font-bold text-xs truncate">{chap.title}</div>
              <div className={`text-[10px] truncate ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                {chap.factionName}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Chapter View */}
      {currentChapter && (
        <div className="bg-white text-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold bg-black text-white px-2.5 py-0.5 rounded-lg">
                  CAPÍTULO {currentChapter.chapterNumber}
                </span>
                <span className="text-xs text-gray-500 font-mono font-bold">Facção: {currentChapter.factionName}</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mt-2">{currentChapter.title}</h2>
            </div>

            {currentChapter.isCompleted ? (
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs font-mono flex items-center space-x-1.5 self-start sm:self-auto">
                <CheckCircle2 className="w-4 h-4" />
                <span>CAPÍTULO CONCLUÍDO</span>
              </span>
            ) : areAllObjectivesCompleted ? (
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs font-mono flex items-center space-x-1.5 self-start sm:self-auto animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>OBJETIVOS CONCLUÍDOS • ESCOLHA O DESFECHO</span>
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-xl font-bold text-xs font-mono flex items-center space-x-1.5 self-start sm:self-auto">
                <span>EM ANDAMENTO</span>
              </span>
            )}
          </div>

          <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
            {currentChapter.briefing}
          </p>

          {/* Dialogue Transcript */}
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Comunicações Criptografadas do Contratante
            </div>

            <div className="space-y-2">
              {currentChapter.dialogue.map((d, i) => {
                const ipRegex = /(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b)/g;
                const parts = d.text.split(ipRegex);

                return (
                  <div key={i} className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{d.avatar || '💬'}</span>
                      <span className="font-bold text-xs text-gray-900 font-mono">{d.speaker}</span>
                      <span className="text-[10px] text-gray-400 font-medium">({d.role})</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed font-sans pl-7">
                      {parts.map((part, pIdx) => {
                        if (ipRegex.test(part)) {
                          return (
                            <button
                              key={pIdx}
                              onClick={() => {
                                connectToTarget(part);
                                setCurrentView('target_server');
                              }}
                              className="inline-flex items-center space-x-1 font-mono font-bold text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-lg mx-1 my-0.5 transition shadow-sm"
                              title={`Conectar a ${part}`}
                            >
                              <span>🚀</span>
                              <span className="underline decoration-dotted">{part}</span>
                            </button>
                          );
                        }
                        return <span key={pIdx}>{part}</span>;
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Objectives Checklist */}
          <div className="bg-zinc-900 text-white p-5 rounded-3xl space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>Objetivos Táticos da Operação</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5 font-mono">
                  Alvo: <strong>{currentChapter.targetHostname}</strong> ({currentChapter.targetIp})
                </div>
              </div>

              {currentChapter.targetIp && (
                <button
                  onClick={() => {
                    connectToTarget(currentChapter.targetIp!);
                    setCurrentView('target_server');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-sm flex items-center space-x-1.5 self-start sm:self-auto"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Conectar ao Alvo ({currentChapter.targetIp})</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {currentChapter.objectives.map(obj => {
                const isMet = isObjectiveMet(obj);

                return (
                  <div
                    key={obj.id}
                    className={`p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border transition ${
                      isMet
                        ? 'bg-zinc-800/90 border-emerald-700/60 shadow-sm'
                        : 'bg-zinc-800/60 border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isMet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {isMet ? <CheckCircle2 className="w-4 h-4" /> : <Terminal className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-xs font-mono truncate sm:whitespace-normal ${isMet ? 'text-emerald-200' : 'text-gray-200'}`}>
                        {obj.text}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        isMet
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
                          : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                      }`}>
                        {isMet ? '✓ CONCLUÍDO' : '⏳ PENDENTE'}
                      </span>

                      <button
                        onClick={() => {
                          connectToTarget(obj.targetIp);
                          setCurrentView('target_server');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl transition flex items-center space-x-1 shadow-sm"
                      >
                        <span>Acessar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Branching Choices Section */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-gray-900">
                {currentChapter.isCompleted
                  ? 'Decisão já executada neste capítulo:'
                  : 'Escolha seu desfecho & Recompensas:'}
              </div>

              {!currentChapter.isCompleted && !areAllObjectivesCompleted && (
                <div className="text-[11px] font-mono font-bold text-amber-600 flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Conclua os objetivos acima para liberar</span>
                </div>
              )}
            </div>

            {/* Warning banner if objectives not done */}
            {!currentChapter.isCompleted && !areAllObjectivesCompleted && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-start space-x-3 text-xs">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Desfechos bloqueados:</strong> Você precisa cumprir todas as tarefas táticas marcadas como <span className="font-mono font-bold text-amber-800">⏳ PENDENTE</span> no servidor alvo antes de decidir o rumo da história.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentChapter.choices.map(choice => {
                const isChoiceDisabled = currentChapter.isCompleted || !areAllObjectivesCompleted;

                return (
                  <button
                    key={choice.id}
                    disabled={isChoiceDisabled}
                    onClick={() => {
                      if (!isChoiceDisabled) {
                        submitStoryChoice(currentChapter.id, choice.id);
                      }
                    }}
                    className={`p-4 rounded-2xl text-left border transition flex flex-col justify-between space-y-3 ${
                      currentChapter.isCompleted
                        ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-default'
                        : !areAllObjectivesCompleted
                          ? 'bg-gray-50/80 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                          : 'bg-white hover:bg-emerald-50/30 border-gray-200 hover:border-emerald-500 text-gray-900 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-gray-900 leading-snug flex items-center justify-between">
                        <span>{choice.label}</span>
                        {!areAllObjectivesCompleted && !currentChapter.isCompleted && (
                          <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mt-1">{choice.outcomeText}</p>
                    </div>

                    {choice.rewardPerk && (
                      <div className="bg-purple-50 text-purple-900 p-2.5 rounded-xl text-[11px] font-mono font-bold">
                        🎁 NOVO PERK: {choice.rewardPerk.name} - {choice.rewardPerk.description}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-[11px] font-mono font-bold pt-1">
                      {choice.rewardCash && (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          +${choice.rewardCash.toLocaleString()} USD
                        </span>
                      )}
                      {choice.rewardBtc && (
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          +{choice.rewardBtc} BTC
                        </span>
                      )}
                      {choice.rewardRep && (
                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          +{choice.rewardRep} REP
                        </span>
                      )}
                      {choice.rewardSoftware && (
                        <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                          +SOFTWARE {choice.rewardSoftware.name} (v{choice.rewardSoftware.version})
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
