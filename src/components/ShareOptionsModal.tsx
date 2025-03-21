import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Certificate } from '@/lib/types';
import { Link, Mail, Download, Printer, QrCode } from 'lucide-react';

interface ShareOptionsModalProps {
  certificate: Certificate;
  isOpen: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  onEmailShare: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onShowQRCode: () => void;
}

const ShareOptionsModal: React.FC<ShareOptionsModalProps> = ({
  certificate,
  isOpen,
  onClose,
  onCopyLink,
  onEmailShare,
  onDownload,
  onPrint,
  onShowQRCode,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Certificate</DialogTitle>
          <DialogDescription>
            Choose how you want to share "{certificate.title}"
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 p-4"
            onClick={() => {
              onCopyLink();
              onClose();
            }}
          >
            <Link className="h-8 w-8 mb-2" />
            <span>Copy Link</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 p-4"
            onClick={() => {
              onEmailShare();
              onClose();
            }}
          >
            <Mail className="h-8 w-8 mb-2" />
            <span>Email</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 p-4"
            onClick={() => {
              onDownload();
              onClose();
            }}
          >
            <Download className="h-8 w-8 mb-2" />
            <span>Download</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 p-4"
            onClick={() => {
              onPrint();
              onClose();
            }}
          >
            <Printer className="h-8 w-8 mb-2" />
            <span>Print</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 p-4 col-span-2"
            onClick={() => {
              onShowQRCode();
              onClose();
            }}
          >
            <QrCode className="h-8 w-8 mb-2" />
            <span>QR Code</span>
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareOptionsModal;
