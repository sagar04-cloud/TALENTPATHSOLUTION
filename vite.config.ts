import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Dev & Preview API middleware to handle POST /api/send-enquiry seamlessly inside Vite
 */
function smtpDevApiPlugin(): Plugin {
  const handler = async (req: any, res: any, next: any) => {
    const url = req.url || '';
    if (url === '/api/send-enquiry' || url.startsWith('/api/send-enquiry?') || url.startsWith('/api/send-enquiry/')) {
      // Set permissive CORS headers for local development and multi-port testing
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      if (req.method === 'POST') {
        const processPayload = async (payload: any) => {
          try {
            // Use absolute file URL so Vite's .vite-temp bundle resolves server/emailService.js correctly
            const serviceUrl = pathToFileURL(path.resolve(process.cwd(), 'server/emailService.js')).href;
            const { sendEnquiryEmail } = await import(`${serviceUrl}?t=${Date.now()}`);
            const result = await sendEnquiryEmail(payload);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(result));
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'SMTP delivery failed';
            console.error('[Vite SMTP Middleware Error]:', message);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: message }));
          }
        };

        if (req.body && typeof req.body === 'object') {
          return processPayload(req.body);
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const payload = typeof body === 'string' && body.length > 0 ? JSON.parse(body) : {};
            await processPayload(payload);
          } catch (parseErr: any) {
            console.warn('[SMTP API Parse Warning]:', parseErr?.message);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
          }
        });
        return;
      }
    }
    next();
  };

  return {
    name: 'smtp-dev-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), smtpDevApiPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/framer-motion')) {
            return 'vendor-ui';
          }
        }
      }
    },
    chunkSizeWarningLimit: 900
  }
})
