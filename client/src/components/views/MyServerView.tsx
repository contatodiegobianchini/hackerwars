import React from 'react';
import { Activity, Cpu, FolderArchive, Globe2, HardDrive, Layers, Radio, Server, ShieldAlert, Terminal, Wifi, Zap } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore.js';
import { CyberButton } from '../ui/CyberButton.js';
import { CyberMetric } from '../ui/CyberMetric.js';
import { CyberPanel } from '../ui/CyberPanel.js';
import { CyberProgress } from '../ui/CyberProgress.js';

export const MyServerView: React.FC = () => {
  const { player, processes, activeConnection, allServers, setCurrentView, toggleTerminal } = useGameStore();
  if (!player) return null;

  const storagePercent = Math.min(100, Math.round((player.hardware.hdd.usedMb / player.hardware.hdd.capacityMb) * 100));
  const activeMiners = allServers.filter(server => server.activeMiners?.some(miner => miner.ownerId === player.id));
  const processLabels: Record<string, string> = { crack: 'Quebrando senha', download: 'Baixando arquivo', upload: 'Enviando arquivo', scan: 'Varredura de portas', compile: 'Compilando', wipelog: 'Apagando logs', ddos: 'Ataque DDoS', mine: 'Minerando', antivirus_scan: 'Varredura de vírus', plant_spyware: 'Implantando spyware', mass_bank_heist: 'Mega-assalto' };
  const events = [
    activeConnection ? `Conectado a ${activeConnection.ip}` : 'Máquina local pronta',
    processes.length ? `${processes.length} ${processes.length === 1 ? 'processo em execução' : 'processos em execução'}` : 'Nenhum processo em execução',
    activeMiners.length ? `${activeMiners.length} ${activeMiners.length === 1 ? 'minerador remoto ativo' : 'mineradores remotos ativos'}` : 'Nenhum minerador remoto instalado',
  ];

  return <div className="space-y-4" data-zone="core">
    <CyberPanel accent className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="cyber-kicker">Sua máquina</p>
          <h1 className="mt-2 text-xl font-bold text-[var(--text-primary)]">Servidor de {player.username}</h1>
          <p className="mt-2 font-mono text-xs text-[var(--text-secondary)]">{player.ip} <span className="mx-2 text-[var(--text-muted)]">·</span> {player.rank} <span className="mx-2 text-[var(--text-muted)]">·</span> {player.reputation} de reputação</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CyberButton variant="secondary" onClick={() => setCurrentView('known_servers')}><Globe2 className="h-3.5 w-3.5" /> Ver alvos</CyberButton>
          <CyberButton onClick={toggleTerminal}><Terminal className="h-3.5 w-3.5" /> Abrir terminal</CyberButton>
        </div>
      </div>
    </CyberPanel>

    <div className="grid gap-4 xl:grid-cols-[1.45fr_.9fr]">
      <CyberPanel accent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3"><div><p className="cyber-kicker">Estado do sistema</p><h2 className="cyber-module-title mt-2">Hardware</h2></div><span className="cyber-live flex items-center gap-1.5 font-mono text-[10px] text-[var(--signal-primary)]"><i className="h-1.5 w-1.5 rounded-full bg-current" /> online</span></div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <CyberMetric label="CPU" value={`${player.hardware.cpu.clockSpeedGhz} GHz`} detail={player.hardware.cpu.name} icon={Cpu} />
          <CyberMetric label="RAM" value={`${processes.length}/${player.hardware.ram.maxTasks}`} detail={`${player.hardware.ram.capacityGb} GB instalados`} icon={Layers} />
          <CyberMetric label="Rede" value={`${player.hardware.network.speedMbps} Mbps`} detail={player.hardware.network.name} tone="network" icon={Wifi} />
          <CyberMetric label="Disco" value={`${player.hardware.hdd.usedMb}/${player.hardware.hdd.capacityMb} MB`} detail="armazenamento local" icon={HardDrive} />
          <CyberMetric label="Firewall" value={`v${player.software.filter(s => s.type === 'firewall').length || 1}.0`} detail="defesa ativa" icon={ShieldAlert} />
          <CyberMetric label="Atraso de rastreio" value={`+${player.hardware.vpn?.traceDelaySec || 0}s`} detail={player.hardware.vpn?.name || 'Sem VPN'} tone="network" icon={Radio} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><CyberProgress label="Disco usado" value={storagePercent} valueLabel={`${storagePercent}%`} /><CyberProgress label="Processos em uso" value={(processes.length / Math.max(1, player.hardware.ram.maxTasks)) * 100} valueLabel={`${processes.length}/${player.hardware.ram.maxTasks}`} tone="network" /></div>
      </CyberPanel>

      <CyberPanel className="p-4 sm:p-5">
        <p className="cyber-kicker">Agora</p><h2 className="cyber-module-title mt-2">Processos</h2>
        <div className="mt-4 space-y-2">
          {processes.slice(0, 4).map(process => <div key={process.id} className="border border-[var(--border-subtle)] bg-[var(--bg-inset)] p-3"><div className="flex justify-between gap-3 font-mono text-[10px]"><span className="text-[var(--text-primary)]">{processLabels[process.type] || process.type.toUpperCase()}</span><span className="text-[var(--signal-primary)]">{Math.round(process.progress)}%</span></div><CyberProgress className="mt-2" value={process.progress} /></div>)}
          {!processes.length && <div className="flex min-h-32 flex-col items-center justify-center border border-dashed border-[var(--border-subtle)] text-center"><Activity className="h-5 w-5 text-[var(--text-muted)]" /><p className="mt-2 font-mono text-[10px] text-[var(--text-secondary)]">Nenhum processo rodando. Conecte-se a um alvo para começar.</p></div>}
        </div>
        <button onClick={() => setCurrentView('processes')} className="mt-4 w-full text-sm font-semibold text-amber-500 hover:text-amber-400">Ver todos os processos</button>
      </CyberPanel>
    </div>

    <div className="grid gap-4 lg:grid-cols-[1.45fr_.9fr]">
      <CyberPanel className="p-4 sm:p-5"><div className="flex items-center justify-between"><div><p className="cyber-kicker">Registro</p><h2 className="cyber-module-title mt-2">Atividade recente</h2></div><Activity className="h-4 w-4 text-[var(--signal-primary)]" /></div><ol className="mt-4 border-l border-[var(--border-subtle)] pl-4 space-y-3">{events.map((event, index) => <li key={event} className="relative font-mono text-[11px] text-[var(--text-secondary)] before:absolute before:-left-[1.28rem] before:top-1 before:h-2 before:w-2 before:border before:border-[var(--signal)] before:bg-[var(--bg-panel)]"><span className="mr-3 text-[var(--text-muted)]">{String(14 + index).padStart(2, '0')}:3{index}:2{index}</span>{event}</li>)}</ol></CyberPanel>
      <CyberPanel className="p-4 sm:p-5" accent><p className="cyber-kicker">Conexão</p><h2 className="cyber-module-title mt-2">Alvo atual</h2><div className="mt-5"><CyberMetric label={activeConnection ? 'Alvo conectado' : 'Situação'} value={activeConnection ? activeConnection.hostname : 'Sem conexão'} detail={activeConnection ? activeConnection.ip : 'Abra Rede › Alvos para escolher um servidor'} tone="network" icon={Server} /></div><div className="mt-3 grid grid-cols-2 gap-2"><CyberMetric label="Mineradores" value={activeMiners.length} detail="em servidores remotos" icon={Zap} tone="economy" /><CyberMetric label="Software" value={player.software.length} detail="programas instalados" icon={FolderArchive} /></div></CyberPanel>
    </div>
  </div>;
};
