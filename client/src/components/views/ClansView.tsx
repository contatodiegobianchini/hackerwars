import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import {
  Users,
  Shield,
  Globe,
  Award,
  DollarSign,
  Bitcoin,
  Swords,
  PlusCircle,
  LogOut,
  Crown,
  Lock
} from 'lucide-react';
import { Clan, TerritoryNode } from '../../types/game.js';

export const ClansView: React.FC = () => {
  const {
    player,
    clans,
    territoryNodes,
    createClan,
    joinClan,
    leaveClan,
    depositClanVault,
    attackClanTerritory
  } = useGameStore();

  const [createName, setCreateName] = useState('');
  const [createTag, setCreateTag] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [depositAmount, setDepositAmount] = useState(1000);
  const [depositBtc, setDepositBtc] = useState(0.01);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!player) return null;

  const myClan = clans.find(c => c.id === player.clanId || c.members.some(m => m.playerId === player.id));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (createName && createTag) {
      createClan(createName, createTag, createDesc);
      setShowCreateModal(false);
      setCreateName('');
      setCreateTag('');
      setCreateDesc('');
    }
  };

  const handleDeposit = () => {
    if (myClan && depositAmount > 0) {
      depositClanVault(myClan.id, depositAmount, depositBtc);
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-700" />
              <h1 className="text-base font-bold text-gray-900">Sindicato & Clãs Hackers</h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Junte-se a um coletivo clandestino, compartilhe um cofre bancário e dispute o controle de nós globais na Guerra de Território.
            </p>
          </div>

          {!myClan && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-black hover:bg-gray-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition flex items-center space-x-1.5 self-start sm:self-center"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Fundar Meu Clã ($5.000)</span>
            </button>
          )}
        </div>
      </div>

      {/* My Clan Dashboard */}
      {myClan ? (
        <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm space-y-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-mono font-black text-sm shadow-md">
                [{myClan.tag}]
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-gray-900">{myClan.name}</h2>
                  <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                    {myClan.members.length} Membros
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{myClan.description}</p>
              </div>
            </div>

            <button
              onClick={() => leaveClan(myClan.id)}
              className="text-xs text-gray-400 hover:text-red-600 p-2 rounded-xl hover:bg-gray-50 transition flex items-center space-x-1 self-start sm:self-center"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair do Clã</span>
            </button>
          </div>

          {/* Clan Vault & Financials */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl font-mono">
              <div className="text-[10px] text-gray-400 font-bold uppercase">COFRE COMUNITÁRIO (USD)</div>
              <div className="text-lg font-bold text-gray-900 mt-1">${myClan.vaultCash.toLocaleString()}</div>
            </div>

            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl font-mono">
              <div className="text-[10px] text-gray-400 font-bold uppercase">RESERVAS BITCOIN</div>
              <div className="text-lg font-bold text-gray-900 mt-1">{myClan.vaultBtc.toFixed(4)} BTC</div>
            </div>

            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl font-mono">
              <div className="text-[10px] text-gray-400 font-bold uppercase">REPUTAÇÃO COLETIVA</div>
              <div className="text-lg font-bold text-emerald-600 mt-1">{myClan.totalReputation} REP</div>
            </div>
          </div>

          {/* Deposit Form */}
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-3">
            <div className="text-xs font-bold text-gray-700">Contribuir com o Cofre do Clã</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="number"
                  min="100"
                  max={player.cash}
                  value={depositAmount}
                  onChange={e => setDepositAmount(Number(e.target.value))}
                  placeholder="Valor em USD..."
                  className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-gray-900 outline-none"
                />
              </div>

              <button
                onClick={handleDeposit}
                className="bg-black hover:bg-gray-800 text-white font-semibold text-xs py-2 rounded-xl transition"
              >
                Depositar no Cofre
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Clan Explorer */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clans.map(c => (
            <div
              key={c.id}
              className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 border border-gray-100"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-mono font-black text-xs">
                    [{c.tag}]
                  </div>
                  <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                    {c.totalReputation} REP
                  </span>
                </div>

                <h3 className="font-bold text-sm text-gray-900 mt-3">{c.name}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{c.description}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="text-[11px] text-gray-400 font-mono">
                  Líder: <strong className="text-gray-700">{c.leaderName}</strong>
                </div>

                <button
                  onClick={() => joinClan(c.id)}
                  className="bg-black hover:bg-gray-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl transition"
                >
                  Entrar no Clã
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Territory Wars (Nós Globais em Disputa) */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <div className="flex items-center space-x-2">
            <Swords className="w-5 h-5 text-gray-700" />
            <h2 className="text-base font-bold text-gray-900">Guerra de Território Cibernético</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Conquiste os principais nós de infraestrutura mundial para desbloquear vantagens passivas para todos os membros do seu clã.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {territoryNodes.map(node => {
            const isControlledByMyClan = myClan && node.controllingClanId === myClan.id;

            return (
              <div
                key={node.id}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                  isControlledByMyClan
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                      {node.type} • {node.ip}
                    </span>

                    {node.controllingClanTag ? (
                      <span className="text-xs font-mono font-black bg-black text-white px-2.5 py-0.5 rounded-lg">
                        [{node.controllingClanTag}]
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-gray-400 bg-gray-200 px-2 py-0.5 rounded-lg">
                        NEUTRO
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-gray-900 mt-1">{node.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{node.bonusDescription}</p>
                </div>

                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                  <div className="text-xs font-mono text-gray-500">
                    Defesa: <strong className="text-gray-900">{node.defensePower} Gbps</strong>
                  </div>

                  {myClan && !isControlledByMyClan && (
                    <button
                      onClick={() => attackClanTerritory(myClan.id, node.id)}
                      className="bg-black hover:bg-gray-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Atacar Nó</span>
                    </button>
                  )}

                  {isControlledByMyClan && (
                    <span className="text-xs font-bold text-emerald-600">
                      ✓ Nó Dominado pelo seu Clã
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Clan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-gray-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <h2 className="text-base font-bold text-gray-900">Fundar Novo Clã Hacker</h2>
            <p className="text-xs text-gray-500">Taxa de registro na Darknet: <strong>$5.000 USD</strong></p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome do Clã</label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  placeholder="ex: fsociety, CyberGhost..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">TAG do Clã (3 a 5 letras)</label>
                <input
                  type="text"
                  maxLength={5}
                  required
                  value={createTag}
                  onChange={e => setCreateTag(e.target.value.toUpperCase())}
                  placeholder="ex: FSOC, ANON, NULL"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono uppercase outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Descrição & Manifesto</label>
                <textarea
                  rows={2}
                  value={createDesc}
                  onChange={e => setCreateDesc(e.target.value)}
                  placeholder="Objetivos e causa do seu coletivo..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-black resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={player.cash < 5000}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition ${
                    player.cash >= 5000
                      ? 'bg-black hover:bg-gray-800 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Fundar Clã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
