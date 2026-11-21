import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure .env is loaded in any runtime context
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
} catch {
  dotenv.config();
}

/**
 * Validates whether an email string is well-formed
 */
function isValidEmail(email) {
  return typeof email === 'string' && email.trim().length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Sanitizes user input against HTML / XSS injection in email bodies
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Parses comma/semicolon-separated email strings or arrays into clean recipient arrays or undefined
 */
function parseEmailList(input) {
  if (!input) return undefined;
  let items = [];
  if (Array.isArray(input)) {
    items = input;
  } else if (typeof input === 'string') {
    items = input.split(/[,;]/);
  } else {
    return undefined;
  }
  const cleanList = items
    .map(e => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
    .filter(e => e.length > 0 && isValidEmail(e));
  return cleanList.length > 0 ? cleanList : undefined;
}

/**
 * Formats a clean RFC 5322 compliant sender address with quoted display name
 */
export function formatSender(fromEnv, defaultUser) {
  const user = defaultUser || process.env.SMTP_USER || 'talentpathsolutions1@gmail.com';
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    const raw = fromEnv.trim();
    const match = raw.match(/^(?:"?([^"<]+)"?\s+)?<([^>]+)>$/);
    if (match) {
      const name = (match[1] || 'Talent Path Solutions').trim().replace(/^"|"$/g, '');
      const addr = match[2].trim();
      return `"${name}" <${addr}>`;
    }
    if (raw.includes('@')) {
      return `"Talent Path Solutions" <${raw}>`;
    }
  }
  return `"Talent Path Solutions" <${user}>`;
}

/**
 * Creates and returns the Nodemailer SMTP transporter using Google SMTP credentials
 */
export function createSmtpTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER || '';
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, ''); // strip any accidental whitespace in app password

  if (!user || !pass) {
    console.warn('[Google SMTP Warning] SMTP_USER or SMTP_PASS is missing in environment variables.');
  }

  return nodemailer.createTransport({
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    // Explicit FQDN prevents HELO_NO_DOMAIN / HELO_LOCALHOST anti-spam penalties
    name: 'gmail.com',
    host,
    port,
    secure,
    auth: {
      user,
      pass
    },
    // Standard TLS options for Google SMTP
    tls: {
      rejectUnauthorized: true
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

/**
 * Formats a clean, professional plain text email body for Admin notification
 */
export function formatStructuredEmailText(enquiry) {
  const formattedDate = enquiry.created_at
    ? new Date(enquiry.created_at).toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'medium',
        timeZone: 'Asia/Kolkata'
      })
    : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const category = (enquiry.service_type || 'general').replace(/_/g, ' ').toUpperCase();
  const refId = enquiry.id || `TPS-${Date.now()}`;

  const lines = [
    '================================================================================',
    'ENQUIRY LEADS - TALENT PATH SOLUTIONS',
    '================================================================================',
    '',
    'LEAD OVERVIEW:',
    `• Reference ID      : ${refId}`,
    `• Service Category  : ${category}`,
    `• Submission Date   : ${formattedDate} IST`,
    `• Source Page URL   : ${enquiry.source_page || 'Website Contact'}`,
    '',
    'CONTACT INFORMATION:',
    `• Full Name         : ${enquiry.full_name || 'N/A'}`,
    `• Contact Phone     : ${enquiry.phone || 'N/A'}`,
    `• Email Address     : ${enquiry.email || 'N/A'}`,
    `• City / District   : ${enquiry.city_district || 'Not specified'}`,
  ];

  if (enquiry.organization_name) {
    lines.push(`• Organization      : ${enquiry.organization_name}`);
  }

  lines.push('', 'SERVICE-SPECIFIC DETAILS:');

  if (enquiry.service_type === 'admission') {
    lines.push(`• Program Applied   : ${enquiry.interested_program || 'Not specified'}`);
    lines.push(`• Education Level   : ${enquiry.education_level || 'Not specified'}`);
    lines.push(`• Preferred Mode    : ${enquiry.learning_mode || 'Flexible Learning'}`);
  } else if (enquiry.service_type === 'career_guidance') {
    lines.push(`• Current Status    : ${enquiry.current_status || 'Not specified'}`);
    lines.push(`• Area of Interest  : ${enquiry.area_of_interest || 'Not specified'}`);
    lines.push(`• Career Goal       : ${enquiry.career_goal || 'Not specified'}`);
    lines.push(`• Preferred Contact : ${enquiry.preferred_contact_method || 'WhatsApp / Phone'}`);
  } else if (enquiry.service_type === 'recruitment') {
    lines.push(`• Company / Client  : ${enquiry.organization_name || 'Not specified'}`);
    lines.push(`• Staffing Need     : ${enquiry.recruitment_requirement || 'General Staffing'}`);
    lines.push(`• Open Positions    : ${enquiry.number_of_positions || '1-5'}`);
  } else {
    lines.push(`• Subject / Topic   : ${enquiry.interested_program || 'General Support Inquiry'}`);
  }

  lines.push('');
  lines.push('APPLICANT MESSAGE / NOTES:');
  lines.push(enquiry.message && enquiry.message.trim() ? enquiry.message.trim() : 'No additional message provided.');
  lines.push('');
  lines.push('================================================================================');
  lines.push('ADMIN ACTION & ROUTING:');
  lines.push(`• Submitter Email   : ${enquiry.email || 'N/A'} (Reply-To is configured to this address)`);
  lines.push(`• Reference ID      : ${refId}`);
  lines.push('================================================================================');

  return lines.join('\n');
}

/**
 * Formats a modern, responsive HTML email body for Admin notification
 */
export function formatStructuredEmailHtml(enquiry) {
  const formattedDate = enquiry.created_at
    ? new Date(enquiry.created_at).toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'medium',
        timeZone: 'Asia/Kolkata'
      })
    : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const category = escapeHtml((enquiry.service_type || 'general').replace(/_/g, ' ').toUpperCase());
  const refId = escapeHtml(enquiry.id || `TPS-${Date.now()}`);

  let specificDetailsRows = '';

  if (enquiry.service_type === 'admission') {
    specificDetailsRows = `
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; width: 35%; border-bottom: 1px solid #f1f5f9;">Interested Program</td><td style="padding: 10px 14px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.interested_program) || 'Not specified'}</td></tr>
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Current Qualification</td><td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.education_level) || 'Not specified'}</td></tr>
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569;">Preferred Study Mode</td><td style="padding: 10px 14px; color: #0f172a;">${escapeHtml(enquiry.learning_mode) || 'Flexible Learning'}</td></tr>
    `;
  } else if (enquiry.service_type === 'career_guidance') {
    specificDetailsRows = `
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; width: 35%; border-bottom: 1px solid #f1f5f9;">Current Status</td><td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.current_status) || 'Not specified'}</td></tr>
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Area of Interest</td><td style="padding: 10px 14px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.area_of_interest) || 'Not specified'}</td></tr>
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Career Goal</td><td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.career_goal) || 'Not specified'}</td></tr>
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569;">Preferred Contact</td><td style="padding: 10px 14px; color: #0f172a;">${escapeHtml(enquiry.preferred_contact_method) || 'WhatsApp / Phone'}</td></tr>
    `;
  } else if (enquiry.service_type === 'recruitment') {
    specificDetailsRows = `
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; width: 35%; border-bottom: 1px solid #f1f5f9;">Company / Organization</td><td style="padding: 10px 14px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.organization_name) || 'Not specified'}</td></tr>
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Hiring Requirement</td><td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.recruitment_requirement) || 'Corporate Staffing'}</td></tr>
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569;">Open Positions</td><td style="padding: 10px 14px; color: #0f172a;">${escapeHtml(enquiry.number_of_positions) || '1-5'}</td></tr>
    `;
  } else {
    specificDetailsRows = `
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; width: 35%;">Subject / Topic</td><td style="padding: 10px 14px; color: #0f172a; font-weight: 600;">${escapeHtml(enquiry.interested_program) || 'General Support Inquiry'}</td></tr>
    `;
  }

  const cleanMessage = enquiry.message && enquiry.message.trim() ? escapeHtml(enquiry.message.trim()) : '';
  const messageText = cleanMessage
    ? cleanMessage.replace(/\n/g, '<br/>')
    : '<em>No additional message provided.</em>';

  const safeName = escapeHtml(enquiry.full_name) || 'N/A';
  const safePhone = escapeHtml(enquiry.phone) || 'N/A';
  const safeEmail = escapeHtml(enquiry.email) || 'N/A';
  const safeCity = escapeHtml(enquiry.city_district) || 'Not specified';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enquiry Leads</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 640px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 28px 32px; color: #ffffff;">
              <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #93c5fd; margin-bottom: 6px;">
                Talent Path Solutions • Lead Notification
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                Enquiry Leads: ${category}
              </h1>
              <div style="margin-top: 12px; display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 8px; padding: 4px 12px; font-size: 12px; font-family: monospace; font-weight: 700;">
                Ref ID: ${refId}
              </div>
            </td>
          </tr>

          <!-- MAIN CONTENT BODY -->
          <tr>
            <td style="padding: 28px 32px;">
              
              <!-- SECTION 1: CONTACT DETAILS -->
              <h2 style="margin: 0 0 14px 0; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                Applicant Contact Details
              </h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px; font-size: 14px;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 10px 14px; font-weight: 600; color: #475569; width: 35%; border-bottom: 1px solid #e2e8f0;">Full Name</td>
                  <td style="padding: 10px 14px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;">Phone Number</td>
                  <td style="padding: 10px 14px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                    <a href="tel:${safePhone}" style="color: #2563eb; text-decoration: none;">${safePhone}</a>
                  </td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;">Email Address</td>
                  <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
                    <a href="mailto:${safeEmail}" style="color: #2563eb; text-decoration: none;">${safeEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;">City / District</td>
                  <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${safeCity}</td>
                </tr>
                ${enquiry.organization_name ? `
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 10px 14px; font-weight: 600; color: #475569;">Organization</td>
                  <td style="padding: 10px 14px; color: #0f172a; font-weight: 600;">${escapeHtml(enquiry.organization_name)}</td>
                </tr>` : ''}
              </table>

              <!-- SECTION 2: SPECIFIC ENQUIRY DETAILS -->
              <h2 style="margin: 0 0 14px 0; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                Enquiry Specifications
              </h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px; font-size: 14px; background-color: #ffffff;">
                ${specificDetailsRows}
              </table>

              <!-- SECTION 3: APPLICANT MESSAGE -->
              <h2 style="margin: 0 0 14px 0; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                Applicant Message / Specific Queries
              </h2>
              <div style="background-color: #f1f5f9; border-left: 4px solid #2563eb; border-radius: 6px; padding: 14px 18px; font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
                ${messageText}
              </div>

              <!-- SECTION 4: METADATA & QUICK REPLY -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px 18px; font-size: 13px; color: #1e40af;">
                <p style="margin: 0 0 6px 0; font-weight: 700;">
                  Submission Metadata:
                </p>
                <div style="color: #1e3a8a; line-height: 1.5;">
                  • <strong>Received:</strong> ${formattedDate} IST<br/>
                  • <strong>Source URL:</strong> ${enquiry.source_page || '/'}<br/>
                  • <strong>Direct Reply:</strong> Click "Reply" in your email client to respond straight to <a href="mailto:${enquiry.email}" style="color: #2563eb; font-weight: 700;">${enquiry.email || 'the applicant'}</a>.
                </div>
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 12px; color: #64748b;">
              This is an automated lead notification dispatched via <strong>Google SMTP Service</strong>.<br/>
              Talent Path Solutions • <a href="https://talentpathsolutions.com" style="color: #2563eb; text-decoration: none;">talentpathsolutions.com</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Formats a clean, personalized plain text "Thank You" confirmation email for the form submitter
 * Optimized for spam filters with clean formatting, no ASCII art, and clear transactional notice
 */
export function formatThankYouEmailText(enquiry) {
  const formattedDate = enquiry.created_at
    ? new Date(enquiry.created_at).toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'medium',
        timeZone: 'Asia/Kolkata'
      })
    : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const refId = enquiry.id || `TPS-${Date.now().toString().slice(-6)}`;
  const category = (enquiry.service_type || 'general').replace(/_/g, ' ').toUpperCase();
  const name = (enquiry.full_name || 'Valued Candidate').trim();
  const userEmail = enquiry.email || enquiry.workEmail || enquiry.user_email || 'your email';
  const supportEmail = process.env.SMTP_TO || process.env.SMTP_USER || 'talentpathsolutions1@gmail.com';

  const lines = [
    `Dear ${name},`,
    '',
    'Thank you for contacting Talent Path Solutions. We have received your inquiry and registered your reference ticket with our advisory team.',
    '',
    '--------------------------------------------------',
    `INQUIRY REFERENCE ID: ${refId}`,
    '--------------------------------------------------',
    'Please keep this Reference ID for all future correspondence.',
    '',
    'SUMMARY OF YOUR SUBMISSION:',
    `• Reference ID      : ${refId}`,
    `• Service Category  : ${category}`,
    `• Submission Date   : ${formattedDate} IST`,
    `• Contact Phone     : ${enquiry.phone || 'Not provided'}`,
    `• Contact Email     : ${enquiry.email || 'Not provided'}`,
    `• City / District   : ${enquiry.city_district || 'Not specified'}`,
  ];

  if (enquiry.service_type === 'admission') {
    lines.push(`• Program Applied   : ${enquiry.interested_program || 'Degree / Course Program'}`);
    lines.push(`• Education Level   : ${enquiry.education_level || 'Not specified'}`);
    lines.push(`• Study Mode        : ${enquiry.learning_mode || 'Flexible Learning'}`);
  } else if (enquiry.service_type === 'career_guidance') {
    lines.push(`• Current Status    : ${enquiry.current_status || 'Not specified'}`);
    lines.push(`• Area of Interest  : ${enquiry.area_of_interest || 'Not specified'}`);
    lines.push(`• Career Goal       : ${enquiry.career_goal || 'Not specified'}`);
    lines.push(`• Contact Method    : ${enquiry.preferred_contact_method || 'Phone / WhatsApp'}`);
  } else if (enquiry.service_type === 'recruitment') {
    lines.push(`• Organization      : ${enquiry.organization_name || 'Not specified'}`);
    lines.push(`• Staffing Need     : ${enquiry.recruitment_requirement || 'Corporate Staffing'}`);
    lines.push(`• Open Positions    : ${enquiry.number_of_positions || '1-5'}`);
  } else {
    lines.push(`• Topic / Subject   : ${enquiry.interested_program || 'General Information'}`);
  }

  if (enquiry.message && enquiry.message.trim()) {
    lines.push('', 'YOUR QUERY / NOTE:', enquiry.message.trim());
  }

  lines.push(
    '',
    '--------------------------------------------------',
    'WHAT HAPPENS NEXT?',
    '--------------------------------------------------',
    '1. Advisor Review: A dedicated counselor is reviewing your profile and requirements.',
    '2. Pathway Assessment: We evaluate admission criteria, curriculum details, or hiring timelines.',
    '3. Direct Consultation: An advisor will contact you via Phone or WhatsApp within 24 business hours.',
    '',
    '--------------------------------------------------',
    'DIRECT CONTACT & SUPPORT:',
    '• Helpline / Call : +91 97389 29550',
    '• WhatsApp        : +91 97389 29550 (https://wa.me/919738929550)',
    `• Support Email   : ${supportEmail}`,
    '• Operating Hours : Monday – Saturday, 9:30 AM – 6:30 PM IST',
    '• Official Website: https://talentpathsolutions.com',
    '',
    '--------------------------------------------------',
    `You are receiving this transactional confirmation receipt because an inquiry was submitted on the Talent Path Solutions website for ${userEmail}.`,
    `If you did not submit this inquiry, please contact our support desk at ${supportEmail}.`,
    'Talent Path Solutions • Level 4, Corporate Heights, MG Road, Bengaluru, Karnataka 560001',
    '',
    'Warm regards,',
    'Admissions & Counseling Team',
    'Talent Path Solutions'
  );

  return lines.join('\n');
}

/**
 * Formats a clean, inbox-optimized HTML confirmation email for the form submitter
 * Engineered for 100% inbox placement: solid brand styling, clean semantics, no suspicious redirect links
 */
export function formatThankYouEmailHtml(enquiry) {
  const formattedDate = enquiry.created_at
    ? new Date(enquiry.created_at).toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'medium',
        timeZone: 'Asia/Kolkata'
      })
    : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const refId = escapeHtml(enquiry.id || `TPS-${Date.now().toString().slice(-6)}`);
  const category = escapeHtml((enquiry.service_type || 'general').replace(/_/g, ' ').toUpperCase());
  const name = escapeHtml((enquiry.full_name || 'Valued Candidate').trim());
  const userEmail = escapeHtml((enquiry.email || enquiry.workEmail || enquiry.user_email || '').trim());
  const safePhone = escapeHtml(enquiry.phone) || 'Not provided';
  const supportEmail = process.env.SMTP_TO || process.env.SMTP_USER || 'talentpathsolutions1@gmail.com';

  let specificDetailsRows = '';

  if (enquiry.service_type === 'admission') {
    specificDetailsRows = `
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; width: 38%; border-bottom: 1px solid #f1f5f9;">Interested Program</td><td style="padding: 10px 14px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.interested_program) || 'Degree / Course Program'}</td></tr>
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Qualification</td><td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.education_level) || 'Not specified'}</td></tr>
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Study Mode</td><td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.learning_mode) || 'Flexible Learning'}</td></tr>
    `;
  } else if (enquiry.service_type === 'career_guidance') {
    specificDetailsRows = `
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; width: 38%; border-bottom: 1px solid #f1f5f9;">Current Status</td><td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.current_status) || 'Not specified'}</td></tr>
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Area of Interest</td><td style="padding: 10px 14px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.area_of_interest) || 'Not specified'}</td></tr>
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Career Goal</td><td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.career_goal) || 'Not specified'}</td></tr>
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Contact Method</td><td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.preferred_contact_method) || 'WhatsApp / Phone'}</td></tr>
    `;
  } else if (enquiry.service_type === 'recruitment') {
    specificDetailsRows = `
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; width: 38%; border-bottom: 1px solid #f1f5f9;">Organization</td><td style="padding: 10px 14px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.organization_name) || 'Not specified'}</td></tr>
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Hiring Requirement</td><td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.recruitment_requirement) || 'Corporate Staffing'}</td></tr>
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Open Positions</td><td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.number_of_positions) || '1-5'}</td></tr>
    `;
  } else {
    specificDetailsRows = `
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #475569; width: 38%; border-bottom: 1px solid #f1f5f9;">Topic / Subject</td><td style="padding: 10px 14px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${escapeHtml(enquiry.interested_program) || 'General Information'}</td></tr>
    `;
  }

  const cleanMessage = enquiry.message && enquiry.message.trim() ? escapeHtml(enquiry.message.trim()) : '';
  const messageHtml = cleanMessage
    ? `<div style="background-color: #f8fafc; border-left: 3px solid #2563eb; border-radius: 4px; padding: 12px 16px; margin: 18px 0; font-size: 13px; color: #334155; line-height: 1.5;">
         <strong style="color: #1e3a8a;">Your Query / Note:</strong><br/>
         ${cleanMessage.replace(/\n/g, '<br/>')}
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inquiry Confirmation - Talent Path Solutions</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="background-color: #1e3a8a; padding: 26px 30px; text-align: left;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #93c5fd; margin-bottom: 4px;">
                Talent Path Solutions
              </div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">
                Inquiry Confirmation
              </h1>
            </td>
          </tr>

          <!-- REFERENCE ID CALLOUT -->
          <tr>
            <td style="background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 14px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">
                      Reference ID
                    </div>
                    <div style="font-size: 18px; font-family: Consolas, 'Courier New', monospace; font-weight: 700; color: #1e3a8a; margin-top: 2px;">
                      ${refId}
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #e2e8f0; color: #334155; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                      ${category}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN BODY -->
          <tr>
            <td style="padding: 26px 30px;">
              
              <p style="margin: 0 0 14px 0; font-size: 15px; color: #0f172a; line-height: 1.6;">
                Dear <strong>${name}</strong>,
              </p>
              <p style="margin: 0 0 18px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                Thank you for contacting Talent Path Solutions. We have received your inquiry and our counseling team has been notified. Below is a summary of the information you submitted.
              </p>

              <!-- SUBMISSION SUMMARY TABLE -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; background-color: #ffffff; margin-bottom: 18px;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 10px 14px; font-weight: 600; color: #475569; width: 38%; border-bottom: 1px solid #e2e8f0;">Service Category</td>
                  <td style="padding: 10px 14px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${category}</td>
                </tr>
                ${specificDetailsRows}
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;">Contact Phone</td>
                  <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${safePhone}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;">Contact Email</td>
                  <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${userEmail || 'Not provided'}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 10px 14px; font-weight: 600; color: #475569;">Submission Date</td>
                  <td style="padding: 10px 14px; color: #0f172a;">${formattedDate} IST</td>
                </tr>
              </table>

              ${messageHtml}

              <!-- NEXT STEPS -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
                <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #1e3a8a; margin-bottom: 10px;">
                  What Happens Next?
                </div>
                <div style="font-size: 13px; color: #334155; line-height: 1.6;">
                  <strong>1. Advisor Assignment:</strong> A dedicated counselor is reviewing your profile.<br/>
                  <strong>2. Pathway Assessment:</strong> We evaluate curriculum options, university criteria, or hiring timelines.<br/>
                  <strong>3. Direct Contact:</strong> An advisor will reach out via Phone or WhatsApp within <strong>24 business hours</strong>.
                </div>
              </div>

              <!-- SUPPORT DESK -->
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px 20px; margin-top: 18px; font-size: 13px; color: #334155; line-height: 1.6;">
                <div style="font-weight: 700; color: #1e3a8a; margin-bottom: 6px;">
                  Direct Support Desk:
                </div>
                <div>• Helpline / Call: <a href="tel:+919738929550" style="color: #1e3a8a; font-weight: 600; text-decoration: none;">+91 97389 29550</a></div>
                <div>• WhatsApp: <a href="https://wa.me/919738929550" style="color: #1e3a8a; font-weight: 600; text-decoration: none;">+91 97389 29550</a></div>
                <div>• Support Email: <a href="mailto:${supportEmail}" style="color: #1e3a8a; font-weight: 600; text-decoration: none;">${supportEmail}</a></div>
                <div>• Operating Hours: Monday – Saturday: 9:30 AM – 6:30 PM IST</div>
              </div>

            </td>
          </tr>

          <!-- TRANSACTIONAL COMPLIANCE FOOTER -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6;">
              <p style="margin: 0 0 6px 0;">
                <strong>Talent Path Solutions</strong> • Higher Education & Career Advisory<br/>
                Level 4, Corporate Heights, MG Road, Bengaluru, Karnataka 560001
              </p>
              <p style="margin: 0 0 6px 0;">
                You received this transactional receipt because an inquiry was submitted on our website (<a href="https://talentpathsolutions.com" style="color: #2563eb; text-decoration: underline;">talentpathsolutions.com</a>)${userEmail ? ` for <strong>${userEmail}</strong>` : ''}.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 10px;">
                If you did not make this submission, please contact us at <a href="mailto:${supportEmail}" style="color: #2563eb;">${supportEmail}</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends the personalized "Thank You" confirmation email to the form submitter
 * Engineered with RFC transactional headers and clean sender identities for Primary Inbox delivery
 */
export async function sendThankYouEmail(enquiry, existingTransporter = null) {
  // Dynamically extract user email from enquiry with multiple robust field fallbacks
  const rawEmail = enquiry.email || enquiry.workEmail || enquiry.work_email || enquiry.user_email || enquiry.contact_email || '';
  const userEmail = (typeof rawEmail === 'string' ? rawEmail : '').trim().toLowerCase();

  if (!isValidEmail(userEmail)) {
    console.warn(`[Thank You Email] Skipped: No valid recipient email found in enquiry (${rawEmail || 'empty'}).`);
    return {
      sent: false,
      reason: 'No valid recipient email address provided in form'
    };
  }

  const transporter = existingTransporter || createSmtpTransporter();
  const refId = enquiry.id || `TPS-${Date.now().toString().slice(-6)}`;
  const senderFrom = formatSender(process.env.SMTP_FROM, process.env.SMTP_USER);
  const supportEmail = process.env.SMTP_TO || process.env.SMTP_USER || 'talentpathsolutions1@gmail.com';

  const subjectPrefix = process.env.THANKYOU_SUBJECT_PREFIX || 'Inquiry Confirmation: Talent Path Solutions';
  const subject = `${subjectPrefix} [Ref: ${refId}]`;
  const textBody = formatThankYouEmailText(enquiry);
  const htmlBody = formatThankYouEmailHtml(enquiry);

  // Security: Only server environment variables control CC and BCC.
  // Public user payload must NEVER dictate CC/BCC to prevent open email relay / amplification attacks.
  const envCc = parseEmailList(process.env.THANKYOU_CC);
  const filteredCc = envCc ? envCc.filter(email => email.toLowerCase() !== userEmail) : undefined;

  const envBcc = parseEmailList(process.env.THANKYOU_BCC);
  const filteredBcc = envBcc ? envBcc.filter(email => email.toLowerCase() !== userEmail) : undefined;

  const messageDomain = process.env.SMTP_USER && process.env.SMTP_USER.includes('@')
    ? process.env.SMTP_USER.split('@')[1]
    : 'gmail.com';
  const customMessageId = `<TPS-${refId.toLowerCase()}-${Date.now()}@${messageDomain}>`;

  const mailOptions = {
    from: senderFrom,
    to: userEmail,
    subject: subject,
    text: textBody,
    html: htmlBody,
    replyTo: supportEmail,
    messageId: customMessageId,
    headers: {
      'Auto-Submitted': 'auto-generated',
      'X-Auto-Response-Suppress': 'All',
      'X-Entity-Ref-ID': refId,
      'Feedback-ID': `${refId}:enquiry:tps`
    }
  };

  if (filteredCc && filteredCc.length > 0) {
    mailOptions.cc = filteredCc;
  }

  if (filteredBcc && filteredBcc.length > 0) {
    mailOptions.bcc = filteredBcc;
  }

  console.log(`[Thank You Email] Dispatching confirmation to ${userEmail}:`, {
    to: userEmail,
    cc: mailOptions.cc || 'None',
    bcc: mailOptions.bcc || 'None',
    replyTo: supportEmail,
    subject
  });

  try {
    let info;
    try {
      info = await transporter.sendMail(mailOptions);
    } catch (socketErr) {
      console.warn(`[Thank You Email] Retrying with dedicated connection (${socketErr.message})...`);
      const freshTransporter = createSmtpTransporter();
      info = await freshTransporter.sendMail(mailOptions);
    }
    console.log(`✅ [Thank You Email] Dispatched to ${userEmail} (CC: ${mailOptions.cc?.join(', ') || 'None'})! Message ID: ${info.messageId}`);
    return {
      sent: true,
      messageId: info.messageId,
      to: userEmail,
      cc: mailOptions.cc || [],
      bcc: mailOptions.bcc || [],
      refId: refId,
      subject: subject
    };
  } catch (error) {
    console.error(`❌ [Thank You Email Error] Failed to send to ${userEmail}:`, error.message);
    return {
      sent: false,
      error: error.message,
      to: userEmail,
      cc: mailOptions.cc || [],
      bcc: mailOptions.bcc || []
    };
  }
}

/**
 * Sends both the Admin Enquiry Lead notification (with CC/BCC) AND the User Thank You confirmation
 * Dispatches both in parallel with Promise.allSettled for fastest response time and high resilience.
 */
export async function sendEnquiryEmail(enquiry) {
  const transporter = createSmtpTransporter();

  const recipientTo = process.env.SMTP_TO || process.env.SMTP_USER || 'talentpathsolutions1@gmail.com';
  const recipientCc = parseEmailList(process.env.SMTP_CC);
  const recipientBcc = parseEmailList(process.env.SMTP_BCC);
  const senderFrom = formatSender(process.env.SMTP_FROM, recipientTo);

  const subjectPrefix = process.env.SMTP_SUBJECT_PREFIX || 'Enquiry Leads';
  const category = (enquiry.service_type || 'general').replace(/_/g, ' ').toUpperCase();
  const applicantName = (enquiry.full_name || 'Candidate').trim();
  const refId = enquiry.id || `TPS-${Date.now().toString().slice(-6)}`;

  // Admin lead subject
  const adminSubject = `${subjectPrefix}: ${category} - ${applicantName} [${refId}]`;

  const textBody = formatStructuredEmailText(enquiry);
  const htmlBody = formatStructuredEmailHtml(enquiry);

  const rawApplicantEmail = enquiry.email || enquiry.workEmail || enquiry.work_email || enquiry.user_email || enquiry.contact_email || '';
  const applicantEmail = (typeof rawApplicantEmail === 'string' ? rawApplicantEmail : '').trim().toLowerCase();

  const messageDomain = recipientTo.includes('@') ? recipientTo.split('@')[1] : 'gmail.com';
  const adminMessageId = `<TPS-LEAD-${refId.toLowerCase()}-${Date.now()}@${messageDomain}>`;

  const adminMailOptions = {
    from: senderFrom,
    to: recipientTo,
    subject: adminSubject,
    text: textBody,
    html: htmlBody,
    replyTo: isValidEmail(applicantEmail) ? applicantEmail : recipientTo,
    messageId: adminMessageId,
    headers: {
      'Auto-Submitted': 'auto-generated',
      'X-Entity-Ref-ID': refId
    }
  };

  if (recipientCc && recipientCc.length > 0) {
    adminMailOptions.cc = recipientCc;
  }

  if (recipientBcc && recipientBcc.length > 0) {
    adminMailOptions.bcc = recipientBcc;
  }

  console.log(`[Google SMTP] Dispatching lead "${refId}" to Admin:`, {
    to: recipientTo,
    cc: adminMailOptions.cc || 'None',
    bcc: adminMailOptions.bcc || 'None',
    replyTo: adminMailOptions.replyTo,
    subject: adminSubject
  });

  // Parallel dual-dispatch: Admin Lead + User Thank You email
  const [adminResult, thankYouResult] = await Promise.allSettled([
    transporter.sendMail(adminMailOptions),
    sendThankYouEmail(enquiry, transporter)
  ]);

  let adminInfo = null;
  let adminError = null;
  if (adminResult.status === 'fulfilled') {
    adminInfo = adminResult.value;
    console.log(`✅ [Google SMTP] Admin lead notification dispatched! Message ID: ${adminInfo.messageId}`);
  } else {
    adminError = adminResult.reason?.message || 'Admin email sending failed';
    console.error(`❌ [Google SMTP Error] Admin lead notification failed:`, adminError);
  }

  let thankYouData = null;
  if (thankYouResult.status === 'fulfilled') {
    thankYouData = thankYouResult.value;
  } else {
    thankYouData = {
      sent: false,
      error: thankYouResult.reason?.message || 'Thank You email sending failed'
    };
    console.error(`❌ [Google SMTP Error] Thank You email failed:`, thankYouData.error);
  }

  const overallSuccess = adminResult.status === 'fulfilled' || (thankYouData && thankYouData.sent);

  return {
    success: overallSuccess,
    refId: refId,
    adminLead: adminInfo ? {
      messageId: adminInfo.messageId,
      subject: adminSubject,
      recipients: {
        to: recipientTo,
        cc: adminMailOptions.cc || [],
        bcc: adminMailOptions.bcc || []
      }
    } : { error: adminError },
    userThankYou: thankYouData,
    // Backward compatibility fields
    messageId: adminInfo ? adminInfo.messageId : (thankYouData?.messageId || ''),
    subject: adminSubject,
    recipients: {
      to: recipientTo,
      cc: adminMailOptions.cc || [],
      bcc: adminMailOptions.bcc || []
    }
  };
}
