import fs from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig, type Plugin} from 'vite';

function importMapExternalPlugin(): Plugin {
  return {
    name: 'index-and-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url === '/' || url === '/index.html') {
          const html = fs.readFileSync(path.resolve(import.meta.dirname, 'index.html'), 'utf-8');
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
          return;
        }
        next();
      });
    },
    writeBundle() {
      const srcDir = path.resolve(import.meta.dirname, 'src/assets/images');
      const outDir = path.resolve(import.meta.dirname, 'dist/src/assets/images');
      if (fs.existsSync(srcDir)) {
        fs.mkdirSync(outDir, {recursive: true});
        for (const file of fs.readdirSync(srcDir)) {
          fs.copyFileSync(path.join(srcDir, file), path.join(outDir, file));
        }
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [importMapExternalPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
        rapier: '@dimforge/rapier3d-compat',
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
