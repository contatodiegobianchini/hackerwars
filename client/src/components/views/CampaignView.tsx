import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Circle, LockKeyhole, MessageSquare, Radio, Terminal } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore.js';
import { StoryObjective } from '../../types/game.js';
import { CyberButton } from '../ui/CyberButton.js';
import { CyberPanel } from '../ui/CyberPanel.js';
import { CyberProgress } from '../ui/CyberProgress.js';

export const CampaignView: React.FC = () => {
  const { player, storyChapters, servers, allServers, submitStoryChoice, connectToTarget, setCurrentView } = useGameStore();
  const [selectedChapterId, setSelectedChapterId] = useState('chap-1');
  if (!player) return null;
  const chapter = storyChapters.find(item => item.id === selectedChapterId) || storyChapters[0];
  const objectiveComplete = (objective: StoryObjective) => {
    if (objective.completed) return true;
    const server = allServers.find(item => item.ip === objective.targetIp) || servers.find(item => item.ip === objective.targetIp);
    const breached = player.hackedIps.includes(objective.targetIp) || !!server?.security?.isBreached;
    if (objective.type === 'download') return !objective.targetFileName ? breached : player.software.some(item => item.name.toLowerCase().includes(objective.targetFileName!.toLowerCase()));
    if (objective.type === 'spyware') return !!server?.activeSpyware?.some(item => item.ownerId === player.id);
    if (objective.type === 'wipe_logs') return breached && !server?.logs?.some(log => log.ip === player.ip || log.action.includes(player.username));
    if (objective.type === 'ddos') return server?.isOnline === false;
    return breached;
  };
  const completed = chapter?.objectives.filter(objectiveComplete).length || 0;
  const allComplete = !!chapter && completed === chapter.objectives.length;

  return <div className="space-y-4" data-zone="operations">
    <CyberPanel accent className="p-4 sm:p-5"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="cyber-kicker">Story archive / branching operations</p><h1 className="mt-2 text-xl font-bold uppercase tracking-[.08em] text-[var(--text-primary)]">Invisible war</h1><p className="mt-2 max-w-2xl text-xs text-[var(--text-secondary)]">A classified sequence of operations. Complete objectives, choose an outcome, and define your network.</p></div><CyberButton variant="secondary" onClick={() => setCurrentView('dark_chat')}><MessageSquare className="h-3.5 w-3.5" /> Open DarkIRC</CyberButton></div><div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border-subtle)] pt-4"><div className="campaign-stat"><span>CHAPTERS</span><strong>{storyChapters.length}</strong></div><div className="campaign-stat"><span>COMPLETED</span><strong>{player.completedStoryChapters.length}</strong></div><div className="campaign-stat"><span>PERKS</span><strong>{player.unlockedStoryPerks.length}</strong></div></div></CyberPanel>
    <div className="campaign-rail" role="tablist" aria-label="Campaign chapters">{storyChapters.map(item => { const selected = item.id === chapter?.id; return <button key={item.id} role="tab" aria-selected={selected} disabled={!item.unlocked} onClick={() => setSelectedChapterId(item.id)} className={`campaign-node ${selected ? 'campaign-node--active' : ''} ${item.isCompleted ? 'campaign-node--complete' : ''}`}><span className="campaign-node__number">{String(item.chapterNumber).padStart(2, '0')}</span><span className="campaign-node__copy"><strong>{item.title}</strong><small>{item.unlocked ? item.factionName : 'Encrypted'}</small></span>{item.isCompleted ? <CheckCircle2 /> : item.unlocked ? <Circle /> : <LockKeyhole />}</button>; })}</div>
    {chapter && <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]"><CyberPanel className="p-4 sm:p-5"><header className="flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="cyber-kicker">Operation {String(chapter.chapterNumber).padStart(2, '0')} / {chapter.factionName}</p><h2 className="cyber-module-title mt-2">{chapter.title}</h2></div><span className={`campaign-state ${chapter.isCompleted ? 'campaign-state--complete' : allComplete ? 'campaign-state--ready' : ''}`}>{chapter.isCompleted ? 'Archived' : allComplete ? 'Decision ready' : 'In progress'}</span></header><p className="campaign-briefing">{chapter.briefing}</p><div className="mt-5"><p className="cyber-kicker">Intercepted transcript</p><div className="mt-3 space-y-2">{chapter.dialogue.map((dialogue, index) => <article key={index} className="campaign-transcript"><div><strong>{dialogue.speaker}</strong><span>{dialogue.role}</span></div><p>{dialogue.text}</p></article>)}</div></div></CyberPanel>
      <CyberPanel accent className="p-4 sm:p-5"><p className="cyber-kicker">Tactical objectives</p><h2 className="cyber-module-title mt-2">Target {chapter.targetHostname}</h2><p className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">{chapter.targetIp}</p><CyberProgress className="mt-5" label="Operation completion" value={(completed / Math.max(1, chapter.objectives.length)) * 100} valueLabel={`${completed}/${chapter.objectives.length}`} /><div className="mt-4 space-y-2">{chapter.objectives.map(objective => { const done = objectiveComplete(objective); return <div key={objective.id} className={`campaign-objective ${done ? 'campaign-objective--complete' : ''}`}>{done ? <CheckCircle2 /> : <Terminal />}<span>{objective.text}</span><button onClick={() => { connectToTarget(objective.targetIp); setCurrentView('target_server'); }} aria-label={`Access ${objective.targetIp}`}><ArrowRight /></button></div>; })}</div>{chapter.targetIp && <CyberButton className="mt-4 w-full" onClick={() => { connectToTarget(chapter.targetIp!); setCurrentView('target_server'); }}><Radio className="h-3.5 w-3.5" /> Connect target</CyberButton>}</CyberPanel>
    </div>}
    {chapter && <CyberPanel className="p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><p className="cyber-kicker">Branch decision</p><h2 className="cyber-module-title mt-2">Choose the next outcome</h2></div>{!allComplete && !chapter.isCompleted && <span className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--signal-economy)]"><LockKeyhole className="h-3.5 w-3.5" /> COMPLETE OBJECTIVES</span>}</div><div className="mt-4 grid gap-2 md:grid-cols-2">{chapter.choices.map(choice => { const disabled = chapter.isCompleted || !allComplete; return <button key={choice.id} disabled={disabled} onClick={() => submitStoryChoice(chapter.id, choice.id)} className="campaign-choice"><div><strong>{choice.label}</strong><p>{choice.outcomeText}</p></div><div className="campaign-rewards">{choice.rewardCash ? <span>+${choice.rewardCash.toLocaleString()}</span> : null}{choice.rewardBtc ? <span>+{choice.rewardBtc} BTC</span> : null}{choice.rewardRep ? <span>+{choice.rewardRep} REP</span> : null}</div></button>; })}</div></CyberPanel>}
  </div>;
};
