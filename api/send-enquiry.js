import { sendEnquiryEmail } from '../server/emailService.js';

// In-memory rate limiting map: IP -> array of timestamps
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 submissions per 10 mins per IP

function isRateLimited(clientIp) {
  if (!clientIp) return false;
  const now = Date.now();

  // Prune stale entries if map exceeds 1000 entries to prevent memory accumulation
  if (rateLimitMap.size > 1000) {
    for (const [ip, times] of rateLimitMap.entries()) {
      const active = times.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
      if (active.length === 0) {
        rateLimitMap.delete(ip);
      } else {
        rateLimitMap.set(ip, active);
      }
    }
  }

  const timestamps = rateLimitMap.get(clientIp) || [];
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(clientIp, validTimestamps);
    return true;
  }
  
  validTimestamps.push(now);
  rateLimitMap.set(clientIp, validTimestamps);
  return false;
}

/**
 * Sanitizes single-line fields to prevent CRLF injection in email headers/logs
 */
function sanitizeString(val, maxLength = 200) {
  if (typeof val !== 'string') return '';
  return val.replace(/[\r\n]/g, ' ').trim().slice(0, maxLength);
}

/**
 * Vercel Serverless Function handler for POST /api/send-enquiry
 */
export default async function handler(req, res) {
  // Set CORS and Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Only permit POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed. Expected POST.`
    });
  }

  // Rate limiting check
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Too many submissions from this connection. Please wait a few minutes before trying again.'
    });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Missing required enquiry data in request body.'
      });
    }

    // Server-side Honeypot anti-spam check
    if (payload.honeypot && String(payload.honeypot).trim() !== '') {
      // Quietly acknowledge without dispatching email to trick spam scrapers
      return res.status(200).json({
        success: true,
        id: 'SPAM-FILTERED'
      });
    }

    if (!payload.full_name || typeof payload.full_name !== 'string' || !payload.full_name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing required full_name in request body.'
      });
    }

    // Email validation if present
    if (payload.email && typeof payload.email === 'string') {
      const emailTrimmed = payload.email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailTrimmed.length > 254 || !emailRegex.test(emailTrimmed)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address format provided.'
        });
      }
    }

    // Phone validation if present
    if (payload.phone && typeof payload.phone === 'string') {
      const phoneDigits = payload.phone.replace(/\D/g, '');
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        return res.status(400).json({
          success: false,
          error: 'Phone number must contain between 7 and 15 digits.'
        });
      }
    }

    // Input length boundaries & sanitization
    if (payload.full_name.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Full name exceeds maximum allowed length of 100 characters.'
      });
    }

    if (payload.message && typeof payload.message === 'string' && payload.message.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Message exceeds maximum allowed length of 5000 characters.'
      });
    }

    // Sanitize single-line fields
    const sanitizedPayload = {
      ...payload,
      full_name: sanitizeString(payload.full_name, 100),
      phone: sanitizeString(payload.phone, 30),
      city_district: sanitizeString(payload.city_district, 100),
      interested_program: sanitizeString(payload.interested_program, 150),
      message: typeof payload.message === 'string' ? payload.message.slice(0, 5000) : ''
    };

    const result = await sendEnquiryEmail(sanitizedPayload);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[API /api/send-enquiry Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to dispatch email inquiry. Please try again or contact us directly.'
    });
  }
}

