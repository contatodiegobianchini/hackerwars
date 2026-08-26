# HackerWars Security Audit

Audit date: 2026-08-26

## Findings

### CRITICAL: Socket.IO session impersonation
The server accepts `set_user_session` with an arbitrary `userId` and assigns it directly to the active socket session. This bypasses authentication and can let a client operate as another player. The socket event surface also accepts connections without requiring a valid JWT.

**Required fix:** authenticate the Socket.IO handshake, reject unauthenticated connections, remove `set_user_session`, and derive the player ID exclusively from the verified JWT. Every state-changing event must use that verified identity.

### CRITICAL: Default admin credentials are hard-coded
The database initializer creates `zero_cool` with the password `password123` and grants it admin. This is a production credential exposure.

**Required fix:** remove the demo administrator and bootstrap the sole admin from environment-controlled credentials.

### HIGH: JWT secret has a hard-coded fallback
`JWT_SECRET` falls back to a predictable literal value when the environment variable is absent. Anyone who obtains that value can forge tokens.

**Required fix:** fail fast when `JWT_SECRET` is not configured in production and use a long random secret.

### HIGH: Wildcard CORS
Express and Socket.IO currently allow `origin: '*'`. This unnecessarily broadens the attack surface.

**Required fix:** allow only the production frontend origin(s), using an environment variable such as `FRONTEND_ORIGIN`.

### MEDIUM: Authentication endpoints have no rate limiting
Login and registration can be called without an application-level rate limit, enabling password guessing and abuse.

**Required fix:** rate-limit `/api/auth/login` and `/api/auth/register`, and consider account/IP backoff after repeated failures.

### MEDIUM: Weak password policy
Registration currently accepts passwords with only 4 characters.

**Required fix:** require at least 12 characters for player accounts and at least 20 characters for the admin bootstrap credential.

### LOW: Username enumeration
Login distinguishes between a missing user and an incorrect password.

**Required fix:** return one generic authentication failure message.

## Admin bootstrap

The repository now contains `server/src/scripts/bootstrapAdmin.ts` and the server start command invokes it before starting the application.

Configure these environment variables in the backend deployment:

- `ADMIN_PASSWORD`: the bootstrap password for `diegodev`, at least 20 characters.
- `JWT_SECRET`: a long random value, at least 32 bytes of entropy.

The bootstrap process demotes existing admins and ensures that `diegodev` is the only account with the `admin` role.

## Current security status

The project should **not** be considered production-secure yet. The Socket.IO identity-bypass issue and JWT/CORS configuration need to be fixed in the server entrypoint before the game is exposed as an authenticated multiplayer service.
