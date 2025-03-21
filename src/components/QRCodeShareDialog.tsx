import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Copy, 
  Check, 
  Share2,
  QrCode,
  Smartphone,
  Mail,
  Clock,
  Lock,
  AlertTriangle
} from 'lucide-react';

interface QRCodeShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shareLink: string;
  expiryDays?: number;
  isPasswordProtected?: boolean;
  maxDownloads?: number;
}

const QRCodeShareDialog: React.FC<QRCodeShareDialogProps> = ({
  isOpen,
  onClose,
  shareLink,
  expiryDays,
  isPasswordProtected,
  maxDownloads
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // Check if Web Share API is available
    setCanShare(!!navigator.share);
    
    if (isOpen && shareLink) {
      generateQRCode();
    }
  }, [isOpen, shareLink]);

  const generateQRCode = async () => {
    try {
      // Use a public QR code generation API
      const encodedUrl = encodeURIComponent(shareLink);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
      setQrCodeUrl(qrUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setError('Failed to copy link to clipboard');
    }
  };

  const handleDownloadQRCode = async () => {
    if (!qrCodeUrl) return;
    
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'certificate-qrcode.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error('Error downloading QR code:', err);
      setError('Failed to download QR code');
    }
  };

  const handleShare = async () => {
    if (!shareLink) return;
    
    try {
      if (canShare) {
        try {
          await navigator.clipboard.writeText(shareLink);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          
          try {
            await navigator.share({
              title: 'Certificate Share',
              text: 'View my certificate',
              url: shareLink
            });
          } catch (shareErr) {
            // If share fails but we already copied to clipboard, don't show an error
            // Only show error if it's not an AbortError (user cancellation) and not a permission error
            if (shareErr.name !== 'AbortError' && shareErr.name !== 'NotAllowedError') {
              console.error('Error sharing:', shareErr);
              setError('Failed to share link, but it has been copied to clipboard');
            }
          }
        } catch (clipboardErr) {
          console.error('Failed to copy link:', clipboardErr);
          setError('Failed to copy link to clipboard');
        }
      } else {
        // Fallback to copy if Web Share API is not available
        await handleCopyLink();
      }
    } catch (err) {
      console.error('Error in share handler:', err);
      setError('Failed to share or copy link');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Certificate Link</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col items-center justify-center">
            {qrCodeUrl ? (
              <div className="border p-2 rounded-lg bg-white">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              </div>
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                <QrCode className="h-12 w-12 text-gray-400" />
              </div>
            )}
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">Scan this QR code to view the certificate</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Share Link</div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopyLink}
                className="text-blue-500"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="p-2 bg-gray-50 rounded-md text-xs font-mono break-all border">
              {shareLink}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 text-xs">
            {expiryDays !== undefined && expiryDays > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expires in {expiryDays} day{expiryDays !== 1 ? 's' : ''}
              </Badge>
            )}
            
            {isPasswordProtected && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Password Protected
              </Badge>
            )}
            
            {maxDownloads !== undefined && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {maxDownloads} download{maxDownloads !== 1 ? 's' : ''} limit
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-20 p-2"
              onClick={handleCopyLink}
            >
              <Copy className="h-6 w-6 mb-1" />
              <span className="text-xs">Copy Link</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-20 p-2"
              onClick={handleDownloadQRCode}
              disabled={!qrCodeUrl}
            >
              <Download className="h-6 w-6 mb-1" />
              <span className="text-xs">Download QR</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-20 p-2"
              onClick={handleShare}
            >
              <Share2 className="h-6 w-6 mb-1" />
              <span className="text-xs">{canShare ? 'Share' : 'Copy'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeShareDialog;