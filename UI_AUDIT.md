# Hacker Wars UI audit — Cyber OS foundation

## Scope
This audit establishes the first redesign increment: a shared visual foundation, shell zones, and a command-center home. It deliberately avoids backend and gameplay-mechanic changes.

## Current UI inventory

| Area | Current entry points | Primary player action |
| --- | --- | --- |
| System | My Server, Software, Processes, Hardware | Inspect and improve the local machine |
| Network | Known Servers, Target Server | Discover, connect, scan, and breach targets |
| Operations | Missions, Campaign, Processes | Start and monitor operations |
| Economy | Banking, Crypto, Black Market | Manage funds, trade, and acquire items |
| Infrastructure | Software, Hardware, Datacenter | Build capability and capacity |
| Security | Logs, Antivirus | Review trace signals and respond to threats |
| Social | Dark Chat, Clans, Leaderboard | Communicate and compete |

## Existing reusable feedback systems

- `ToastNotifications`, `TaskProgressPopup`, `PoliceRaidAlert`, and `CartelLockdownOverlay` already provide global feedback.
- `HackerTerminalDrawer` is the game-wide terminal entry point.
- `useGameStore` supplies player, connection, process, trace, and alert state without needing API changes.

## Foundation introduced in this increment

- CSS tokens: surfaces, semantic signals, typography colors, borders, and spacing.
- Zone signals via `data-zone`, applied by `App` according to the active view.
- Reusable primitives: `CyberPanel`, `CyberMetric`, `CyberProgress`, and `CyberButton`.
- A Command Center home that consolidates local infrastructure, process capacity, connection status, miners, and an operational timeline.

## Migration rule

New or redesigned views should use the Cyber primitives and a zone signal. Legacy Tailwind-based views remain functional and can migrate independently; do not replace gameplay state or backend contracts solely for styling.
