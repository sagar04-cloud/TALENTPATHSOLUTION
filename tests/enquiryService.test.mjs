import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStructuredEmail } from '../src/services/enquiryService.ts';

test('Enquiry Service - buildStructuredEmail generates complete email data', () => {
  const enquiry = {
    id: 'ENQ-UNIT-01',
    created_at: '2026-11-09T10:00:00Z',
    full_name: 'Aditya Verma',
    email: 'aditya@example.com',
    phone: '+91 99000 88776',
    service_type: 'admission',
    interested_program: 'BCA in Cloud Systems',
    education_level: '12th Pass',
    learning_mode: 'Online',
    city_district: 'Bengaluru',
    message: 'Requesting syllabus details',
    consent_given: true
  };

  const result = buildStructuredEmail(enquiry);

  assert.ok(result.subject.includes('ENQ-UNIT-01'), 'Admin subject contains ID');
  assert.ok(/admission/i.test(result.subject), 'Admin subject contains Category');
  assert.ok(result.body.includes('Aditya Verma'), 'Admin body contains candidate name');
  assert.ok(result.body.includes('aditya@example.com'), 'Admin body contains candidate email');

  assert.ok(result.mailtoUrl.startsWith('mailto:'), 'Generates valid mailto: link');
  assert.ok(result.gmailWebUrl.startsWith('https://mail.google.com/mail/'), 'Generates valid Gmail compose URL');

  assert.ok(result.thankYouSubject.includes('Inquiry Confirmation'), 'Thank You subject is transactional and inbox-safe');
  assert.ok(result.thankYouSubject.includes('ENQ-UNIT-01'), 'Thank You subject contains reference ID');
  assert.ok(result.thankYouBody.includes('Dear Aditya Verma,'), 'Thank You body has personalized greeting');
  assert.ok(result.thankYouBody.includes('+91 98765 43210'), 'Thank You body has support phone number');
});
