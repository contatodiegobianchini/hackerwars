import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Circle, Globe2, LockKeyhole, MessageSquare, Radio, Send, Terminal } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore.js';
import { CyberButton } from '../ui/CyberButton.js';
import { CyberPanel } from '../ui/CyberPanel.js';

type FactionKey = 'anonymous' | 'russian_bears' | 'cartel' | 'lone_wolf';
const factionNames: Record<FactionKey, string> = { anonymous: 'Anonymous', russian_bears: 'Bear Syndicate', cartel: 'Cartel Network', lone_wolf: 'Lone Wolf' };

export const DarkChatView: React.FC = () => {
  const { player, darkChatChannels, activeDarkChatChannelId, setActiveDarkChatChannelId, sendDarkChatMessage, connectToTarget, startProcess, setCurrentView, setFactionAlignment } = useGameStore();
  const [inputMessage, setInputMessage] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const activeChannel = darkChatChannels.find(channel => channel.id === activeDarkChatChannelId) || darkChatChannels[0];
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeChannel?.messages.length, activeDarkChatChannelId]);
  if (!player) return null;

  const factionRep = player.factionReputation || { anonymous: 0, russian_bears: 0, cartel: 0, lone_wolf: 0 };
  const alignment = (player.activeFactionAlignment || 'anonymous') as FactionKey;
  const handleAction = (button: any) => {
    if (!button?.targetIp) return;
    connectToTarget(button.targetIp);
    if (button.actionType === 'scan') startProcess('scan', { targetIp: button.targetIp });
    if (button.actionType === 'crack') startProcess('crack', { targetIp: button.targetIp });
    if (button.actionType === 'plant_spyware') startProcess('plant_spyware', { targetIp: button.targetIp });
    if (button.actionType === 'mass_heist') startProcess('mass_bank_heist', { targetIp: button.targetIp });
    setCurrentView(button.actionType === 'connect' ? 'target_server' : button.actionType ? 'processes' : 'target_server');
  };
  const messageContent = (text: string) => text.split(/(\b\d{1,3}(?:\.\d{1,3}){3}\b)/g).map((part, index) => /^(\d{1,3}\.){3}\d{1,3}$/.test(part) ? <button key={index} onClick={() => { connectToTarget(part); setCurrentView('target_server'); }} className="irc-ip-link"><Globe2 /><span>{part}</span></button> : <React.Fragment key={index}>{part}</React.Fragment>);

  return <div className="space-y-4" data-zone="social">
    <CyberPanel accent className="p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="cyber-kicker">Encrypted relay / social network</p><h1 className="mt-2 text-xl font-bold uppercase tracking-[.08em] text-[var(--text-primary)]">DarkIRC relay</h1><p className="mt-2 max-w-2xl text-xs text-[var(--text-secondary)]">A compartmentalized message relay for contacts, operators, and faction intelligence.</p></div><div className="flex items-center gap-2 border border-[var(--border-subtle)] bg-[var(--bg-inset)] px-3 py-2 font-mono text-[10px]"><Radio className="h-3.5 w-3.5 text-[var(--signal-social)] cyber-live" /><span className="text-[var(--text-muted)]">IDENTITY</span><strong className="text-[var(--text-primary)]">{factionNames[alignment]}</strong></div></div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{(Object.keys(factionNames) as FactionKey[]).map(faction => <div key={faction} className={`irc-faction ${alignment === faction ? 'irc-faction--active' : ''}`}><span>{factionNames[faction]}</span><strong>{factionRep[faction]} REP</strong></div>)}</div>
    </CyberPanel>

    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <CyberPanel className="flex min-h-[430px] flex-col p-3"><div className="flex items-center justify-between px-1 pb-3"><span className="cyber-kicker">Channels</span><span className="font-mono text-[10px] text-[var(--text-muted)]">{darkChatChannels.length} LIVE</span></div><div className="flex gap-1 overflow-x-auto lg:flex-col">{darkChatChannels.map(channel => { const selected = channel.id === activeChannel?.id; return <button key={channel.id} onClick={() => setActiveDarkChatChannelId(channel.id)} className={`irc-channel ${selected ? 'irc-channel--active' : ''}`}><span className="irc-channel__mark">#</span><span className="min-w-0 flex-1 text-left"><strong>{channel.name}</strong><small>{channel.messages.length} transmissions</small></span>{channel.faction === alignment && <Circle className="h-2 w-2 fill-current text-[var(--signal-social)]" />}</button>; })}</div><div className="mt-auto border-t border-[var(--border-subtle)] pt-3"><p className="px-1 font-mono text-[10px] leading-relaxed text-[var(--text-muted)]">CAMPAIGN RELAYS UNLOCK NEW CHANNELS AND CONTRACTS.</p><button onClick={() => setCurrentView('campaign')} className="mt-3 flex w-full items-center justify-between px-1 font-mono text-[10px] uppercase tracking-[.1em] text-[var(--signal-social)]">Open story archive <ArrowRight className="h-3.5 w-3.5" /></button></div></CyberPanel>

      <CyberPanel className="flex h-[600px] min-h-0 flex-col overflow-hidden"><header className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[rgba(5,10,11,.52)] p-4"><div className="min-w-0"><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-[var(--signal-social)]" /><h2 className="truncate font-mono text-xs font-bold text-[var(--text-primary)]">{activeChannel?.name || 'NO CHANNEL SELECTED'}</h2><span className="irc-status"><i /> P2P</span></div><p className="mt-1 truncate text-[11px] text-[var(--text-secondary)]">{activeChannel?.description}</p></div>{activeChannel && alignment !== activeChannel.faction && <CyberButton variant="secondary" className="shrink-0" onClick={() => setFactionAlignment(activeChannel.faction)}>Align</CyberButton>}</header>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">{activeChannel?.messages?.length ? activeChannel.messages.map(message => { const self = message.sender === player.username; return <article key={message.id} className={`irc-message ${self ? 'irc-message--self' : ''}`}><div className="irc-message__meta"><span className="font-bold">{message.sender}</span><span>{message.role}</span><time>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div><div className="irc-message__body">{messageContent(message.text)}{message.actionButton && <button onClick={() => handleAction(message.actionButton)} className="irc-action"><Terminal className="h-3.5 w-3.5" />{message.actionButton.label}<ArrowRight className="ml-auto h-3.5 w-3.5" /></button>}</div></article>; }) : <div className="flex h-full flex-col items-center justify-center text-center"><LockKeyhole className="h-5 w-5 text-[var(--text-muted)]" /><p className="mt-3 font-mono text-[10px] text-[var(--text-muted)]">NO INTERCEPTED TRANSMISSIONS</p></div>}<div ref={chatBottomRef} /></div>
        <form onSubmit={event => { event.preventDefault(); if (inputMessage.trim() && activeChannel) { sendDarkChatMessage(activeChannel.id, inputMessage.trim()); setInputMessage(''); } }} className="flex gap-2 border-t border-[var(--border-subtle)] bg-[rgba(5,10,11,.58)] p-3"><input value={inputMessage} onChange={event => setInputMessage(event.target.value)} className="irc-input" placeholder={`Transmit to ${activeChannel?.name || 'relay'}…`} /><CyberButton type="submit" disabled={!inputMessage.trim()} aria-label="Send encrypted message"><Send className="h-3.5 w-3.5" /></CyberButton></form>
      </CyberPanel>
    </div>
  </div>;
};
