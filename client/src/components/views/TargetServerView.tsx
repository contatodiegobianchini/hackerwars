import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { useBankActions } from '../../hooks/useBankActions.js';
import { AlertTriangle, Crosshair, Flame, Trash2 } from 'lucide-react';
import type { GameProcess, ProcessType, SoftwareItem } from '../../types/game.js';
import { SERVER_TYPE_LABELS, secondsLeft, versionLabel } from '../../game/labels.js';
import { HUNT_KIND_BY_TYPE, HUNT_KIND_TEXT, HUNT_MINUTES, formatCountdown, traceHeatSeconds } from '../../game/traceHeat.js';
import { CyberProgress } from '../ui/CyberProgress.js';
import { bestSoftware } from '../../game/bestSoftware.js';
import { accessTimeLeft, formatWindow, rotationWindow } from '../../game/worldReaction.js';

const money = (v: number) => `US$ ${Math.round(v).toLocaleString('pt-BR')}`;

/** Target screen: one operation in three real steps (breach → exploit → vanish). */
export const TargetServerView: React.FC = () => {
  const {
    player, activeConnection, activeTrace, processes, storyChapters, startProcess, deleteRemoteFile, wipeRemoteLogs, setCurrentView,
  } = useGameStore();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const { handleMassBankHeist, handleBankHeist, handleSiphonAccount, handleSiphonCrypto } = useBankActions();
  const [showLogs, setShowLogs] = useState(false);
  const [glitch, setGlitch] = useState(false);

  const ip = activeConnection?.ip;
  const isBreached = !!(ip && player?.hackedIps?.includes(ip));
  const wasBreached = useRef(isBreached);
  useEffect(() => {
    if (isBreached && !wasBreached.current) {
      setGlitch(true);
      const t = setTimeout(() => setGlitch(false), 700);
      wasBreached.current = true;
      return () => clearTimeout(t);
    }
    wasBreached.current = isBreached;
  }, [isBreached, ip]);

  if (!player) return null;

  if (!activeConnection) {
    return (
      <div className="cyber-panel p-8 text-center max-w-lg mx-auto">
        <Crosshair className="h-8 w-8 mx-auto text-gray-500" />
        <h2 className="hw-section-title mt-3">Nenhum alvo conectado</h2>
        <p className="mt-2 text-sm text-gray-500">Escolha um servidor na lista de alvos ou digite um IP para se conectar.</p>
        <button className="cyber-button mt-5" onClick={() => setCurrentView('known_servers')}>Ver alvos</button>
      </div>
    );
  }

  const server = activeConnection;
  const isOnline = server.isOnline !== false;
  const isBank = server.type === 'bank';
  const running = processes.filter(p => p.targetIp === server.ip);
  const runningOf = (type: ProcessType, fileId?: string): GameProcess | undefined =>
    running.find(p => p.type === type && (!fileId || p.targetFileId === fileId));

  const cracker = bestSoftware(player.software, 'cracker');
  const crackerVersion = cracker?.version ?? 1;
  const hasher = server.security.hasherLevel;
  const canCrack = crackerVersion >= hasher;
  const spyware = bestSoftware(player.software, 'spyware');
  const miner = bestSoftware(player.software, 'miner');
  const botnet = bestSoftware(player.software, 'ddos');
  const myMiner = server.activeMiners?.find(m => m.ownerId === player.id);
  const mySpyware = server.activeSpyware?.find(s => s.ownerId === player.id);
  const myLogs = (server.logs || []).filter(l => l.ip === player.ip || l.action.includes(player.ip));
  const usedMb = player.software.reduce((n, s) => n + s.sizeMb, 0);
  const freeMb = player.hardware.hdd.capacityMb - usedMb;

  // Objectives that point at this server: current chapter and accepted contracts.
  const goals: string[] = [];
  const goalFiles = new Set<string>();
  for (const chapter of storyChapters.filter(c => c.unlocked && !c.isCompleted)) {
    for (const o of chapter.objectives.filter(o => !o.completed && o.targetIp === server.ip)) {
      goals.push(`Capítulo ${chapter.chapterNumber}: ${o.text}`);
      if (o.targetFileName) goalFiles.add(o.targetFileName.toLowerCase());
    }
  }
  for (const m of (player.activeMissions || []).filter(m => m.targetIp === server.ip && !player.missionProgress?.[m.id])) {
    goals.push(`Contrato "${m.title}"`);
    if (m.requiredFileName) goalFiles.add(m.requiredFileName.toLowerCase());
  }

  const playerPower = Math.round((botnet?.version || 1) * player.hardware.network.speedMbps * 10);
  const targetDefense = Math.round(server.security.firewallLevel * server.hardware.networkMbps * 4);
  const ddosChance = Math.min(95, Math.max(5, Math.round((playerPower / (playerPower + targetDefense * 0.7)) * 100)));

  // While the police trace runs on this target, every action shows what it costs.
  const tracingHere = !!activeTrace?.isActive && activeTrace.targetIp === server.ip;
  const cost = (type: ProcessType, sizeMb = 0) => (tracingHere ? ` · −${traceHeatSeconds(type, sizeMb)} s` : '');
  const hunt = player.pendingHunts?.find(h => h.ip === server.ip);
  const accessLeft = accessTimeLeft(player, server.ip, server.type, now);

  const download = (file: SoftwareItem) => startProcess('download', { targetIp: server.ip, targetFileId: file.id, targetFileName: file.name });
  const progressRow = (p: GameProcess, label: string) => (
    <CyberProgress value={Math.round(p.progress)} label={label} valueLabel={`${secondsLeft(p)} s`} />
  );

  const stageClass = (done: boolean, current: boolean, locked: boolean) =>
    `hw-stage ${done ? 'hw-stage--done' : ''} ${current ? 'hw-stage--current' : ''} ${locked ? 'hw-stage--locked' : ''}`;

  return (
    <div className="space-y-4" data-zone="network">
      <section className="cyber-panel p-4 sm:p-5">
        <div className="hw-target-head">
          <div className="min-w-0 flex-1">
            <h2 className={`hw-target-name ${glitch ? 'hw-glitch' : ''}`}>{server.hostname}</h2>
            <div className="hw-target-meta">
              <span className="ip">{server.ip}</span>
              <span>{SERVER_TYPE_LABELS[server.type] || server.type}</span>
              <span>Hasher {versionLabel(hasher)}</span>
              <span>Firewall {versionLabel(server.security.firewallLevel)}</span>
              {!!server.patchLevel && <span className="text-red-500" title="Os administradores reforçaram a segurança depois de várias invasões. Relaxa em cerca de 1 h sem invasões.">Patch +{server.patchLevel}</span>}
            </div>
            {server.description && <p className="mt-2 text-sm text-gray-500 max-w-[70ch]">{server.description}</p>}
          </div>
          <span className={`hw-chip ${!isOnline ? 'hw-chip--off' : isBreached ? 'hw-chip--root' : ''}`}>
            {!isOnline ? 'Fora do ar' : isBreached ? 'Acesso root' : 'Protegido'}
          </span>
        </div>
        {goals.length > 0 && (
          <div className="mt-4 grid gap-2">
            {goals.map(g => <div key={g} className="hw-objective"><Crosshair className="h-4 w-4" /><span>Objetivo: {g}</span></div>)}
          </div>
        )}
      </section>

      <div className="hw-stages">
        {/* 1. Invadir */}
        <section className={stageClass(isBreached, !isBreached, false)} aria-label="Etapa 1: invadir">
          <span className="hw-stage__num">1</span>
          <div>
            <h3 className="hw-stage__title">Invadir</h3>
            <p className="hw-stage__status">
              {isBreached ? (accessLeft === null
                ? `Senha quebrada. Você tem acesso root; se ficar ${formatWindow(rotationWindow(server.type))} sem voltar, trocam a senha.`
                : `Senha quebrada. Acesso expira em ${formatWindow(accessLeft)} se você não voltar.`)
                : canCrack ? `Seu cracker ${versionLabel(crackerVersion)} quebra o Hasher ${versionLabel(hasher)} deste alvo.`
                  : `Seu cracker ${versionLabel(crackerVersion)} é fraco para o Hasher ${versionLabel(hasher)}.`}
            </p>
          </div>
          {!isBreached && (
            <div className="hw-stage__body">
              {runningOf('crack') ? progressRow(runningOf('crack')!, 'Quebrando senha') : (
                <div className="flex flex-wrap gap-2">
                  {canCrack ? (
                    <button className="cyber-button" onClick={() => startProcess('crack', { targetIp: server.ip })}>Quebrar senha{cost('crack')}</button>
                  ) : (
                    <button className="cyber-button" onClick={() => setCurrentView('software')}>Evoluir cracker</button>
                  )}
                  <button className="cyber-button cyber-button--secondary" onClick={() => startProcess('scan', { targetIp: server.ip })} disabled={!!runningOf('scan')}>
                    {runningOf('scan') ? 'Varrendo portas…' : `Varrer portas${cost('scan')}`}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 2. Explorar */}
        <section className={stageClass(false, isBreached, !isBreached)} aria-label="Etapa 2: explorar">
          <span className="hw-stage__num">2</span>
          <div>
            <h3 className="hw-stage__title">Explorar</h3>
            <p className="hw-stage__status">{isBreached ? 'Baixe arquivos, implante spyware, instale um minerador.' : 'Disponível depois da invasão.'}</p>
          </div>
          {isBreached && (
            <div className="hw-stage__body">
              <p className="hw-row__sub">Arquivos · {Math.max(0, freeMb)} MB livres no seu disco</p>
              {(server.files || []).length === 0 && <p className="text-sm text-gray-500">Nenhum arquivo neste servidor.</p>}
              {(server.files || []).map(file => {
                const owned = player.software.some(s => s.name === file.name);
                const proc = runningOf('download', file.id);
                const isGoal = goalFiles.has(file.name.toLowerCase());
                return (
                  <div key={file.id} className={`hw-row ${isGoal ? 'hw-row--goal' : ''}`}>
                    {proc ? <div className="w-full">{progressRow(proc, `Baixando ${file.name}`)}</div> : (
                      <>
                        <div className="hw-row__main">
                          <p className="hw-row__title">{file.name}</p>
                          <p className="hw-row__sub">{file.sizeMb} MB · {versionLabel(file.version)}{isGoal ? ' · objetivo' : ''}</p>
                        </div>
                        {owned && player.software.find(sw => sw.name === file.name)?.content && (
                          <p className="hw-note w-full order-last">{player.software.find(sw => sw.name === file.name)!.content}</p>
                        )}
                        {owned ? <span className="text-sm text-emerald-500">Já baixado</span> : (
                          <button className="cyber-button hw-mini" onClick={() => download(file)} disabled={file.sizeMb > freeMb} title={file.sizeMb > freeMb ? 'Disco cheio' : undefined}>
                            {file.sizeMb > freeMb ? 'Disco cheio' : `Baixar${cost('download', file.sizeMb)}`}
                          </button>
                        )}
                        {!isGoal && !file.clueIp && !file.loot && (
                          <button className="hw-icon-btn !h-8 !w-8" onClick={() => deleteRemoteFile(server.ip, file.id)} aria-label={`Apagar ${file.name} do servidor`} title="Apagar do servidor">
                            <Trash2 />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              <p className="hw-row__sub mt-2">Implantes</p>
              <div className="hw-row">
                {runningOf('plant_spyware') ? <div className="w-full">{progressRow(runningOf('plant_spyware')!, 'Implantando spyware')}</div> : (
                  <>
                    <div className="hw-row__main">
                      <p className="hw-row__title">Spyware {mySpyware ? `ativo (${versionLabel(mySpyware.spywareLevel)})` : ''}</p>
                      <p className="hw-row__sub">{spyware ? 'Intercepta contas bancárias e carteiras cripto de quem usa este servidor.' : 'Você não tem spyware instalado.'}</p>
                    </div>
                    {spyware ? (
                      <button className="cyber-button hw-mini cyber-button--secondary" onClick={() => startProcess('plant_spyware', { targetIp: server.ip, targetFileName: spyware.name })}>
                        {mySpyware ? 'Atualizar' : 'Implantar'}{cost('plant_spyware')}
                      </button>
                    ) : <button className="hw-link" onClick={() => setCurrentView('black_market')}>Procurar no Black Market</button>}
                  </>
                )}
              </div>
              {mySpyware?.discoveredAccounts?.map(acc => (
                <div key={acc.accountNumber} className="hw-row">
                  <div className="hw-row__main">
                    <p className="hw-row__title">{acc.ownerName || 'Conta interceptada'} · {money(acc.balance)}</p>
                    <p className="hw-row__sub font-mono">{acc.bankName} · {acc.accountNumber}</p>
                  </div>
                  <button className="cyber-button hw-mini" disabled={acc.balance <= 0} onClick={() => handleSiphonAccount(acc.accountNumber)}>Desviar</button>
                </div>
              ))}
              {mySpyware?.discoveredCrypto?.map(w => (
                <div key={w.address} className="hw-row">
                  <div className="hw-row__main">
                    <p className="hw-row__title">Carteira com {w.amount} BTC</p>
                    <p className="hw-row__sub font-mono truncate">{w.address}</p>
                  </div>
                  <button className="cyber-button hw-mini" onClick={() => handleSiphonCrypto(w.address)}>Drenar</button>
                </div>
              ))}

              <div className="hw-row">
                {runningOf('upload') ? <div className="w-full">{progressRow(runningOf('upload')!, 'Instalando minerador')}</div> : (
                  <>
                    <div className="hw-row__main">
                      <p className="hw-row__title">Minerador {myMiner ? `ativo · ${myMiner.hashRate} H/s` : ''}</p>
                      <p className="hw-row__sub">{miner ? `Usa os ${server.hardware.cpuPower} GHz deste servidor para minerar cripto para você.` : 'Você não tem minerador instalado.'}</p>
                    </div>
                    {miner && (
                      <button className="cyber-button hw-mini cyber-button--secondary"
                        onClick={() => startProcess('upload', { targetIp: server.ip, softwareId: miner.id, targetFileName: miner.name, details: { softwareId: miner.id } })}>
                        {myMiner ? 'Atualizar' : 'Instalar'}{cost('upload')}
                      </button>
                    )}
                  </>
                )}
              </div>

              {isBank && (
                <>
                  <p className="hw-row__sub mt-2">Cofre do banco</p>
                  <div className="hw-row hw-row--alert">
                    {runningOf('mass_bank_heist') ? <div className="w-full">{progressRow(runningOf('mass_bank_heist')!, 'Mega-assalto em andamento')}</div> : (
                      <>
                        <div className="hw-row__main">
                          <p className="hw-row__title">Mega-assalto à database central</p>
                          <p className="hw-row__sub">Leva o cofre inteiro, mas a polícia federal emite um mandado na hora.</p>
                        </div>
                        <button className="cyber-button cyber-button--danger hw-mini" onClick={handleMassBankHeist}>Executar{cost('mass_bank_heist')}</button>
                      </>
                    )}
                  </div>
                  {server.bankAccounts?.filter(a => a.balance > 0).map(acc => (
                    <div key={acc.accountNumber} className="hw-row">
                      <div className="hw-row__main">
                        <p className="hw-row__title">{acc.ownerName || 'Conta corrente'} · {money(acc.balance)}</p>
                        <p className="hw-row__sub font-mono">{acc.accountNumber}</p>
                      </div>
                      <button className="cyber-button hw-mini cyber-button--secondary" onClick={() => handleBankHeist(acc)}>Transferir para mim</button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </section>

        {/* 3. Sumir */}
        <section className={stageClass(isBreached && myLogs.length === 0, isBreached && myLogs.length > 0, !isBreached)} aria-label="Etapa 3: sumir">
          <span className="hw-stage__num">3</span>
          <div>
            <h3 className="hw-stage__title">Sumir</h3>
            <p className="hw-stage__status">
              {myLogs.length > 0
                ? <span className="text-red-500">Seu IP aparece em {myLogs.length} {myLogs.length === 1 ? 'registro' : 'registros'} deste servidor.</span>
                : 'Nenhum rastro seu nos logs deste servidor.'}
            </p>
          </div>
          <div className="hw-stage__body">
            <div className="flex flex-wrap items-center gap-2">
              {isBreached && myLogs.length > 0 && (
                <button className="cyber-button" onClick={() => wipeRemoteLogs(server.ip)}>Apagar logs{cost('wipelog')}</button>
              )}
              {(server.logs || []).length > 0 && (
                <button className="hw-link px-2" onClick={() => setShowLogs(v => !v)} aria-expanded={showLogs}>
                  {showLogs ? 'Esconder registros' : `Ver registros (${server.logs.length})`}
                </button>
              )}
            </div>
            {!isBreached && myLogs.length > 0 && <p className="text-sm text-gray-500">Para apagar os logs você precisa de acesso root.</p>}
            {isBreached && myLogs.length > 0 && (
              <p className="hw-row hw-row--alert text-sm text-gray-900">
                {hunt
                  ? <>Prazo: <strong className="font-mono text-red-500">{formatCountdown(hunt.dueAt - now)}</strong> para apagar antes que {HUNT_KIND_TEXT[hunt.kind]}.</>
                  : <>Se sair sem apagar, em {HUNT_MINUTES[server.type]} min {HUNT_KIND_TEXT[HUNT_KIND_BY_TYPE[server.type]]}. Usar proxies esconde o seu IP dos logs.</>}
              </p>
            )}
            {showLogs && (
              <ul className="grid gap-1.5">
                {server.logs.map(log => {
                  const mine = log.ip === player.ip || log.action.includes(player.ip);
                  return (
                    <li key={log.id} className={`hw-row ${mine ? 'hw-row--alert' : ''}`}>
                      <div className="hw-row__main">
                        <p className="hw-row__sub font-mono">{log.formattedTime} · {log.ip}{mine ? ' (você)' : ''}</p>
                        <p className="text-sm text-gray-900">{log.action}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Ataque separado: não faz parte da invasão */}
      <section className="cyber-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Flame className="h-5 w-5 text-red-500" />
          <div className="min-w-0 flex-1">
            <h3 className="hw-section-title">Ataque DDoS</h3>
            <p className="text-sm text-gray-500">
              Derruba o servidor por 60 s, sem precisar invadir. Sua botnet: {playerPower} Gbps contra {targetDefense} Gbps de defesa · chance de {ddosChance}%.
            </p>
          </div>
          {runningOf('ddos') ? <div className="w-full">{progressRow(runningOf('ddos')!, 'Ataque DDoS')}</div> : (
            <button className="cyber-button cyber-button--danger" disabled={!isOnline}
              onClick={() => startProcess('ddos', { targetIp: server.ip, targetFileName: `DDoS em ${server.hostname}` })}>
              {isOnline ? `Lançar ataque${cost('ddos')}` : 'Já está fora do ar'}
            </button>
          )}
        </div>
        {!isOnline && (
          <p className="mt-3 flex items-center gap-2 text-sm text-red-500"><AlertTriangle className="h-4 w-4" /> Este servidor está fora do ar por um ataque DDoS.</p>
        )}
      </section>
    </div>
  );
};
