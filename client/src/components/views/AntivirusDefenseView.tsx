import React from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import {
  ShieldCheck,
  ShieldAlert,
  Bug,
  Radio,
  Zap,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Power,
  RefreshCw
} from 'lucide-react';

export const AntivirusDefenseView: React.FC = () => {
  const {
    player,
    runAntivirusScan,
    cleanInfection,
    toggleHoneypot,
    activeInvasion,
    defendNpcInvasion,
    dismissInvasionAlert,
    setCurrentView
  } = useGameStore();

  const [currentTime, setCurrentTime] = React.useState<number>(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!player) return null;

  const avSoftware = player.software.find(s => s.type === 'antivirus') || {
    id: 'soft-av-1',
    name: 'AegisScanner Pro',
    version: 1.0,
    sizeMb: 18,
  };

  const fwSoftware = player.software.find(s => s.type === 'firewall') || {
    id: 'soft-fw-1',
    name: 'AegisWall',
    version: 1.0,
    sizeMb: 15,
  };

  const infections = player.infections || [];
  const systemHealth = Math.max(0, 100 - infections.length * 25);

  // Honeypot active & cooldown timing
  const isHoneypotActive = !!(player.honeypotActiveUntil && player.honeypotActiveUntil > currentTime);
  const isHoneypotCooldown = !isHoneypotActive && !!(player.honeypotCooldownUntil && player.honeypotCooldownUntil > currentTime);

  const formatHoneypotActiveTimer = () => {
    if (!player.honeypotActiveUntil) return '00:00';
    const msLeft = Math.max(0, player.honeypotActiveUntil - currentTime);
    const mins = Math.floor(msLeft / 60000);
    const secs = Math.floor((msLeft % 60000) / 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHoneypotCooldownTimer = () => {
    if (!player.honeypotCooldownUntil) return '0h 0m';
    const msLeft = Math.max(0, player.honeypotCooldownUntil - currentTime);
    const hours = Math.floor(msLeft / 3600000);
    const mins = Math.floor((msLeft % 3600000) / 60000);
    const secs = Math.floor((msLeft % 60000) / 1000);
    if (hours > 0) return `${hours}h ${mins.toString().padStart(2, '0')}m`;
    return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="space-y-4 select-none">
      {/* Active NPC Invasion Modal / Alert */}
      {activeInvasion && activeInvasion.status === 'incoming' && (
        <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-6 text-gray-900 shadow-xl animate-pulse space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold bg-red-600 text-white px-2.5 py-0.5 rounded-full">
                    INVASÃO EM ANDAMENTO
                  </span>
                  <span className="text-xs text-red-600 font-mono font-bold">
                    Tempo Restante: {activeInvasion.timeRemainingSec}s
                  </span>
                </div>
                <h2 className="text-base font-bold text-gray-900 mt-1">
                  {activeInvasion.attackerName} ({activeInvasion.attackerIp}) está atacando seu IP!
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Nível do Invasor: <strong>v{activeInvasion.attackerLevel.toFixed(1)}</strong> • Recompensa por neutralização: <strong>${activeInvasion.rewardCash.toLocaleString()} USD</strong>
                </p>
              </div>
            </div>

            <div className="w-full sm:w-48 bg-gray-200 h-2.5 rounded-full overflow-hidden self-center">
              <div className="bg-red-600 h-full transition-all" style={{ width: `${activeInvasion.progress}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => defendNpcInvasion('firewall')}
              className="bg-black hover:bg-gray-800 text-white font-semibold text-xs py-3 rounded-2xl shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Bloquear com Firewall (v{fwSoftware.version.toFixed(1)})</span>
            </button>

            <button
              onClick={() => defendNpcInvasion('honeypot')}
              disabled={!isHoneypotActive}
              className={`font-semibold text-xs py-3 rounded-2xl shadow-sm transition flex items-center justify-center space-x-1.5 ${
                isHoneypotActive
                  ? 'bg-amber-500 hover:bg-amber-600 text-black font-bold cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{isHoneypotActive ? `Contra-Atacar com Honeypot (${formatHoneypotActiveTimer()})` : 'Honeypot Inativo'}</span>
            </button>

            <button
              onClick={() => defendNpcInvasion('killswitch')}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-3 rounded-2xl shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              <Power className="w-4 h-4" />
              <span>Killswitch Emergencial (-$200)</span>
            </button>
          </div>
        </div>
      )}

      {/* Header & Health Status */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-gray-700" />
              <h1 className="text-base font-bold text-gray-900">Centro de Defesa & Antivírus</h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Proteja seu computador contra invasões de outros hackers, execute varreduras e arme armadilhas Honeypot.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl text-xs font-mono">
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase">INTEGRIDADE DO SISTEMA</div>
              <div className={`text-base font-bold ${systemHealth === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                {systemHealth}% {systemHealth === 100 ? 'SEGURO' : 'COMPROMETIDO'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Antivirus Card */}
        <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 border border-gray-100">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                v{avSoftware.version.toFixed(1)}
              </span>
            </div>

            <h3 className="font-bold text-sm text-gray-900 mt-3">{avSoftware.name}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Faz uma varredura completa na memória RAM e nos arquivos para eliminar cavalos de Troia e mineradores secretos.
            </p>
          </div>

          <button
            onClick={runAntivirusScan}
            className="w-full bg-black hover:bg-gray-800 text-white font-semibold text-xs py-2.5 rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Executar Varredura Antivírus</span>
          </button>
        </div>

        {/* Honeypot Trap Card */}
        <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 border border-gray-100">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                <Zap className="w-5 h-5" />
              </div>
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1 ${
                isHoneypotActive
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse'
                  : isHoneypotCooldown
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {isHoneypotActive ? (
                  <span>⚡ ATIVO ({formatHoneypotActiveTimer()})</span>
                ) : isHoneypotCooldown ? (
                  <span>⏳ RECARGA ({formatHoneypotCooldownTimer()})</span>
                ) : (
                  <span>PRONTO</span>
                )}
              </span>
            </div>

            <h3 className="font-bold text-sm text-gray-900 mt-3">Armadilha Honeypot (10 min)</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Simula portas vulneráveis para capturar invasores. Fica ativo por <strong>10 minutos</strong> e pode ser rearmado <strong>uma vez a cada 2 horas</strong>.
            </p>
          </div>

          <button
            onClick={toggleHoneypot}
            disabled={isHoneypotActive || isHoneypotCooldown}
            className={`w-full font-semibold text-xs py-2.5 rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5 ${
              isHoneypotActive
                ? 'bg-emerald-600 text-white font-bold cursor-default'
                : isHoneypotCooldown
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                : 'bg-black hover:bg-gray-800 text-white cursor-pointer'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>
              {isHoneypotActive
                ? `Honeypot Armado (${formatHoneypotActiveTimer()})`
                : isHoneypotCooldown
                ? `Em Recarga (${formatHoneypotCooldownTimer()})`
                : 'Armar Armadilha (10 min)'}
            </span>
          </button>
        </div>

        {/* Firewall Defense Card */}
        <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 border border-gray-100">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                v{fwSoftware.version.toFixed(1)}
              </span>
            </div>

            <h3 className="font-bold text-sm text-gray-900 mt-3">{fwSoftware.name}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Barreira de filtragem de pacotes. Bloqueia tentativas de invasão e absorve ataques DDoS de alvos vingativos.
            </p>
          </div>

          <div className="bg-gray-50 p-2.5 rounded-xl text-center text-xs font-mono text-gray-600">
            Poder de Defesa: <strong className="text-gray-900">{Math.round(fwSoftware.version * player.hardware.network.speedMbps * 4)} Gbps</strong>
          </div>
        </div>
      </div>

      {/* Infections & Threats List */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
          <Bug className="w-4 h-4 text-gray-700" />
          <span>Ameaças e Infecções Detectadas ({infections.length})</span>
        </h3>

        {infections.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center text-xs text-gray-500 flex flex-col items-center space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-1" />
            <span className="font-bold text-gray-900">Seu computador está 100% limpo!</span>
            <span>Nenhum cavalo de Troia, spyware ou minerador clandestino detectado.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {infections.map(inf => {
              const canClean = avSoftware.version >= inf.level;

              return (
                <div key={inf.id} className="bg-red-50 border border-red-200 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <Bug className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-red-900 flex items-center space-x-2">
                        <span>{inf.name}</span>
                        {!canClean ? (
                          <span className="text-[10px] bg-red-200 text-red-900 border border-red-300 px-2 py-0.5 rounded-md font-mono font-bold flex items-center space-x-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Requer Antivírus v{inf.level.toFixed(1)}+</span>
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-mono font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Eliminável (Antivírus v{avSoftware.version.toFixed(1)})</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-red-700 font-mono mt-0.5">
                        Nível de Ameaça: <strong>v{inf.level.toFixed(1)}</strong> • Dreno Financeiro: -${inf.drainUsdPerMin}/min
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {!canClean && (
                      <button
                        onClick={() => setCurrentView('my_server')}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-xs px-3 py-2 rounded-xl transition flex items-center space-x-1"
                        title="Ir para Meus Softwares para compilar e evoluir o Antivírus"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Evoluir Antivírus</span>
                      </button>
                    )}

                    <button
                      onClick={() => cleanInfection(inf.id)}
                      className={`font-semibold text-xs px-3.5 py-2 rounded-xl shadow-sm transition flex items-center space-x-1.5 ${
                        canClean
                          ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                          : 'bg-red-200 text-red-800 hover:bg-red-300'
                      }`}
                    >
                      {canClean ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Eliminar Vírus</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Antivírus Insuficiente</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
