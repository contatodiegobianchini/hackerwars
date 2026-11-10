import React from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { LogOut, ShieldAlert } from 'lucide-react';
import { ZONES, zoneOfView } from '../../navigation.js';
import { useNavCounts } from './useNavCounts.js';

/** Desktop navigation: the five zones of the game loop. Screens live as tabs inside each zone. */
export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, player, logout } = useGameStore();
  const { zone: zoneCounts } = useNavCounts();
  const activeZone = zoneOfView(currentView);
  const isAdmin = player?.role === 'admin' || player?.username.toLowerCase() === 'zero_cool';

  return (
    <nav className="hw-nav hidden md:flex" aria-label="Zonas do jogo">
      {ZONES.map(zone => {
        const Icon = zone.icon;
        const badge = zoneCounts[zone.id];
        return (
          <button
            key={zone.id}
            className="hw-nav__zone"
            aria-current={activeZone.id === zone.id ? 'page' : undefined}
            onClick={() => setCurrentView(zone.tabs[0].view)}
          >
            <Icon />
            <span>
              <span className="hw-nav__label">{zone.label}</span>
              <span className="hw-nav__hint">{zone.hint}</span>
            </span>
            {badge && badge.count > 0 ? (
              <span className={`hw-nav__badge ${badge.alert ? 'hw-nav__badge--alert' : ''}`}>{badge.count}</span>
            ) : <span />}
          </button>
        );
      })}

      <div className="hw-nav__foot">
        {isAdmin && (
          <button className="hw-nav__small" aria-current={currentView === 'admin_panel' ? 'page' : undefined} onClick={() => setCurrentView('admin_panel')}>
            <ShieldAlert /> Administração
          </button>
        )}
        <button className="hw-nav__small hw-nav__small--danger" onClick={logout}>
          <LogOut /> Sair
        </button>
      </div>
    </nav>
  );
};
