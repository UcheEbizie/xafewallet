import { Certificate } from './types';
import { logAccess } from './analytics';

/**
 * Generates a shareable link for a certificate
 * @param certificateId ID of the certificate to share
 * @returns The shareable link
 */
export const generateShareableLink = (certificateId: string): string => {
  // In a real app, this would generate a unique, possibly short-lived link
  // For demo purposes, we'll just create a URL with the certificate ID
  const baseUrl = window.location.origin;
  return `${baseUrl}/certificate/share/${certificateId}`;
};

/**
 * Copies a text to clipboard
 * @param text Text to copy
 * @returns Promise that resolves when the text is copied
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    return Promise.resolve();
  } catch (err) {
    console.error('Failed to copy text: ', err);
    // Fallback method for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback: Failed to copy text: ', err);
    }
    document.body.removeChild(textArea);
    return Promise.resolve();
  }
};

/**
 * Shares a certificate via email using mailto protocol
 * @param certificate Certificate to share
 * @param recipientEmail Email address of the recipient
 * @param customMessage Optional custom message to include in the email
 * @returns Promise that resolves when the email client is opened
 */
export const shareViaEmail = async (
  certificate: Certificate, 
  recipientEmail: string,
  customMessage: string = ''
): Promise<void> => {
  try {
    // Create email subject and body
    const subject = `Certificate: ${certificate.title}`;
    const body = `
      Hello,
      
      I'd like to share my ${certificate.title} certificate with you.
      
      Certificate Details:
      - Title: ${certificate.title}
      - Issuer: ${certificate.issuer}
      - Completion Date: ${certificate.completion_date}
      ${certificate.expiry_date ? `- Expiry Date: ${certificate.expiry_date}` : ''}
      
      ${customMessage ? `Message: ${customMessage}\n\n` : ''}
      
      You can view this certificate at: ${generateShareableLink(certificate.id)}
      
      Regards,
      ${certificate.owner_name || '[Your Name]'}
    `;
    
    // Create mailto URL and open it
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    
    // Log the email share
    await logAccess({
      certificate_id: certificate.id,
      access_type: 'email',
      access_method: 'email',
      recipient_email: recipientEmail
    });
    
    return Promise.resolve();
  } catch (err) {
    console.error('Failed to share via email: ', err);
    throw err;
  }
};

/**
 * Downloads a certificate
 * @param certificate Certificate to download
 * @returns Promise that resolves when the certificate is downloaded
 */
export const downloadCertificate = async (certificate: Certificate): Promise<void> => {
  try {
    if (!certificate.file_url) {
      throw new Error('No file available for download');
    }
    
    // Create an anchor element and trigger download
    const link = document.createElement('a');
    link.href = certificate.file_url;
    link.download = `${certificate.title.replace(/\s+/g, '_')}_Certificate.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Log the download
    await logAccess({
      certificate_id: certificate.id,
      access_type: 'download',
      access_method: 'direct'
    });
    
    return Promise.resolve();
  } catch (err) {
    console.error('Failed to download certificate: ', err);
    throw err;
  }
};

/**
 * Prints a certificate
 * @param certificate Certificate to print
 * @returns Promise that resolves when the print dialog is opened
 */
export const printCertificate = async (certificate: Certificate): Promise<void> => {
  try {
    if (certificate.file_url) {
      // If we have a file URL, open it in a new window and print
      const printWindow = window.open(certificate.file_url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } else {
      // Otherwise, print the current page
      window.print();
    }
    
    // Log the print action
    await logAccess({
      certificate_id: certificate.id,
      access_type: 'print',
      access_method: 'direct'
    });
    
    return Promise.resolve();
  } catch (err) {
    console.error('Failed to print certificate: ', err);
    throw err;
  }
};

/**
 * Generates a QR code for a certificate
 * @param certificateId ID of the certificate
 * @returns URL to a QR code image
 */
export const generateQRCode = (certificateId: string): string => {
  // In a real app, this would generate a QR code using a library or API
  // For demo purposes, we'll use the Google Charts API
  const shareableLink = generateShareableLink(certificateId);
  const encodedUrl = encodeURIComponent(shareableLink);
  return `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodedUrl}`;
};

/**
 * Shows a QR code for a certificate
 * @param certificate Certificate to show QR code for
 * @returns Promise that resolves with the QR code URL
 */
export const showQRCode = async (certificate: Certificate): Promise<string> => {
  try {
    // Log the QR code view
    await logAccess({
      certificate_id: certificate.id,
      access_type: 'view',
      access_method: 'qrcode'
    });
    
    return generateQRCode(certificate.id);
  } catch (err) {
    console.error('Failed to show QR code: ', err);
    throw err;
  }
};

/**
 * Downloads a QR code image
 * @param qrCodeUrl URL of the QR code image
 * @param title Title to use for the downloaded file
 * @returns Promise that resolves when the QR code is downloaded
 */
export const downloadQRCode = async (qrCodeUrl: string, title: string): Promise<void> => {
  try {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${title.replace(/\s+/g, '_')}_QRCode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return Promise.resolve();
  } catch (err) {
    console.error('Failed to download QR code: ', err);
    throw err;
  }
};

/**
 * Shares multiple certificates via email
 * @param certificates Array of certificates to share
 * @param recipientEmails Comma-separated list of recipient email addresses
 * @param customMessage Optional custom message to include in the email
 * @returns Promise that resolves when the email client is opened
 */
export const shareMultipleCertificatesViaEmail = async (
  certificates: Certificate[],
  recipientEmails: string,
  customMessage: string = ''
): Promise<void> => {
  try {
    if (certificates.length === 0) {
      throw new Error('No certificates selected for sharing');
    }
    
    // Create email subject and body
    const subject = `Certificates: ${certificates.length} certificate${certificates.length > 1 ? 's' : ''}`;
    
    let certificatesList = '';
    certificates.forEach((cert, index) => {
      certificatesList += `
      ${index + 1}. ${cert.title}
         - Issuer: ${cert.issuer}
         - Completion Date: ${cert.completion_date}
         ${cert.expiry_date ? `- Expiry Date: ${cert.expiry_date}` : ''}
         - View: ${generateShareableLink(cert.id)}
      `;
    });
    
    const body = `
      Hello,
      
      I'd like to share the following certificates with you:
      
      ${certificatesList}
      
      ${customMessage ? `Message: ${customMessage}\n\n` : ''}
      
      Regards,
      ${certificates[0]?.owner_name || '[Your Name]'}
    `;
    
    // Create mailto URL and open it
    const mailtoUrl = `mailto:${recipientEmails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    
    // Log the email share for each certificate
    for (const cert of certificates) {
      await logAccess({
        certificate_id: cert.id,
        access_type: 'email',
        access_method: 'email',
        recipient_email: recipientEmails
      });
    }
    
    return Promise.resolve();
  } catch (err) {
    console.error('Failed to share certificates via email: ', err);
    throw err;
  }
};
