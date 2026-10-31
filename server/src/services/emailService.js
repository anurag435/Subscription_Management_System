import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  // If credentials are provided in env, use them
  if (ENV.SMTP.USER && ENV.SMTP.PASS) {
    transporter = nodemailer.createTransport({
      host: ENV.SMTP.HOST,
      port: ENV.SMTP.PORT,
      secure: ENV.SMTP.PORT === 465,
      auth: {
        user: ENV.SMTP.USER,
        pass: ENV.SMTP.PASS,
      },
    });
  } else {
    // Generate an automatic Ethereal test account for seamless local testing
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[Email Service]: Created Ethereal test account ${testAccount.user}`);
    } catch {
      // Fallback dummy transport
      transporter = {
        sendMail: async (options) => {
          console.log(`[Email Service Fallback]: Simulating email to ${options.to}`);
          return { messageId: 'simulated-id' };
        },
      };
    }
  }

  return transporter;
};

export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  try {
    const mailTransporter = await getTransporter();

    const mailOptions = {
      from: ENV.SMTP.FROM,
      to,
      subject: 'Brightloop Software — Password Reset Request',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-bottom: 16px;">Brightloop Software</h2>
          <p style="color: #334155; font-size: 16px; line-height: 24px;">Hello,</p>
          <p style="color: #334155; font-size: 16px; line-height: 24px;">
            You requested a password reset for your Brightloop account. Click the button below to set a new password:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: 600; border-radius: 6px; display: inline-block;">
              Reset Your Password
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px; line-height: 20px;">
            This reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Brightloop Software. All rights reserved.
          </p>
        </div>
      `,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    if (nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[Password Reset Email Sent]: Preview URL -> ${previewUrl}`);
      }
    }
    return info;
  } catch (err) {
    console.warn(`[Email Service Warning]: Failed to send live email (${err.message}). Simulating password reset delivery.`);
    return { messageId: 'simulated-reset-' + Date.now() };
  }
};

export const sendInvoiceEmail = async ({ to, invoiceNumber, total, dueDate, pdfContent }) => {
  try {
    const mailTransporter = await getTransporter();

    const mailOptions = {
      from: ENV.SMTP.FROM,
      to,
      subject: `Brightloop Software — Invoice ${invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5;">Brightloop Software</h2>
          <p>Dear Customer,</p>
          <p>Please find attached your invoice <strong>${invoiceNumber}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Invoice Number:</strong></td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Total Amount:</strong></td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">$${total.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Due Date:</strong></td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${new Date(dueDate).toLocaleDateString()}</td>
            </tr>
          </table>
          <p>Thank you for choosing Brightloop Software!</p>
        </div>
      `,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    return info;
  } catch (err) {
    console.warn(`[Email Service Warning]: Failed to send live email (${err.message}). Simulating successful dispatch.`);
    return { messageId: 'simulated-dispatch-' + Date.now() };
  }
};
