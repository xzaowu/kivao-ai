import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export function appConfig(portVariable: 'WEB_PORT' | 'ADMIN_PORT', defaultPort: number) {
  return defineConfig(({ mode }) => {
    const envDir = fileURLToPath(new URL('../../', import.meta.url));
    const env = { ...loadEnv(mode, envDir, ''), ...process.env };
    return {
      envDir,
      plugins: [react(), tailwindcss()],
      server: {
        host: env.HOST || '127.0.0.1', port: Number(env[portVariable] || defaultPort), strictPort: true,
        proxy: { '/api': env.API_PROXY_TARGET || 'http://127.0.0.1:3001' },
      },
    };
  });
}
