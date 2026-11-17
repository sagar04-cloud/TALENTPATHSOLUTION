import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSmtpTransporter, sendEnquiryEmail } from '../server/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runSmtpVerification() {
  console.log('========================================================================');
  console.log('TALENT PATH SOLUTIONS - GOOGLE SMTP & THANK YOU EMAIL VERIFICATION');
  console.log('========================================================================\n');

  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || '465',
    secure: process.env.SMTP_SECURE || 'true',
    user: process.env.SMTP_USER || '(Not set)',
    to: process.env.SMTP_TO || '(Not set)',
    cc: process.env.SMTP_CC || '(Not set)',
    bcc: process.env.SMTP_BCC || '(Not set)',
    subjectPrefix: process.env.SMTP_SUBJECT_PREFIX || 'Enquiry Leads'
  };

  console.log('Configuration from .env:');
  console.log(`• Host                 : ${config.host}:${config.port} (SSL: ${config.secure})`);
  console.log(`• SMTP User            : ${config.user}`);
  console.log(`• Password set?        : ${process.env.SMTP_PASS ? 'YES (Hidden for security)' : 'NO (Empty)'}`);
  console.log(`• Admin Recipient (To) : ${config.to}`);
  console.log(`• CC                   : ${config.cc}`);
  console.log(`• BCC                  : ${config.bcc}`);
  console.log(`• Subject Prefix       : ${config.subjectPrefix}\n`);

  if (!process.env.SMTP_PASS) {
    console.warn('⚠️  WARNING: SMTP_PASS is currently empty in .env.');
    console.warn('   To enable live Google SMTP sending:');
    console.warn('   1. Visit your Google Account -> Security -> 2-Step Verification -> App passwords');
    console.warn('   2. Generate a 16-character App Password');
    console.warn('   3. Set SMTP_PASS in your .env file.\n');
    console.log('✅ Configuration parsing test: SUCCESSFUL (Ready for password input).');
    return;
  }

  const transporter = createSmtpTransporter();

  try {
    console.log('Verifying connection with Google SMTP server...');
    await transporter.verify();
    console.log('✅ Google SMTP Server connection & authentication successful!\n');

    console.log('Simulating full enquiry submission with dynamic user email...');
    const sampleUserEmail = 'candidate.test@gmail.com';

    const result = await sendEnquiryEmail({
      id: `TPS-TEST-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
      full_name: 'Priya Sharma',
      email: sampleUserEmail,
      phone: '9876543210',
      service_type: 'admission',
      interested_program: 'Executive MBA (Distance Learning)',
      education_level: 'Bachelor Degree',
      learning_mode: 'distance',
      city_district: 'Bengaluru, Karnataka',
      message: 'Testing dual email trigger: 1. Admin lead notification, 2. Dynamic User Thank You confirmation.',
      source_page: '/test-verification'
    });

    console.log('\n========================================================================');
    console.log('DISPATCH RESULTS:');
    console.log('========================================================================');
    console.log('1. Admin Lead Email:');
    console.log(`   • Status     : Delivered`);
    console.log(`   • Message ID : ${result.adminLead?.messageId || result.messageId}`);
    console.log(`   • To         : ${result.adminLead?.recipients?.to || result.recipients?.to}`);
    console.log(`   • CC         : ${result.adminLead?.recipients?.cc || 'None'}`);
    console.log(`   • BCC        : ${result.adminLead?.recipients?.bcc || 'None'}`);
    console.log(`   • Subject    : ${result.adminLead?.subject || result.subject}`);

    console.log('\n2. User Thank You Email (Dynamic Submitter Address):');
    if (result.userThankYou?.sent) {
      console.log(`   • Status     : ✅ Sent to ${result.userThankYou.to}`);
      console.log(`   • Message ID : ${result.userThankYou.messageId}`);
      console.log(`   • CC         : ${result.userThankYou.cc?.length ? result.userThankYou.cc.join(', ') : 'None'}`);
      console.log(`   • BCC        : ${result.userThankYou.bcc?.length ? result.userThankYou.bcc.join(', ') : 'None'}`);
      console.log(`   • Subject    : ${result.userThankYou.subject}`);
    } else {
      console.log(`   • Status     : ⚠️ ${result.userThankYou?.error || result.userThankYou?.reason || 'Not sent'}`);
    }
    console.log('========================================================================\n');
  } catch (error) {
    console.error('❌ Google SMTP Error:', error.message);
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.error('\nAuthentication failed. Please ensure:');
      console.error('1. You are using a 16-character Google App Password (not your normal Gmail password).');
      console.error('2. 2-Step Verification is active on the sender Google Account.');
    }
  }
}

runSmtpVerification();
