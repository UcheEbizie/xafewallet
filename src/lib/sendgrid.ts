import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  console.warn('SendGrid API key is not set. Email functionality will not work.');
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailAttachment {
  content: string; // Base64 encoded content
  filename: string;
  type: string;
  disposition: 'attachment' | 'inline';
  content_id?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailParams {
  to: string | string[];
  from: {
    email: string;
    name: string;
  };
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  categories?: string[];
  trackingSettings?: {
    clickTracking?: {
      enable?: boolean;
      enableText?: boolean;
    };
    openTracking?: {
      enable?: boolean;
    };
  };
}

export interface EnhancedEmailParams extends SendEmailParams {
  trackingId?: string;
  securityOptions?: {
    watermark?: boolean;
    preventForwarding?: boolean;
    expiryDate?: Date;
  };
}

/**
 * Send an email using SendGrid
 */
export const sendEmail = async (params: SendEmailParams): Promise<boolean> => {
  if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key is not set. Email not sent.');
    return false;
  }

  try {
    await sgMail.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments,
      templateId: params.templateId,
      dynamicTemplateData: params.dynamicTemplateData,
      categories: params.categories || ['xafe-wallet'],
      trackingSettings: params.trackingSettings || {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      }
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Send a secure email with enhanced tracking and security options
 */
export const sendSecureEmail = async (params: EnhancedEmailParams): Promise<boolean> => {
  if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key is not set. Email not sent.');
    return false;
  }

  try {
    // Add tracking pixel if not already present
    let htmlContent = params.html || '';
    if (params.trackingId && !htmlContent.includes('tracking-pixel')) {
      const trackingPixel = `<img src="${window.location.origin}/api/track?id=${params.trackingId}" width="1" height="1" alt="" class="tracking-pixel" />`;
      htmlContent = htmlContent.replace('</body>', `${trackingPixel}</body>`);
    }

    // Add security headers
    const headers = {};
    if (params.securityOptions?.preventForwarding) {
      headers['X-PM-Forwarding'] = 'disabled';
    }

    await sgMail.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: htmlContent,
      attachments: params.attachments,
      templateId: params.templateId,
      dynamicTemplateData: params.dynamicTemplateData,
      categories: params.categories || ['xafe-wallet'],
      trackingSettings: params.trackingSettings || {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      },
      headers
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Generate a certificate sharing email template
 */
export const generateCertificateEmailTemplate = (
  senderName: string,
  senderPosition: string,
  certificateNames: string[],
  message?: string
): EmailTemplate => {
  const certificateList = certificateNames
    .map(name => `<li>${name}</li>`)
    .join('');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f0f4f8; padding: 20px; border-radius: 8px 8px 0 0;">
        <div style="display: flex; align-items: center;">
          <div style="background-color: #3b82f6; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">
            ${senderName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style="margin: 0; color: #1e293b;">${senderName}</h3>
            <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">${senderPosition}</p>
          </div>
        </div>
      </div>
      
      <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1e293b; margin-top: 0;">Certificate Shared via XafeWallet</h2>
        
        <p style="color: #475569; line-height: 1.6;">
          ${senderName} has shared the following certificate(s) with you:
        </p>
        
        <ul style="color: #475569; line-height: 1.6;">
          ${certificateList}
        </ul>
        
        ${message ? `
        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 4px;">
          <p style="color: #475569; font-style: italic; margin: 0;">${message}</p>
        </div>
        ` : ''}
        
        <p style="color: #475569; line-height: 1.6;">
          The certificate(s) are attached to this email. You can view them using any standard PDF or image viewer.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          <p>This is an automated message from XafeWallet. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} XafeWallet. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  const text = `
Certificate Shared via XafeWallet

${senderName} (${senderPosition}) has shared the following certificate(s) with you:
${certificateNames.map(name => `- ${name}`).join('\n')}

${message ? `Personal message: ${message}\n\n` : ''}
The certificate(s) are attached to this email. You can view them using any standard PDF or image viewer.

This is an automated message from XafeWallet. Please do not reply to this email.
© ${new Date().getFullYear()} XafeWallet. All rights reserved.
  `;

  return {
    subject: `Certificate Shared by ${senderName} via XafeWallet`,
    html,
    text
  };
};

/**
 * Generate an enhanced certificate sharing email template with security features
 */
export const generateSecureEmailTemplate = (
  senderName: string,
  senderPosition: string,
  certificateNames: string[],
  message?: string,
  expiryDate?: Date,
  trackingId?: string
): EmailTemplate => {
  const certificateList = certificateNames
    .map(name => `<li>${name}</li>`)
    .join('');
  
  const expiryNotice = expiryDate 
    ? `<p style="color: #ef4444; font-weight: bold;">These certificates will expire on ${expiryDate.toLocaleDateString()}.</p>` 
    : '';
  
  const trackingPixel = trackingId 
    ? `<img src="${window.location.origin}/api/track?id=${trackingId}" width="1" height="1" alt="" class="tracking-pixel" style="position: absolute; visibility: hidden;" />` 
    : '';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f0f4f8; padding: 20px; border-radius: 8px 8px 0 0;">
        <div style="display: flex; align-items: center;">
          <div style="background-color: #3b82f6; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">
            ${senderName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style="margin: 0; color: #1e293b;">${senderName}</h3>
            <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">${senderPosition}</p>
          </div>
        </div>
      </div>
      
      <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1e293b; margin-top: 0;">Secure Certificate Shared via XafeWallet</h2>
        
        <p style="color: #475569; line-height: 1.6;">
          ${senderName} has shared the following certificate(s) with you:
        </p>
        
        <ul style="color: #475569; line-height: 1.6;">
          ${certificateList}
        </ul>
        
        ${expiryNotice}
        
        ${message ? `
        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 4px;">
          <p style="color: #475569; font-style: italic; margin: 0;">${message}</p>
        </div>
        ` : ''}
        
        <p style="color: #475569; line-height: 1.6;">
          The certificate(s) are attached to this email. You can view them using any standard PDF or image viewer.
        </p>
        
        <div style="background-color: #fffbeb; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px;">
          <p style="color: #92400e; margin: 0; font-weight: bold;">Security Notice</p>
          <p style="color: #92400e; margin: 8px 0 0;">These certificates contain watermarks for security. Any unauthorized distribution is prohibited.</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          <p>This is an automated message from XafeWallet. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} XafeWallet. All rights reserved.</p>
        </div>
      </div>
      ${trackingPixel}
    </div>
  `;

  const text = `
SECURE CERTIFICATE SHARED VIA XAFEWALLET

${senderName} (${senderPosition}) has shared the following certificate(s) with you:
${certificateNames.map(name => `- ${name}`).join('\n')}

${expiryDate ? `IMPORTANT: These certificates will expire on ${expiryDate.toLocaleDateString()}.` : ''}

${message ? `Personal message: ${message}\n\n` : ''}
The certificate(s) are attached to this email. You can view them using any standard PDF or image viewer.

SECURITY NOTICE: These certificates contain watermarks for security. Any unauthorized distribution is prohibited.

This is an automated message from XafeWallet. Please do not reply to this email.
© ${new Date().getFullYear()} XafeWallet. All rights reserved.
  `;

  return {
    subject: `Secure Certificate Shared by ${senderName} via XafeWallet`,
    html,
    text
  };
};

/**
 * Convert a file to a base64 string for email attachment
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};