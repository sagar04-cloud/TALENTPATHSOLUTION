import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatSender,
  formatStructuredEmailText,
  formatStructuredEmailHtml,
  formatThankYouEmailText,
  formatThankYouEmailHtml,
  createSmtpTransporter
} from '../server/emailService.js';

test('Email Service - formatSender formats RFC 5322 display names cleanly', () => {
  assert.equal(
    formatSender('Talent Path Solutions <test@example.com>', 'fallback@example.com'),
    '"Talent Path Solutions" <test@example.com>'
  );
  assert.equal(
    formatSender('"Talent Path Solutions" <test@example.com>', 'fallback@example.com'),
    '"Talent Path Solutions" <test@example.com>'
  );
  assert.equal(
    formatSender(undefined, 'admin@example.com'),
    '"Talent Path Solutions" <admin@example.com>'
  );
});

test('Email Service - Admin Lead Plain Text Formatting', () => {
  const enquiry = {
    id: 'TPS-TEST-100',
    full_name: 'John Doe',
    email: 'john@example.com',
    phone: '+91 98765 43210',
    service_type: 'admission',
    interested_program: 'MBA in Analytics',
    education_level: 'Bachelor Degree',
    learning_mode: 'Flexible Learning',
    city_district: 'Bengaluru',
    message: 'Looking for part-time MBA admission.'
  };

  const text = formatStructuredEmailText(enquiry);
  assert.ok(text.includes('TPS-TEST-100'), 'Includes Reference ID');
  assert.ok(text.includes('John Doe'), 'Includes Candidate Name');
  assert.ok(text.includes('john@example.com'), 'Includes Candidate Email');
  assert.ok(text.includes('MBA in Analytics'), 'Includes Program');
  assert.ok(text.includes('Looking for part-time MBA admission.'), 'Includes Message');
});

test('Email Service - Admin Lead HTML Formatting', () => {
  const enquiry = {
    id: 'TPS-TEST-101',
    full_name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+91 91234 56789',
    service_type: 'recruitment',
    organization_name: 'Acme Corp',
    recruitment_requirement: 'Full-stack Developers',
    number_of_positions: '5',
    city_district: 'Hyderabad'
  };

  const html = formatStructuredEmailHtml(enquiry);
  assert.ok(html.includes('TPS-TEST-101'), 'Includes Reference ID in HTML');
  assert.ok(html.includes('Jane Smith'), 'Includes Candidate Name in HTML');
  assert.ok(html.includes('Acme Corp'), 'Includes Organization in HTML');
  assert.ok(html.includes('Full-stack Developers'), 'Includes Requirement in HTML');
});

test('Email Service - Applicant Thank You Plain Text Formatting', () => {
  const enquiry = {
    id: 'TPS-TEST-102',
    full_name: 'Rahul Kumar',
    email: 'rahul@example.com',
    phone: '+91 98765 11111',
    service_type: 'career_guidance',
    current_status: 'Working Professional',
    area_of_interest: 'Data Science',
    career_goal: 'Transition to AI/ML',
    preferred_contact_method: 'WhatsApp'
  };

  const text = formatThankYouEmailText(enquiry);
  assert.ok(text.includes('TPS-TEST-102'), 'Includes Reference ID');
  assert.ok(text.includes('Dear Rahul Kumar,'), 'Includes Personalized Greeting');
  assert.ok(text.includes('Data Science'), 'Includes Area of Interest');
  assert.ok(text.includes('+91 98765 43210'), 'Includes Helpline Contact');
  assert.ok(text.includes('talentpathsolutions.com'), 'Includes Official Website');
  assert.ok(!text.includes('================================================================================'), 'No spammy 80-char ASCII banners');
});

test('Email Service - Applicant Thank You HTML Formatting', () => {
  const enquiry = {
    id: 'TPS-TEST-103',
    full_name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91 98765 22222',
    service_type: 'admission',
    interested_program: 'BBA in Digital Marketing',
    education_level: '12th Standard',
    learning_mode: 'Distance Learning',
    city_district: 'Mysuru'
  };

  const html = formatThankYouEmailHtml(enquiry);
  assert.ok(html.includes('TPS-TEST-103'), 'Includes Reference ID');
  assert.ok(html.includes('Priya Sharma'), 'Includes Candidate Name');
  assert.ok(html.includes('Inquiry Confirmation'), 'Contains Transactional Header');
  assert.ok(html.includes('priya@example.com'), 'Includes Recipient Email in Body and Compliance Footer');
  assert.ok(html.includes('talentpathsolutions.com'), 'Includes Website');
  assert.ok(!html.includes('linear-gradient'), 'Uses solid colors for anti-spam deliverability');
  assert.ok(!html.includes('?text='), 'No suspicious URL query redirect parameters');
});

test('Email Service - createSmtpTransporter sets valid HELO name', () => {
  const transporter = createSmtpTransporter();
  assert.equal(transporter.options.name, 'gmail.com', 'HELO/EHLO name is explicitly set to valid FQDN domain');
  assert.equal(transporter.options.host, process.env.SMTP_HOST || 'smtp.gmail.com');
});

