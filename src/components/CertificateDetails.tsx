import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Edit, Trash2, Calendar, RefreshCw, RotateCw, Share } from 'lucide-react';
import { format } from 'date-fns';
import PDFPreview from './PDFPreview';
import { database } from '@/lib/database';
import { Certificate } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '../components/ui/use-toast';
import { copyToClipboard, downloadCertificate, printCertificate, showQRCode, generateShareableLink } from '@/lib/share';
import { logAccess } from '@/lib/analytics';
import QRCodeModal from './QRCodeModal';
import EmailShareModal from './EmailShareModal';
import ShareOptionsModal from './ShareOptionsModal';

const CertificateDetails = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Share modals state
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isShareOptionsModalOpen, setIsShareOptionsModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!certificateId) {
          throw new Error('Certificate ID is required');
        }

        console.log('Loading certificate with ID:', certificateId);
        const cert = await database.certificates.getById(certificateId);
        
        console.log('Fetched certificate details:', cert);
        
        if (!cert) {
          console.error('Certificate not found for ID:', certificateId);
          setError('Certificate not found');
          return;
        }

        console.log('Certificate loaded successfully:', cert);
        if (cert.file_url) {
          console.log('Certificate has file_url:', cert.file_url);
        } else {
          console.warn('Certificate does not have a file_url');
        }
        
        setCertificate(cert);
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError('Failed to load certificate details');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No Expiry Date';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      console.error('Invalid date:', dateString);
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const handleDelete = async () => {
    if (!certificate) return;
    
    try {
      await database.certificates.delete(certificate.id);
      toast({
        title: 'Certificate Deleted',
        description: 'The certificate has been successfully deleted',
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting certificate:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete certificate',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = () => {
    if (!certificate) return;
    navigate(`/edit-certificate/${certificate.id}`);
  };

  const handleRenew = () => {
    if (!certificate) return;
    navigate(`/renew-certificate/${certificate.id}`);
  };

  const handleCopyLink = async () => {
    if (!certificate) return;
    
    try {
      const link = generateShareableLink(certificate.id);
      await copyToClipboard(link);
      
      toast({
        title: 'Link Copied',
        description: 'Certificate link copied to clipboard',
      });
      
      logAccess({
        certificate_id: certificate.id,
        access_type: 'view',
        access_method: 'link'
      });
    } catch (err) {
      console.error('Error copying link:', err);
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleEmailShare = () => {
    if (!certificate) return;
    setIsEmailModalOpen(true);
    
    logAccess({
      certificate_id: certificate.id,
      access_type: 'view',
      access_method: 'email'
    });
  };

  const handleDownload = async () => {
    if (!certificate) return;
    
    try {
      await downloadCertificate(certificate);
      
      toast({
        title: 'Download Started',
        description: 'Certificate download has started',
      });
      
      logAccess({
        certificate_id: certificate.id,
        access_type: 'download',
        access_method: 'direct'
      });
    } catch (err) {
      console.error('Error downloading certificate:', err);
      toast({
        title: 'Error',
        description: 'Failed to download certificate',
        variant: 'destructive',
      });
    }
  };

  const handlePrint = async () => {
    if (!certificate) return;
    
    try {
      await printCertificate(certificate);
      
      toast({
        title: 'Print Prepared',
        description: 'Certificate print dialog opened',
      });
      
      logAccess({
        certificate_id: certificate.id,
        access_type: 'view',
        access_method: 'direct'
      });
    } catch (err) {
      console.error('Error printing certificate:', err);
      toast({
        title: 'Error',
        description: 'Failed to print certificate',
        variant: 'destructive',
      });
    }
  };

  const handleShowQRCode = async () => {
    if (!certificate) return;
    
    try {
      const qrUrl = await showQRCode(certificate);
      setQrCodeUrl(qrUrl);
      setIsQRCodeModalOpen(true);
      
      logAccess({
        certificate_id: certificate.id,
        access_type: 'view',
        access_method: 'link'
      });
    } catch (err) {
      console.error('Error generating QR code:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate QR code',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading certificate details...</p>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error || 'Certificate not found'}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/dashboard')} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      {/* Back button */}
      <Button onClick={() => navigate('/dashboard')} variant="ghost" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      {/* Certificate Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{certificate.title}</h1>
              <p className="text-blue-100">{certificate.issuer}</p>
            </div>
            <Badge className={getStatusColor(certificate.status)}>
              {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
            </Badge>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="grid md:grid-cols-1 gap-6">
            {/* Certificate Image/Preview */}
            <div className="aspect-video bg-gradient-to-br from-blue-200 via-purple-200 to-cyan-200 p-6 relative">
              {certificate.file_url ? (
                certificate.file_url.toLowerCase().endsWith('.pdf') ? (
                  <PDFPreview file={certificate.file_url} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src={certificate.file_url}
                      alt={certificate.title}
                      className="max-w-full max-h-full object-contain"
                      onLoad={() => console.log('Certificate image loaded successfully:', certificate.file_url)}
                      onError={() => {
                        console.error('Failed to load certificate image:', certificate.file_url);
                        // Don't show any fallback, just log the error
                      }}
                    />
                  </div>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 font-medium">No certificate image available</p>
                    <p className="text-sm text-gray-400 mt-2">Upload a certificate image when creating a certificate</p>
                  </div>
                </div>
              )}
            </div>

            {/* Certificate Details */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <Label className="text-sm text-gray-500 block mb-1">Completion Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(certificate.completion_date)}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-500 block mb-1">Expiry Date</Label>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(certificate.expiry_date)}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-500 block mb-1">Certificate Type</Label>
                  <p>{certificate.type}</p>
                </div>

                <div>
                  <Label className="text-sm text-gray-500 block mb-1">Certificate Number</Label>
                  <p>{certificate.cert_number}</p>
                </div>

                <div className="col-span-2">
                  <Label className="text-sm text-gray-500 block mb-1">Description</Label>
                  <p className="text-gray-700">{certificate.description}</p>
                </div>
              </div>

              {/* Share Actions */}
              <div className="mt-8">
                <h3 className="font-medium mb-4">Share Certificate</h3>
                <Separator className="mb-4" />
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setIsShareOptionsModalOpen(true)}
                >
                  <Share className="h-4 w-4 mr-2" />
                  Share Certificate
                </Button>
              </div>
              
              {/* Certificate Management Actions */}
              <div className="mt-8">
                <h3 className="font-medium mb-4">Certificate Management</h3>
                <Separator className="mb-4" />
                
                <div className="grid grid-cols-3 gap-3">
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Certificate
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRenew}>
                    <RotateCw className="h-4 w-4 mr-2" />
                    Renew Certificate
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Certificate
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {certificate && (
        <>
          <QRCodeModal 
            certificate={certificate}
            qrCodeUrl={qrCodeUrl}
            isOpen={isQRCodeModalOpen}
            onClose={() => setIsQRCodeModalOpen(false)}
          />

          <EmailShareModal 
            certificate={certificate}
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
          />

          <ShareOptionsModal
            certificate={certificate}
            isOpen={isShareOptionsModalOpen}
            onClose={() => setIsShareOptionsModalOpen(false)}
            onCopyLink={handleCopyLink}
            onEmailShare={handleEmailShare}
            onDownload={handleDownload}
            onPrint={handlePrint}
            onShowQRCode={handleShowQRCode}
          />
        </>
      )}
    </div>
  );
};

export default CertificateDetails;
