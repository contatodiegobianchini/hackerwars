# HackerWars Security

Audit and hardening date: 2026-08-26

## Hardened areas

- Socket.IO connections now require a valid JWT and an existing user.
- The client can no longer switch the authenticated socket identity with `set_user_session`; that event is ignored server-side.
- Socket payloads are size-limited before game handlers execute.
- Login and registration are rate-limited in-process.
- JSON request bodies are limited to 100 KB.
- Authentication responses no longer reveal whether a username exists.
- Player registration requires at least 12-character passwords.
- Admin password changes require 20+ characters for `Diegodev` and 12+ for players.
- Express security headers are added to API responses.
- CORS is restricted to `FRONTEND_ORIGIN`; when unset, cross-origin browser requests are disabled.
- JWT signing now fails closed when `JWT_SECRET` is missing or too short in the hardened server entrypoint.
- `Diegodev` is the only permitted administrator. Other accounts are forced to `player` if the admin role is requested.
- The legacy `zero_cool` demo administrator is removed during hardened startup.

## Required environment variables

Configure these in the backend runtime, never in Git:

- `ADMIN_PASSWORD`: the secret for `Diegodev`; at least 20 characters.
- `JWT_SECRET`: a cryptographically random secret; at least 32 characters.
- `FRONTEND_ORIGIN`: exact browser origin allowed to call the API/socket, for example `https://hackerwars.vercel.app`.

## Important architecture note

The project contains a separate Express + Socket.IO server. The hardened entrypoint is `server/src/secure-server.ts`, and the server package now starts that file in both development and production. Do not launch `dist/index.js` directly in production because that bypasses the hardening wrapper.

SQLite is a local file database, so production deployment must use a persistent server/volume or a managed database. A stateless serverless deployment should not be expected to preserve game state in local SQLite.

## Remaining work

The main security risks found in the first audit are addressed by the hardened entrypoint. Before public launch, the backend should still be deployed on infrastructure suited to a long-lived Socket.IO process and persistent data, dependencies should be audited regularly, and automated security tests should cover every state-changing socket event.
