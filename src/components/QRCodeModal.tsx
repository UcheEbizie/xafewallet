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
import { generateShareableLink } from '@/lib/share';

interface QRCodeModalProps {
  certificate: Certificate;
  qrCodeUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  certificate,
  qrCodeUrl,
  isOpen,
  onClose,
}) => {
  const shareableLink = generateShareableLink(certificate.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Certificate QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to view the certificate or share it with others.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          <img
            src={qrCodeUrl}
            alt="QR Code"
            className="w-64 h-64 object-contain"
          />
          <p className="mt-4 text-sm text-center text-gray-500 break-all">
            {shareableLink}
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={() => {
              const link = document.createElement('a');
              link.href = qrCodeUrl;
              link.download = `${certificate.title.replace(/\s+/g, '_')}_QRCode.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            Download QR Code
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal;
