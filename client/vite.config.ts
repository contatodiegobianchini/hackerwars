import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function configureProductionEndpoints(env: Record<string, string>): Plugin {
  const apiUrl = (env.VITE_API_URL || 'https://hackerwars-api.onrender.com').replace(/\/$/, '');
  const socketUrl = (env.VITE_SOCKET_URL || apiUrl).replace(/\/$/, '');

  return {
    name: 'configure-production-endpoints',
    transform(code, id) {
      if (!id.includes('/src/stores/useGameStore.ts')) return null;

      const transformed = code
        .replaceAll("fetch('/api/", `fetch('${apiUrl}/api/`)
        .replace("io('/', {", `io('${socketUrl}', {`)
        .replace("io(\"/\", {", `io('${socketUrl}', {`)
        .replace("io(\"/\")", `io('${socketUrl}')`)
        .replace("io('/')", `io('${socketUrl}')`);

      return transformed === code ? null : { code: transformed, map: null };
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react(), configureProductionEndpoints(env)],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/socket.io': {
          target: 'http://localhost:3001',
          ws: true,
        },
      },
    },
  };
});
