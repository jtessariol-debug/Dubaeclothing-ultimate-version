import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      build: {
        rollupOptions: {
          input: {
            storefront: path.resolve(__dirname, 'index.html'),
            admin: path.resolve(__dirname, 'admin/index.html'),
          },
        },
      },
      plugins: [
        react(),
        {
          name: 'admin-trailing-slash-redirect',
          configureServer(server) {
            server.middlewares.use((req, res, next) => {
              if (req.url === '/admin') {
                res.statusCode = 302;
                res.setHeader('Location', '/admin/');
                res.end();
                return;
              }
              next();
            });
          },
          configurePreviewServer(server) {
            server.middlewares.use((req, res, next) => {
              if (req.url === '/admin') {
                res.statusCode = 302;
                res.setHeader('Location', '/admin/');
                res.end();
                return;
              }
              next();
            });
          },
        },
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
