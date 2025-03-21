import { supabase } from './supabase';

// Maximum file size in bytes (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Maximum number of recipients
export const MAX_RECIPIENTS = 10;
// Maximum message length
export const MAX_MESSAGE_LENGTH = 1000;

interface EmailAttachment {
  content: string; // Base64 encoded content
  filename: string;
  type: string;
  disposition: 'attachment';
}

interface EmailRequest {
  to: string[];
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
  from?: {
    email: string;
    name: string;
  };
}

/**
 * Converts a file to base64 string for email attachments
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

/**
 * Generates an email template for certificate sharing
 */
export const generateCertificateEmailTemplate = (
  senderName: string,
  senderPosition: string,
  certificateNames: string[],
  message?: string
): { subject: string; html: string; text: string } => {
  const certificateList = certificateNames
    .map(name => `<li style="margin-bottom: 8px;">${name}</li>`)
    .join('');
  
  const subject = `Certificates shared by ${senderName} via XafeWallet`;
  
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
    subject,
    html,
    text
  };
};

/**
 * Sends an email with certificate attachments
 */
export const sendCertificateEmail = async (
  recipients: string[],
  subject: string,
  message: string,
  certificateFiles: { file: File; title: string }[],
  senderProfile: { name: string; position: string }
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate inputs
    if (!recipients.length) {
      return { success: false, error: 'No recipients specified' };
    }
    
    if (recipients.length > MAX_RECIPIENTS) {
      return { success: false, error: `Maximum ${MAX_RECIPIENTS} recipients allowed` };
    }
    
    if (!certificateFiles.length) {
      return { success: false, error: 'No certificates selected' };
    }
    
    // Check file sizes
    for (const { file, title } of certificateFiles) {
      if (file.size > MAX_FILE_SIZE) {
        return { success: false, error: `Certificate "${title}" exceeds the maximum size of 10MB` };
      }
    }
    
    // Prepare email template
    const certificateNames = certificateFiles.map(c => c.title);
    const emailTemplate = generateCertificateEmailTemplate(
      senderProfile.name,
      senderProfile.position,
      certificateNames,
      message
    );
    
    // Prepare attachments
    const attachments: EmailAttachment[] = [];
    for (const { file } of certificateFiles) {
      try {
        // Convert file to base64
        const base64Content = await fileToBase64(file);
        
        attachments.push({
          content: base64Content,
          filename: file.name,
          type: file.type,
          disposition: 'attachment'
        });
      } catch (err) {
        console.error('Error processing attachment:', err);
        // Continue with other attachments if one fails
      }
    }
    
    // Prepare email request
    const emailRequest: EmailRequest = {
      to: recipients,
      subject: subject || emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
      attachments,
      from: {
        email: import.meta.env.VITE_EMAIL_FROM || 'noreply@xafewallet.com',
        name: import.meta.env.VITE_EMAIL_FROM_NAME || 'XafeWallet'
      }
    };
    
    // In a real implementation, we would send this to a server endpoint
    // For demo purposes, we'll log it and simulate success
    console.log('Sending email:', emailRequest);
    
    // Record email in database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('email_shares')
          .insert({
            user_id: user.id,
            recipients,
            subject,
            message,
            certificate_ids: certificateFiles.map(c => c.file.name),
            sent_at: new Date().toISOString(),
            status: 'sent'
          })
          .select();
          
        if (error) {
          console.error('Error recording email share:', error);
        }
      }
    } catch (e) {
      console.error('Error recording email share:', e);
      // Continue even if recording fails
    }
    
    // Simulate a delay for sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
};