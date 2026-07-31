import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';

const versionPlugin = () => {
  let version = Date.now().toString();
  return {
    name: 'version-plugin',
    config(config, { command }) {
      if (command === 'build') {
        if (!fs.existsSync('public')) {
          fs.mkdirSync('public', { recursive: true });
        }
        fs.writeFileSync('public/version.json', JSON.stringify({ version }));
      }
    },
    configResolved(config) {
      config.define = {
        ...config.define,
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(config.command === 'build' ? version : 'dev')
      };
    }
  };
};

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), versionPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 5000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage'],
            ui: ['lucide-react', 'framer-motion'],
          }
        }
      }
    }
  };
});
