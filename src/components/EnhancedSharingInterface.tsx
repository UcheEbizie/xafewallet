import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateShareLink, revokeShareLink } from '@/lib/sharing';
import SecureLinkGenerator from './SecureLinkGenerator';
import QRCodeShareDialog from './QRCodeShareDialog';
import PrintableCertificate from './PrintableCertificate';
import EmailShareDialog from './EmailShareDialog';
import { 
  Mail, 
  Link2, 
  Copy, 
  Share2, 
  Clock,
  Lock,
  Eye,
  Check,
  AlertTriangle,
  Download,
  User,
  Infinity,
  Loader2,
  QrCode,
  Printer
} from 'lucide-react';

interface Certificate {
  id: number;
  title: string;
  file: File | null;
  type: string;
  expiryDate: string | null;
  completionDate: string;
  issuer: string;
  certNumber: string;
  description: string;
  noExpiry?: boolean;
}

interface Profile {
  name: string;
  position: string;
  avatar_url?: string;
}

interface ShareHistory {
  id: string;
  type: 'email' | 'link';
  recipients?: string[];
  url?: string;
  certificates: number[];
  createdAt: Date;
  expiresAt: Date | null;
  isRevoked: boolean;
  sharedBy: string;
  position: string;
}

interface PreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCertificates: Certificate[];
  profile: Profile;
}

const PreviewDialog: React.FC<PreviewDialogProps> = ({ 
  isOpen, 
  onClose, 
  selectedCertificates,
  profile
}) => {
  const [previewUrls, setPreviewUrls] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    // Create object URLs for selected certificates
    const urls: { [key: number]: string } = {};
    selectedCertificates.forEach(cert => {
      if (cert.file) {
        urls[cert.id] = URL.createObjectURL(cert.file);
      }
    });
    setPreviewUrls(urls);

    // Cleanup function
    return () => {
      Object.values(urls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedCertificates]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Certificate Preview</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-4">
          {selectedCertificates.map(cert => (
            <div key={cert.id} className="border rounded-lg overflow-hidden">
              {/* Profile Section */}
              <div className="bg-slate-50 p-4 border-b">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-xl font-bold">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{profile.name}</h3>
                    <p className="text-sm text-slate-500">{profile.position}</p>
                  </div>
                </div>
              </div>

              {/* Certificate Content */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">{cert.title}</h3>
                    <p className="text-sm text-gray-500">Issued by {cert.issuer}</p>
                  </div>
                  <Badge>{cert.type}</Badge>
                </div>

                {cert.file && previewUrls[cert.id] && (
                  <div className="relative">
                    <img
                      src={previewUrls[cert.id]}
                      alt={cert.title}
                      className="w-full rounded-lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-gray-500 opacity-30 transform -rotate-45 text-2xl font-bold">
                        Shared via XafeWallet
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Certificate Number</Label>
                    <p className="mt-1">{cert.certNumber}</p>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <p className="mt-1">{cert.type}</p>
                  </div>
                  <div>
                    <Label>Completion Date</Label>
                    <p className="mt-1">{new Date(cert.completionDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Expiry Date</Label>
                    <p className="mt-1 flex items-center gap-2">
                      {cert.noExpiry ? (
                        <>
                          <Infinity className="h-4 w-4" />
                          <span>No Expiry</span>
                        </>
                      ) : (
                        cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'No Expiry'
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <p className="mt-1 text-sm text-gray-600">{cert.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EnhancedSharingInterface: React.FC<{
  certificates: Certificate[];
  profile: Profile;
  onClose: () => void;
}> = ({ certificates, profile, onClose }) => {
  const [selectedCerts, setSelectedCerts] = useState<number[]>([]);
  const [shareMethod, setShareMethod] = useState<'link' | 'qrcode' | 'email' | 'print'>('link');
  const [showSecureLinkDialog, setShowSecureLinkDialog] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [shareOptions, setShareOptions] = useState({
    expiryDays: 7,
    isPasswordProtected: false,
    maxDownloads: undefined
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSelectAll = () => {
    setSelectedCerts(certificates.map(cert => cert.id));
  };

  const handleDeselectAll = () => {
    setSelectedCerts([]);
  };

  const toggleCertificate = (certId: number) => {
    setSelectedCerts(prev => 
      prev.includes(certId) 
        ? prev.filter(id => id !== certId)
        : [...prev, certId]
    );
  };

  const handleShareMethodSelect = (method: 'link' | 'qrcode' | 'email' | 'print') => {
    // Clear any previous error messages
    setError(null);
    
    // Check if certificates are selected
    if (selectedCerts.length === 0) {
      setError('Please select at least one certificate');
      return;
    }
    
    setShareMethod(method);
    
    // Open appropriate dialog based on method
    switch (method) {
      case 'link':
        setShowSecureLinkDialog(true);
        break;
      case 'qrcode':
        if (generatedLink) {
          setShowQRCode(true);
        } else {
          setShowSecureLinkDialog(true);
        }
        break;
      case 'email':
        setShowEmailDialog(true);
        break;
      case 'print':
        if (selectedCerts.length > 0) {
          setShowPrintDialog(true);
        } else {
          setError('Please select a certificate to print');
        }
        break;
      default:
        break;
    }
  };

  const handleLinkGenerated = (link: string, options: any) => {
    setGeneratedLink(link);
    setShareOptions(options);
    setSuccess('Secure link generated successfully!');
    
    // If the user selected QR code initially, show that dialog now
    if (shareMethod === 'qrcode') {
      setShowQRCode(true);
    }
  };

  const getSelectedCertificates = () => {
    return certificates.filter(cert => selectedCerts.includes(cert.id));
  };

  const getSelectedCertificate = () => {
    // For print dialog, we only use the first selected certificate
    return certificates.find(cert => cert.id === selectedCerts[0]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="font-medium">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.position}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Share Certificates</h2>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Select Certificates</h3>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {certificates.map(cert => (
            <div
              key={cert.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedCerts.includes(cert.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => toggleCertificate(cert.id)}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={selectedCerts.includes(cert.id)}
                  onChange={() => toggleCertificate(cert.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium">{cert.title}</p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                    <Badge variant="secondary">{cert.type}</Badge>
                    {cert.noExpiry ? (
                      <span className="flex items-center gap-1">
                        <Infinity className="h-3 w-3" />
                        No Expiry
                      </span>
                    ) : (
                      <span>
                        Expires: {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'No Expiry'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {selectedCerts.length} certificate(s) selected
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            disabled={selectedCerts.length === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <h3 className="font-medium">Share Options</h3>
        <div className="grid grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-24 p-4"
            onClick={() => handleShareMethodSelect('link')}
          >
            <Link2 className="h-8 w-8 mb-2 text-blue-500" />
            <span>Secure Link</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-24 p-4"
            onClick={() => handleShareMethodSelect('qrcode')}
          >
            <QrCode className="h-8 w-8 mb-2 text-purple-500" />
            <span>QR Code</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-24 p-4"
            onClick={() => handleShareMethodSelect('email')}
          >
            <Mail className="h-8 w-8 mb-2 text-green-500" />
            <span>Email</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-24 p-4"
            onClick={() => handleShareMethodSelect('print')}
          >
            <Printer className="h-8 w-8 mb-2 text-gray-500" />
            <span>Print</span>
          </Button>
        </div>
      </div>

      {/* Secure Link Generator Dialog */}
      <SecureLinkGenerator
        isOpen={showSecureLinkDialog}
        onClose={() => setShowSecureLinkDialog(false)}
        certificateIds={selectedCerts.map(id => id.toString())}
        onLinkGenerated={handleLinkGenerated}
        onShowQRCode={() => setShowQRCode(true)}
      />

      {/* QR Code Dialog */}
      <QRCodeShareDialog
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        shareLink={generatedLink}
        expiryDays={shareOptions.expiryDays}
        isPasswordProtected={shareOptions.isPasswordProtected}
        maxDownloads={shareOptions.maxDownloads}
      />

      {/* Printable Certificate Dialog */}
      <PrintableCertificate
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        certificate={getSelectedCertificate()}
        profile={profile}
        shareLink={generatedLink}
      />

      {/* Email Share Dialog */}
      <EmailShareDialog
        isOpen={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
        certificates={certificates}
        selectedCertificateIds={selectedCerts}
        profile={profile}
      />

      {/* Preview Dialog */}
      <PreviewDialog
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        selectedCertificates={getSelectedCertificates()}
        profile={profile}
      />
    </div>
  );
};

export default EnhancedSharingInterface;