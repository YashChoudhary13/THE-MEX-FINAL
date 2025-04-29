import { MailService } from '@sendgrid/mail';
import crypto from 'crypto';

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set. Email functionality will not work.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// In-memory storage for reset tokens (would be replaced with database in production)
const passwordResetTokens = new Map<string, { email: string, expires: Date }>();

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// For SendGrid's expected format
interface SendGridMailData {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key not set. Email not sent.');
    return false;
  }

  try {
    const mailData: SendGridMailData = {
      to: params.to,
      from: params.from, // This should be a verified sender in SendGrid
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    };
    
    await mailService.send(mailData);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generatePasswordResetToken(email: string): string {
  // Create a random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Store token with email and expiration (24 hours)
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  
  passwordResetTokens.set(token, { email, expires });
  
  return token;
}

export function validatePasswordResetToken(token: string): string | null {
  const resetData = passwordResetTokens.get(token);
  
  if (!resetData) {
    return null;
  }
  
  const now = new Date();
  if (now > resetData.expires) {
    // Token expired, remove it
    passwordResetTokens.delete(token);
    return null;
  }
  
  return resetData.email;
}

export function clearPasswordResetToken(token: string): void {
  passwordResetTokens.delete(token);
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  const emailParams: EmailParams = {
    to: email,
    from: 'reset@themex.restaurant', // Update this with your verified sender
    subject: 'Password Reset Request - The Mex',
    text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #FF5000; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">The Mex</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <h2>Password Reset Request</h2>
          <p>You recently requested to reset your password for your account at The Mex. Click the button below to reset it.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #FF5000; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Your Password</a>
          </p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>This password reset link is only valid for the next 24 hours.</p>
        </div>
        <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} The Mex. All rights reserved.</p>
        </div>
      </div>
    `,
  };
  
  return await sendEmail(emailParams);
}