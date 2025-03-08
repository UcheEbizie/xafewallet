import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PDFPreview from './PDFPreview';
import { validate } from 'email-validator';
import { generateShareLink, revokeShareLink } from '@/lib/sharing';
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
  Send
} from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 500;
const SHARE_RATE_LIMIT = 10; // Maximum shares per minute

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
  avatar?: string;
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

const PreviewDialog = ({ 
  isOpen, 
  onClose, 
  selectedCertificates,
  certificates,
  profile,
  watermarkText = "Shared via XafeWallet"
}) => {
  const [downloadStatus, setDownloadStatus] = useState<{ [key: number]: boolean }>({});
  const [previewUrls, setPreviewUrls] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    // Create object URLs for selected certificates
    const urls: { [key: number]: string } = {};
    selectedCertificates.forEach(certId => {
      const cert = certificates.find(c => c.id === certId);
      if (cert?.file) {
        urls[certId] = URL.createObjectURL(cert.file);
      }
    });
    setPreviewUrls(urls);

    // Cleanup function
    return () => {
      Object.values(urls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedCertificates, certificates]);

  const handleDownloadPreview = async (cert: Certificate) => {
    if (!cert.file || !cert.file.type.startsWith('image/')) return;

    try {
      setDownloadStatus(prev => ({ ...prev, [cert.id]: true }));

      // Create a canvas to draw the image and watermark
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Create a new image object
      const img = new Image();
      img.src = previewUrls[cert.id];
      
      // Wait for the image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height + 80; // Add extra height for profile info

      // Draw white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw profile section
      ctx.fillStyle = '#f8fafc'; // Light gray background
      ctx.fillRect(0, 0, canvas.width, 80);

      // Draw profile image placeholder
      ctx.beginPath();
      ctx.arc(50, 40, 25, 0, Math.PI * 2);
      ctx.fillStyle = '#bfdbfe'; // Light blue background
      ctx.fill();
      ctx.fillStyle = '#3b82f6'; // Blue text
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(profile.name.charAt(0).toUpperCase(), 50, 40);

      // Draw profile text
      ctx.fillStyle = '#1e293b'; // Dark text
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(profile.name, 90, 30);
      ctx.font = '14px Arial';
      ctx.fillStyle = '#64748b'; // Gray text
      ctx.fillText(profile.position, 90, 50);

      // Draw divider line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 80);
      ctx.lineTo(canvas.width, 80);
      ctx.stroke();

      // Draw the original image below the profile section
      ctx.drawImage(img, 0, 80);

      // Add watermark
      ctx.save();
      ctx.globalAlpha = 0.3; // Watermark opacity
      ctx.font = `${Math.floor(img.width / 20)}px Arial`;
      ctx.fillStyle = '#666666';
      
      // Rotate and position watermark
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 4);
      
      // Draw watermark text
      const text = watermarkText;
      const textMetrics = ctx.measureText(text);
      ctx.fillText(text, -textMetrics.width / 2, 0);
      
      ctx.restore();

      // Convert canvas to blob
      const blob = await new Promise<Blob>(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.8);
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cert.title}_preview.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading preview:', error);
    } finally {
      setDownloadStatus(prev => ({ ...prev, [cert.id]: false }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Certificate Preview</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-4">
          {selectedCertificates.map(certId => {
            const cert = certificates.find(c => c.id === certId);
            if (!cert) return null;

            return (
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
                    <>
                      {cert.file.type.startsWith('image/') ? (
                        <div className="relative">
                          <img
                            src={previewUrls[cert.id]}
                            alt={cert.title}
                            className="w-full rounded-lg"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-gray-500 opacity-30 transform -rotate-45 text-2xl font-bold">
                              {watermarkText}
                            </div>
                          </div>
                        </div>
                      ) : cert.file.type === 'application/pdf' && (
                        <PDFPreview file={previewUrls[cert.id]} className="max-h-[500px]" />
                      )}
                    </>
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

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-500"
                      onClick={() => handleDownloadPreview(cert)}
                      disabled={!cert.file || !cert.file.type.startsWith('image/') || downloadStatus[cert.id]}
                    >
                      {downloadStatus[cert.id] ? (
                        <>
                          <span className="animate-spin mr-2">⌛</span>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download Preview
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SharingInterface = ({ 
  certificates,
  profile,
  onClose 
}: { 
  certificates: Certificate[];
  profile: Profile;
  onClose: () => void;
}) => {
  const [selectedCerts, setSelectedCerts] = useState<number[]>([]);
  const [shareMethod, setShareMethod] = useState<'email' | 'link'>('email');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [message, setMessage] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [shareProgress, setShareProgress] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shareHistory, setShareHistory] = useState<ShareHistory[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Rate limiting
  const [shareCount, setShareCount] = useState(0);
  const [lastShareTime, setLastShareTime] = useState(Date.now());

  useEffect(() => {
    if (shareCount >= SHARE_RATE_LIMIT) {
      const timeSinceLastShare = Date.now() - lastShareTime;
      if (timeSinceLastShare < 60000) { // 1 minute
        setError('Too many share attempts. Please wait a moment.');
        return;
      }
      setShareCount(0);
      setLastShareTime(Date.now());
    }
  }, [shareCount, lastShareTime]);

  const validateEmails = (emails: string): boolean => {
    return emails.split(',').every(email => validate(email.trim()));
  };

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

  const handleShare = async () => {
    // Clear any previous error messages
    setError('');
    
    if (selectedCerts.length === 0) {
      setError('Please select at least one certificate');
      return;
    }

    if (shareCount >= SHARE_RATE_LIMIT) {
      setError('Too many share attempts. Please wait a moment.');
      return;
    }

    setIsSharing(true);
    setShareProgress(0);
    setGeneratedLink(null);

    try {
      if (shareMethod === 'email') {
        if (!emailRecipients.trim()) {
          throw new Error('Please enter at least one recipient email address');
        }
        
        if (!validateEmails(emailRecipients)) {
          throw new Error('Invalid email address(es)');
        }

        // Simulate email sending progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setShareProgress(i);
        }

        // Record share history
        const newShare: ShareHistory = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'email',
          recipients: emailRecipients.split(',').map(email => email.trim()),
          certificates: selectedCerts,
          createdAt: new Date(),
          expiresAt: null,
          isRevoked: false,
          sharedBy: profile.name,
          position: profile.position
        };
        setShareHistory(prev => [...prev, newShare]);

      } else {
        // Generate and copy link
        const shareOptions = {
          certificateIds: selectedCerts.map(id => id.toString()),
          expiryDays,
          isPasswordProtected,
          password: isPasswordProtected ? password : undefined,
          maxDownloads: undefined
        };
        
        // Simulate progress
        setShareProgress(30);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Generate the share link
        const shareableLink = await generateShareLink(shareOptions);
        setShareProgress(70);
        
        await navigator.clipboard.writeText(shareableLink);
        setCopied(true);
        setGeneratedLink(shareableLink);
        setShareProgress(100);

        // Record share history
        const newShare: ShareHistory = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'link',
          url: shareableLink,
          certificates: selectedCerts,
          createdAt: new Date(),
          expiresAt: expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : null,
          isRevoked: false,
          sharedBy: profile.name,
          position: profile.position
        };
        setShareHistory(prev => [...prev, newShare]);
      }

      setShareCount(prev => prev + 1);
      setLastShareTime(Date.now());
      setSuccess(shareMethod === 'email' ? 'Certificates shared successfully!' : 'Link generated and copied to clipboard!');
      
      // Reset form after successful share
      if (shareMethod === 'email') {
        setEmailRecipients('');
        setMessage('');
      }
    } catch (err) {
      console.error('Error sharing certificates:', err);
      setError(err.message || 'Failed to share certificates');
    } finally {
      setIsSharing(false);
      setShareProgress(0);
    }
  };

  const handleRevoke = (shareId: string) => {
    setShareHistory(prev => 
      prev.map(share => 
        share.id === shareId 
          ? { ...share, isRevoked: true }
          : share
      )
    );
  };

  const handleCopyLink = async () => {
    if (generatedLink) {
      try {
        await navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
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

      <div className="flex space-x-4">
        <Button
          variant={shareMethod === 'email' ? 'default' : 'outline'}
          onClick={() => setShareMethod('email')}
          className="flex-1"
        >
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
        <Button
          variant={shareMethod === 'link' ? 'default' : 'outline'}
          onClick={() => setShareMethod('link')}
          className="flex-1"
        >
          <Link2 className="h-4 w-4 mr-2" />
          Share Link
        </Button>
      </div>

      {shareMethod === 'email' ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="recipients">Recipients</Label>
            <Input
              id="recipients"
              placeholder="Enter email addresses (comma-separated)"
              value={emailRecipients}
              onChange={(e) => setEmailRecipients(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <textarea
              id="message"
              className="w-full min-h-[100px] p-3 border rounded-md"
              placeholder="Add a personal message..."
              maxLength={MAX_MESSAGE_LENGTH}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">
              {message.length}/{MAX_MESSAGE_LENGTH} characters
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label>Link Expiration</Label>
            <select
              className="w-full p-2 border rounded-md mt-1"
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
            >
              <option value={1}>24 hours</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={0}>Never</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="password-protection">Password Protection</Label>
              <Switch
                id="password-protection"
                checked={isPasswordProtected}
                onCheckedChange={setIsPasswordProtected}
              />
            </div>
          </div>
          {isPasswordProtected && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secure password"
              />
            </div>
          )}
          
          {generatedLink && (
            <div className="mt-4 space-y-2">
              <Label>Generated Link</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  value={generatedLink} 
                  readOnly 
                  className="bg-gray-50 text-sm font-mono"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyLink}
                  className="whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                This link will expire {expiryDays > 0 ? `in ${expiryDays} day${expiryDays > 1 ? 's' : ''}` : 'never'}.
                {isPasswordProtected && ' Password protection is enabled.'}
              </p>
            </div>
          )}
        </div>
      )}

      {isSharing && (
        <div className="space-y-2">
          <Progress value={shareProgress} className="w-full" />
          <p className="text-sm text-center text-gray-500">
            {shareMethod === 'email' ? 'Sending emails...' : 'Generating link...'}
          </p>
        </div>
      )}

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
        <h3 className="font-medium">Recent Shares</h3>
        <div className="space-y-2">
          {shareHistory.map(share => (
            <div
              key={share.id}
              className="p-4 border rounded-lg flex items-center justify-between"
            >
              <div>
                <div className="flex items-center space-x-2">
                  {share.type === 'email' ? (
                    <Mail className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Link2 className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="font-medium">
                    {share.type === 'email'
                      ? `Shared with ${share.recipients?.length} recipient(s)`
                      : 'Shareable Link'}
                  </span>
                  {share.isRevoked && (
                    <Badge variant="destructive">Revoked</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {share.certificates.length} certificate(s) shared on{' '}
                  {share.createdAt.toLocaleDateString()}
                </p>
                {share.expiresAt && (
                  <p className="text-sm text-gray-500">
                    Expires: {share.expiresAt.toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {!share.isRevoked && share.type === 'link' && share.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(share.url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                {!share.isRevoked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(share.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        className="w-full"
        onClick={handleShare}
        disabled={
          isSharing ||
          selectedCerts.length === 0 ||
          (shareMethod === 'email' && !emailRecipients) ||
          (isPasswordProtected && !password)
        }
      >
        {isSharing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {shareMethod === 'email' ? 'Sending...' : 'Generating...'}
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4 mr-2" />
            {shareMethod === 'email' ? 'Send Certificates' : 'Generate Share Link'}
          </>
        )}
      </Button>

      <PreviewDialog
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        selectedCertificates={selectedCerts}
        certificates={certificates}
        profile={profile}
      />
    </div>
  );
};

export default SharingInterface;