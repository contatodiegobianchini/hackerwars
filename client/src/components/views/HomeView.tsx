import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Radio } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore.js';
import { computeNextStep, suggestContracts, type StepAction, type StepButton } from '../../game/nextStep.js';
import { processTitle, secondsLeft } from '../../game/labels.js';
import { HUNT_KIND_TEXT, formatCountdown } from '../../game/traceHeat.js';
import { CyberProgress } from '../ui/CyberProgress.js';

const money = (v: number) => `US$ ${v.toLocaleString('pt-BR')}`;
const timeAgo = (ts: number) => {
  const min = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} d`;
};

/** Home: the next useful step, what is running, and what can be done now. */
export const HomeView: React.FC = () => {
  const {
    player, storyChapters, missions, allServers, processes, news,
    setCurrentView, connectToTarget, claimMission, acceptMission,
  } = useGameStore();

  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const step = useMemo(
    () => player ? computeNextStep({ player, storyChapters, missions, servers: allServers }) : null,
    [player, storyChapters, missions, allServers],
  );
  const suggestions = useMemo(
    () => player ? suggestContracts({ player, storyChapters, missions, servers: allServers }, 3) : [],
    [player, storyChapters, missions, allServers],
  );

  if (!player || !step) return null;

  const run = (action: StepAction) => {
    if (action.kind === 'connect') connectToTarget(action.ip);
    else if (action.kind === 'claim') claimMission(action.missionId);
    else setCurrentView(action.view);
  };
  const button = (b: StepButton, primary: boolean) => (
    <button key={b.label} className={`cyber-button ${primary ? '' : 'cyber-button--secondary'}`} onClick={() => run(b.action)}>
      {b.label}{primary && <ArrowRight className="h-4 w-4" />}
    </button>
  );

  const hunts = [...(player.pendingHunts || [])].sort((a, b) => a.dueAt - b.dueAt);
  const active = player.activeMissions || [];
  const maxTasks = player.hardware.ram.maxTasks;

  return (
    <div className="space-y-4" data-zone="core">
      <section className="hw-next" aria-labelledby="next-step-title">
        <p className="hw-next__context">Próximo passo · {step.context}</p>
        <h2 id="next-step-title" className="hw-next__title">{step.title}</h2>
        {step.deadline && (
          <p className="hw-next__deadline">Prazo <strong>{formatCountdown(step.deadline - now)}</strong></p>
        )}
        {step.detail && <p className="hw-next__detail">{step.detail}</p>}
        {step.blocker && (
          <p className="hw-next__blocker"><AlertTriangle className="h-4 w-4 shrink-0" />{step.blocker}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-5">
          {button(step.primary, true)}
          {step.secondary && button(step.secondary, false)}
        </div>
      </section>

      {hunts.length > 1 && (
        <section className="cyber-panel p-4 sm:p-5">
          <h3 className="cyber-module-title">Rastros deixados</h3>
          <ul className="mt-3 divide-y divide-gray-200">
            {hunts.map(h => (
              <li key={h.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                <span className="font-mono text-sm font-semibold text-red-500 w-12">{formatCountdown(h.dueAt - now)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{h.hostname} <span className="font-mono text-xs text-gray-500">{h.ip}</span></p>
                  <p className="text-xs text-gray-500">Depois do prazo, {HUNT_KIND_TEXT[h.kind]}.</p>
                </div>
                <button className="cyber-button hw-mini" onClick={() => connectToTarget(h.ip)}>Voltar e apagar</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="cyber-panel p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="cyber-module-title">Em andamento</h3>
            <span className="text-sm text-gray-500">{processes.length} de {maxTasks} processos</span>
          </div>
          {processes.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              Nada rodando. Conecte-se a um alvo para quebrar senhas, baixar arquivos ou apagar logs.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {processes.slice(0, 4).map(p => (
                <li key={p.id}>
                  <CyberProgress value={Math.round(p.progress)} label={processTitle(p)} valueLabel={`${secondsLeft(p)} s`} />
                </li>
              ))}
            </ul>
          )}
          {processes.length > 4 && (
            <button className="mt-3 text-sm font-semibold text-amber-500" onClick={() => setCurrentView('processes')}>
              Ver todos os {processes.length} processos
            </button>
          )}
        </section>

        <section className="cyber-panel p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="cyber-module-title">Contratos aceitos</h3>
            <button className="text-sm font-semibold text-amber-500" onClick={() => setCurrentView('missions')}>Ver quadro</button>
          </div>
          {active.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Nenhum contrato aceito. Os que você já consegue fazer aparecem abaixo.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-200">
              {active.map(m => {
                const ready = !!player.missionProgress?.[m.id];
                return (
                  <li key={m.id} className="flex items-center gap-3 py-2.5">
                    {ready ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <Radio className="h-4 w-4 shrink-0 text-gray-500" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{m.title}</p>
                      <p className="text-xs text-gray-500">{ready ? 'Objetivo cumprido' : <>Alvo <span className="font-mono">{m.targetIp}</span></>}</p>
                    </div>
                    {ready ? (
                      <button className="cyber-button !min-h-0 !py-1.5" onClick={() => claimMission(m.id)}>Receber {money(m.rewardCash)}</button>
                    ) : (
                      <button className="cyber-button cyber-button--secondary !min-h-0 !py-1.5" onClick={() => connectToTarget(m.targetIp)}>Conectar</button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="cyber-panel p-4 sm:p-5">
          <h3 className="cyber-module-title">Dá para fazer agora</h3>
          <p className="mt-1 text-sm text-gray-500">Contratos que seu equipamento atual consegue cumprir.</p>
          {suggestions.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              Nenhum contrato ao seu alcance agora. Evolua o cracker em Base › Software para abrir alvos maiores.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-200">
              {suggestions.map(({ mission, server }) => (
                <li key={mission.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{mission.title}</p>
                    <p className="text-xs text-gray-500">
                      {server?.hostname || mission.targetDomain} · <span className="font-mono">{mission.targetIp}</span>
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-amber-500">{money(mission.rewardCash)}</span>
                  <button className="cyber-button cyber-button--secondary !min-h-0 !py-1.5" onClick={() => acceptMission(mission.id)}>Aceitar</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="cyber-panel p-4 sm:p-5">
          <h3 className="cyber-module-title">Na rede</h3>
          {(news || []).length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Sem notícias por enquanto.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {news.slice(0, 5).map(item => (
                <li key={item.id} className="text-sm">
                  <p className={item.category === 'POLICE' ? 'text-red-500' : 'text-gray-900'}>{item.headline}</p>
                  <p className="text-xs text-gray-500">{timeAgo(item.timestamp)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
