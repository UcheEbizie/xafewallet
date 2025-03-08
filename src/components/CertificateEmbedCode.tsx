import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, Code, AlertTriangle, ExternalLink } from 'lucide-react';

interface CertificateEmbedCodeProps {
  isOpen: boolean;
  onClose: () => void;
  shareLink: string;
  certificateTitle: string;
}

const CertificateEmbedCode: React.FC<CertificateEmbedCodeProps> = ({
  isOpen,
  onClose,
  shareLink,
  certificateTitle
}) => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [embedType, setEmbedType] = useState<'iframe' | 'button' | 'badge'>('iframe');

  // Generate different embed code options
  const iframeCode = `<iframe 
  src="${shareLink}" 
  title="${certificateTitle}" 
  width="100%" 
  height="600px" 
  style="border: 1px solid #ddd; border-radius: 8px;"
></iframe>`;

  const linkCode = `<a 
  href="${shareLink}" 
  target="_blank" 
  rel="noopener noreferrer"
  style="display: inline-block; padding: 10px 16px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-family: sans-serif;"
>
  View Certificate: ${certificateTitle}
</a>`;

  const badgeCode = `<a 
  href="${shareLink}" 
  target="_blank" 
  rel="noopener noreferrer"
  style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 9999px; text-decoration: none; font-family: sans-serif; color: #1e293b;"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <path d="M9 12l2 2 4-4"></path>
  </svg>
  <span>Verified Certificate</span>
</a>`;

  // Get the selected code based on the embed type
  const getSelectedCode = () => {
    switch (embedType) {
      case 'iframe':
        return iframeCode;
      case 'button':
        return linkCode;
      case 'badge':
        return badgeCode;
      default:
        return iframeCode;
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(getSelectedCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      setError('Failed to copy code to clipboard');
    }
  };

  // Create a safe version of the HTML for the preview
  const createSafeHtml = () => {
    // For iframe, we'll show a placeholder instead of the actual iframe for security
    if (embedType === 'iframe') {
      return `
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9fafb; text-align: center;">
          <div style="font-weight: bold; margin-bottom: 10px;">iFrame Preview</div>
          <div style="color: #6b7280; font-size: 14px;">
            Your certificate will be embedded here when added to a website
          </div>
          <div style="margin-top: 10px;">
            <a href="${shareLink}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: none; font-size: 14px; display: inline-flex; align-items: center; gap: 4px;">
              Preview link
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>
      `;
    }
    
    // For button and badge, we can safely render them
    return getSelectedCode();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Embed Certificate</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Embed Type</div>
            <div className="flex space-x-2">
              <Button 
                variant={embedType === 'iframe' ? "default" : "outline"} 
                size="sm"
                onClick={() => setEmbedType('iframe')}
              >
                iFrame
              </Button>
              <Button 
                variant={embedType === 'button' ? "default" : "outline"} 
                size="sm"
                onClick={() => setEmbedType('button')}
              >
                Button
              </Button>
              <Button 
                variant={embedType === 'badge' ? "default" : "outline"} 
                size="sm"
                onClick={() => setEmbedType('badge')}
              >
                Badge
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Embed Code</div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopyCode}
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
                    Copy Code
                  </>
                )}
              </Button>
            </div>
            <pre className="p-3 bg-gray-50 rounded-md text-xs font-mono overflow-x-auto border whitespace-pre-wrap">
              {getSelectedCode()}
            </pre>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Preview</div>
            <div className="p-4 bg-white rounded-md border">
              <div dangerouslySetInnerHTML={{ __html: createSafeHtml() }} />
            </div>
          </div>
          
          <Alert>
            <Code className="h-4 w-4" />
            <AlertDescription>
              Embed this code on your website or portfolio to showcase your certificate.
              <a 
                href={shareLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-500 hover:underline mt-2"
              >
                <ExternalLink className="h-3 w-3" />
                <span>View the certificate link</span>
              </a>
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateEmbedCode;