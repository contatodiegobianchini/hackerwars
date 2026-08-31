import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { Shield, Lock, User, ArrowRight, Sparkles, Terminal, Radio } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { login, register } = useGameStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const res = await login(username, password);
      if (!res.success) {
        setError(res.error || 'Falha ao autenticar.');
      }
    } else {
      const res = await register(username, password);
      if (!res.success) {
        setError(res.error || 'Falha ao criar conta.');
      }
    }
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    const res = await login('zero_cool', 'password123');
    if (!res.success) {
      setError(res.error || 'Falha no login demo.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-screen fixed inset-0 flex items-center justify-center p-4 z-50 select-none">
      <div className="auth-panel text-gray-900 max-w-md w-full shadow-2xl relative overflow-hidden">
        <div className="auth-topline flex items-center justify-between px-6 py-3 text-[10px] font-mono tracking-[0.14em]">
          <span className="flex items-center gap-1.5"><Radio className="w-3 h-3" /> REDE PÚBLICA</span>
          <span>NODE 01 / BR</span>
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between mb-7">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-700 font-bold tracking-[0.16em] mb-2"><span className="w-1.5 h-1.5 bg-emerald-600 inline-block" /> SISTEMA ONLINE</div>
              <h1 className="text-2xl font-black tracking-[-0.06em] text-gray-950 uppercase leading-none">Hacker<br />Wars</h1>
              <p className="text-xs text-gray-500 mt-2">Acesso à rede clandestina.</p>
            </div>
            <div className="w-11 h-11 bg-[#132218] flex items-center justify-center text-emerald-300 border border-emerald-700/50">
              <Shield className="w-5 h-5 fill-emerald-300 text-emerald-300" />
            </div>
          </div>

        {/* Mode Selector */}
        <div className="flex auth-mode p-1 mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 rounded-xl transition ${
              mode === 'login'
                ? 'bg-white text-gray-950 shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Entrar na Rede
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 rounded-xl transition ${
              mode === 'register'
                ? 'bg-white text-gray-950 shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Criar Conta Hacker
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Nome de Usuário (Alias)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ex: neo, zero_cool, cyber_phantom..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-black transition font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Digite sua senha..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-black transition font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full auth-submit hover:bg-emerald-900 text-white font-semibold text-xs py-3 transition flex items-center justify-center space-x-2 mt-2"
          >
            <span>{loading ? 'Processando...' : mode === 'login' ? 'Conectar ao Terminal' : 'Registrar Nova Conta'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Button */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="text-xs text-gray-500 hover:text-black font-medium transition flex items-center justify-center space-x-1.5 mx-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Entrar rápido com conta de teste (zero_cool)</span>
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
