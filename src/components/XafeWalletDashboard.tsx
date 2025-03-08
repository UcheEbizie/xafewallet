import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import EnhancedSharingInterface from './EnhancedSharingInterface';
import FileUploadHandler from './FileUploadHandler';
import ProfileSection from './ProfileSection';
import SettingsSection from './SettingsSection';
import AccessLogsPanel from './AccessLogsPanel';
import AnalyticsOverview from './analytics/AnalyticsOverview';
import PDFPreview from './PDFPreview';
import { database } from '@/lib/database';
import { Certificate, Profile, Settings } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  Shield, 
  Plus, 
  Share2, 
  Search,
  Trash2,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  Settings as SettingsIcon,
  Infinity,
  Loader2,
  BarChart,
  User
} from 'lucide-react';

const XafeWalletDashboard = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({
    id: '',
    name: 'User Name',
    position: 'Position'
  });
  const [settings, setSettings] = useState<Settings>({
    id: '',
    user_id: '',
    email_notifications: true,
    push_notifications: true,
    expiry_reminders_days: 30,
    auto_renewal_reminders: true
  });
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showEnhancedSharingDialog, setShowEnhancedSharingDialog] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
  });
  const [sortConfig, setSortConfig] = useState({
    key: '',
    direction: 'asc'
  });
  const [activeTab, setActiveTab] = useState('certificates');
  const [previewUrl, setPreviewUrl] = useState(null);

  const [newCertificate, setNewCertificate] = useState({
    title: '',
    type: '',
    expiryDate: new Date().toISOString().split('T')[0],
    completionDate: new Date().toISOString().split('T')[0],
    issuer: '',
    certNumber: '',
    description: '',
    file: null,
    noExpiry: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load profile
      const userProfile = await database.profiles.get();
      setProfile(userProfile);
      
      // Load settings
      const userSettings = await database.settings.get();
      setSettings(userSettings);
      
      // Load certificates
      const userCertificates = await database.certificates.list();
      setCertificates(userCertificates);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Using demo mode with sample data.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (newProfile: Partial<Profile>) => {
    try {
      // Update profile in database
      const updatedProfile = await database.profiles.upsert(newProfile);
      
      // Update local state
      setProfile(prev => ({ ...prev, ...updatedProfile }));
      
      return updatedProfile;
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  const handleSettingsUpdate = async (newSettings: Partial<Settings>) => {
    try {
      // Update settings in database
      const updatedSettings = await database.settings.upsert(newSettings);
      
      // Update local state
      setSettings(prev => ({ ...prev, ...updatedSettings }));
      
      return updatedSettings;
    } catch (err) {
      setError('Failed to update settings. Please try again.');
      console.error('Error updating settings:', err);
      throw err;
    }
  };

  const handleCardClick = (cert) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedCertificate(cert);
    if (cert.file) {
      setPreviewUrl(URL.createObjectURL(cert.file));
    }
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileUploaded = (file) => {
    setNewCertificate(prev => ({
      ...prev,
      file: file
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid':
        return 'bg-green-500';
      case 'expiring':
        return 'bg-yellow-500';
      case 'expired':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No Expiry';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      console.error('Invalid date:', dateString);
      return 'Invalid date';
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortCertificates = (certs) => {
    if (!sortConfig.key) return certs;

    return [...certs].sort((a, b) => {
      if (sortConfig.key === 'title' || sortConfig.key === 'type') {
        const comparison = a[sortConfig.key].localeCompare(b[sortConfig.key]);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      } else if (sortConfig.key === 'expiryDate' || sortConfig.key === 'completionDate') {
        // Handle null expiry dates for no-expiry certificates
        if (sortConfig.key === 'expiryDate') {
          if (a.noExpiry && b.noExpiry) return 0;
          if (a.noExpiry) return sortConfig.direction === 'asc' ? 1 : -1;
          if (b.noExpiry) return sortConfig.direction === 'asc' ? -1 : 1;
        }
        const dateA = new Date(a[sortConfig.key]);
        const dateB = new Date(b[sortConfig.key]);
        return sortConfig.direction === 'asc' 
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }
      return 0;
    });
  };

  const uniqueTypes = [...new Set(certificates.map(cert => cert.type))];
  const uniqueStatuses = [...new Set(certificates.map(cert => cert.status))];

  const filteredCertificates = sortCertificates(certificates.filter(cert => {
    const matchesSearch = cert.title.toLowerCase().includes(searchQuery) ||
      cert.type.toLowerCase().includes(searchQuery) ||
      cert.issuer.toLowerCase().includes(searchQuery);

    const matchesType = !filters.type || cert.type === filters.type;
    const matchesStatus = !filters.status || cert.status === filters.status;

    return matchesSearch && matchesType && matchesStatus;
  }));

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      // Validate required fields
      if (!newCertificate.title || !newCertificate.type || !newCertificate.issuer || !newCertificate.certNumber) {
        setError('Please fill in all required fields');
        return;
      }
      
      // Ensure dates are valid
      if (!newCertificate.completionDate) {
        setError('Completion date is required');
        return;
      }
      
      // Determine status based on expiry date
      let status = 'valid';
      if (!newCertificate.noExpiry && newCertificate.expiryDate) {
        status = new Date(newCertificate.expiryDate) > new Date() ? 'valid' : 'expired';
      }

      // Upload file if provided
      let fileUrl = null;
      if (newCertificate.file) {
        fileUrl = await database.certificates.uploadFile(newCertificate.file);
      }

      // Create certificate in database
      const newCert = await database.certificates.create({
        title: newCertificate.title,
        type: newCertificate.type,
        expiry_date: newCertificate.noExpiry ? null : newCertificate.expiryDate,
        completion_date: newCertificate.completionDate,
        status,
        issuer: newCertificate.issuer,
        cert_number: newCertificate.certNumber,
        description: newCertificate.description,
        file_url: fileUrl
      });
      
      // Add file to certificate for UI display
      if (newCertificate.file) {
        newCert.file = newCertificate.file;
      }
      
      // Update local state
      setCertificates(prev => [newCert, ...prev]);
      setShowUploadDialog(false);
      
      // Reset form with default dates
      setNewCertificate({
        title: '',
        type: '',
        expiryDate: new Date().toISOString().split('T')[0],
        completionDate: new Date().toISOString().split('T')[0],
        issuer: '',
        certNumber: '',
        description: '',
        file: null,
        noExpiry: false
      });
    } catch (err) {
      setError('Failed to upload certificate. Please try again.');
      console.error('Error uploading certificate:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Delete certificate from database
      await database.certificates.delete(id);
      
      // Update local state
      setCertificates(prev => prev.filter(cert => cert.id !== id));
      setSelectedCertificate(null);
    } catch (err) {
      setError('Failed to delete certificate. Please try again.');
      console.error('Error deleting certificate:', err);
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const LogoWithCheckmark = () => (
    <div className="relative">
      <Shield className="h-8 w-8 text-blue-500" strokeWidth={2} />
      <Check 
        className="h-4 w-4 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
        strokeWidth={3}
      />
    </div>
  );

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-600">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="text-blue-600">Xafe</span>
            <span className="text-black">Wallet</span>
          </h1>
          <p className="text-gray-500">Your Digital Safety Portfolio</p>
        </div>
        <LogoWithCheckmark />
      </div>

      <ProfileSection 
        profile={profile} 
        onProfileUpdate={handleProfileUpdate} 
      />

      <div className="flex space-x-2 border-b">
        <Button
          variant={activeTab === 'certificates' ? 'default' : 'ghost'}
          className="rounded-none border-b-2 border-transparent px-4"
          onClick={() => setActiveTab('certificates')}
        >
          Certificates
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'ghost'}
          className="rounded-none border-b-2 border-transparent px-4"
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart className="h-4 w-4 mr-2" />
          Analytics
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'default' : 'ghost'}
          className="rounded-none border-b-2 border-transparent px-4"
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {activeTab === 'certificates' ? (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search certificates..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                onChange={handleSearch}
                value={searchQuery}
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowFilterDialog(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('title')}
              className="flex items-center gap-1"
            >
              Title {getSortIcon('title')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('type')}
              className="flex items-center gap-1"
            >
              Type {getSortIcon('type')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('completionDate')}
              className="flex items-center gap-1"
            >
              Completion {getSortIcon('completionDate')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('expiryDate')}
              className="flex items-center gap-1"
            >
              Expiry {getSortIcon('expiryDate')}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              className="flex items-center justify-center gap-2"
              onClick={() => setShowUploadDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Add New
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center gap-2"
              onClick={() => setShowEnhancedSharingDialog(true)}
            >
              <Share2 className="h-4 w-4" />
              Share Certificates
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Certificates</h2>
            {filteredCertificates.map((cert) => (
              <Card 
                key={cert.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCardClick(cert)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{cert.title}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {cert.type}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(cert.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      {cert.expiry_date === null ? (
                        <>
                          <Infinity className="h-4 w-4" />
                          <span>No Expiry</span>
                        </>
                      ) : (
                        <>Expires: {formatDate(cert.expiry_date)}</>
                      )}
                    </div>
                    <Badge className={`${getStatusColor(cert.status)} text-white`}>
                      {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : activeTab === 'analytics' ? (
        <AnalyticsOverview userId={user?.id || ''} />
      ) : (
        <SettingsSection 
          settings={settings}
          onSettingsUpdate={handleSettingsUpdate}
          userEmail={user?.email || "user@example.com"}
          onSignOut={handleSignOut}
        />
      )}

      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Certificates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Certificate Type</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({ type: '', status: '' });
                  setShowFilterDialog(false);
                }}
              >
                Reset
              </Button>
              <Button onClick={() => setShowFilterDialog(false)}>Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Upload New Certificate</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="flex-1 overflow-y-auto pr-6 -mr-6">
            <div className="space-y-4">
              <FileUploadHandler onFileUploaded={handleFileUploaded} />
              
              <div className="space-y-2">
                <Label htmlFor="title">Certificate Title</Label>
                <Input
                  id="title"
                  required
                  value={newCertificate.title}
                  onChange={(e) => setNewCertificate({...newCertificate, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  required
                  value={newCertificate.type}
                  onChange={(e) => setNewCertificate({...newCertificate, type: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="completionDate">Completion Date</Label>
                <Input
                  id="completionDate"
                  type="date"
                  required
                  value={newCertificate.completionDate}
                  onChange={(e) => setNewCertificate({...newCertificate, completionDate: e.target.value})}
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="noExpiry">No Expiry Date</Label>
                  <Switch
                    id="noExpiry"
                    checked={newCertificate.noExpiry}
                    onCheckedChange={(checked) => setNewCertificate({
                      ...newCertificate,
                      noExpiry: checked,
                      expiryDate: checked ? null : newCertificate.expiryDate || new Date().toISOString().split('T')[0]
                    })}
                  />
                </div>
                {!newCertificate.noExpiry && (
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      type="date"
                      value={newCertificate.expiryDate}
                      onChange={(e) => setNewCertificate({...newCertificate, expiryDate: e.target.value})}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer</Label>
                <Input
                  id="issuer"
                  required
                  value={newCertificate.issuer}
                  onChange={(e) => setNewCertificate({...newCertificate, issuer: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certNumber">Certificate Number</Label>
                <Input
                  id="certNumber"
                  required
                  value={newCertificate.certNumber}
                  onChange={(e) => setNewCertificate({...newCertificate, certNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newCertificate.description}
                  onChange={(e) => setNewCertificate({...newCertificate, description: e.target.value})}
                />
              </div>
            </div>
          </form>
          <DialogFooter className="flex justify-end gap-2 mt-6 border-t pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleUpload}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={!!selectedCertificate} 
        onOpenChange={(open) => {
          if (!open) {
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }
            setSelectedCertificate(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Certificate Details</DialogTitle>
          </DialogHeader>
          {selectedCertificate && (
            <div className="space-y-4">
              {selectedCertificate.file && previewUrl && (
                <>
                  {selectedCertificate.file.type.startsWith('image/') ? (
                    <div className="relative w-full aspect-video bg-gray-50 rounded-lg overflow-hidden">
                      <img
                        src={previewUrl}
                        alt={selectedCertificate.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : selectedCertificate.file.type === 'application/pdf' && (
                    <PDFPreview file={previewUrl} />
                  )}
                </>
              )}
              <div className="space-y-2">
                <Label>Title</Label>
                <p className="text-sm">{selectedCertificate.title}</p>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <p className="text-sm">{selectedCertificate.type}</p>
              </div>
              <div className="space-y-2">
                <Label>Completion Date</Label>
                <p className="text-sm">{formatDate(selectedCertificate.completion_date)}</p>
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <p className="text-sm flex items-center gap-2">
                  {selectedCertificate.expiry_date === null ? (
                    <>
                      <Infinity className="h-4 w-4" />
                      <span>No Expiry</span>
                    </>
                  ) : (
                    formatDate(selectedCertificate.expiry_date)
                  )}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Issuer</Label>
                <p className="text-sm">{selectedCertificate.issuer}</p>
              </div>
              <div className="space-y-2">
                <Label>Certificate Number</Label>
                <p className="text-sm">{selectedCertificate.cert_number}</p>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <p className="text-sm">{selectedCertificate.description}</p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Badge className={`${getStatusColor(selectedCertificate.status)} text-white`}>
                  {selectedCertificate.status.charAt(0).toUpperCase() + selectedCertificate.status.slice(1)}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEnhancedSharingDialog} onOpenChange={setShowEnhancedSharingDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Share Certificates</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            <EnhancedSharingInterface
              certificates={certificates}
              profile={profile}
              onClose={() => setShowEnhancedSharingDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default XafeWalletDashboard;