import resend from '../config/resend';

/**
 * The "from" address used for all outbound emails.
 *
 * ── Production ──────────────────────────────────────────────────────────
 * Set FROM_EMAIL in your .env / Render env vars to your verified Resend
 * domain address, e.g. "PrimeVision Trades <noreply@primevisiontrades.com>"
 *
 * Your domain MUST be verified in the Resend dashboard first:
 * https://resend.com/domains
 *
 * ── Development / Before Domain Verification ────────────────────────────
 * Resend's test address "onboarding@resend.dev" is used automatically
 * if FROM_EMAIL is not set. Note: this address can ONLY deliver to the
 * email address that owns the Resend account.
 */
const FROM_EMAIL =
  process.env.FROM_EMAIL ||
  (process.env.NODE_ENV === 'production'
    ? 'PrimeVision Trades <noreply@primevisiontrades.com>'
    : 'PrimeVision Trades <onboarding@resend.dev>');

/** Admin email to BCC on important platform events */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/** Logs email errors without crashing the request */
const logEmailError = (fn: string, err: unknown) => {
  console.error(`[email.service] ${fn} failed:`, (err as Error).message ?? err);
};

export const sendWelcomeEmail = async (name: string, email: string): Promise<void> => {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    ...(ADMIN_EMAIL ? { bcc: ADMIN_EMAIL } : {}),
    subject: 'Welcome to PrimeVision Trades!',
    html: `
      <div style="font-family:Arial,sans-serif;background:#0e0e52;color:#fff;padding:40px;border-radius:20px;max-width:600px;margin:auto">
        <h1 style="color:#e9d758;font-size:32px;margin-bottom:8px">Welcome, ${name}!</h1>
        <p style="color:#cdcacc;font-size:16px">Thank you for joining PrimeVision Trades. Your account has been created and you're ready to start trading.</p>
        <div style="margin:32px 0">
          <a href="${process.env.FRONTEND_URL}/auth/login"
             style="background:#f5a623;color:#fff;padding:14px 32px;border-radius:40px;text-decoration:none;font-weight:600;font-size:16px">
            Go to Dashboard
          </a>
        </div>
        <p style="color:#cdcacc;font-size:13px">Trade Futures, Stocks &amp; Crypto all in one powerful platform.</p>
        <hr style="border-color:#150578;margin:24px 0"/>
        <p style="color:#cdcacc;font-size:12px">PrimeVision Trades &copy; 2022-2026, All rights reserved</p>
      </div>
    `,
  });
  if (error) logEmailError('sendWelcomeEmail', error);
};

export const sendOTPEmail = async (name: string, email: string, otp: string): Promise<void> => {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Your PrimeVision Trades Verification Code',
    html: `
      <div style="font-family:Arial,sans-serif;background:#0e0e52;color:#fff;padding:40px;border-radius:20px;max-width:600px;margin:auto">
        <h2 style="color:#e9d758">Email Verification</h2>
        <p style="color:#cdcacc">Hi ${name}, use the code below to verify your email address. It expires in 10 minutes.</p>
        <div style="background:#150578;border-radius:20px;padding:24px;text-align:center;margin:24px 0">
          <span style="font-size:48px;font-weight:700;letter-spacing:16px;color:#e9d758">${otp}</span>
        </div>
        <p style="color:#cdcacc;font-size:13px">If you didn't request this, please ignore this email.</p>
        <hr style="border-color:#150578;margin:24px 0"/>
        <p style="color:#cdcacc;font-size:12px">PrimeVision Trades &copy; 2022-2026, All rights reserved</p>
      </div>
    `,
  });
  if (error) {
    logEmailError('sendOTPEmail', error);
    // Re-throw OTP email errors — user cannot verify without it
    throw new Error('Failed to send verification email. Please try again.');
  }
};

export const sendPasswordResetEmail = async (
  name: string,
  email: string,
  resetUrl: string,
): Promise<void> => {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset Your PrimeVision Trades Password',
    html: `
      <div style="font-family:Arial,sans-serif;background:#0e0e52;color:#fff;padding:40px;border-radius:20px;max-width:600px;margin:auto">
        <h2 style="color:#e9d758">Password Reset</h2>
        <p style="color:#cdcacc">Hi ${name}, you requested to reset your password. Click below — the link expires in 1 hour.</p>
        <div style="margin:32px 0">
          <a href="${resetUrl}"
             style="background:#f5a623;color:#fff;padding:14px 32px;border-radius:40px;text-decoration:none;font-weight:600;font-size:16px">
            Reset Password
          </a>
        </div>
        <p style="color:#cdcacc;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border-color:#150578;margin:24px 0"/>
        <p style="color:#cdcacc;font-size:12px">PrimeVision Trades &copy; 2022-2026, All rights reserved</p>
      </div>
    `,
  });
  if (error) {
    logEmailError('sendPasswordResetEmail', error);
    throw new Error('Failed to send password reset email. Please try again.');
  }
};

export const sendDepositConfirmationEmail = async (
  name: string,
  email: string,
  amount: number,
  method: string,
): Promise<void> => {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    ...(ADMIN_EMAIL ? { bcc: ADMIN_EMAIL } : {}),
    subject: 'Deposit Received – PrimeVision Trades',
    html: `
      <div style="font-family:Arial,sans-serif;background:#0e0e52;color:#fff;padding:40px;border-radius:20px;max-width:600px;margin:auto">
        <h2 style="color:#e9d758">Deposit Received</h2>
        <p style="color:#cdcacc">Hi ${name}, we've received your deposit.</p>
        <div style="background:#150578;border-radius:20px;padding:24px;margin:24px 0">
          <p style="margin:0;color:#cdcacc">Amount: <span style="color:#fff;font-weight:600">$${amount.toLocaleString()}</span></p>
          <p style="margin:8px 0 0;color:#cdcacc">Method: <span style="color:#fff">${method}</span></p>
        </div>
        <p style="color:#cdcacc;font-size:13px">Your balance will be updated once the transaction is confirmed.</p>
        <hr style="border-color:#150578;margin:24px 0"/>
        <p style="color:#cdcacc;font-size:12px">PrimeVision Trades &copy; 2022-2026, All rights reserved</p>
      </div>
    `,
  });
  if (error) logEmailError('sendDepositConfirmationEmail', error);
};

export const sendWithdrawalEmail = async (
  name: string,
  email: string,
  amount: number,
  status: string,
): Promise<void> => {
  const isApproved = status === 'completed';
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    ...(ADMIN_EMAIL ? { bcc: ADMIN_EMAIL } : {}),
    subject: `Withdrawal ${isApproved ? 'Approved' : 'Rejected'} – PrimeVision Trades`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0e0e52;color:#fff;padding:40px;border-radius:20px;max-width:600px;margin:auto">
        <h2 style="color:${isApproved ? '#e9d758' : '#f77f00'}">Withdrawal ${isApproved ? 'Approved' : 'Rejected'}</h2>
        <p style="color:#cdcacc">Hi ${name}, your withdrawal request for <strong>$${amount.toLocaleString()}</strong> has been ${status}.</p>
        ${!isApproved ? '<p style="color:#cdcacc">Please contact support for more information.</p>' : ''}
        <hr style="border-color:#150578;margin:24px 0"/>
        <p style="color:#cdcacc;font-size:12px">PrimeVision Trades &copy; 2022-2026, All rights reserved</p>
      </div>
    `,
  });
  if (error) logEmailError('sendWithdrawalEmail', error);
};
