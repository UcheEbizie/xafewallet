import { supabase } from '@/lib/supabase';
import { sendEmail, fileToBase64, generateCertificateEmailTemplate } from '@/lib/sendgrid';

export interface SendEmailRequest {
  recipients: string[];
  subject: string;
  message?: string;
  certificateIds: string[];
  files?: File[];
}

export async function sendCertificateEmail(request: SendEmailRequest) {
  const { recipients, subject, message, certificateIds, files = [] } = request;
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (profileError) throw profileError;
    
    // Get certificates
    const { data: certificates, error: certsError } = await supabase
      .from('certificates')
      .select('*')
      .in('id', certificateIds);
      
    if (certsError) throw certsError;
    
    // Prepare email template
    const certificateNames = certificates.map(cert => cert.title);
    const emailTemplate = generateCertificateEmailTemplate(
      profile.name,
      profile.position,
      certificateNames,
      message
    );
    
    // Prepare attachments
    const attachments = [];
    for (const file of files) {
      // Convert file to base64
      const base64Content = await fileToBase64(file);
      
      attachments.push({
        content: base64Content,
        filename: file.name,
        type: file.type,
        disposition: 'attachment'
      });
    }
    
    // Send email
    const fromEmail = import.meta.env.VITE_EMAIL_FROM || 'noreply@xafewallet.com';
    const fromName = import.meta.env.VITE_EMAIL_FROM_NAME || 'XafeWallet';
    
    const emailResult = await sendEmail({
      to: recipients,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: subject || emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
      attachments,
      categories: ['certificate-sharing'],
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      }
    });
    
    if (!emailResult) {
      throw new Error('Failed to send email');
    }
    
    // Record email in database
    const { data, error } = await supabase
      .from('email_shares')
      .insert({
        user_id: user.id,
        recipients,
        subject,
        message,
        certificate_ids: certificateIds,
        sent_at: new Date().toISOString(),
        status: 'sent'
      })
      .select()
      .single();
      
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Record failed email attempt if user is authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('email_shares')
          .insert({
            user_id: user.id,
            recipients,
            subject,
            message,
            certificate_ids: certificateIds,
            sent_at: new Date().toISOString(),
            status: 'failed'
          });
      }
    } catch (e) {
      console.error('Error recording failed email:', e);
    }
    
    return { success: false, error: error.message || 'Failed to send email' };
  }
}