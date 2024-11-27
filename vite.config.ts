import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'fs/promises';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'articles-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/save-articles' && req.method === 'POST') {
            try {
              let body = '';
              for await (const chunk of req) {
                body += chunk;
              }
              
              const filePath = path.join(process.cwd(), 'public', 'data', 'articles.csv');
              await fs.writeFile(filePath, body, 'utf-8');
              
              res.statusCode = 200;
              res.end('Articles saved successfully');
            } catch (error) {
              console.error('Error saving articles:', error);
              res.statusCode = 500;
              res.end('Failed to save articles');
            }
          } else {
            next();
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});