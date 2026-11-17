import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/send-enquiry.js';

test('API Endpoint - Rejects non-POST methods with 405', async () => {
  const req = { method: 'GET' };
  let statusCode = 0;
  let headers = {};
  let responseData = null;

  const res = {
    setHeader(key, val) { headers[key] = val; },
    status(code) {
      statusCode = code;
      return {
        json(data) { responseData = data; }
      };
    }
  };

  await handler(req, res);
  assert.equal(statusCode, 405, 'Should return HTTP 405 Method Not Allowed');
  assert.equal(responseData.success, false);
});

test('API Endpoint - Handles OPTIONS preflight requests with 204', async () => {
  const req = { method: 'OPTIONS' };
  let statusCode = 0;
  let headers = {};
  let ended = false;

  const res = {
    setHeader(key, val) { headers[key] = val; },
    status(code) {
      statusCode = code;
      return {
        end() { ended = true; }
      };
    }
  };

  await handler(req, res);
  assert.equal(statusCode, 204, 'Preflight options should return 204');
  assert.equal(ended, true);
  assert.equal(headers['Access-Control-Allow-Origin'], '*');
});

test('API Endpoint - Rejects missing enquiry payload with 400', async () => {
  const req = { method: 'POST', body: {} };
  let statusCode = 0;
  let responseData = null;

  const res = {
    setHeader() {},
    status(code) {
      statusCode = code;
      return {
        json(data) { responseData = data; }
      };
    }
  };

  await handler(req, res);
  assert.equal(statusCode, 400, 'Empty payload should return 400 Bad Request');
  assert.equal(responseData.success, false);
});

test('API Endpoint - Emits essential HTTP security headers', async () => {
  const req = { method: 'OPTIONS' };
  let headers = {};
  const res = {
    setHeader(key, val) { headers[key] = val; },
    status() { return { end() {} }; }
  };

  await handler(req, res);
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['X-Frame-Options'], 'DENY');
});

test('API Endpoint - Honeypot traps spambots with silent drop', async () => {
  const req = {
    method: 'POST',
    body: {
      full_name: 'Spam Bot',
      email: 'bot@spam.com',
      honeypot: 'http://spam-link.example'
    }
  };
  let statusCode = 0;
  let responseData = null;

  const res = {
    setHeader() {},
    status(code) {
      statusCode = code;
      return {
        json(data) { responseData = data; }
      };
    }
  };

  await handler(req, res);
  assert.equal(statusCode, 200);
  assert.equal(responseData.id, 'SPAM-FILTERED');
});

test('API Endpoint - Rejects name exceeding max character limits', async () => {
  const req = {
    method: 'POST',
    body: {
      full_name: 'A'.repeat(150),
      email: 'user@example.com'
    }
  };
  let statusCode = 0;
  let responseData = null;

  const res = {
    setHeader() {},
    status(code) {
      statusCode = code;
      return {
        json(data) { responseData = data; }
      };
    }
  };

  await handler(req, res);
  assert.equal(statusCode, 400);
  assert.equal(responseData.success, false);
});

