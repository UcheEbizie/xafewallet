import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Download, 
  Mail, 
  Share2, 
  Clock, 
  RefreshCw,
  Loader2,
  AlertTriangle,
  Filter,
  ArrowUpDown,
  Link,
  QrCode,
  User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ShareAnalytics from './ShareAnalytics';

interface AnalyticsOverviewProps {
  userId: string;
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [refreshing, setRefreshing] = useState(false);
  
  const [analyticsData, setAnalyticsData] = useState({
    totalViews: 0,
    totalDownloads: 0,
    totalShares: 0,
    uniqueVisitors: 0,
    mostViewedCertificate: { title: '', views: 0 },
    mostDownloadedCertificate: { title: '', downloads: 0 },
    sharesByMethod: { email: 0, link: 0, qrcode: 0 },
    accessTrends: [],
    certificatePopularity: [],
    deviceBreakdown: [],
    recentShares: [],
    recentAccess: []
  });

  useEffect(() => {
    if (userId) {
      loadAnalyticsData();
    }
  }, [userId, dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get date range filter
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case 'all':
          startDate = new Date(2020, 0, 1); // Far in the past
          break;
      }
      
      // Get user's certificates
      const { data: certificates, error: certError } = await supabase
        .from('certificates')
        .select('id, title, type')
        .eq('user_id', userId);
        
      if (certError) throw certError;
      
      if (!certificates || certificates.length === 0) {
        setAnalyticsData({
          totalViews: 0,
          totalDownloads: 0,
          totalShares: 0,
          uniqueVisitors: 0,
          mostViewedCertificate: { title: '', views: 0 },
          mostDownloadedCertificate: { title: '', downloads: 0 },
          sharesByMethod: { email: 0, link: 0, qrcode: 0 },
          accessTrends: [],
          certificatePopularity: [],
          deviceBreakdown: [],
          recentShares: [],
          recentAccess: []
        });
        setLoading(false);
        return;
      }
      
      const certificateIds = certificates.map(cert => cert.id);
      
      // Get access logs for these certificates
      const { data: accessLogs, error: logsError } = await supabase
        .from('access_logs')
        .select('*, certificate_id')
        .in('certificate_id', certificateIds)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false });
        
      if (logsError) throw logsError;
      
      // Get email shares
      const { data: emailShares, error: emailError } = await supabase
        .from('email_shares')
        .select('*')
        .eq('user_id', userId)
        .gte('sent_at', startDate.toISOString())
        .order('sent_at', { ascending: false });
        
      if (emailError) throw emailError;
      
      // Get link shares
      const { data: linkShares, error: linkError } = await supabase
        .from('link_shares')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
        
      if (linkError) throw linkError;
      
      // Process data
      const logs = accessLogs || [];
      const views = logs.filter(log => log.access_type === 'view').length;
      const downloads = logs.filter(log => log.access_type === 'download').length;
      const uniqueIps = new Set(logs.map(log => log.ip_address).filter(Boolean)).size;
      
      // Calculate most viewed certificate
      const viewsByReference = {};
      logs.filter(log => log.access_type === 'view').forEach(log => {
        viewsByReference[log.certificate_id] = (viewsByReference[log.certificate_id] || 0) + 1;
      });
      
      // Calculate most downloaded certificate
      const downloadsByReference = {};
      logs.filter(log => log.access_type === 'download').forEach(log => {
        downloadsByReference[log.certificate_id] = (downloadsByReference[log.certificate_id] || 0) + 1;
      });
      
      // Find most viewed and downloaded certificates
      let mostViewedId = '';
      let mostViewedCount = 0;
      let mostDownloadedId = '';
      let mostDownloadedCount = 0;
      
      Object.entries(viewsByReference).forEach(([id, count]) => {
        if (count > mostViewedCount) {
          mostViewedId = id;
          mostViewedCount = count as number;
        }
      });
      
      Object.entries(downloadsByReference).forEach(([id, count]) => {
        if (count > mostDownloadedCount) {
          mostDownloadedId = id;
          mostDownloadedCount = count as number;
        }
      });
      
      // Get certificate titles
      const mostViewedCert = certificates.find(cert => cert.id === mostViewedId);
      const mostDownloadedCert = certificates.find(cert => cert.id === mostDownloadedId);
      
      // Calculate shares by method
      const emailShareCount = emailShares?.length || 0;
      const linkShareCount = linkShares?.length || 0;
      
      // Calculate access trends (last 7 days)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        last7Days.push({
          date: date.toISOString().split('T')[0],
          views: 0,
          downloads: 0
        });
      }
      
      logs.forEach(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        const dayData = last7Days.find(day => day.date === logDate);
        if (dayData) {
          if (log.access_type === 'view') dayData.views++;
          if (log.access_type === 'download') dayData.downloads++;
        }
      });
      
      // Calculate certificate popularity
      const certificatePopularity = certificates.map(cert => {
        const views = logs.filter(log => log.certificate_id === cert.id && log.access_type === 'view').length;
        const downloads = logs.filter(log => log.certificate_id === cert.id && log.access_type === 'download').length;
        return {
          title: cert.title,
          type: cert.type,
          views,
          downloads
        };
      }).sort((a, b) => (b.views + b.downloads) - (a.views + a.downloads));
      
      // Calculate device breakdown
      const deviceCounts = {};
      logs.forEach(log => {
        if (!log.user_agent) return;
        
        let device = 'Unknown';
        if (log.user_agent.includes('Mobile') || log.user_agent.includes('Android') || log.user_agent.includes('iPhone')) {
          device = 'Mobile';
        } else if (log.user_agent.includes('Tablet') || log.user_agent.includes('iPad')) {
          device = 'Tablet';
        } else {
          device = 'Desktop';
        }
        
        deviceCounts[device] = (deviceCounts[device] || 0) + 1;
      });
      
      const deviceBreakdown = Object.entries(deviceCounts).map(([device, count]) => ({
        device,
        count
      }));
      
      // Get recent shares (combine email and link shares)
      const recentShares = [
        ...(emailShares || []).map(share => ({
          id: share.id,
          type: 'email',
          recipients: share.recipients,
          certificateCount: share.certificate_ids?.length || 0,
          date: new Date(share.sent_at),
          status: share.status
        })),
        ...(linkShares || []).map(share => ({
          id: share.id,
          type: 'link',
          url: share.url,
          certificateCount: share.certificate_ids?.length || 0,
          date: new Date(share.created_at),
          viewCount: share.view_count || 0,
          downloadCount: share.download_count || 0,
          isRevoked: share.is_revoked
        }))
      ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
      
      // Get recent access logs
      const recentAccess = logs.slice(0, 10).map(log => {
        const cert = certificates.find(c => c.id === log.certificate_id);
        return {
          id: log.id,
          certificateTitle: cert?.title || 'Unknown Certificate',
          certificateType: cert?.type || 'Unknown',
          accessType: log.access_type,
          accessMethod: log.access_method,
          timestamp: new Date(log.timestamp),
          userAgent: log.user_agent
        };
      });
      
      // Update state with processed data
      setAnalyticsData({
        totalViews: views,
        totalDownloads: downloads,
        totalShares: emailShareCount + linkShareCount,
        uniqueVisitors: uniqueIps,
        mostViewedCertificate: { 
          title: mostViewedCert?.title || 'None', 
          views: mostViewedCount 
        },
        mostDownloadedCertificate: { 
          title: mostDownloadedCert?.title || 'None', 
          downloads: mostDownloadedCount 
        },
        sharesByMethod: { 
          email: emailShareCount, 
          link: linkShareCount, 
          qrcode: 0 // QR code shares are tracked as link shares
        },
        accessTrends: last7Days,
        certificatePopularity,
        deviceBreakdown,
        recentShares,
        recentAccess
      });
      
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getAccessTypeIcon = (type: string) => {
    switch (type) {
      case 'view':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'download':
        return <Download className="h-4 w-4 text-green-500" />;
      case 'email':
        return <Mail className="h-4 w-4 text-purple-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAccessMethodIcon = (method: string) => {
    switch (method) {
      case 'link':
        return <Link className="h-4 w-4 text-blue-500" />;
      case 'email':
        return <Mail className="h-4 w-4 text-purple-500" />;
      case 'direct':
        return <User className="h-4 w-4 text-green-500" />;
      default:
        return <Link className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDeviceFromUserAgent = (userAgent: string) => {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return 'Mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading analytics data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Share Analytics</h2>
        <div className="flex items-center space-x-2">
          <div className="bg-gray-100 p-1 rounded-full flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full px-3 py-1 ${dateRange === '7d' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setDateRange('7d')}
            >
              7 Days
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full px-3 py-1 ${dateRange === '30d' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setDateRange('30d')}
            >
              30 Days
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full px-3 py-1 ${dateRange === '90d' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setDateRange('90d')}
            >
              90 Days
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full px-3 py-1 ${dateRange === 'all' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setDateRange('all')}
            >
              All Time
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email Shares</p>
                          <p className="text-2xl font-bold">{analyticsData.sharesByMethod.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Link className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Link Shares</p>
                          <p className="text-2xl font-bold">{analyticsData.sharesByMethod.link}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <QrCode className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">QR Code Shares</p>
                          <p className="text-2xl font-bold">{analyticsData.sharesByMethod.qrcode}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <ShareAnalytics 
                      emailShares={analyticsData.sharesByMethod.email}
                      linkShares={analyticsData.sharesByMethod.link}
                      qrShares={analyticsData.sharesByMethod.qrcode}
                      showLegend={true}
                      height={300}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Shares</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.recentShares.length > 0 ? (
                    analyticsData.recentShares.map((share) => (
                      <div key={share.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              {share.type === 'email' ? (
                                <Mail className="h-4 w-4 text-blue-500 mr-2" />
                              ) : (
                                <Link className="h-4 w-4 text-purple-500 mr-2" />
                              )}
                              <p className="font-medium">
                                {share.type === 'email' 
                                  ? `Email Share (${share.recipients?.length || 0} recipients)` 
                                  : 'Link Share'}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {share.certificateCount} certificate{share.certificateCount !== 1 ? 's' : ''}
                              {share.type === 'link' && ` • ${share.viewCount || 0} views`}
                            </p>
                          </div>
                          <Badge className={share.type === 'email' && share.status === 'failed' ? 'bg-red-100 text-red-800' : ''}>
                            {formatDate(share.date)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No share history found for the selected time period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
    </div>
  );
};

export default AnalyticsOverview;