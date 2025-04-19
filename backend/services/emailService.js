const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    logger.error('SMTP connection error:', error);
  } else {
    logger.info('SMTP server is ready to send emails');
  }
});

const sendMfaCode = async (email, code) => {
  try {
    const mailOptions = {
      from: `"Login System" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: 'Your MFA Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your MFA Code</h2>
          <p>Hello,</p>
          <p>Your MFA code is: <strong style="font-size: 24px; color: #4F46E5;">${code}</strong></p>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`MFA code sent to ${email}`);
    return true;
  } catch (error) {
    logger.error('Error sending MFA code:', error);
    throw error;
  }
};

module.exports = {
  sendMfaCode
}; 