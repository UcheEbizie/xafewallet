import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Eye, 
  Download, 
  Mail, 
  Clock, 
  Search,
  User,
  Globe,
  Smartphone,
  ArrowUpDown,
  FileText,
  Loader2
} from 'lucide-react';

interface AccessLog {
  id: string;
  certificate_id: string;
  access_type: 'view' | 'download' | 'email';
  access_method: 'link' | 'email' | 'direct';
  ip_address?: string;
  user_agent?: string;
  recipient_email?: string;
  share_id?: string;
  timestamp: string;
  certificate?: {
    title: string;
    type: string;
  };
}

interface AccessLogsPanelProps {
  certificateId?: string;
}

const AccessLogsPanel: React.FC<AccessLogsPanelProps> = ({ certificateId }) => {
  const [logs, setLogs] = useState<AccessLog[]>([
    {
      id: '1',
      certificate_id: '1',
      access_type: 'view',
      access_method: 'link',
      timestamp: new Date().toISOString(),
      certificate: {
        title: 'AWS Certified Solutions Architect',
        type: 'Professional Certification'
      }
    },
    {
      id: '2',
      certificate_id: '1',
      access_type: 'download',
      access_method: 'link',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      certificate: {
        title: 'AWS Certified Solutions Architect',
        type: 'Professional Certification'
      }
    },
    {
      id: '3',
      certificate_id: '2',
      access_type: 'email',
      access_method: 'email',
      recipient_email: 'colleague@example.com',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      certificate: {
        title: 'React Developer Certification',
        type: 'Technical Certification'
      }
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'timestamp',
    direction: 'desc'
  });
  const [stats, setStats] = useState({
    totalViews: 2,
    totalDownloads: 1,
    totalEmails: 1,
    uniqueVisitors: 2
  });

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortLogs = (logsToSort: AccessLog[]) => {
    return [...logsToSort].sort((a, b) => {
      if (sortConfig.key === 'timestamp') {
        return sortConfig.direction === 'asc'
          ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      
      if (sortConfig.key === 'access_type' || sortConfig.key === 'access_method') {
        return sortConfig.direction === 'asc'
          ? a[sortConfig.key].localeCompare(b[sortConfig.key])
          : b[sortConfig.key].localeCompare(a[sortConfig.key]);
      }
      
      if (sortConfig.key === 'certificate') {
        const titleA = a.certificate?.title || '';
        const titleB = b.certificate?.title || '';
        return sortConfig.direction === 'asc'
          ? titleA.localeCompare(titleB)
          : titleB.localeCompare(titleA);
      }
      
      return 0;
    });
  };

  const filteredLogs = sortLogs(logs.filter(log => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      log.certificate?.title?.toLowerCase().includes(query) ||
      log.access_type.toLowerCase().includes(query) ||
      log.access_method.toLowerCase().includes(query) ||
      log.recipient_email?.toLowerCase().includes(query) ||
      log.ip_address?.toLowerCase().includes(query)
    );
  }));

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
        return <Globe className="h-4 w-4 text-blue-500" />;
      case 'email':
        return <Mail className="h-4 w-4 text-purple-500" />;
      case 'direct':
        return <User className="h-4 w-4 text-green-500" />;
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-2 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Views</p>
                  <p className="text-2xl font-bold">{stats.totalViews}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-2 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Download className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Downloads</p>
                  <p className="text-2xl font-bold">{stats.totalDownloads}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-2 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email Shares</p>
                  <p className="text-2xl font-bold">{stats.totalEmails}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-2 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Unique Visitors</p>
                  <p className="text-2xl font-bold">{stats.uniqueVisitors}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search access logs..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {}}
        >
          Refresh
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('timestamp')}>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Time {getSortIcon('timestamp')}</span>
                </div>
              </th>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('certificate')}>
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>Certificate {getSortIcon('certificate')}</span>
                </div>
              </th>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('access_type')}>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>Action {getSortIcon('access_type')}</span>
                </div>
              </th>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('access_method')}>
                <div className="flex items-center space-x-1">
                  <Globe className="h-4 w-4" />
                  <span>Method {getSortIcon('access_method')}</span>
                </div>
              </th>
              <th className="px-6 py-3">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>Recipient</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {log.certificate?.title || 'Unknown Certificate'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.certificate?.type && (
                            <Badge variant="outline">{log.certificate.type}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getAccessTypeIcon(log.access_type)}
                      <span className="text-sm text-gray-900 capitalize">
                        {log.access_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getAccessMethodIcon(log.access_method)}
                      <span className="text-sm text-gray-900 capitalize">
                        {log.access_method}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.recipient_email || (
                      <span className="text-gray-400">Not available</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No access logs found
                </td>
              </tr>
            )} </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccessLogsPanel;