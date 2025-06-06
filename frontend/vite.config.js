import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'acme-challenge',
      configureServer(server) {
        // Serve acme-challenge files
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/.well-known/acme-challenge/')) {
            const token = req.url.split('/').pop();
            const challengePath = path.resolve(process.cwd(), '.well-known/acme-challenge', token);
            
            if (fs.existsSync(challengePath)) {
              console.log(`Serving ACME challenge file: ${challengePath}`);
              const content = fs.readFileSync(challengePath, 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/plain');
              return res.end(content);
            }
          }
          next();
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://backend:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
}); 