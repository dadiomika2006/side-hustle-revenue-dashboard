/**
 * Side Hustle Revenue Dashboard — Email Diagnostic Tool
 */
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('==================================================');
console.log('📧  EMAIL SMTP SERVICE DIAGNOSTIC');
console.log(`USER: ${process.env.EMAIL_USER}`);
console.log(`PASS: ${process.env.EMAIL_PASS ? '******** (configured)' : 'NOT CONFIGURED'}`);
console.log('==================================================');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function run() {
  try {
    console.log('Attempting to send a real diagnostic email...');
    const info = await transporter.sendMail({
      from: `"Side Hustle Diagnostic" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'SMTP Diagnostic Test — Side Hustle Dashboard',
      html: '<h3>Test Successful!</h3><p>Your Nodemailer SMTP is connected and sending real emails perfectly. ✅</p>'
    });
    console.log('\n✅ SUCCESS! Email sent successfully.');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (err) {
    console.error('\n❌ ERROR: Failed to send email via SMTP!');
    console.error('Error Details:', err);
  }
}

run();
