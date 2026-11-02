import React from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { zoneOfView } from '../../navigation.js';
import { useNavCounts } from './useNavCounts.js';

/** Zone title and the tabs for the screens inside it. */
export const ZoneTabs: React.FC = () => {
  const { currentView, setCurrentView, activeConnection } = useGameStore();
  const { tab: tabCounts } = useNavCounts();
  const zone = zoneOfView(currentView);

  return (
    <div className="hw-zone-head">
      <h1 className="hw-zone-title">{zone.label}</h1>
      {zone.tabs.length > 1 && (
        <div className="hw-tabs" role="tablist" aria-label={`Telas de ${zone.label}`}>
          {zone.tabs.map(tab => {
            const isTarget = tab.view === 'target_server';
            const label = isTarget && activeConnection ? activeConnection.hostname : tab.label;
            const count = tabCounts[tab.view];
            return (
              <button
                key={tab.view}
                role="tab"
                className="hw-tab"
                aria-selected={currentView === tab.view}
                onClick={() => setCurrentView(tab.view)}
                title={isTarget && !activeConnection ? 'Conecte-se a um alvo na aba Alvos' : undefined}
              >
                {label}
                {count && count.count > 0 && (
                  <span className={`hw-tab__count ${count.action ? 'hw-tab__count--action' : ''}`}>{count.count}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
