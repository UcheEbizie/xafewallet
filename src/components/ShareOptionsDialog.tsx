import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  QrCode, 
  Link, 
  Mail, 
  Code, 
  Download, 
  Share2,
  FileText,
  Smartphone,
  Globe,
  Printer
} from 'lucide-react';

interface ShareOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface ShareOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: string) => void;
}

const ShareOptionsDialog: React.FC<ShareOptionsDialogProps> = ({
  isOpen,
  onClose,
  onSelectOption
}) => {
  const shareOptions: ShareOption[] = [
    {
      id: 'link',
      title: 'Secure Link',
      description: 'Generate a secure link with optional password protection',
      icon: <Link className="h-6 w-6 text-blue-500" />
    },
    {
      id: 'qrcode',
      title: 'QR Code',
      description: 'Create a QR code for easy mobile scanning',
      icon: <QrCode className="h-6 w-6 text-purple-500" />
    },
    {
      id: 'email',
      title: 'Email',
      description: 'Send certificates directly via email',
      icon: <Mail className="h-6 w-6 text-green-500" />
    },
    {
      id: 'embed',
      title: 'Embed Code',
      description: 'Get code to embed on websites or portfolios',
      icon: <Code className="h-6 w-6 text-yellow-500" />
    },
    {
      id: 'download',
      title: 'Download',
      description: 'Download certificates with watermark',
      icon: <Download className="h-6 w-6 text-red-500" />
    },
    {
      id: 'print',
      title: 'Print',
      description: 'Print certificates with verification details',
      icon: <Printer className="h-6 w-6 text-gray-500" />
    }
  ];

  const handleSelectOption =
}