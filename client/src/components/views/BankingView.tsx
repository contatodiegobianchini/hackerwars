import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { DollarSign, Send } from 'lucide-react';

export const BankingView: React.FC = () => {
  const { player, bankTransfer } = useGameStore();
  const [destAccount, setDestAccount] = useState('');
  const [amount, setAmount] = useState<number>(500);

  if (!player) return null;

  const playerAccount = player.bankAccounts?.[0] || {
    accountNumber: `ACC-${player.username.toUpperCase()}-01`,
    bankName: 'Global Trust Bank',
    bankIp: '185.220.101.44',
    balance: player.cash,
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (destAccount && amount > 0) {
      bankTransfer(playerAccount.accountNumber, destAccount, amount, playerAccount.bankIp);
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-gray-700" />
          <h1 className="text-base font-bold text-gray-900">Banco Online & Sistema Financeiro</h1>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          Gerencie sua conta corrente, faça transferências interbancárias anônimas e consulte seus fundos reais.
        </p>
      </div>

      {/* Account Balance Card */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Conta Corrente Principal</div>
          <div className="text-xl font-bold font-mono text-gray-900 mt-1">{playerAccount.accountNumber}</div>
          <div className="text-xs text-gray-500 mt-0.5">{playerAccount.bankName} (IP: {playerAccount.bankIp})</div>
        </div>

        <div className="text-right font-mono bg-gray-50 p-3 rounded-xl border border-gray-100">
          <div className="text-[10px] text-gray-400 font-semibold uppercase">SALDO REAL DISPONÍVEL</div>
          <div className="text-2xl font-bold text-emerald-600 mt-0.5">${player.cash.toLocaleString()} USD</div>
        </div>
      </div>

      {/* Transfer Form */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <Send className="w-4 h-4 text-gray-700" />
          <span>Transferência Interbancária Anônima</span>
        </div>

        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Número da Conta de Destino</label>
              <input
                type="text"
                value={destAccount}
                onChange={e => setDestAccount(e.target.value)}
                placeholder="Ex: ACC-884210 ou ACC-GLOBAL-01"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-gray-900 outline-none focus:border-black transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Valor da Transferência ($ USD)</label>
              <input
                type="number"
                min="1"
                max={player.cash}
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-gray-900 outline-none focus:border-black transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white font-semibold text-xs py-3 rounded-xl shadow-sm transition"
          >
            Enviar Transferência
          </button>
        </form>
      </div>
    </div>
  );
};
