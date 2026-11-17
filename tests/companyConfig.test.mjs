import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPANY_CONFIG } from '../src/config/company.ts';

test('Company Config - Integrity and required fields', () => {
  assert.equal(COMPANY_CONFIG.name, 'Talent Path Solutions');
  assert.equal(COMPANY_CONFIG.logoUrl, '/logo.png');
  assert.equal(COMPANY_CONFIG.iconUrl, '/logo-icon.png');
  assert.ok(COMPANY_CONFIG.tagline.length > 0);
  assert.ok(COMPANY_CONFIG.shortDescription.length > 0);
});

test('Company Config - Phone and WhatsApp formatting', () => {
  assert.ok(COMPANY_CONFIG.phone.display.includes('+91'), 'Phone display includes country code');
  assert.ok(COMPANY_CONFIG.phone.raw.startsWith('+'), 'Phone raw starts with + for tel: link');
  assert.ok(!COMPANY_CONFIG.whatsapp.raw.startsWith('+'), 'WhatsApp raw has no + for wa.me link');
  assert.ok(COMPANY_CONFIG.whatsapp.defaultMessage.length > 0);
});

test('Company Config - Support Emails and Addresses', () => {
  assert.ok(COMPANY_CONFIG.email.admissions.includes('@'), 'Valid admissions email');
  assert.ok(COMPANY_CONFIG.email.support.includes('@'), 'Valid support email');
  assert.ok(COMPANY_CONFIG.address.city === 'Bengaluru', 'Valid address city');
});

