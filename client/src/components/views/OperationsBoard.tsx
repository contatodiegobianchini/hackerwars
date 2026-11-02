import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Circle, LockKeyhole } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore.js';
import { buildOperations, type Operation, type OperationKind, type OperationState } from '../../game/operations.js';

const KIND_LABEL: Record<OperationKind, string> = { story: 'História', contract: 'Contrato', syndicate: 'Syndicate' };
const STATE_LABEL: Record<OperationState, string> = {
  ready: 'Pronto para entregar', active: 'Em andamento', available: 'Disponível', blocked: 'Bloqueado', locked: 'Trancado', done: 'Concluído',
};
const money = (v: number) => `US$ ${Math.round(v).toLocaleString('pt-BR')}`;

type KindFilter = 'all' | OperationKind;

/** Single board for story chapters, contracts and Syndicate jobs. */
export const OperationsBoard: React.FC = () => {
  const {
    player, storyChapters, missions, contracts, allServers,
    acceptMission, claimMission, claimDarknetContract, connectToTarget, setCurrentView, openChapter,
  } = useGameStore();
  const [kind, setKind] = useState<KindFilter>('all');
  const [showDone, setShowDone] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const operations = useMemo(
    () => (player ? buildOperations({ player, storyChapters, missions, contracts, servers: allServers }) : []),
    [player, storyChapters, missions, contracts, allServers],
  );
  if (!player) return null;

  const visible = operations.filter(op =>
    (kind === 'all' || op.kind === kind)
    && (showDone ? op.state === 'done' : op.state !== 'done' && op.state !== 'locked'));
  const lockedCount = operations.filter(op => op.state === 'locked' && (kind === 'all' || op.kind === kind)).length;
  const count = (k: KindFilter) => operations.filter(op => (k === 'all' || op.kind === k) && op.state !== 'done' && op.state !== 'locked').length;

  const actions = (op: Operation) => {
    const list: React.ReactNode[] = [];
    if (op.kind === 'story') {
      list.push(
        <button key="open" className="cyber-button" onClick={() => openChapter(op.id)}>
          {op.state === 'ready' ? 'Escolher o desfecho' : 'Abrir capítulo'}
        </button>,
      );
    } else if (op.state === 'ready') {
      list.push(
        <button key="claim" className="cyber-button" onClick={() => (op.kind === 'contract' ? claimMission(op.id) : claimDarknetContract(op.id))}>
          Receber {money(op.rewardCash)}
        </button>,
      );
    } else if (op.kind === 'contract' && op.state === 'available') {
      list.push(<button key="accept" className="cyber-button" onClick={() => acceptMission(op.id)}>Aceitar contrato</button>);
    }
    if (op.fix && op.state === 'blocked') {
      list.push(
        <button key="fix" className={`cyber-button ${list.length ? 'cyber-button--secondary' : ''}`} onClick={() => setCurrentView(op.fix!)}>
          {op.fix === 'software' ? 'Evoluir cracker' : 'Ir ao Black Market'}
        </button>,
      );
    }
    if (op.targetIp && op.state !== 'done' && op.state !== 'locked' && op.state !== 'ready') {
      list.push(
        <button key="go" className="cyber-button cyber-button--secondary" onClick={() => connectToTarget(op.targetIp!)}>Conectar ao alvo</button>,
      );
    }
    return list;
  };

  return (
    <div className="space-y-4" data-zone="operations">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="hw-filter" role="group" aria-label="Tipo de operação">
          {(['all', 'story', 'contract', 'syndicate'] as KindFilter[]).map(k => (
            <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>
              {k === 'all' ? 'Tudo' : k === 'story' ? 'História' : k === 'contract' ? 'Contratos' : 'Syndicate'}
              <span className="hw-filter__count">{count(k)}</span>
            </button>
          ))}
        </div>
        <div className="hw-filter" role="group" aria-label="Situação">
          <button aria-pressed={!showDone} onClick={() => setShowDone(false)}>Em aberto</button>
          <button aria-pressed={showDone} onClick={() => setShowDone(true)}>Concluídas</button>
        </div>
      </div>

      <ul className="hw-ops" aria-label="Operações">
        {visible.length === 0 && (
          <li className="hw-ops__empty">
            {showDone ? 'Nada concluído aqui ainda.' : 'Nenhuma operação em aberto. Volte depois: novos contratos aparecem na rede.'}
          </li>
        )}
        {visible.map(op => {
          const open = openKey === op.key;
          const doneCount = op.objectives.filter(o => o.done).length;
          return (
            <li key={op.key} className={`hw-op hw-op--${op.state}`}>
              <button className="hw-op__row" onClick={() => setOpenKey(open ? null : op.key)} aria-expanded={open}>
                <span className="hw-op__kind">{KIND_LABEL[op.kind]}</span>
                <span className="hw-op__main">
                  <span className="hw-op__title">{op.title}</span>
                  <span className="hw-op__sub">
                    {op.source}{op.targetIp && <> · <span className="font-mono">{op.targetIp}</span></>}
                  </span>
                </span>
                <span className="hw-op__status">
                  {op.blocker ? <span className="hw-op__blocker">{op.blocker}</span>
                    : <>{STATE_LABEL[op.state]}{op.objectives.length > 1 && op.state !== 'done' ? ` · ${doneCount}/${op.objectives.length}` : ''}</>}
                </span>
                <span className="hw-op__reward">{op.rewardIsMax ? 'até ' : ''}{money(op.rewardCash)}</span>
                <ChevronDown className={`hw-op__chev ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && (
                <div className="hw-op__detail">
                  {op.description && <p className="hw-op__desc">{op.description}</p>}
                  <ul className="grid gap-1.5">
                    {op.objectives.map(o => (
                      <li key={o.text} className={`hw-op__obj ${o.done ? 'hw-op__obj--done' : ''}`}>
                        {o.done ? <CheckCircle2 /> : op.state === 'locked' ? <LockKeyhole /> : <Circle />}{o.text}
                      </li>
                    ))}
                  </ul>
                  <p className="hw-op__rewards">
                    Recompensa{op.rewardIsMax ? ' (depende da escolha)' : ''}: {op.rewardIsMax ? 'até ' : ''}{money(op.rewardCash)}
                    {op.rewardBtc ? ` · ${op.rewardBtc} BTC` : ''} · {op.rewardRep} de reputação
                  </p>
                  {actions(op).length > 0 && <div className="flex flex-wrap gap-2">{actions(op)}</div>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {!showDone && lockedCount > 0 && (
        <p className="text-sm text-gray-500">
          Mais {lockedCount} {lockedCount === 1 ? 'capítulo trancado' : 'capítulos trancados'}: avance na história para liberar.
        </p>
      )}
    </div>
  );
};
