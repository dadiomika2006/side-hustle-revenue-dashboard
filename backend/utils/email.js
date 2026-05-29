const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendEmail = async ({ to, subject, html }) => {
  if (process.env.USE_LOCAL_DB === 'true' && process.env.SEND_REAL_EMAILS !== 'true') {
    console.log('\n==================================================');
    console.log(`📧  OFFLINE EMAIL EMULATOR`);
    console.log(`TO:      ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`CONTENT:`);
    const match = html.match(/>(\d{6})<\/span>/);
    if (match && match[1]) {
      console.log(`\n🔑  OTP SECURITY CODE: [ ${match[1]} ]`);
      console.log(`    (Copy and paste this code in the frontend OTP page)\n`);
    } else {
      console.log(html.replace(/<[^>]*>/g, ' ').substring(0, 500) + '...');
    }
    console.log('==================================================\n');
    return { messageId: 'mock-message-id-' + Date.now() };
  }

  try {
    const mailOptions = {
      from: `"Side Hustle Dashboard" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send verification email containing 6-digit OTP code
 */
const sendVerificationEmail = async (email, name, code) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fcfcfc;">
      <h2 style="color: #6366f1; text-align: center;">Verify Your Email Address</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering at Side Hustle Revenue Dashboard. Only verified email addresses are allowed to log in.</p>
      <p>Please use the following 6-digit verification code to complete your registration. This code is valid for 1 hour.</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; border: 2px dashed #6366f1; padding: 10px 20px; border-radius: 8px; background-color: #f3f4f6;">${code}</span>
      </div>
      <p>If you did not request this verification, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">Side Hustle Revenue Dashboard &copy; 2026</p>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Verify Your Email — Side Hustle Dashboard', html });
};

/**
 * Send reset password email containing 6-digit OTP code
 */
const sendResetPasswordEmail = async (email, name, code) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fcfcfc;">
      <h2 style="color: #ef4444; text-align: center;">Reset Your Password</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password for your Side Hustle Revenue Dashboard account.</p>
      <p>Use the following 6-digit code to reset your password. This code will expire in 15 minutes.</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ef4444; border: 2px dashed #f87171; padding: 10px 20px; border-radius: 8px; background-color: #fef2f2;">${code}</span>
      </div>
      <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">Side Hustle Revenue Dashboard &copy; 2026</p>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Reset Your Password — Side Hustle Dashboard', html });
};

/**
 * Send OTP login email containing 6-digit OTP code
 */
const sendOTPLoginEmail = async (email, name, code) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fcfcfc;">
      <h2 style="color: #10b981; text-align: center;">Your One-Time Login Code</h2>
      <p>Hello ${name},</p>
      <p>You requested a secure One-Time Password (OTP) login for your Side Hustle Revenue Dashboard account.</p>
      <p>Please enter the following 6-digit OTP code to log in instantly. This code is valid for 10 minutes and can only be used once.</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #059669; border: 2px dashed #34d399; padding: 10px 20px; border-radius: 8px; background-color: #ecfdf5;">${code}</span>
      </div>
      <p>If you did not request this login code, please secure your account.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">Side Hustle Revenue Dashboard &copy; 2026</p>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Your Secure Login OTP — Side Hustle Dashboard', html });
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendOTPLoginEmail
};
