import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { Trophy } from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const { player, news } = useGameStore();
  const [tab, setTab] = useState<'ranking' | 'news'>('ranking');

  if (!player) return null;

  const rankings = [
    { rank: 1, name: 'acid_burn', rep: 28400, title: 'Cyber Demigod', clan: 'ZeroDay Cabal', score: '$840,000' },
    { rank: 2, name: 'crash_override', rep: 24100, title: 'Ghost in the Machine', clan: 'ZeroDay Cabal', score: '$620,000' },
    { rank: 3, name: 'lord_nikon', rep: 19800, title: 'Ghost in the Machine', clan: 'NullByte Syndicate', score: '$450,000' },
    { rank: 4, name: 'phantom_phreak', rep: 14200, title: 'Zero-Day Specialist', clan: 'PhonePhreaks', score: '$310,000' },
    { rank: 5, name: 'cereal_killer', rep: 9500, title: 'Cyber Infiltrator', clan: 'NullByte Syndicate', score: '$180,000' },
    { rank: 6, name: player.username, rep: player.reputation, title: player.rank, clan: 'Freelancer', score: `$${player.cash.toLocaleString()}`, isPlayer: true },
    { rank: 7, name: 'data_miner_99', rep: 650, title: 'Novice Cracker', clan: 'CryptoMine DAO', score: '$8,400' },
    { rank: 8, name: 'byte_bandit', rep: 320, title: 'Script Kiddie', clan: 'Anonymous', score: '$2,100' },
  ].sort((a, b) => b.rep - a.rep).map((p, idx) => ({ ...p, rank: idx + 1 }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-gray-700" />
              <h1 className="text-base font-bold text-gray-900">Ranking Global & Notícias da Rede</h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Classificação dos maiores hackers mundiais e feed de notícias globais.
            </p>
          </div>

          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setTab('ranking')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                tab === 'ranking' ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ranking Hacker
            </button>
            <button
              onClick={() => setTab('news')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                tab === 'news' ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Feed de Notícias ({news.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm space-y-3">
        {tab === 'ranking' ? (
          <div className="space-y-2">
            <div className="grid grid-cols-12 text-[10px] font-bold text-gray-400 px-3 pb-1 uppercase">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Hacker</div>
              <div className="col-span-3">Título / Rank</div>
              <div className="col-span-2">Clã</div>
              <div className="col-span-2 text-right">Reputação</div>
            </div>

            {rankings.map(item => (
              <div
                key={item.name}
                className={`grid grid-cols-12 items-center p-3 rounded-xl border text-xs font-mono transition ${
                  item.isPlayer
                    ? 'bg-gray-100 border-gray-300 text-gray-900 font-bold shadow-sm'
                    : 'bg-gray-50 border-gray-100 text-gray-700'
                }`}
              >
                <div className="col-span-1">
                  <span className={`font-bold ${
                    item.rank === 1 ? 'text-amber-500' : item.rank === 2 ? 'text-gray-500' : item.rank === 3 ? 'text-amber-700' : 'text-gray-400'
                  }`}>
                    #{item.rank}
                  </span>
                </div>

                <div className="col-span-4 flex items-center space-x-2 truncate">
                  <span className={item.isPlayer ? 'text-black font-bold' : 'text-gray-900'}>{item.name}</span>
                  {item.isPlayer && (
                    <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded font-bold">VOCÊ</span>
                  )}
                </div>

                <div className="col-span-3 text-gray-500 text-[11px] truncate">{item.title}</div>
                <div className="col-span-2 text-gray-500 text-[11px] truncate">{item.clan}</div>
                <div className="col-span-2 text-right text-emerald-600 font-bold">{item.rep.toLocaleString()} REP</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 font-sans">
            {news.map(item => (
              <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-mono">
                  <span className="text-gray-700 font-semibold">[{new Date(item.timestamp).toLocaleTimeString()}]</span>
                  <span className="text-gray-700 font-bold uppercase">{item.category}</span>
                </div>
                <div className="text-xs text-gray-800 leading-relaxed">{item.headline}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
