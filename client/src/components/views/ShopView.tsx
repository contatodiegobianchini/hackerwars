import React, { useEffect, useState } from 'react';
import { Zap, Coins, ShieldAlert } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore.js';
import { TURBO_OFFERS, coinBalance, formatBRL, turboActive, type CoinPackage } from '../../game/cyberCoins.js';

const formatLeft = (ms: number) => {
  const min = Math.ceil(ms / 60_000);
  return min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min` : `${min} min`;
};

/** CyberCoins: bought with real money on Stripe, spent only on speed. */
export const ShopView: React.FC = () => {
  const { player, buyCoinPackage, buyTurbo } = useGameStore();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/shop/packages').then(r => r.json()).then(d => { setPackages(d.packages || []); setEnabled(!!d.enabled); }).catch(() => setEnabled(false));
  }, []);
  if (!player) return null;
  const balance = coinBalance(player);
  const turbo = turboActive(player);

  return (
    <div className="space-y-6" data-zone="money">
      <section className="hw-shop-balance">
        <Coins className="h-8 w-8" aria-hidden />
        <div>
          <div className="hw-shop-balance__value">{balance.toLocaleString('pt-BR')}</div>
          <div className="hw-shop-balance__label">CyberCoins {turbo && <>· Turbo ativo por mais {formatLeft((player.turboUntil || 0) - Date.now())}</>}</div>
        </div>
      </section>

      <section>
        <h2 className="hw-shop-title">Gastar: acelerar o jogo</h2>
        <p className="text-sm text-gray-500 mb-3">
          CyberCoins só compram velocidade. Elas não dão dinheiro, reputação nem software, e não pulam rastreio da polícia. Para terminar um processo na hora, use o botão ⚡ na tela de Processos.
        </p>
        <div className="hw-shop-grid">
          {TURBO_OFFERS.map(o => (
            <div key={o.id} className="hw-shop-card">
              <Zap className="h-5 w-5" aria-hidden />
              <h3>{o.label}</h3>
              <p>{o.hint}</p>
              <button className="cyber-button" disabled={balance < o.cost} onClick={() => buyTurbo(o.id)}>
                {o.cost} CyberCoins
              </button>
              {balance < o.cost && <small>Faltam {o.cost - balance}.</small>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="hw-shop-title">Comprar CyberCoins</h2>
        {!enabled && (
          <p className="hw-shop-warn"><ShieldAlert className="h-4 w-4" aria-hidden /> As compras ainda não estão ativas neste servidor.</p>
        )}
        <div className="hw-shop-grid">
          {packages.map(p => (
            <div key={p.id} className="hw-shop-card">
              <Coins className="h-5 w-5" aria-hidden />
              <h3>{p.coins.toLocaleString('pt-BR')} CyberCoins</h3>
              <p>{p.label}{p.bonus > 0 && <> · inclui <strong>+{p.bonus} de bônus</strong></>}</p>
              <button
                className="cyber-button"
                disabled={!enabled || busy !== null}
                onClick={async () => { setBusy(p.id); await buyCoinPackage(p.id); setBusy(null); }}
              >
                {busy === p.id ? 'Abrindo pagamento…' : formatBRL(p.priceCents)}
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3 max-w-[70ch]">
          O pagamento é feito no checkout seguro do Stripe: seus dados de cartão não passam pelo jogo. CyberCoins são uma moeda virtual do HackerWars, não podem ser trocadas por dinheiro e não são reembolsáveis depois de usadas.
        </p>
      </section>
    </div>
  );
};
