import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { generateShareLink } from '@/lib/sharing';
import { 
  Copy, 
  Check, 
  Link, 
  Clock, 
  Lock, 
  Download,
  AlertTriangle,
  Loader2,
  QrCode
} from 'lucide-react';

interface SecureLinkGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  certificateIds: string[];
  onLinkGenerated: (link: string, options: any) => void;
  onShowQRCode: () => void;
}

const SecureLinkGenerator: React.FC<SecureLinkGeneratorProps> = ({
  isOpen,
  onClose,
  certificateIds,
  onLinkGenerated,
  onShowQRCode
}) => {
  const [expiryDays, setExpiryDays] = useState(7);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [maxDownloads, setMaxDownloads] = useState<number | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    // Clear any previous error messages
    setError(null);
    
    if (certificateIds.length === 0) {
      setError('No certificates selected');
      return;
    }

    if (isPasswordProtected && !password) {
      setError('Please enter a password');
      return;
    }

    try {
      setIsGenerating(true);
      setProgress(0);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      // Generate share link
      const shareOptions = {
        certificateIds,
        expiryDays,
        isPasswordProtected,
        password: isPasswordProtected ? password : undefined,
        maxDownloads: maxDownloads
      };
      
      const link = await generateShareLink(shareOptions);
      
      clearInterval(progressInterval);
      setProgress(100);
      setGeneratedLink(link);
      
      // Notify parent component
      onLinkGenerated(link, {
        expiryDays,
        isPasswordProtected,
        maxDownloads
      });
    } catch (err) {
      console.error('Error generating link:', err);
      setError('Failed to generate link. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setError('Failed to copy link to clipboard');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Secure Link</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Link Expiration</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
              >
                <option value={1}>24 hours</option>
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={0}>Never</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password-protection">Password Protection</Label>
                <Switch
                  id="password-protection"
                  checked={isPasswordProtected}
                  onCheckedChange={setIsPasswordProtected}
                />
              </div>
              
              {isPasswordProtected && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a secure password"
                  />
                  <p className="text-xs text-gray-500">
                    Recipients will need this password to access the certificates
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="download-limit">Download Limit</Label>
                <Switch
                  id="download-limit"
                  checked={maxDownloads !== undefined}
                  onCheckedChange={(checked) => setMaxDownloads(checked ? 5 : undefined)}
                />
              </div>
              
              {maxDownloads !== undefined && (
                <div className="space-y-2">
                  <Label htmlFor="max-downloads">Maximum Downloads</Label>
                  <Input
                    id="max-downloads"
                    type="number"
                    min={1}
                    max={100}
                    value={maxDownloads}
                    onChange={(e) => setMaxDownloads(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-gray-500">
                    Link will expire after this many downloads
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-gray-500">
                Generating secure link... {progress}%
              </p>
            </div>
          )}
          
          {generatedLink ? (
            <div className="space-y-4">
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
                  {generatedLink}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-20 p-2"
                  onClick={onShowQRCode}
                >
                  <QrCode className="h-6 w-6 mb-1" />
                  <span className="text-xs">QR Code</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-20 p-2"
                  onClick={handleCopyLink}
                >
                  <Copy className="h-6 w-6 mb-1" />
                  <span className="text-xs">Copy Link</span>
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleGenerateLink}
              disabled={isGenerating || (isPasswordProtected && !password)}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  Generate Secure Link
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SecureLinkGenerator;