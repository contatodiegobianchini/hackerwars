import React from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { ZONES, zoneOfView } from '../../navigation.js';
import { useNavCounts } from './useNavCounts.js';

/** Phone navigation: the same five zones as the desktop sidebar. */
export const MobileBottomNav: React.FC = () => {
  const { currentView, setCurrentView } = useGameStore();
  const { zone: zoneCounts } = useNavCounts();
  const activeZone = zoneOfView(currentView);

  return (
    <nav className="hw-bottom-nav md:hidden" aria-label="Zonas do jogo">
      {ZONES.map(zone => {
        const Icon = zone.icon;
        const badge = zoneCounts[zone.id];
        return (
          <button
            key={zone.id}
            aria-current={activeZone.id === zone.id ? 'page' : undefined}
            onClick={() => setCurrentView(zone.tabs[0].view)}
          >
            <Icon />
            <span>{zone.label}</span>
            {badge && badge.count > 0 && <span className="hw-count" style={badge.alert ? { background: 'var(--sirene)', color: '#fff' } : undefined}>{badge.count}</span>}
          </button>
        );
      })}
    </nav>
  );
};
