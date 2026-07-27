import { google } from 'googleapis';

/**
 * Sends a welcome email to a newly created user account via the Gmail API.
 */
export async function sendWelcomeEmail(recipientEmail: string, recipientName: string, role: string) {
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/gmail.send']
    });

    const gmail = google.gmail({ version: 'v1', auth });

    const subject = `✨ Welcome to Math Is Fun Academy, ${recipientName}!`;
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #4f46e5; padding: 16px 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Math Is Fun Academy</h1>
        </div>
        <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Welcome aboard, ${recipientName}! 👋</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Your account has been successfully created with the role of <strong>${role.toUpperCase()}</strong> at Math Is Fun Academy portal.
        </p>
        <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #334155;">
            <strong>Registered Email:</strong> ${recipientEmail}<br/>
            <strong>Account Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}
          </p>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          You can now log in to access your customized dashboard, study materials, live AI Gem Assistant, announcements, and track academic progress.
        </p>
        <p style="color: #64748b; font-size: 13px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Warm regards,<br/>
          <strong>Math Is Fun Academy Team</strong>
        </p>
      </div>
    `;

    const messageParts = [
      `To: ${recipientEmail}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      htmlBody
    ];
    const message = messageParts.join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log(`[Gmail Automation] Welcome email successfully dispatched to ${recipientEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[Gmail Automation] Could not send email to ${recipientEmail}:`, error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Sends a password reset notification via Gmail API.
 */
export async function sendPasswordResetEmail(recipientEmail: string, recipientName: string, tempPass: string) {
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/gmail.send']
    });

    const gmail = google.gmail({ version: 'v1', auth });

    const subject = `🔑 Password Reset Notice - Math Is Fun Academy`;
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #4f46e5; padding: 16px 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Math Is Fun Academy</h1>
        </div>
        <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Hello ${recipientName}, a temporary password has been generated for your account.
        </p>
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>Temporary Password:</strong> <code style="font-size: 16px; font-weight: bold; background: #fde68a; padding: 2px 8px; border-radius: 4px;">${tempPass}</code>
          </p>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Please log in using this temporary password and update your credentials under account settings.
        </p>
      </div>
    `;

    const messageParts = [
      `To: ${recipientEmail}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      htmlBody
    ];
    const message = messageParts.join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log(`[Gmail Automation] Password reset email sent to ${recipientEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[Gmail Automation] Password reset email failed for ${recipientEmail}:`, error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}
