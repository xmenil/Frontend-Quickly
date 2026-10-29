import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.API_PROXY_TARGET || 'http://localhost:3000';

  return {
    plugins: [react(), {
      name: 'quickly-production-boundary',
      apply: 'build',
      generateBundle(_, bundle) {
        const retired = /\/src\/(?:test\/|mocks\/|store\/(?:demoAuthStore|dataStore|cartStore)\.|features\/(?:catalog\/DemoHomePage|operations\/Real[^/]+)\.|components\/shared\/DemoSwitcher\.)/;
        const modules = Object.values(bundle).flatMap(output => output.type === 'chunk' ? Object.keys(output.modules) : []);
        const forbidden = modules.filter(id => retired.test(id.replace(/\\/g, '/')));
        if (forbidden.length) this.error('Dependencias de prototipo en producción: ' + forbidden.join(', '));
      },
    }],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      include: ['src/**/*.test.{ts,tsx}'],
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  };
});
