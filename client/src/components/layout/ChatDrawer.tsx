import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Globe2, Send, X } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore.js';

type FactionKey = 'anonymous' | 'russian_bears' | 'cartel' | 'lone_wolf';
const factionNames: Record<FactionKey, string> = { anonymous: 'Anonymous', russian_bears: 'Bear Syndicate', cartel: 'Cartel', lone_wolf: 'Lobo Solitário' };

/** DarkIRC as a side panel that opens over any zone (bottom sheet on phones). */
export const ChatDrawer: React.FC = () => {
  const {
    player, isChatOpen, setChatOpen, darkChatChannels, activeDarkChatChannelId, setActiveDarkChatChannelId,
    sendDarkChatMessage, connectToTarget, startProcess, setCurrentView, setFactionAlignment,
  } = useGameStore();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const channel = darkChatChannels.find(c => c.id === activeDarkChatChannelId) || darkChatChannels[0];

  useEffect(() => { if (isChatOpen) bottomRef.current?.scrollIntoView({ block: 'end' }); }, [isChatOpen, channel?.messages.length, activeDarkChatChannelId]);
  useEffect(() => {
    if (!isChatOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setChatOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isChatOpen, setChatOpen]);

  if (!isChatOpen || !player) return null;

  const rep = player.factionReputation || { anonymous: 0, russian_bears: 0, cartel: 0, lone_wolf: 0 };
  const alignment = (player.activeFactionAlignment || 'anonymous') as FactionKey;
  const channelFaction = channel?.faction as FactionKey | undefined;
  const switchIsFree = channelFaction ? (rep[channelFaction] || 0) >= 1000 : false;

  const goTo = (ip: string) => { connectToTarget(ip); setCurrentView('target_server'); setChatOpen(false); };
  const runAction = (button: any) => {
    if (!button?.targetIp) return;
    connectToTarget(button.targetIp);
    if (button.actionType === 'scan') startProcess('scan', { targetIp: button.targetIp });
    if (button.actionType === 'crack') startProcess('crack', { targetIp: button.targetIp });
    if (button.actionType === 'plant_spyware') startProcess('plant_spyware', { targetIp: button.targetIp });
    if (button.actionType === 'mass_heist') startProcess('mass_bank_heist', { targetIp: button.targetIp });
    setCurrentView(button.actionType && button.actionType !== 'connect' ? 'processes' : 'target_server');
    setChatOpen(false);
  };
  const withIpLinks = (value: string) => value.split(/(\b\d{1,3}(?:\.\d{1,3}){3}\b)/g).map((part, i) =>
    /^(\d{1,3}\.){3}\d{1,3}$/.test(part)
      ? <button key={i} onClick={() => goTo(part)} className="irc-ip-link"><Globe2 /><span>{part}</span></button>
      : <React.Fragment key={i}>{part}</React.Fragment>);

  return (
    <>
      <div className="hw-drawer-backdrop" onClick={() => setChatOpen(false)} />
      <aside className="hw-drawer" role="dialog" aria-label="DarkIRC">
        <div className="hw-drawer__head">
          <h2 className="hw-drawer__title">DarkIRC</h2>
          <span className="irc-status"><i /> online</span>
          <button className="hw-icon-btn" onClick={() => setChatOpen(false)} aria-label="Fechar DarkIRC"><X /></button>
        </div>

        <div className="flex gap-1 overflow-x-auto px-3 py-2 border-b border-gray-200" role="tablist" aria-label="Canais">
          {darkChatChannels.map(c => (
            <button key={c.id} role="tab" aria-selected={c.id === channel?.id} onClick={() => setActiveDarkChatChannelId(c.id)}
              className={`irc-channel shrink-0 ${c.id === channel?.id ? 'irc-channel--active' : ''}`}>
              <span className="irc-channel__mark">#</span><strong>{c.name.replace(/^#/, '')}</strong>
            </button>
          ))}
        </div>

        {channel && (
          <div className="flex items-center gap-2 px-4 py-2 text-[13px] text-gray-500 border-b border-gray-200">
            <span className="flex-1 min-w-0">
              Facção: <strong className="text-gray-900">{factionNames[channelFaction || 'anonymous']}</strong> · {rep[channelFaction || 'anonymous'] || 0} de reputação
              {alignment === channelFaction && <span className="text-emerald-600"> · você está alinhado</span>}
            </span>
            {alignment !== channelFaction && channelFaction && (
              <button className="cyber-button cyber-button--secondary !min-h-0 !py-1.5 !text-[13px] shrink-0"
                onClick={() => setFactionAlignment(channelFaction)}
                title="Intervalo mínimo de 30 min entre trocas de facção.">
                Alinhar {switchIsFree ? '(grátis)' : '(US$ 5.000)'}
              </button>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {channel?.messages?.length ? channel.messages.map(m => {
            const self = m.sender === player.username;
            return (
              <article key={m.id} className={`irc-message ${self ? 'irc-message--self' : ''}`}>
                <div className="irc-message__meta">
                  <span className="font-semibold">{m.sender}</span>
                  <span>{m.role}</span>
                  <time>{new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time>
                </div>
                <div className="irc-message__body">
                  {withIpLinks(m.text)}
                  {m.actionButton && (
                    <button className="irc-action" onClick={() => runAction(m.actionButton)}>
                      <ArrowRight className="w-4 h-4" /> {m.actionButton.label}
                    </button>
                  )}
                </div>
              </article>
            );
          }) : <p className="text-sm text-gray-500">Nenhuma mensagem neste canal ainda. Escreva a primeira.</p>}
          <div ref={bottomRef} />
        </div>

        <form className="flex gap-2 p-3 border-t border-gray-200"
          onSubmit={e => { e.preventDefault(); if (text.trim() && channel) { sendDarkChatMessage(channel.id, text.trim()); setText(''); } }}>
          <input id="darkirc-message" value={text} onChange={e => setText(e.target.value)} className="irc-input" placeholder={`Mensagem para #${(channel?.name || 'canal').replace(/^#/, '')}`} />
          <button type="submit" className="cyber-button" disabled={!text.trim()} aria-label="Enviar mensagem"><Send className="w-4 h-4" /></button>
        </form>
      </aside>
    </>
  );
};
