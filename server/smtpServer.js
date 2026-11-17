import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEnquiryEmail } from './emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = parseInt(process.env.SMTP_SERVER_PORT || '3001', 10);
const MAX_BODY_BYTES = 50 * 1024; // 50 KB max body size
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const ipRateMap = new Map();

function isRateLimited(clientIp) {
  if (!clientIp) return false;
  const now = Date.now();
  const timestamps = ipRateMap.get(clientIp) || [];
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRateMap.set(clientIp, validTimestamps);
    return true;
  }
  
  validTimestamps.push(now);
  ipRateMap.set(clientIp, validTimestamps);
  return false;
}

function sanitizeString(val, maxLength = 200) {
  if (typeof val !== 'string') return '';
  return val.replace(/[\r\n]/g, ' ').trim().slice(0, maxLength);
}

const server = http.createServer((req, res) => {
  // Set CORS and Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'healthy', service: 'Google SMTP Dispatcher' }));
    return;
  }

  if (req.url === '/api/send-enquiry' && req.method === 'POST') {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || 'unknown';
    
    if (isRateLimited(clientIp)) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 429;
      res.end(JSON.stringify({ success: false, error: 'Too many submissions from this connection. Please wait a few minutes before trying again.' }));
      return;
    }

    let body = '';
    let bodyLength = 0;
    let aborted = false;

    req.on('data', chunk => {
      if (aborted) return;
      bodyLength += chunk.length;
      if (bodyLength > MAX_BODY_BYTES) {
        aborted = true;
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 413;
        res.end(JSON.stringify({ success: false, error: 'Payload Too Large. Max size is 50KB.' }));
        req.destroy();
        return;
      }
      body += chunk;
    });

    req.on('end', async () => {
      if (aborted) return;

      try {
        const payload = JSON.parse(body);

        // Server-side Honeypot anti-spam check
        if (payload?.honeypot && String(payload.honeypot).trim() !== '') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, id: 'SPAM-FILTERED' }));
          return;
        }

        if (!payload || !payload.full_name || typeof payload.full_name !== 'string' || !payload.full_name.trim()) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: 'Missing required full_name in request body.' }));
          return;
        }

        if (payload.full_name.length > 100) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: 'Full name exceeds maximum allowed length of 100 characters.' }));
          return;
        }

        const sanitizedPayload = {
          ...payload,
          full_name: sanitizeString(payload.full_name, 100),
          phone: sanitizeString(payload.phone, 30),
          city_district: sanitizeString(payload.city_district, 100),
          interested_program: sanitizeString(payload.interested_program, 150),
          message: typeof payload.message === 'string' ? payload.message.slice(0, 5000) : ''
        };

        const result = await sendEnquiryEmail(sanitizedPayload);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error('[SMTP Server Error]:', err);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: 'Failed to process inquiry submission.' }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`[Google SMTP Server] Running on http://localhost:${PORT}`);
  console.log(`[Google SMTP Server] Endpoint ready: POST http://localhost:${PORT}/api/send-enquiry`);
});

