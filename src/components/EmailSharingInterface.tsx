import React, { useState, useEffect } from 'react';
import { validate } from 'email-validator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PDFPreview from './PDFPreview';
import { sendEmail, fileToBase64, generateCertificateEmailTemplate } from '@/lib/sendgrid';
import { 
  Mail, 
  Plus, 
  X, 
  Send,
  Eye,
  Check,
  AlertTriangle,
  Clock,
  User,
  FileText,
  Paperclip,
  Loader2
} from 'lucide-react';

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Maximum number of recipients
const MAX_RECIPIENTS = 10;
// Maximum message length
const MAX_MESSAGE_LENGTH = 1000;
// Rate limiting (emails per minute)
const MAX_EMAILS_PER_MINUTE = 5;

interface Certificate {
  id: number;
  title: string;
  file: File | null;
  type: string;
  expiryDate: string | null;
  completionDate: string;
  issuer: string;
  certNumber: string;
  description: string;
  noExpiry?: boolean;
}

interface Profile {
  name: string;
  position: string;
  avatar_url?: string;
}

interface EmailHistory {
  id: string;
  recipients: string[];
  subject: string;
  certificateIds: number[];
  sentAt: Date;
  status: 'sent' | 'failed';
}

interface EmailPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  recipients: string[];
  subject: string;
  message: string;
  selectedCertificates: Certificate[];
}

const EmailPreview: React.FC<EmailPreviewProps> = ({
  isOpen,
  onClose,
  profile,
  recipients,
  subject,
  message,
  selectedCertificates
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-4">
          {/* Email Header */}
          <div className="border-b pb-4">
            <div className="bg-blue-50 p-4 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.name} 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-blue-800">{profile.name}</p>
                  <p className="text-sm text-blue-600">{profile.position}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex">
                <span className="w-20 text-gray-500">From:</span>
                <span>{profile.name}</span>
              </div>
              <div className="flex">
                <span className="w-20 text-gray-500">To:</span>
                <div className="flex-1 flex flex-wrap gap-1">
                  {recipients.map((recipient, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {recipient}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex">
                <span className="w-20 text-gray-500">Subject:</span>
                <span className="font-medium">{subject}</span>
              </div>
            </div>
          </div>
          
          {/* Email Body */}
          <div className="space-y-6">
            {/* Logo and Branding */}
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    <span className="text-blue-600">Xafe</span>
                    <span className="text-black">Wallet</span>
                  </h2>
                </div>
              </div>
            </div>
            
            {/* Greeting */}
            <div>
              <p className="text-lg">Hello,</p>
              <p className="mt-2">
                {profile.name} has shared {selectedCertificates.length > 1 ? 'certificates' : 'a certificate'} with you via XafeWallet.
              </p>
            </div>
            
            {/* Personal Message */}
            {message && (
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 italic">
                <p>{message}</p>
              </div>
            )}
            
            {/* Certificates */}
            <div>
              <h3 className="font-medium mb-3">Shared Certificates:</h3>
              <div className="space-y-3">
                {selectedCertificates.map((cert) => (
                  <div key={cert.id} className="border rounded-lg p-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{cert.title}</p>
                        <p className="text-sm text-gray-500">
                          Issued by {cert.issuer} • {new Date(cert.completionDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge>{cert.type}</Badge>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <Paperclip className="h-3 w-3 mr-1" />
                      <span>Attachment: {cert.file?.name || 'Certificate file'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Instructions:</h3>
              <ul className="list-disc pl-5 text-sm space-y-1 text-blue-700">
                <li>The certificates are attached to this email</li>
                <li>You can view them using any standard PDF or image viewer</li>
                <li>For security, please verify the sender's identity before opening attachments</li>
                <li>These certificates are for your reference only</li>
              </ul>
            </div>
            
            {/* Footer */}
            <div className="border-t pt-4 text-sm text-gray-500">
              <p>This is an automated message from XafeWallet. Please do not reply to this email.</p>
              <p className="mt-2">© {new Date().getFullYear()} XafeWallet. All rights reserved.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EmailSharingInterface: React.FC<{
  certificates: Certificate[];
  profile: Profile;
  onClose: () => void;
}> = ({ certificates, profile, onClose }) => {
  const [selectedCerts, setSelectedCerts] = useState<number[]>([]);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [subject, setSubject] = useState(`Certificates shared by ${profile.name}`);
  const [message, setMessage] = useState('');
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [recentRecipients, setRecentRecipients] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  // Rate limiting
  const [emailsSentThisMinute, setEmailsSentThisMinute] = useState(0);
  const [lastEmailTime, setLastEmailTime] = useState(Date.now());

  // Load recent recipients from localStorage
  useEffect(() => {
    const savedRecipients = localStorage.getItem('recentRecipients');
    if (savedRecipients) {
      try {
        setRecentRecipients(JSON.parse(savedRecipients));
      } catch (e) {
        console.error('Error parsing recent recipients:', e);
      }
    }
    
    // Load email history from localStorage
    const savedHistory = localStorage.getItem('emailHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        // Convert string dates back to Date objects
        const historyWithDates = parsedHistory.map(item => ({
          ...item,
          sentAt: new Date(item.sentAt)
        }));
        setEmailHistory(historyWithDates);
      } catch (e) {
        console.error('Error parsing email history:', e);
      }
    }
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (recipientInput.trim() === '') {
      setFilteredSuggestions([]);
      return;
    }
    
    const filtered = recentRecipients.filter(
      email => email.toLowerCase().includes(recipientInput.toLowerCase())
    );
    setFilteredSuggestions(filtered);
  }, [recipientInput, recentRecipients]);

  // Reset rate limiting after a minute
  useEffect(() => {
    if (emailsSentThisMinute >= MAX_EMAILS_PER_MINUTE) {
      const timeSinceLastEmail = Date.now() - lastEmailTime;
      if (timeSinceLastEmail >= 60000) {
        setEmailsSentThisMinute(0);
      }
    }
  }, [emailsSentThisMinute, lastEmailTime]);

  const handleSelectAll = () => {
    setSelectedCerts(certificates.map(cert => cert.id));
  };

  const handleDeselectAll = () => {
    setSelectedCerts([]);
  };

  const toggleCertificate = (certId: number) => {
    setSelectedCerts(prev => 
      prev.includes(certId) 
        ? prev.filter(id => id !== certId)
        : [...prev, certId]
    );
  };

  const handleAddRecipient = () => {
    if (!recipientInput.trim()) return;
    
    // Validate email
    if (!validate(recipientInput)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Check if already added
    if (recipients.includes(recipientInput)) {
      setError('This email is already added');
      return;
    }
    
    // Check maximum recipients
    if (recipients.length >= MAX_RECIPIENTS) {
      setError(`Maximum ${MAX_RECIPIENTS} recipients allowed`);
      return;
    }
    
    setRecipients([...recipients, recipientInput]);
    setRecipientInput('');
    setError('');
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleSelectSuggestion = (email: string) => {
    if (recipients.includes(email)) {
      setError('This email is already added');
      return;
    }
    
    if (recipients.length >= MAX_RECIPIENTS) {
      setError(`Maximum ${MAX_RECIPIENTS} recipients allowed`);
      return;
    }
    
    setRecipients([...recipients, email]);
    setRecipientInput('');
    setShowSuggestions(false);
  };

  const validateForm = () => {
    if (selectedCerts.length === 0) {
      setError('Please select at least one certificate');
      return false;
    }
    
    if (recipients.length === 0) {
      setError('Please add at least one recipient');
      return false;
    }
    
    // Check if any selected certificate exceeds the size limit
    const selectedCertificates = certificates.filter(cert => selectedCerts.includes(cert.id));
    const oversizedCert = selectedCertificates.find(cert => cert.file && cert.file.size > MAX_FILE_SIZE);
    if (oversizedCert) {
      setError(`Certificate "${oversizedCert.title}" exceeds the maximum size of 10MB`);
      return false;
    }
    
    // Check rate limiting
    if (emailsSentThisMinute >= MAX_EMAILS_PER_MINUTE) {
      setError(`You can only send ${MAX_EMAILS_PER_MINUTE} emails per minute. Please try again later.`);
      return false;
    }
    
    return true;
  };

  const handleSendEmail = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setProgress(0);
    setError('');
    setSuccess('');
    
    try {
      // Get selected certificates
      const selectedCertificates = certificates.filter(cert => selectedCerts.includes(cert.id));
      
      // Prepare email template
      const certificateNames = selectedCertificates.map(cert => cert.title);
      const emailTemplate = generateCertificateEmailTemplate(
        profile.name,
        profile.position,
        certificateNames,
        message
      );
      
      // Prepare attachments
      const attachments = [];
      for (let i = 0; i < selectedCertificates.length; i++) {
        const cert = selectedCertificates[i];
        if (cert.file) {
          setProgress(Math.floor((i / selectedCertificates.length) * 50));
          
          // Convert file to base64
          const base64Content = await fileToBase64(cert.file);
          
          attachments.push({
            content: base64Content,
            filename: cert.file.name || `${cert.title}.${cert.file.type.split('/')[1]}`,
            type: cert.file.type,
            disposition: 'attachment'
          });
        }
      }
      
      // Send email to each recipient
      setProgress(50);
      
      const fromEmail = import.meta.env.VITE_EMAIL_FROM || 'noreply@xafewallet.com';
      const fromName = import.meta.env.VITE_EMAIL_FROM_NAME || 'XafeWallet';
      
      const emailResult = await sendEmail({
        to: recipients,
        from: {
          email: fromEmail,
          name: fromName
        },
        subject: subject || emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
        attachments,
        categories: ['certificate-sharing'],
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      });
      
      setProgress(100);
      
      if (!emailResult) {
        throw new Error('Failed to send email');
      }
      
      // Add to email history
      const newEmailHistory: EmailHistory = {
        id: Math.random().toString(36).substring(2, 11),
        recipients: [...recipients],
        subject,
        certificateIds: [...selectedCerts],
        sentAt: new Date(),
        status: 'sent'
      };
      
      const updatedHistory = [newEmailHistory, ...emailHistory];
      setEmailHistory(updatedHistory);
      
      // Save to localStorage
      localStorage.setItem('emailHistory', JSON.stringify(updatedHistory));
      
      // Update recent recipients
      const newRecentRecipients = Array.from(new Set([...recipients, ...recentRecipients])).slice(0, 20);
      setRecentRecipients(newRecentRecipients);
      localStorage.setItem('recentRecipients', JSON.stringify(newRecentRecipients));
      
      // Update rate limiting
      setEmailsSentThisMinute(prev => prev + 1);
      setLastEmailTime(Date.now());
      
      setSuccess('Certificates sent successfully!');
      
      // Reset form
      setRecipients([]);
      setSubject(`Certificates shared by ${profile.name}`);
      setMessage('');
      setSelectedCerts([]);
    } catch (error) {
      console.error('Error sending email:', error);
      setError('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const getSelectedCertificates = () => {
    return certificates.filter(cert => selectedCerts.includes(cert.id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="font-medium">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.position}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Email Certificates</h2>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Select Certificates</h3>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {certificates.map(cert => (
            <div
              key={cert.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedCerts.includes(cert.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => toggleCertificate(cert.id)}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={selectedCerts.includes(cert.id)}
                  onChange={() => toggleCertificate(cert.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium">{cert.title}</p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                    <Badge variant="secondary">{cert.type}</Badge>
                    {cert.file && (
                      <span className="text-xs">
                        {(cert.file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {selectedCerts.length} certificate(s) selected
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            disabled={selectedCerts.length === 0 || recipients.length === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Email
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipients">Recipients</Label>
          <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-white">
            {recipients.map((email, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {email}
                <button
                  type="button"
                  onClick={() => handleRemoveRecipient(email)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <div className="relative flex-1 min-w-[200px]">
              <Input
                id="recipient-input"
                value={recipientInput}
                onChange={(e) => {
                  setRecipientInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRecipient();
                  }
                }}
                placeholder="Enter email address"
                className="border-0 focus-visible:ring-0 p-0 h-8"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredSuggestions.map((email, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSelectSuggestion(email)}
                    >
                      {email}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <p className="text-xs text-gray-500">
              {recipients.length}/{MAX_RECIPIENTS} recipients
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleAddRecipient}
              disabled={!recipientInput || recipients.length >= MAX_RECIPIENTS}
              className="text-blue-500"
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message (Optional)</Label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal message..."
            className="w-full min-h-[100px] p-3 border rounded-md"
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <p className="text-xs text-gray-500 text-right">
            {message.length}/{MAX_MESSAGE_LENGTH}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-center text-gray-500">
            Sending email... {progress}%
          </p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <h3 className="font-medium">Recent Email History</h3>
        {emailHistory.length > 0 ? (
          <div className="space-y-3">
            {emailHistory.map((email) => (
              <div key={email.id} className="border rounded-lg p-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{email.subject}</p>
                    <p className="text-sm text-gray-500">
                      Sent to {email.recipients.length} recipient(s) on{' '}
                      {email.sentAt.toLocaleString()}
                    </p>
                  </div>
                  <Badge className={email.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {email.status === 'sent' ? 'Sent' : 'Failed'}
                  </Badge>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">Certificates: </span>
                  {email.certificateIds.length} certificate(s)
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No email history yet</p>
        )}
      </div>

      <Button
        className="w-full"
        onClick={handleSendEmail}
        disabled={isLoading || selectedCerts.length === 0 || recipients.length === 0}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Send Certificates
          </>
        )}
      </Button>

      <EmailPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        profile={profile}
        recipients={recipients}
        subject={subject}
        message={message}
        selectedCertificates={getSelectedCertificates()}
      />
    </div>
  );
};

export default EmailSharingInterface;