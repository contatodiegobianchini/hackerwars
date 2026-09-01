import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { useSoftwareActions } from '../../hooks/useSoftwareActions.js';
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Search,
  Download,
  Trash2,
  Zap,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Flame,
  WifiOff,
  Radio,
  Sparkles,
  Eye,
  Landmark,
  Coins,
  Bitcoin,
  LockOpen
} from 'lucide-react';
import { SoftwareItem } from '../../types/game.js';

export const TargetServerView: React.FC = () => {
  const {
    player,
    activeConnection,
    activeTrace,
    startProcess,
    disconnectTarget,
    deleteRemoteFile,
    wipeRemoteLogs,
    bankTransfer,
    siphonVictimCrypto,
    siphonVictimAccount,
    setCurrentView
  } = useGameStore();

  const { handleDownload, handleInstallMiner } = useSoftwareActions();

  const [subTab, setSubTab] = useState<'attack' | 'files' | 'logs' | 'bank'>('attack');

  if (!player) return null;

  if (!activeConnection) {
    return (
      <div className="bg-white text-gray-900 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-600">
          <Globe className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-gray-900 mb-1">Nenhum Servidor Conectado</h2>
        <p className="text-xs text-gray-500 mb-5">
          Conecte-se a um servidor na lista de alvos para iniciar operações de invasão, quebra de senhas, DDoS ou transferência de arquivos.
        </p>
        <button
          onClick={() => setCurrentView('known_servers')}
          className="bg-black hover:bg-gray-800 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-sm transition"
        >
          Ver Lista de Servidores & Alvos
        </button>
      </div>
    );
  }

  const isBreached = activeConnection.security.isBreached || (player.hackedIps && player.hackedIps.includes(activeConnection.ip));
  const isOnline = activeConnection.isOnline !== false;
  const isBank = activeConnection.type === 'bank';

  const playerCracker = player.software.find(s => s.type === 'cracker');
  const crackerVersion = playerCracker?.version || 1.0;
  const hasherVersion = activeConnection.security.hasherLevel;

  const playerMiner = player.software.find(s => s.type === 'miner');
  const playerBotnet = player.software.find(s => s.type === 'ddos');
  const playerSpyware = player.software.find(s => s.type === 'spyware');

  const existingMiner = activeConnection.activeMiners?.find(m => m.ownerId === player.id);
  const existingSpyware = activeConnection.activeSpyware?.find(s => s.ownerId === player.id);
  const hasPlayerLogs = activeConnection.logs?.some(l => l.ip === player.ip || l.action.includes(player.ip));

  const handleCrack = () => {
    startProcess('crack', { targetIp: activeConnection.ip });
  };

  const handleScan = () => {
    startProcess('scan', { targetIp: activeConnection.ip });
  };

  const handleDDoS = () => {
    startProcess('ddos', {
      targetIp: activeConnection.ip,
      targetFileName: `Ataque DDoS em ${activeConnection.hostname}`
    });
  };

  const handlePlantSpyware = () => {
    if (!playerSpyware) {
      alert('Você precisa de um software Spyware instalado para implantar keylogger e monitorar esta vítima!');
      return;
    }
    startProcess('plant_spyware', {
      targetIp: activeConnection.ip,
      targetFileName: `Implantando Spyware Trojan (${playerSpyware.name})`,
    });
  };

  const handleMassBankHeist = () => {
    if (confirm(`🚨 ALERTA MÁXIMO DE SEGURANÇA BANCÁRIA:\n\nExecutar o Mega-Assalto à Database Central de ${activeConnection.hostname} irá desviar todos os fundos de clientes e do cofre central de uma vez só!\n\nNo entanto, o FBI / INTERPOL DEFLAGRARÁ UM MANDADO DE PRISÃO IMEDIATAMENTE e você terá 45 segundos para se defender!\n\nDeseja prosseguir com o assalto agora?`)) {
      startProcess('mass_bank_heist', {
        targetIp: activeConnection.ip,
        targetFileName: `Infiltrando Database Central & Mega-Assalto em ${activeConnection.hostname}`,
      });
    }
  };

  const handleBankHeist = (victimAcc: any) => {
    const playerAcc = player.bankAccounts[0];
    if (playerAcc) {
      bankTransfer(victimAcc.accountNumber, playerAcc.accountNumber, victimAcc.balance, activeConnection.ip);
    }
  };

  return (
    <div className="space-y-4">
      {/* Live Police Trace HUD */}
      {activeTrace && activeTrace.isActive && (
        <div className="bg-red-950/40 border border-red-500/80 rounded-2xl p-4 text-white shadow-xl animate-pulse space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-red-200">
                🚨 RASTREAMENTO POLICIAL EM ANDAMENTO ({activeTrace.dangerLevel})
              </span>
            </div>

            <div className="text-xs font-mono font-bold text-red-300">
              {activeTrace.secondsRemaining}s para triangulação ({activeTrace.progressPercent}%)
            </div>
          </div>

          <div className="w-full bg-red-900/40 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-1000"
              style={{ width: `${activeTrace.progressPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-red-300 font-mono">
            <div className="flex items-center space-x-2">
              <span>Proxies: {activeTrace.hops.length > 0 ? `${activeTrace.hops.length} nós (+${activeTrace.hops.length * 18}s)` : 'Nenhum'}</span>
              <span>•</span>
              <span>VPN: {player?.hardware.vpn ? `${player.hardware.vpn.name} (+${player.hardware.vpn.traceDelaySec}s)` : 'Tor Padrão'}</span>
            </div>
            <span>Desconecte antes de 100% para evitar retaliação ou prisão!</span>
          </div>
        </div>
      )}

      {/* Offline DDoS Warning Banner */}
      {!isOnline && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between text-red-900 shadow-sm animate-pulse">
          <div className="flex items-center space-x-3">
            <WifiOff className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <h3 className="font-bold text-sm">SERVIDOR DERRUBADO (OFFLINE POR DDOS)</h3>
              <p className="text-xs text-red-700 mt-0.5">
                Os serviços deste host foram paralisados pelo ataque de negação de serviço.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-red-600 text-white px-3 py-1 rounded-xl">
            OFFLINE
          </span>
        </div>
      )}

      {/* Top Target Profile Card */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              !isOnline
                ? 'bg-red-50 text-red-600'
                : isBreached
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-gray-100 text-gray-600'
            }`}>
              {!isOnline ? (
                <WifiOff className="w-6 h-6" />
              ) : isBreached ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-amber-500" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-gray-900">{activeConnection.hostname}</h1>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  !isOnline
                    ? 'bg-red-100 text-red-800'
                    : isBreached
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-700'
                }`}>
                  {!isOnline ? 'Servidor Offline' : isBreached ? 'Acesso Root Obtido' : 'Protegido (Locked)'}
                </span>
              </div>

              <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1 font-mono">
                <span>IP: <strong className="text-gray-900 font-semibold">{activeConnection.ip}</strong></span>
                <span>•</span>
                <span>Tipo: <strong className="text-gray-900 uppercase">{activeConnection.type}</strong></span>
                <span>•</span>
                <span>CPU: <strong className="text-gray-900">{activeConnection.hardware.cpuPower} GHz</strong></span>
              </div>

              <p className="text-xs text-gray-600 mt-2">{activeConnection.description}</p>
            </div>
          </div>

          <button
            onClick={disconnectTarget}
            className="self-start sm:self-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-1.5 rounded-xl text-xs font-medium transition"
          >
            Desconectar
          </button>
        </div>

        {/* Sub-Tabs Bar */}
        <div className="flex items-center space-x-1 border-t border-gray-100 mt-5 pt-3 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setSubTab('attack')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              subTab === 'attack' ? 'bg-black text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>1. Invasão, DDoS & Defesa</span>
          </button>

          <button
            onClick={() => setSubTab('files')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              subTab === 'files' ? 'bg-black text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>2. Arquivos & Mineração ({activeConnection.files?.length || 0})</span>
            {existingMiner && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </button>

          <button
            onClick={() => setSubTab('logs')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              subTab === 'logs' ? 'bg-black text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>3. Logs de Acesso ({activeConnection.logs?.length || 0})</span>
            {hasPlayerLogs && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            )}
          </button>

          {isBank && (
            <button
              onClick={() => setSubTab('bank')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
                subTab === 'bank' ? 'bg-black text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>4. Cofre & Contas Bancárias</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Attack & DDoS */}
      {subTab === 'attack' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Crack Section */}
          <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <Key className="w-4 h-4 text-gray-700" />
                <span>Quebra de Senha (Cracking)</span>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Defesa do Alvo (Hasher):</span>
                  <span className="font-bold text-gray-900">v{hasherVersion.toFixed(1)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Seu Cracker Instalado:</span>
                  <span className={`font-bold ${crackerVersion >= hasherVersion ? 'text-emerald-600' : 'text-red-600'}`}>
                    CrackMaster v{crackerVersion.toFixed(1)} {crackerVersion >= hasherVersion ? '✓' : '(Inferior)'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Poder de Computação:</span>
                  <span className="font-bold text-gray-900">
                    {player.hardware.cpu.clockSpeedGhz} GHz • {player.hardware.gpu?.tflops || 0.5} TFLOPS
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-xs">
                  <span className="text-gray-500">Status de Invasão:</span>
                  <span className={`font-bold ${isBreached ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isBreached ? 'Senha Quebrada (ROOT)' : 'Protegido por Criptografia'}
                  </span>
                </div>
              </div>
            </div>

            {isBreached ? (
              <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl flex items-center space-x-2 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Você já tem acesso ROOT. Vá para a aba <strong>Arquivos</strong> para baixar ferramentas ou instalar mineradores.</span>
              </div>
            ) : crackerVersion < hasherVersion ? (
              <div className="space-y-3">
                <div className="bg-red-50 text-red-700 border border-red-200 p-3.5 rounded-xl text-xs flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <strong>Criptografia Superior:</strong>
                    <div>O Hasher do alvo (v{hasherVersion.toFixed(1)}) é mais forte que seu Cracker (v{crackerVersion.toFixed(1)}). Evolua seu Cracker em <strong>Meus Softwares</strong> para conseguir quebrar esta senha!</div>
                  </div>
                </div>

                <button
                  disabled
                  className="w-full bg-gray-200 text-gray-400 font-semibold text-xs py-3 rounded-xl cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Cracker Insuficiente (Requer v{hasherVersion.toFixed(1)}+)</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleCrack}
                className="w-full bg-black hover:bg-gray-800 text-white font-semibold text-xs py-3 rounded-xl shadow-sm transition flex items-center justify-center space-x-2"
              >
                <Key className="w-4 h-4" />
                <span>Iniciar Quebra de Senha (Crack)</span>
              </button>
            )}
          </div>

          {/* DDoS Attack Section */}
          <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 border border-gray-100">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span>Ataque DDoS (Negação de Serviço)</span>
                </div>

                {(() => {
                  const playerPower = Math.round((playerBotnet?.version || 1.0) * player.hardware.network.speedMbps * 10);
                  const targetDefense = Math.round(activeConnection.security.firewallLevel * activeConnection.hardware.networkMbps * 4);
                  const ddosChance = Math.min(95, Math.max(5, Math.round((playerPower / (playerPower + targetDefense * 0.7)) * 100)));
                  return (
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                      ddosChance >= 70 ? 'bg-emerald-100 text-emerald-800' : ddosChance >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      Chance: {ddosChance}%
                    </span>
                  );
                })()}
              </div>

              {(() => {
                const playerPower = Math.round((playerBotnet?.version || 1.0) * player.hardware.network.speedMbps * 10);
                const targetDefense = Math.round(activeConnection.security.firewallLevel * activeConnection.hardware.networkMbps * 4);
                const ddosChance = Math.min(95, Math.max(5, Math.round((playerPower / (playerPower + targetDefense * 0.7)) * 100)));

                return (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Defesa do Alvo:</span>
                      <span className="font-bold text-gray-900">
                        {targetDefense} Gbps (Firewall v{activeConnection.security.firewallLevel.toFixed(1)})
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Poder de Ataque da sua Botnet:</span>
                      <span className="font-bold text-gray-900">
                        {playerPower} Gbps ({playerBotnet?.name || 'Botnet'} v{playerBotnet?.version.toFixed(1) || 1.0})
                      </span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] text-gray-500 font-mono">
                        <span>PROBABILIDADE DE DERRUBAR</span>
                        <span className="font-bold text-gray-900">{ddosChance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${ddosChance >= 70 ? 'bg-emerald-600' : ddosChance >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${ddosChance}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-xs">
                      <span className="text-gray-500">Estado do Servidor:</span>
                      <span className={`font-bold ${isOnline ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isOnline ? 'ONLINE' : 'DERRUBADO (OFFLINE)'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <button
              onClick={handleDDoS}
              disabled={!isOnline}
              className={`w-full font-semibold text-xs py-3 rounded-xl shadow-sm transition flex items-center justify-center space-x-2 ${
                isOnline
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>{isOnline ? 'Lançar Ataque DDoS' : 'Servidor já está Offline'}</span>
            </button>
          </div>

          {/* Section 3: Spyware & Trojan Keylogger Panel */}
          <div className="md:col-span-2 bg-white text-gray-900 rounded-2xl p-5 shadow-sm space-y-4 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Espionagem & Trojan Spyware (Keylogger)</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Monitore teclas, comunicações e intercepte senhas bancárias e carteiras cripto da vítima automaticamente.
                  </p>
                </div>
              </div>

              {!existingSpyware ? (
                <button
                  onClick={handlePlantSpyware}
                  disabled={!isBreached || !playerSpyware}
                  className={`font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center space-x-1.5 ${
                    isBreached && playerSpyware
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isBreached ? 'Implantar Spyware Trojan' : 'Requer Acesso ROOT (Crack)'}</span>
                </button>
              ) : (
                <div className="bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                  <span>SPYWARE ATIVO (v{existingSpyware.spywareLevel.toFixed(1)})</span>
                </div>
              )}
            </div>

            {existingSpyware ? (
              <div className="space-y-3 pt-2">
                {/* Discovered Accounts */}
                {existingSpyware.discoveredAccounts && existingSpyware.discoveredAccounts.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Contas Bancárias Interceptadas pelo Keylogger ({existingSpyware.discoveredAccounts.length})</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {existingSpyware.discoveredAccounts.map(acc => (
                        <div key={acc.accountNumber} className="bg-gray-50 border border-gray-100 p-3.5 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="font-bold text-xs text-gray-900">{acc.ownerName}</div>
                            <div className="text-[11px] text-gray-500 font-mono">
                              {acc.bankName} • {acc.accountNumber} • PIN: {acc.password}
                            </div>
                            <div className="text-xs font-bold text-emerald-600 font-mono mt-1">
                              ${acc.balance.toLocaleString()} USD
                            </div>
                          </div>

                          <button
                            onClick={() => siphonVictimAccount(activeConnection.ip, acc.accountNumber)}
                            disabled={acc.balance <= 0}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                              acc.balance > 0
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Desviar Pix
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Discovered Crypto Wallets */}
                {existingSpyware.discoveredCrypto && existingSpyware.discoveredCrypto.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                      <Bitcoin className="w-3.5 h-3.5 text-amber-600" />
                      <span>Carteiras Cripto Interceptadas ({existingSpyware.discoveredCrypto.length})</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {existingSpyware.discoveredCrypto.map(w => (
                        <div key={w.address} className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="font-bold text-xs text-gray-900">Carteira Bitcoin Não Rastreada</div>
                            <div className="text-[10px] text-gray-500 font-mono truncate max-w-[180px]">
                              {w.address}
                            </div>
                            <div className="text-xs font-bold text-amber-700 font-mono mt-1">
                              +{w.amount} BTC (~${(w.amount * 68000).toLocaleString()})
                            </div>
                          </div>

                          <button
                            onClick={() => siphonVictimCrypto(activeConnection.ip, w.address)}
                            className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                          >
                            Drenar BTC
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!existingSpyware.discoveredAccounts || existingSpyware.discoveredAccounts.length === 0) &&
                 (!existingSpyware.discoveredCrypto || existingSpyware.discoveredCrypto.length === 0) && (
                  <div className="bg-gray-50 p-4 rounded-xl text-center text-xs text-gray-500 font-mono">
                    Keylogger ativo e monitorando tráfego de rede... Novas senhas e carteiras serão interceptadas a qualquer momento!
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-3.5 rounded-xl text-xs text-gray-500">
                Implantar o Spyware Trojan permite interceptar credenciais de contas e carteiras Bitcoin dos funcionários e usuários deste servidor continuamente.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Files & Mining */}
      {subTab === 'files' && (
        <div className="space-y-4">
          {/* Active Miner Banner on Target Machine */}
          <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                existingMiner ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
              }`}>
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">
                  {existingMiner ? 'Daemon Minerador Ativo neste Servidor' : 'Instalação de Minerador de Criptomoeda'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {existingMiner
                    ? `Minerando Bitcoins em segundo plano: ${existingMiner.hashRate} GH/s ativos gerando BTC a cada 5 segundos!`
                    : 'Instale o CryptoMinerX para transformar o processador deste servidor em uma fonte de renda passiva.'}
                </p>
              </div>
            </div>

            {isBreached && (
              <button
                onClick={handleInstallMiner}
                className="bg-black hover:bg-gray-800 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-sm transition flex items-center space-x-1.5 shrink-0 self-start sm:self-center"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{existingMiner ? 'Atualizar Versão do Minerador' : 'Instalar Minerador de Cripto'}</span>
              </button>
            )}
          </div>

          {/* Files List */}
          <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Arquivos no Servidor Remoto</h3>

            {!isBreached ? (
              <div className="bg-gray-50 rounded-2xl p-8 text-center max-w-md mx-auto space-y-3">
                <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
                <h4 className="font-bold text-gray-900 text-sm">Acesso Bloqueado</h4>
                <p className="text-xs text-gray-500">
                  Você precisa quebrar a senha do servidor antes de poder listar e baixar arquivos confidenciais.
                </p>
                <button
                  onClick={handleCrack}
                  className="bg-black hover:bg-gray-800 text-white font-medium text-xs px-4 py-2 rounded-xl transition"
                >
                  Quebrar Senha Agora
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {activeConnection.files.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-xs">
                    Nenhum arquivo encontrado no diretório remoto.
                  </div>
                ) : (
                  activeConnection.files.map(file => (
                    <div
                      key={file.id}
                      className="bg-gray-50 border border-gray-100 hover:border-gray-200 p-3.5 rounded-xl flex items-center justify-between transition"
                    >
                      <div>
                        <div className="font-semibold text-xs text-gray-900 flex items-center space-x-2">
                          <span>{file.name}</span>
                          <span className="text-gray-600 text-[10px] bg-gray-200 px-1.5 py-0.2 rounded">
                            v{file.version.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Tamanho: {file.sizeMb} MB | Tipo: {file.type.toUpperCase()}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownload(file)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Baixar</span>
                        </button>

                        <button
                          onClick={() => deleteRemoteFile(activeConnection.ip, file.id)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-gray-100 transition"
                          title="Deletar do servidor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Logs */}
      {subTab === 'logs' && (
        <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Registros de Acesso (Logs)</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Histórico de conexões registradas no servidor remoto.
              </p>
            </div>

            {isBreached && (
              <button
                onClick={() => wipeRemoteLogs(activeConnection.ip)}
                className="bg-red-600 hover:bg-red-500 text-white font-medium text-xs px-3.5 py-2 rounded-xl shadow-sm transition flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Todos os Logs</span>
              </button>
            )}
          </div>

          {hasPlayerLogs ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start space-x-3 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-900">Atenção: Seus rastros estão registrados aqui!</strong>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  Seu IP ({player.ip}) está visível nas entradas abaixo. Limpe os logs para não ser rastreado nem multado pelos órgãos de segurança!
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl flex items-center space-x-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Nenhum rastro do seu IP foi encontrado nos logs deste servidor. Você está limpo!</span>
            </div>
          )}

          <div className="space-y-2 font-mono text-xs">
            {(!activeConnection.logs || activeConnection.logs.length === 0) ? (
              <div className="text-center py-8 text-gray-400">
                Arquivo de logs vazio.
              </div>
            ) : (
              activeConnection.logs.map(log => {
                const isSelf = log.ip === player.ip || log.action.includes(player.ip);

                return (
                  <div
                    key={log.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      isSelf ? 'bg-red-50 border-red-200 text-red-900' : 'bg-gray-50 border-gray-100 text-gray-800'
                    }`}
                  >
                    <div>
                      <div className="text-[11px] text-gray-500 mb-0.5">
                        <span>[{log.formattedTime}]</span> • IP Origem: <strong className={isSelf ? 'text-red-700 underline font-bold' : 'text-gray-900'}>{log.ip} {isSelf && '(VOCÊ!)'}</strong>
                      </div>
                      <div className="text-gray-900 font-sans">{log.action}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Bank Vault & Database Central */}
      {subTab === 'bank' && isBank && (
        <div className="space-y-4">
          {/* Mega Bank Database Heist Card */}
          <div className="bg-gradient-to-r from-red-900 via-gray-900 to-black text-white rounded-2xl p-6 shadow-xl border border-red-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-600/20 border border-red-500/40 rounded-2xl flex items-center justify-center text-red-400 shrink-0">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base text-white">Infiltrar Database Central de Clientes (Mega Heist)</h3>
                    <span className="text-[10px] font-mono font-bold bg-red-600 text-white px-2 py-0.5 rounded-md uppercase animate-pulse">
                      RISCO MÁXIMO
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    Executa um ataque quântico nos cofres centrais de {activeConnection.hostname} para desviar todos os fundos de clientes e reservas de uma só vez!
                  </p>
                </div>
              </div>

              <button
                onClick={handleMassBankHeist}
                disabled={!isBreached}
                className={`px-5 py-3 rounded-xl font-bold text-xs transition shadow-lg shrink-0 flex items-center space-x-2 ${
                  isBreached
                    ? 'bg-red-600 hover:bg-red-500 text-white animate-bounce'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>{isBreached ? 'EXECUTAR MEGA-ASSALTO ($$$)' : 'Requer Acesso ROOT'}</span>
              </button>
            </div>

            <div className="bg-red-950/60 border border-red-800/60 p-3 rounded-xl flex items-center space-x-2 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>
                <strong>AVISO DA POLÍCIA FEDERAL:</strong> Esta operação transferirá centenas de milhares de dólares, mas deflagrará <strong>IMEDIATAMENTE um Mandado de Busca e Apreensão pelo FBI</strong>! Prepare suas defesas!
              </span>
            </div>
          </div>

          {/* Regular Accounts List */}
          <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-gray-900 text-sm">Contas do Banco ({activeConnection.hostname})</h3>
            </div>

            {!isBreached ? (
              <div className="bg-gray-50 rounded-2xl p-8 text-center max-w-md mx-auto space-y-3">
                <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
                <h4 className="font-bold text-gray-900 text-sm">Cofre Protegido</h4>
                <p className="text-xs text-gray-500">
                  Quebre a senha do banco para ver as contas correntes e saldos disponíveis.
                </p>
                <button
                  onClick={handleCrack}
                  className="bg-black hover:bg-gray-800 text-white font-medium text-xs px-4 py-2 rounded-xl transition"
                >
                  Quebrar Senha do Banco
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeConnection.bankAccounts?.map(acc => (
                  <div
                    key={acc.accountNumber}
                    className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-sm text-gray-900">{acc.ownerName || 'Conta Corrente'}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        Conta: <strong>{acc.accountNumber}</strong> | PIN: <span className="text-gray-700">{acc.password}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right font-mono">
                        <div className="text-[10px] text-gray-500">SALDO</div>
                        <div className="text-base font-bold text-emerald-600">${acc.balance.toLocaleString()}</div>
                      </div>

                      {acc.balance > 0 && (
                        <button
                          onClick={() => handleBankHeist(acc)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-sm"
                        >
                          Transferir para Minha Conta
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
