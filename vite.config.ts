import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    host: true,
    strictPort: false,
    open: true,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  optimizeDeps: {},
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
