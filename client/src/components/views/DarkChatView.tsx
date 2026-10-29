import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import {
  MessageSquare,
  Send,
  ShieldAlert,
  Zap,
  Globe,
  Lock,
  Radio,
  Terminal,
  Sparkles,
  DollarSign,
  Landmark,
  Target,
  ArrowRight,
  Flame,
  Award
} from 'lucide-react';
import { FactionType } from '../../types/game.js';

export const DarkChatView: React.FC = () => {
  const {
    player,
    darkChatChannels,
    activeDarkChatChannelId,
    setActiveDarkChatChannelId,
    sendDarkChatMessage,
    connectToTarget,
    startProcess,
    setCurrentView,
    setFactionAlignment
  } = useGameStore();

  const [inputMessage, setInputMessage] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const activeChannel = darkChatChannels.find(c => c.id === activeDarkChatChannelId) || darkChatChannels[0];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannel?.messages.length, activeDarkChatChannelId]);

  if (!player) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChannel) return;
    sendDarkChatMessage(activeChannel.id, inputMessage.trim());
    setInputMessage('');
  };

  const renderMessageContent = (text: string, isSelf: boolean) => {
    // Regex to match IPs like 192.168.10.15
    const ipRegex = /(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b)/g;
    const parts = text.split(ipRegex);

    return (
      <p className="font-sans leading-relaxed">
        {parts.map((part, idx) => {
          if (ipRegex.test(part)) {
            return (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  connectToTarget(part);
                  setCurrentView('target_server');
                }}
                title={`Conectar diretamente a ${part}`}
                className={`inline-flex items-center space-x-1 font-mono font-bold text-xs px-2 py-0.5 rounded-lg border transition mx-1 my-0.5 ${
                  isSelf
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border-zinc-700'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm'
                }`}
              >
                <span>🌐</span>
                <span className="underline decoration-dotted">{part}</span>
              </button>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </p>
    );
  };

  const handleActionButton = (btn: any) => {
    if (!btn) return;
    if (btn.targetIp) {
      // Connect to target first
      connectToTarget(btn.targetIp);

      if (btn.actionType === 'connect') {
        setCurrentView('target_server');
      } else if (btn.actionType === 'scan') {
        startProcess('scan', { targetIp: btn.targetIp });
        setCurrentView('processes');
      } else if (btn.actionType === 'crack') {
        startProcess('crack', { targetIp: btn.targetIp });
        setCurrentView('processes');
      } else if (btn.actionType === 'plant_spyware') {
        startProcess('plant_spyware', { targetIp: btn.targetIp });
        setCurrentView('processes');
      } else if (btn.actionType === 'mass_heist') {
        startProcess('mass_bank_heist', { targetIp: btn.targetIp });
        setCurrentView('processes');
      } else {
        setCurrentView('target_server');
      }
    }
  };

  const factionRep = player.factionReputation || { anonymous: 0, russian_bears: 0, cartel: 0, lone_wolf: 0 };
  const currentAlignment = player.activeFactionAlignment || 'anonymous';

  return (
    <div className="space-y-4">
      {/* Header Banner with Active Alignment */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-zinc-900 text-white rounded-3xl p-5 shadow-lg border border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl shrink-0">
              💬
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white">DarkIRC // Mensageiro Criptografado Onion</h1>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full uppercase animate-pulse">
                  CONEXÃO P2P SEGURA
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Comunicações secretas em tempo real com contratantes, rebeldes, generais de ciberguerra e cartéis da Darknet.
              </p>
            </div>
          </div>

          {/* Faction Alignment Badge & Rep Meters */}
          <div className="flex items-center space-x-2 bg-zinc-800/80 border border-zinc-700 px-3.5 py-2 rounded-2xl text-xs">
            <div className="text-right font-mono">
              <div className="text-[10px] text-gray-400">ALINHAMENTO ATUAL</div>
              <div className="font-bold text-emerald-400 uppercase flex items-center space-x-1 justify-end">
                <span>
                  {currentAlignment === 'anonymous' && '🎭 Anonymous'}
                  {currentAlignment === 'russian_bears' && '🐻 Bear Syndicate'}
                  {currentAlignment === 'cartel' && '💀 Sinaloa Cartel'}
                  {currentAlignment === 'lone_wolf' && '🐺 Lobo Solitário'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Faction Reputation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-4 border-t border-zinc-800/80">
          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
            currentAlignment === 'anonymous' ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300' : 'bg-zinc-900/60 border-zinc-800 text-gray-300'
          }`}>
            <span className="text-xs font-mono font-bold flex items-center space-x-1.5">
              <span>🎭</span>
              <span>Anonymous:</span>
            </span>
            <span className="text-xs font-mono font-bold">{factionRep.anonymous} REP</span>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
            currentAlignment === 'russian_bears' ? 'bg-red-950/40 border-red-700/60 text-red-300' : 'bg-zinc-900/60 border-zinc-800 text-gray-300'
          }`}>
            <span className="text-xs font-mono font-bold flex items-center space-x-1.5">
              <span>🐻</span>
              <span>Russo Bear:</span>
            </span>
            <span className="text-xs font-mono font-bold">{factionRep.russian_bears} REP</span>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
            currentAlignment === 'cartel' ? 'bg-amber-950/40 border-amber-700/60 text-amber-300' : 'bg-zinc-900/60 border-zinc-800 text-gray-300'
          }`}>
            <span className="text-xs font-mono font-bold flex items-center space-x-1.5">
              <span>💀</span>
              <span>Cartel:</span>
            </span>
            <span className="text-xs font-mono font-bold">{factionRep.cartel} REP</span>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
            currentAlignment === 'lone_wolf' ? 'bg-purple-950/40 border-purple-700/60 text-purple-300' : 'bg-zinc-900/60 border-zinc-800 text-gray-300'
          }`}>
            <span className="text-xs font-mono font-bold flex items-center space-x-1.5">
              <span>🐺</span>
              <span>Lobo Solo:</span>
            </span>
            <span className="text-xs font-mono font-bold">{factionRep.lone_wolf} REP</span>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Channels Sidebar / Mobile Horizontal Channel Strip */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-sm border border-gray-100 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
              Canais Criptografados
            </div>

            {/* Horizontal on mobile, vertical on desktop */}
            <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible pb-1.5 md:pb-0 gap-1.5 scrollbar-none">
              {darkChatChannels.map(channel => {
                const isSelected = activeDarkChatChannelId === channel.id;
                return (
                  <button
                    key={channel.id}
                    onClick={() => setActiveDarkChatChannelId(channel.id)}
                    className={`p-2.5 sm:p-3 rounded-2xl transition text-left flex items-center justify-between shrink-0 md:shrink md:w-full min-w-[170px] md:min-w-0 ${
                      isSelected
                        ? 'bg-black text-white shadow-sm font-semibold'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-base shrink-0">{channel.avatar}</span>
                      <div className="truncate">
                        <div className="text-xs font-mono font-bold truncate">{channel.name}</div>
                        <div className={`text-[10px] truncate ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                          {channel.messages.length} msgs
                        </div>
                      </div>
                    </div>

                    {currentAlignment === channel.faction && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-2 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Campaign Link (Desktop Only) */}
          <div className="hidden md:block bg-gray-50 border border-gray-100 p-3 rounded-2xl space-y-2">
            <div className="text-[11px] font-bold text-gray-700">Missões da História</div>
            <p className="text-[10px] text-gray-500 leading-tight">
              Avance nos capítulos para desbloquear novos canais, contratos e armamento zero-day.
            </p>
            <button
              onClick={() => setCurrentView('campaign')}
              className="w-full bg-black hover:bg-gray-800 text-white font-medium text-xs py-2 rounded-xl transition flex items-center justify-center space-x-1.5"
            >
              <span>Abrir Campanha</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chat Feed and Input */}
        <div className="md:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between overflow-hidden h-[480px] sm:h-[560px]">
          {/* Channel Header */}
          {activeChannel && (
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center space-x-3 truncate">
                <span className="text-xl shrink-0">{activeChannel.avatar}</span>
                <div className="truncate">
                  <div className="text-xs font-mono font-bold text-gray-900 flex items-center space-x-2">
                    <span>{activeChannel.name}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full">
                      P2P ATIVO
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">{activeChannel.description}</div>
                </div>
              </div>

              {currentAlignment !== activeChannel.faction && (
                <button
                  onClick={() => setFactionAlignment(activeChannel.faction)}
                  className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition shadow-sm"
                >
                  Mudar Alinhamento para Esta Facção
                </button>
              )}
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {(!activeChannel || !activeChannel.messages || activeChannel.messages.length === 0) ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs font-mono">
                Nenhuma mensagem interceptada neste canal ainda.
              </div>
            ) : (
              activeChannel.messages.map(msg => {
                const isSelf = msg.sender === player.username;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1 px-1">
                      <span className="text-xs">{msg.avatar}</span>
                      <span className="font-bold text-xs text-gray-900 font-mono">{msg.sender}</span>
                      <span className="text-[10px] text-gray-400 font-medium">[{msg.role}]</span>
                      <span className="text-[10px] text-gray-300 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className={`p-4 rounded-2xl max-w-lg space-y-2.5 text-xs leading-relaxed ${
                      isSelf
                        ? 'bg-black text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm border border-gray-200/60'
                    }`}>
                      {renderMessageContent(msg.text, isSelf)}

                      {/* Interactive In-Chat Action Buttons */}
                      {msg.actionButton && (
                        <div className="pt-2 border-t border-gray-200/40">
                          <button
                            onClick={() => handleActionButton(msg.actionButton)}
                            className={`w-full py-2 px-3.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center justify-center space-x-1.5 ${
                              isSelf
                                ? 'bg-white hover:bg-gray-100 text-black'
                                : 'bg-black hover:bg-gray-800 text-white'
                            }`}
                          >
                            <Target className="w-3.5 h-3.5" />
                            <span>{msg.actionButton.label}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3.5 border-t border-gray-100 bg-gray-50 flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Enviar mensagem criptografada para ${activeChannel?.name || 'este canal'}...`}
              className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-black font-sans shadow-sm"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className={`p-2.5 rounded-2xl transition shadow-sm flex items-center justify-center ${
                inputMessage.trim()
                  ? 'bg-black hover:bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
