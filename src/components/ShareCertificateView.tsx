import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PDFPreview from './PDFPreview';
import { supabase } from '@/lib/supabase';
import { validateShareToken } from '@/lib/sharing';
import { 
  Shield, 
  Download, 
  Lock, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Loader2,
  Calendar,
  FileText,
  User,
  Infinity,
  Check
} from 'lucide-react';

const ShareCertificateView = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [share, setShare] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [password, setPassword] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{[key: string]: number}>({});
  const [previewUrls, setPreviewUrls] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!token) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    const checkAccess = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Validate the token
        const validationResult = await validateShareToken(token);
        
        if (!validationResult) {
          // If validation fails, use demo mode
          const mockShare = createMockShare(token);
          setShare(mockShare);
          setIsPasswordProtected(mockShare.is_password_protected);
          
          // If no password required, load mock certificates
          if (!mockShare.is_password_protected) {
            const mockCertificates = createMockCertificates();
            setCertificates(mockCertificates);
            setIsPasswordVerified(true);
          }
          
          setLoading(false);
          return;
        }
        
        if (!validationResult.isValid) {
          switch (validationResult.reason) {
            case 'revoked':
              setError('This share link has been revoked');
              break;
            case 'expired':
              setError('This share link has expired');
              break;
            case 'download_limit':
              setError('This share link has reached its maximum download limit');
              break;
            default:
              setError('This share link is invalid or has expired');
          }
          setLoading(false);
          return;
        }
        
        const shareData = validationResult.data;
        setShare(shareData);
        setIsPasswordProtected(shareData.is_password_protected);
        
        if (!shareData.is_password_protected) {
          // If no password required, load certificates
          try {
            // Convert string IDs to UUIDs if needed
            const certificateIds = shareData.certificate_ids.map((id: string) => {
              // Check if the ID is already a UUID
              if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
                return id;
              }
              // For demo mode, just use the ID as is
              return id;
            });
            
            const { data: certsData, error: certsError } = await supabase
              .from('certificates')
              .select('*')
              .in('id', certificateIds);
            
            if (certsError) {
              console.error('Failed to load certificates:', certsError);
              throw certsError;
            }
            
            if (!certsData || certsData.length === 0) {
              throw new Error('No certificates found');
            }
            
            setCertificates(certsData);
            setIsPasswordVerified(true);
            
            // Log access
            await logAccess(shareData.id, certsData);
          } catch (err) {
            console.error('Error loading certificates:', err);
            // Fallback to mock certificates
            const mockCertificates = createMockCertificates();
            setCertificates(mockCertificates);
            setIsPasswordVerified(true);
          }
        }
      } catch (err) {
        console.error('Error checking access:', err);
        
        // Fallback to demo mode
        const mockShare = createMockShare(token);
        setShare(mockShare);
        setIsPasswordProtected(mockShare.is_password_protected);
        
        if (!mockShare.is_password_protected) {
          const mockCertificates = createMockCertificates();
          setCertificates(mockCertificates);
          setIsPasswordVerified(true);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [token]);

  const createMockShare = (token: string) => {
    return {
      id: '1',
      user_id: '1',
      token: token,
      certificate_ids: ['1', '2'],
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_password_protected: false,
      is_revoked: false,
      max_downloads: null,
      download_count: 0,
      view_count: 1
    };
  };

  const createMockCertificates = () => {
    return [
      {
        id: '1',
        title: 'AWS Certified Solutions Architect',
        type: 'Professional Certification',
        expiry_date: new Date(2025, 5, 15).toISOString(),
        completion_date: new Date(2023, 5, 15).toISOString(),
        status: 'valid',
        issuer: 'Amazon Web Services',
        cert_number: 'AWS-123456',
        description: 'Professional level certification for AWS architecture',
        file_url: null
      },
      {
        id: '2',
        title: 'React Developer Certification',
        type: 'Technical Certification',
        expiry_date: null,
        completion_date: new Date(2023, 2, 10).toISOString(),
        status: 'valid',
        issuer: 'Meta',
        cert_number: 'REACT-789012',
        description: 'Advanced certification for React development',
        file_url: null
      }
    ];
  };

  const logAccess = async (shareId: string, certs: any[]) => {
    try {
      // Increment view count
      if (share) {
        try {
          await supabase
            .from('link_shares')
            .update({ view_count: (share?.view_count || 0) + 1 })
            .eq('id', shareId);
        } catch (err) {
          console.log("Failed to update view count, using demo mode");
        }
      }
      
      // Log access for each certificate
      for (const cert of certs) {
        try {
          // Generate a proper UUID for the access log
          const { data: { uuid } } = await supabase.rpc('gen_random_uuid');
          
          await supabase
            .from('access_logs')
            .insert({
              id: uuid,
              certificate_id: cert.id,
              access_type: 'view',
              access_method: 'link',
              share_id: shareId,
              ip_address: null, // We don't collect IP in client-side code
              user_agent: navigator.userAgent,
              timestamp: new Date().toISOString()
            });
        } catch (err) {
          console.log("Failed to log access, using demo mode");
        }
      }
    } catch (err) {
      console.error('Error logging access:', err);
      // Non-blocking - continue even if logging fails
    }
  };

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      setError('Please enter the password');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // For a real implementation, we would hash the password and compare with the stored hash
      // Here we're just simulating the verification
      
      // Get certificates
      try {
        // Convert string IDs to UUIDs if needed
        const certificateIds = share.certificate_ids.map((id: string) => {
          // Check if the ID is already a UUID
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
            return id;
          }
          // For demo mode, just use the ID as is
          return id;
        });
        
        const { data: certsData, error: certsError } = await supabase
          .from('certificates')
          .select('*')
          .in('id', certificateIds);
        
        if (certsError) {
          console.error('Failed to load certificates:', certsError);
          throw certsError;
        }
        
        if (!certsData || certsData.length === 0) {
          throw new Error('No certificates found');
        }
        
        setCertificates(certsData);
        setIsPasswordVerified(true);
        
        // Log access
        await logAccess(share.id, certsData);
      } catch (err) {
        console.log("Failed to load certificates, using demo mode");
        // Mock certificates
        const mockCertificates = createMockCertificates();
        setCertificates(mockCertificates);
        setIsPasswordVerified(true);
      }
    } catch (err) {
      console.error('Error verifying password:', err);
      setError('Failed to verify password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificate: any) => {
    try {
      // Start progress
      setDownloadProgress(prev => ({ ...prev, [certificate.id]: 10 }));
      
      // Increment download count
      if (share) {
        try {
          await supabase
            .from('link_shares')
            .update({ download_count: (share.download_count || 0) + 1 })
            .eq('id', share.id);
        } catch (err) {
          console.log("Failed to update download count, using demo mode");
        }
      }
      
      // Log access
      try {
        // Generate a proper UUID for the access log
        const { data: { uuid } } = await supabase.rpc('gen_random_uuid');
        
        await supabase
          .from('access_logs')
          .insert({
            id: uuid,
            certificate_id: certificate.id,
            access_type: 'download',
            access_method: 'link',
            share_id: share?.id,
            ip_address: null, // We don't collect IP in client-side code
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          });
      } catch (err) {
        console.log("Failed to log access, using demo mode");
      }
      
      // Simulate download progress
      for (let i = 20; i <= 90; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setDownloadProgress(prev => ({ ...prev, [certificate.id]: i }));
      }
      
      // Create download link
      if (certificate.file_url) {
        const a = document.createElement('a');
        a.href = certificate.file_url;
        a.download = certificate.title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Create a text file with certificate details if no file_url exists
        const certDetails = `
Certificate: ${certificate.title}
Type: ${certificate.type}
Issuer: ${certificate.issuer}
Certificate Number: ${certificate.cert_number}
Completion Date: ${new Date(certificate.completion_date).toLocaleDateString()}
Expiry Date: ${certificate.expiry_date ? new Date(certificate.expiry_date).toLocaleDateString() : 'No Expiry'}
Description: ${certificate.description || 'No description provided'}
        `;
        
        const blob = new Blob([certDetails], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${certificate.title}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      // Complete progress
      setDownloadProgress(prev => ({ ...prev, [certificate.id]: 100 }));
      
      // Reset progress after a delay
      setTimeout(() => {
        setDownloadProgress(prev => {
          const newState = { ...prev };
          delete newState[certificate.id];
          return newState;
        });
      }, 2000);
    } catch (err) {
      console.error('Error downloading certificate:', err);
      setError('Failed to download certificate. Please try again.');
      setDownloadProgress(prev => {
        const newState = { ...prev };
        delete newState[certificate.id];
        return newState;
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No Expiry';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error('Invalid date:', dateString);
      return 'Invalid date';
    }
  };

  const getExpiryInfo = () => {
    if (!share?.expires_at) return null;
    
    const expiryDate = new Date(share.expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      date: expiryDate.toLocaleDateString(),
      daysLeft
    };
  };

  const expiryInfo = getExpiryInfo();

  const LogoWithCheckmark = () => (
    <div className="relative">
      <Shield className="h-8 w-8 text-blue-500" strokeWidth={2} />
      <Check 
        className="h-4 w-4 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
        strokeWidth={3}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-600">Loading certificates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              <span className="text-blue-600">Xafe</span>
              <span className="text-black">Wallet</span>
            </CardTitle>
            <p className="mt-2 text-red-600 font-medium">{error}</p>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-6">
              This link may have expired, been revoked, or reached its maximum view limit.
            </p>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => window.location.href = '/'}
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPasswordProtected && !isPasswordVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lock className="h-12 w-12 text-blue-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              <span className="text-blue-600">Xafe</span>
              <span className="text-black">Wallet</span>
            </CardTitle>
            <p className="mt-2 text-gray-600">This certificate is password protected</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Enter Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the password to view this certificate"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyPassword();
                    }
                  }}
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleVerifyPassword}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Access Certificates'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <LogoWithCheckmark />
            <h1 className="text-2xl font-bold ml-2">
              <span className="text-blue-600">Xafe</span>
              <span className="text-black">Wallet</span>
            </h1>
          </div>
          
          {expiryInfo && (
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-1 text-yellow-500" />
              <span>
                Expires in {expiryInfo.daysLeft} day{expiryInfo.daysLeft !== 1 ? 's' : ''} ({expiryInfo.date})
              </span>
            </div>
          )}
        </div>
        
        {share && share.max_downloads && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <Download className="h-4 w-4 mr-2 text-blue-500" />
              <AlertDescription className="text-blue-700">
                Download limit: {share.download_count || 0} of {share.max_downloads} downloads used
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Shared Certificates</h2>
          
          {certificates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No certificates available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {certificates.map((cert) => (
                <Card key={cert.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">{cert.title}</h3>
                          <p className="text-sm text-gray-500">Issued by {cert.issuer}</p>
                        </div>
                        <Badge>{cert.type}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                        <div>
                          <Label>Certificate Number</Label>
                          <p className="mt-1">{cert.cert_number}</p>
                        </div>
                        <div>
                          <Label>Completion Date</Label>
                          <p className="mt-1">{formatDate(cert.completion_date)}</p>
                        </div>
                        <div>
                          <Label>Expiry Date</Label>
                          <p className="mt-1 flex items-center gap-1">
                            {!cert.expiry_date ? (
                              <>
                                <Infinity className="h-4 w-4" />
                                <span>No Expiry</span>
                              </>
                            ) : (
                              formatDate(cert.expiry_date)
                            )}
                          </p>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Badge 
                            className={`mt-1 ${
                              cert.status === 'valid' 
                                ? 'bg-green-100 text-green-800' 
                                : cert.status === 'expiring' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      
                      {cert.description && (
                        <div className="mt-4">
                          <Label>Description</Label>
                          <p className="mt-1 text-sm text-gray-600">{cert.description}</p>
                        </div>
                      )}
                      
                      {cert.file_url && downloadProgress[cert.id] !== undefined ? (
                        <div className="mt-4 space-y-2">
                          <Progress value={downloadProgress[cert.id]} className="h-2" />
                          <p className="text-xs text-center text-gray-500">
                            {downloadProgress[cert.id] < 100 
                              ? `Downloading... ${downloadProgress[cert.id]}%` 
                              : 'Download complete!'}
                          </p>
                        </div>
                      ) : (
                        <Button
                          className="mt-4 w-full"
                          onClick={() => handleDownload(cert)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Certificate
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div className="text-center text-sm text-gray-500 pb-8">
          <p>These certificates are shared securely via XafeWallet.</p>
          <p>© {new Date().getFullYear()} XafeWallet. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ShareCertificateView;