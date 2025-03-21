import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Printer, 
  Download, 
  AlertTriangle, 
  Loader2,
  QrCode,
  Shield
} from 'lucide-react';

interface PrintableCertificateProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: any;
  profile: any;
  shareLink?: string;
}

const PrintableCertificate: React.FC<PrintableCertificateProps> = ({
  isOpen,
  onClose,
  certificate,
  profile,
  shareLink
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && certificate) {
      loadPreview();
      if (shareLink) {
        generateQRCode();
      }
    }
    
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, certificate, shareLink]);

  const loadPreview = () => {
    setLoading(true);
    setError(null);
    
    try {
      if (certificate?.file) {
        const url = URL.createObjectURL(certificate.file);
        setPreviewUrl(url);
      } else if (certificate?.file_url) {
        setPreviewUrl(certificate.file_url);
      } else {
        setError('No certificate file available');
      }
    } catch (err) {
      console.error('Error loading preview:', err);
      setError('Failed to load certificate preview');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    try {
      // Use a public QR code generation API
      const encodedUrl = encodeURIComponent(shareLink);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedUrl}`;
      setQrCodeUrl(qrUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
      // Non-blocking error - we can still show the certificate without QR code
    }
  };

  const handlePrint = () => {
    if (!certificate) {
      setError('No certificate available to print');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Pop-up blocked. Please allow pop-ups for this site.');
      return;
    }
    
    const certificateHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${certificate.title || 'Certificate'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          .certificate-container {
            max-width: 800px;
            margin: 20px auto;
            border: 2px solid #ddd;
            padding: 40px;
            position: relative;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .logo {
            display: flex;
            align-items: center;
          }
          .logo-icon {
            width: 40px;
            height: 40px;
            background-color: #3b82f6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            margin-right: 10px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
          }
          .content {
            margin: 30px 0;
          }
          .details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
          }
          .detail-item {
            margin-bottom: 10px;
          }
          .detail-label {
            font-weight: bold;
            color: #666;
          }
          .footer {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .verification {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 60px;
            color: rgba(200, 200, 200, 0.2);
            white-space: nowrap;
            pointer-events: none;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="watermark">XafeWallet Verified</div>
          
          <div class="header">
            <div class="logo">
              <div class="logo-icon">X</div>
              <div>
                <div style="font-weight: bold;"><span style="color: #3b82f6;">Xafe</span>Wallet</div>
                <div style="font-size: 12px; color: #666;">Secure Certificate Sharing</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold;">Certificate ID</div>
              <div style="font-size: 14px;">${certificate.id || certificate.certNumber || certificate.cert_number || 'N/A'}</div>
            </div>
          </div>
          
          <div class="title">${certificate.title || 'Certificate'}</div>
          
          <div class="content">
            <p>This is to certify that the document titled <strong>${certificate.title || 'Certificate'}</strong> was issued by <strong>${certificate.issuer || 'Issuer'}</strong> and is being shared by <strong>${profile?.name || 'User'}</strong> (${profile?.position || 'Position'}).</p>
          </div>
          
          <div class="details">
            <div class="detail-item">
              <div class="detail-label">Type</div>
              <div>${certificate.type || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Certificate Number</div>
              <div>${certificate.certNumber || certificate.cert_number || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Completion Date</div>
              <div>${certificate.completionDate ? new Date(certificate.completionDate).toLocaleDateString() : 
                    certificate.completion_date ? new Date(certificate.completion_date).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Expiry Date</div>
              <div>${certificate.noExpiry || (!certificate.expiryDate && !certificate.expiry_date) ? 'No Expiry' : 
                    certificate.expiryDate ? new Date(certificate.expiryDate).toLocaleDateString() : 
                    certificate.expiry_date ? new Date(certificate.expiry_date).toLocaleDateString() : 'N/A'}</div>
            </div>
            ${certificate.description ? `
            <div class="detail-item" style="grid-column: span 2;">
              <div class="detail-label">Description</div>
              <div>${certificate.description}</div>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <div>
              <div style="font-weight: bold;">${profile?.name || 'User'}</div>
              <div style="font-size: 14px; color: #666;">${profile?.position || 'Position'}</div>
              <div style="font-size: 12px; color: #666;">Shared on ${new Date().toLocaleDateString()}</div>
            </div>
            ${qrCodeUrl ? `
            <div class="verification">
              <img src="${qrCodeUrl}" alt="Verification QR Code" width="100" height="100" />
              <div style="font-size: 12px; text-align: center; margin-top: 5px;">
                Scan to verify
              </div>
            </div>
            ` : ''}
          </div>
        </div>
        
        <div class="no-print" style="max-width: 800px; margin: 20px auto; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Print Certificate
          </button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(certificateHtml);
    printWindow.document.close();
    
    // Wait for resources to load before printing
    printWindow.onload = () => {
      printWindow.focus();
      // Automatically print
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  // If no certificate is provided, show a message
  if (!certificate) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Print Certificate</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>No certificate selected. Please select a certificate to print.</AlertDescription>
          </Alert>
          <div className="flex justify-end mt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Print Certificate</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg p-6 relative">
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-gray-200 text-4xl font-bold transform -rotate-45">
                    XafeWallet Verified
                  </div>
                </div>
                
                {/* Header */}
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-2">
                      X
                    </div>
                    <div>
                      <div className="font-bold">
                        <span className="text-blue-500">Xafe</span>Wallet
                      </div>
                      <div className="text-xs text-gray-500">Secure Certificate Sharing</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">Certificate ID</div>
                    <div className="text-xs">{certificate.id || certificate.certNumber || certificate.cert_number || 'N/A'}</div>
                  </div>
                </div>
                
                {/* Title */}
                <div className="text-xl font-bold text-center my-6 relative z-10">
                  {certificate.title || 'Certificate'}
                </div>
                
                {/* Content */}
                <div className="my-6 relative z-10">
                  <p className="text-sm">
                    This is to certify that the document titled <strong>{certificate.title || 'Certificate'}</strong> was issued by <strong>{certificate.issuer || 'Issuer'}</strong> and is being shared by <strong>{profile?.name || 'User'}</strong> ({profile?.position || 'Position'}).
                  </p>
                </div>
                
                {/* Details */}
                <div className="grid grid-cols-2 gap-4 my-6 relative z-10">
                  <div>
                    <div className="text-xs font-semibold text-gray-500">Type</div>
                    <div className="text-sm">{certificate.type || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500">Certificate Number</div>
                    <div className="text-sm">{certificate.certNumber || certificate.cert_number || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500">Completion Date</div>
                    <div className="text-sm">
                      {certificate.completionDate ? new Date(certificate.completionDate).toLocaleDateString() : 
                       certificate.completion_date ? new Date(certificate.completion_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500">Expiry Date</div>
                    <div className="text-sm">
                      {certificate.noExpiry || (!certificate.expiryDate && !certificate.expiry_date) ? 'No Expiry' : 
                       certificate.expiryDate ? new Date(certificate.expiryDate).toLocaleDateString() : 
                       certificate.expiry_date ? new Date(certificate.expiry_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  {certificate.description && (
                    <div className="col-span-2">
                      <div className="text-xs font-semibold text-gray-500">Description</div>
                      <div className="text-sm">{certificate.description}</div>
                    </div>
                  )}
                </div>
                
                {/* Footer */}
                <div className="flex justify-between items-end mt-8 relative z-10">
                  <div>
                    <div className="font-bold">{profile?.name || 'User'}</div>
                    <div className="text-xs text-gray-500">{profile?.position || 'Position'}</div>
                    <div className="text-xs text-gray-400">Shared on {new Date().toLocaleDateString()}</div>
                  </div>
                  {qrCodeUrl && (
                    <div className="flex flex-col items-center">
                      <img src={qrCodeUrl} alt="Verification QR Code" className="w-20 h-20" />
                      <div className="text-xs text-center mt-1">Scan to verify</div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button onClick={handlePrint} className="w-full">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Certificate
                </Button>
              </div>
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  This printable version includes security features like watermarks and QR verification.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintableCertificate;