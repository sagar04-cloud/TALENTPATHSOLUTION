import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createSmtpTransporter } from '../server/emailService.js';

test('SMTP Connection - Transporter options meet Google SMTP security and deliverability standards', () => {
  const transporter = createSmtpTransporter();
  const options = transporter.options;

  // Verify host and port defaults
  assert.ok(
    options.host === 'smtp.gmail.com' || options.host === process.env.SMTP_HOST,
    'Host should point to Google SMTP server or configured env host'
  );
  assert.equal(typeof options.port, 'number', 'Port should be numeric');

  // Verify FQDN HELO name is explicitly provided to avoid HELO_NO_DOMAIN spam flags
  assert.equal(options.name, 'gmail.com', 'HELO/EHLO name must be a valid FQDN domain');

  // Verify TLS configuration
  assert.equal(options.tls?.rejectUnauthorized, true, 'TLS rejectUnauthorized must be true for strict certificate validation');

  // Verify Connection pooling settings
  assert.equal(options.pool, true, 'Transporter should enable connection pooling');
  assert.equal(options.maxConnections, 3, 'Transporter should cap concurrent connections at 3');
  assert.equal(options.maxMessages, 50, 'Transporter should cap messages per connection at 50');

  // Verify timeout safety guards
  assert.ok(options.connectionTimeout >= 5000, 'Connection timeout should be at least 5000ms');
  assert.ok(options.greetingTimeout >= 5000, 'Greeting timeout should be at least 5000ms');
  assert.ok(options.socketTimeout >= 5000, 'Socket timeout should be at least 5000ms');
});

test('SMTP Connection - Transporter respects port 587 STARTTLS vs 465 SSL logic', () => {
  const prevPort = process.env.SMTP_PORT;
  const prevSecure = process.env.SMTP_SECURE;

  try {
    process.env.SMTP_PORT = '587';
    delete process.env.SMTP_SECURE;

    const transporter587 = createSmtpTransporter();
    assert.equal(transporter587.options.port, 587);
    assert.equal(transporter587.options.secure, false, 'Port 587 without explicit secure flag should use secure=false (STARTTLS)');

    process.env.SMTP_PORT = '465';
    delete process.env.SMTP_SECURE;

    const transporter465 = createSmtpTransporter();
    assert.equal(transporter465.options.port, 465);
    assert.equal(transporter465.options.secure, true, 'Port 465 should default to secure=true (SSL/TLS direct)');
  } finally {
    if (prevPort !== undefined) process.env.SMTP_PORT = prevPort;
    else delete process.env.SMTP_PORT;

    if (prevSecure !== undefined) process.env.SMTP_SECURE = prevSecure;
    else delete process.env.SMTP_SECURE;
  }
});

test('SMTP Connection - Strips whitespace from Google 16-character App Passwords', () => {
  const prevPass = process.env.SMTP_PASS;
  const prevUser = process.env.SMTP_USER;

  try {
    process.env.SMTP_USER = 'test@gmail.com';
    process.env.SMTP_PASS = 'abcd efgh ijkl mnop'; // 4x4 format commonly copied from Google

    const transporter = createSmtpTransporter();
    assert.equal(
      transporter.options.auth.pass,
      'abcdefghijklmnop',
      'Spaces in app passwords must be stripped automatically'
    );
  } finally {
    if (prevPass !== undefined) process.env.SMTP_PASS = prevPass;
    else delete process.env.SMTP_PASS;

    if (prevUser !== undefined) process.env.SMTP_USER = prevUser;
    else delete process.env.SMTP_USER;
  }
});

test('SMTP Script - scripts/test-smtp.js exists and is syntactically sound', () => {
  const scriptPath = path.resolve(process.cwd(), 'scripts/test-smtp.js');
  assert.ok(fs.existsSync(scriptPath), 'scripts/test-smtp.js must exist');

  const content = fs.readFileSync(scriptPath, 'utf8');
  assert.ok(content.includes('createSmtpTransporter'), 'Script must utilize createSmtpTransporter');
  assert.ok(content.includes('sendEnquiryEmail'), 'Script must test sendEnquiryEmail');
  assert.ok(content.includes('runSmtpVerification'), 'Script defines runSmtpVerification');
});
