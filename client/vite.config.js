import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/n8n': {
        target: 'https://n8n.giaohangtannoi.id.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/n8n/, ''),
      },
      '/api': {
        target: 'http://103.82.195.119:5000',
        changeOrigin: true,
      },
    },
  },
});
