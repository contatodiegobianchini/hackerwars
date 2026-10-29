import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import {
  Globe,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Radio,
  X,
  Plus
} from 'lucide-react';

export const KnownServersView: React.FC = () => {
  const {
    player,
    servers,
    connectToTarget,
    discoverRandomIp,
    toggleProxyHop,
    clearProxyChain
  } = useGameStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [manualIpInput, setManualIpInput] = useState('');

  const activeProxyChain = player?.activeProxyChain || [];

  const handleManualConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualIpInput.trim()) {
      connectToTarget(manualIpInput.trim());
      setManualIpInput('');
    }
  };

  const filteredServers = servers.filter(srv => {
    const matchesQuery =
      srv.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.ip.includes(searchQuery) ||
      (srv.domain && srv.domain.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || srv.type === filterType;

    return matchesQuery && matchesType;
  });

  const getDifficultyStars = (hasher: number) => {
    if (hasher <= 1.2) return { stars: '★☆☆☆☆', label: 'Muito Fácil', color: 'text-emerald-600' };
    if (hasher <= 2.2) return { stars: '★★☆☆☆', label: 'Fácil / Médio', color: 'text-blue-600' };
    if (hasher <= 3.2) return { stars: '★★★☆☆', label: 'Médio', color: 'text-amber-600' };
    if (hasher <= 4.2) return { stars: '★★★★☆', label: 'Difícil', color: 'text-orange-600' };
    return { stars: '★★★★★', label: 'Elite / Militar', color: 'text-red-600' };
  };

  return (
    <div className="space-y-4 select-none">
      {/* Proxy Bouncing Chain Route */}
      <div className="bg-white text-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Corrente de Proxies / Rota de Salto ({activeProxyChain.length}/4 Nós)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg flex items-center space-x-1">
              <Globe className="w-3 h-3 text-blue-600" />
              <span>{player?.hardware.vpn?.name || 'Tor Básico'} (+{player?.hardware.vpn?.traceDelaySec || 0}s VPN)</span>
            </div>

            {activeProxyChain.length > 0 && (
              <button
                onClick={clearProxyChain}
                className="text-[11px] text-gray-400 hover:text-red-500 flex items-center space-x-1"
              >
                <X className="w-3 h-3" />
                <span>Limpar Rota</span>
              </button>
            )}
          </div>
        </div>

        {activeProxyChain.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-3 text-[11px] text-gray-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Conexão Direta. Adicione servidores invadidos como nós de proxy (+18s cada) para somar ao seu plano de VPN Tor e desacelerar o rastreamento policial!</span>
            <span className="font-mono text-gray-700 font-bold shrink-0">Buffer Atual: {40 + (player?.hardware.vpn?.traceDelaySec || 0)}s</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-bold">
              Seu PC ({player?.ip})
            </span>
            <span>➔</span>
            {activeProxyChain.map((hopIp, idx) => {
              const hopServer = servers.find(s => s.ip === hopIp);
              return (
                <React.Fragment key={hopIp}>
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1.5">
                    <span>{hopServer?.hostname || hopIp}</span>
                    <button
                      onClick={() => toggleProxyHop(hopIp)}
                      className="hover:text-red-600 text-gray-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {idx < activeProxyChain.length - 1 && <span>➔</span>}
                </React.Fragment>
              );
            })}
            <span>➔</span>
            <span className="bg-black text-white px-2.5 py-1 rounded-lg font-bold">
              [Alvo Final]
            </span>
          </div>
        )}
      </div>

      {/* Header & Connect Bar */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold text-gray-900">Servidores Conhecidos & Alvos de Rede</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Escolha um servidor na lista ou digite um IP específico para se conectar.
            </p>
          </div>

          <button
            onClick={discoverRandomIp}
            className="bg-black hover:bg-gray-800 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-sm transition flex items-center space-x-1.5 self-start sm:self-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Fazer Varredura de Rede (Descobrir IP)</span>
          </button>
        </div>

        {/* Manual Connect Input Form */}
        <form onSubmit={handleManualConnect} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={manualIpInput}
              onChange={e => setManualIpInput(e.target.value)}
              placeholder="Digite um IP ou domínio (ex: 138.68.22.45 ou mit.cyber.edu)..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 outline-none focus:border-black transition"
            />
          </div>
          <button
            type="submit"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs px-4 py-2 rounded-xl transition"
          >
            Conectar
          </button>
        </form>

        {/* Category Filters */}
        <div className="flex items-center space-x-1.5 pt-2 border-t border-gray-100 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'Todos os Alvos' },
            { id: 'university', label: 'Universidades' },
            { id: 'darkweb', label: 'Dark Web / Warez' },
            { id: 'bank', label: 'Bancos & Finanças' },
            { id: 'corporate', label: 'Corporações' },
            { id: 'government', label: 'Governo' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                filterType === f.id ? 'bg-black text-white font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Servers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServers.map(srv => {
          const diff = getDifficultyStars(srv.security.hasherLevel);
          const isBreached = srv.security.isBreached;
          const isProxyHop = activeProxyChain.includes(srv.ip);

          return (
            <div
              key={srv.id}
              className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 border border-gray-100"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-sm text-gray-900">{srv.hostname}</h3>
                      {isBreached ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          ROOT OBTIDO
                        </span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase">
                          {srv.type}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-gray-500 mt-0.5">{srv.ip}</div>
                  </div>

                  <div className="text-right">
                    <div className={`text-xs font-bold ${diff.color}`}>{diff.stars}</div>
                    <div className="text-[10px] text-gray-400">{diff.label}</div>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">{srv.description}</p>
              </div>

              {/* Specs & Connect Action */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleProxyHop(srv.ip)}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition ${
                      isProxyHop
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {isProxyHop ? '✓ Nó Proxy' : '+ Usar como Proxy'}
                  </button>
                </div>

                <button
                  onClick={() => connectToTarget(srv.ip)}
                  className="bg-black hover:bg-gray-800 text-white font-medium text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition flex items-center space-x-1"
                >
                  <span>Conectar</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
