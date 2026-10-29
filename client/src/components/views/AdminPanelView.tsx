import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  DollarSign,
  Bitcoin,
  Key,
  Ban,
  Trash2,
  Edit3,
  Radio,
  RefreshCw,
  Search,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Layers,
  X,
  Send,
  Award,
  Sparkles,
  Server
} from 'lucide-react';
import { AdminUserData } from '../../types/game.js';

export const AdminPanelView: React.FC = () => {
  const {
    player,
    adminUsers,
    adminGetUsers,
    adminUpdatePlayer,
    adminResetPassword,
    adminSetBan,
    adminDeleteUser,
    adminBroadcastNews,
    adminResetServers,
    setCurrentView
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'users' | 'broadcast' | 'servers'>('users');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected User for Edit Modal
  const [editingUser, setEditingUser] = useState<AdminUserData | null>(null);
  const [editCash, setEditCash] = useState<number>(0);
  const [editBtc, setEditBtc] = useState<number>(0);
  const [editRep, setEditRep] = useState<number>(0);
  const [editRank, setEditRank] = useState<string>('');
  const [editRole, setEditRole] = useState<'admin' | 'player'>('player');

  // Password Reset Modal
  const [pwdResetUser, setPwdResetUser] = useState<AdminUserData | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Ban Modal
  const [banUser, setBanUser] = useState<AdminUserData | null>(null);
  const [banReason, setBanReason] = useState('');

  // Broadcast News Form
  const [broadcastHeadline, setBroadcastHeadline] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState<'SYSTEM' | 'SECURITY' | 'ECONOMY' | 'WAR'>('SYSTEM');

  const isAdmin = player?.role === 'admin' || player?.username.toLowerCase() === 'zero_cool';

  useEffect(() => {
    if (isAdmin) {
      adminGetUsers();
    }
  }, [isAdmin]);

  const handleOpenEditModal = (user: AdminUserData) => {
    setEditingUser(user);
    setEditCash(user.cash);
    setEditBtc(user.cryptoBtc || 0);
    setEditRep(user.reputation);
    setEditRank(user.rank);
    setEditRole(user.role);
  };

  const handleSaveUserEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    adminUpdatePlayer(editingUser.id, {
      cash: Number(editCash),
      cryptoWallet: { ...editingUser.cryptoWallet, btc: Number(editBtc) },
      reputation: Number(editRep),
      rank: editRank,
      role: editRole,
    });

    setEditingUser(null);
  };

  const handleSavePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdResetUser || !newPassword.trim()) return;

    adminResetPassword(pwdResetUser.id, newPassword.trim());
    setPwdResetUser(null);
    setNewPassword('');
  };

  const handleConfirmBan = (isBanned: boolean) => {
    if (!banUser) return;
    adminSetBan(banUser.id, isBanned, banReason.trim());
    setBanUser(null);
    setBanReason('');
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastHeadline.trim()) return;

    adminBroadcastNews(broadcastHeadline.trim(), broadcastCategory);
    setBroadcastHeadline('');
  };

  // 1. Access Denied if Not Admin
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 select-none">
        <div className="bg-white text-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 text-center space-y-5">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-base font-bold text-gray-900">403 // Acesso Restrito</h1>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Você não possui permissão para visualizar este módulo do sistema.
            </p>
          </div>

          <button
            onClick={() => setCurrentView('my_server')}
            className="w-full bg-black hover:bg-gray-800 text-white font-semibold text-xs py-2.5 rounded-xl shadow-sm transition"
          >
            Voltar ao Meu Computador
          </button>
        </div>
      </div>
    );
  }

  // Filtered Users List
  const filteredUsers = adminUsers.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.ip.includes(searchQuery) ||
    u.id.includes(searchQuery)
  );

  const totalCirculatingCash = adminUsers.reduce((acc, u) => acc + (u.cash || 0), 0);
  const totalCirculatingBtc = adminUsers.reduce((acc, u) => acc + (u.cryptoBtc || 0), 0);
  const totalBannedUsers = adminUsers.filter(u => u.isBanned).length;

  return (
    <div className="space-y-4 select-none">
      {/* Admin Dashboard Header */}
      <div className="bg-gradient-to-r from-red-950 via-zinc-900 to-black text-white rounded-3xl p-6 shadow-xl border border-red-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400 text-2xl shrink-0">
              🛡️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white">Central de Controle do Administrador // Root Access</h1>
                <span className="text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full uppercase">
                  DATABASE LIVE
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Gerencie todos os usuários registrados no SQLite, edite saldos de dinheiro e cripto, redefina senhas e aplique banimentos.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => adminGetUsers()}
              className="bg-zinc-800 hover:bg-zinc-700 text-gray-200 hover:text-white font-mono text-xs px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 border border-zinc-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recarregar DB</span>
            </button>
          </div>
        </div>

        {/* Database Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-4 border-t border-zinc-800/80">
          <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-2xl">
            <div className="text-[10px] text-gray-400 font-mono">USUÁRIOS CADASTRADOS</div>
            <div className="text-lg font-bold text-white mt-0.5">{adminUsers.length} Contas</div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-2xl">
            <div className="text-[10px] text-gray-400 font-mono">DINHEIRO CIRCULANTE (USD)</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">${totalCirculatingCash.toLocaleString()}</div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-2xl">
            <div className="text-[10px] text-gray-400 font-mono">BITCOINS EM CARTEIRAS</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5">{totalCirculatingBtc.toFixed(4)} BTC</div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-2xl">
            <div className="text-[10px] text-gray-400 font-mono">USUÁRIOS BANIDOS</div>
            <div className={`text-lg font-bold mt-0.5 ${totalBannedUsers > 0 ? 'text-red-400' : 'text-gray-300'}`}>
              {totalBannedUsers} {totalBannedUsers === 1 ? 'Banido' : 'Banidos'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'users'
              ? 'bg-black text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Usuários ({adminUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'broadcast'
              ? 'bg-black text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Transmissão Global</span>
        </button>

        <button
          onClick={() => setActiveTab('servers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'servers'
              ? 'bg-black text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Servidores & Reset</span>
        </button>
      </div>

      {/* TAB 1: USERS LIST & MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar usuário por nome, IP ou ID..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-black transition"
              />
            </div>

            <div className="text-xs font-mono text-gray-500">
              Exibindo {filteredUsers.length} de {adminUsers.length} usuários
            </div>
          </div>

          {/* Users Table / Grid */}
          <div className="space-y-2">
            {filteredUsers.map(user => {
              const isCurrentUser = user.id === player?.id;

              return (
                <div
                  key={user.id}
                  className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    user.isBanned
                      ? 'bg-red-50/70 border-red-200 text-gray-900'
                      : 'bg-white hover:bg-gray-50/50 border-gray-200 text-gray-900'
                  }`}
                >
                  {/* User Profile Details */}
                  <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-mono font-bold text-sm shrink-0 shadow-sm ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-gray-900 truncate font-mono">
                          {user.username}
                        </span>

                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          user.role === 'admin'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>

                        {user.isBanned && (
                          <span className="text-[9px] font-mono font-bold bg-red-600 text-white px-2 py-0.5 rounded-md flex items-center space-x-1">
                            <Ban className="w-2.5 h-2.5" />
                            <span>BANIDO</span>
                          </span>
                        )}

                        {user.isOnline && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online Agora" />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-mono text-gray-500">
                        <span>IP: <strong className="text-gray-700">{user.ip}</strong></span>
                        <span>•</span>
                        <span>Rank: <strong className="text-gray-700">{user.rank}</strong> ({user.reputation} REP)</span>
                        <span>•</span>
                        <span>Capítulos: <strong className="text-gray-700">{user.completedChaptersCount}/10</strong></span>
                      </div>

                      {user.isBanned && user.banReason && (
                        <div className="text-[10px] text-red-700 mt-1 font-mono">
                          Motivo do banimento: {user.banReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Overview & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="flex items-center space-x-3 text-right font-mono self-start sm:self-auto">
                      <div className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl text-xs font-bold border border-emerald-200">
                        ${user.cash.toLocaleString()} USD
                      </div>
                      <div className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-xl text-xs font-bold border border-amber-200">
                        {(user.cryptoBtc || 0).toFixed(4)} BTC
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="bg-gray-100 hover:bg-black hover:text-white text-gray-700 p-2 rounded-xl text-xs transition"
                        title="Editar Saldo, Rank e Role"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setPwdResetUser(user)}
                        className="bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 p-2 rounded-xl text-xs transition"
                        title="Redefinir Senha"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>

                      {user.isBanned ? (
                        <button
                          onClick={() => {
                            setBanUser(user);
                            handleConfirmBan(false);
                          }}
                          className="bg-emerald-100 hover:bg-emerald-600 hover:text-white text-emerald-800 p-2 rounded-xl text-xs transition font-mono font-bold"
                          title="Desbanir Usuário"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setBanUser(user)}
                          disabled={isCurrentUser}
                          className={`p-2 rounded-xl text-xs transition ${
                            isCurrentUser
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                              : 'bg-red-50 hover:bg-red-600 hover:text-white text-red-700'
                          }`}
                          title="Banir Usuário"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {!isCurrentUser && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Tem certeza que deseja DELETAR permanentemente o usuário "${user.username}" do banco de dados?`)) {
                              adminDeleteUser(user.id);
                            }
                          }}
                          className="bg-gray-100 hover:bg-red-600 hover:text-white text-gray-500 p-2 rounded-xl text-xs transition"
                          title="Excluir Usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: GLOBAL BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 max-w-xl space-y-4">
          <div>
            <div className="flex items-center space-x-2">
              <Radio className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-bold text-gray-900">Transmissão Global em Tempo Real</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Envie uma notícia urgente ou comunicado oficial para a barra de manchetes de todos os jogadores conectados.
            </p>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-gray-700 font-mono uppercase">
                Categoria da Notícia:
              </label>
              <select
                value={broadcastCategory}
                onChange={(e) => setBroadcastCategory(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 mt-1 focus:outline-none focus:border-black font-mono"
              >
                <option value="SYSTEM">🚨 SYSTEM (Alerta do Sistema)</option>
                <option value="SECURITY">🛡️ SECURITY (Segurança / Polícia)</option>
                <option value="ECONOMY">💰 ECONOMY (Economia & Cripto)</option>
                <option value="WAR">⚔️ WAR (Guerra de Facções)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 font-mono uppercase">
                Manchete / Mensagem:
              </label>
              <textarea
                rows={3}
                value={broadcastHeadline}
                onChange={(e) => setBroadcastHeadline(e.target.value)}
                placeholder="Digite o texto da manchete global..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs text-gray-900 mt-1 focus:outline-none focus:border-black resize-none"
              />
            </div>

            <button
              type="submit"
              className="bg-black hover:bg-gray-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition flex items-center space-x-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transmitir para Todos os Jogadores</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: SERVERS & WORLD RESET */}
      {activeTab === 'servers' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 max-w-xl space-y-5">
          <div>
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-gray-700" />
              <h2 className="text-base font-bold text-gray-900">Manutenção dos Servidores do Mundo</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Restaure todos os servidores virtuais (bancos, corporações, satélites) para a configuração de fábrica com cofres cheios e senhas padrão.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Atenção: Ação de Reset Global</span>
            </div>
            <p className="leading-relaxed">
              Isso restaurará a tabela <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">servers</code> do SQLite, recriando todos os arquivos, cofres e portas para o estado original. Os dados dos usuários não serão afetados.
            </p>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Deseja realmente restaurar todos os servidores do mundo para o estado original de fábrica?')) {
                adminResetServers();
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition flex items-center space-x-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restaurar Servidores de Fábrica</span>
          </button>
        </div>
      )}

      {/* MODAL 1: EDIT USER DATA */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Editar Jogador: {editingUser.username}</h3>
                <div className="text-[11px] font-mono text-gray-500">ID: {editingUser.id}</div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdits} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 font-mono">SALDO EM DINHEIRO (USD):</label>
                <input
                  type="number"
                  value={editCash}
                  onChange={(e) => setEditCash(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 mt-1 font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 font-mono">SALDO BITCOIN (BTC):</label>
                <input
                  type="number"
                  step="0.0001"
                  value={editBtc}
                  onChange={(e) => setEditBtc(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 mt-1 font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 font-mono">REPUTAÇÃO (REP):</label>
                  <input
                    type="number"
                    value={editRep}
                    onChange={(e) => setEditRep(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 mt-1 font-mono focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 font-mono">PERMISSÃO (ROLE):</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 mt-1 font-mono focus:outline-none focus:border-black"
                  >
                    <option value="player">Player Comum</option>
                    <option value="admin">Administrador Root</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-xl transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="bg-black hover:bg-gray-800 text-white font-semibold px-4 py-2 rounded-xl transition shadow-sm"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PASSWORD RESET */}
      {pwdResetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Redefinir Senha</h3>
                <div className="text-[11px] font-mono text-gray-500">Usuário: {pwdResetUser.username}</div>
              </div>
              <button
                onClick={() => setPwdResetUser(null)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePasswordReset} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 font-mono">NOVA SENHA:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Insira a nova senha..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 mt-1 font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPwdResetUser(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-xl transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="bg-black hover:bg-gray-800 text-white font-semibold px-4 py-2 rounded-xl transition shadow-sm"
                >
                  Redefinir Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BAN CONFIRMATION */}
      {banUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-red-600 flex items-center space-x-1.5">
                  <Ban className="w-4 h-4" />
                  <span>Banir Jogador</span>
                </h3>
                <div className="text-[11px] font-mono text-gray-500">Usuário: {banUser.username}</div>
              </div>
              <button
                onClick={() => setBanUser(null)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 font-mono">MOTIVO DO BANIMENTO:</label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Ex: Uso indevido, cheats, etc."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 mt-1 font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setBanUser(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-xl transition"
                >
                  Cancelar
                </button>

                <button
                  onClick={() => handleConfirmBan(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl transition shadow-sm"
                >
                  Confirmar Banimento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
