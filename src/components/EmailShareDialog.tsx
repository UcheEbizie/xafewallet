import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { validate } from 'email-validator';
import { sendCertificateEmail } from '@/lib/email-service';
import { 
  Mail, 
  Plus, 
  X, 
  Send,
  Check,
  AlertTriangle,
  Loader2,
  Paperclip,
  User
} from 'lucide-react';

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

interface EmailShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  certificates: Certificate[];
  selectedCertificateIds: number[];
  profile: Profile;
}

const EmailShareDialog: React.FC<EmailShareDialogProps> = ({
  isOpen,
  onClose,
  certificates,
  selectedCertificateIds,
  profile
}) => {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [subject, setSubject] = useState(`Certificates shared by ${profile.name}`);
  const [message, setMessage] = useState('');
  const [recentRecipients, setRecentRecipients] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Constants
  const MAX_RECIPIENTS = 10;
  const MAX_MESSAGE_LENGTH = 1000;

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

  const handleSendEmail = async () => {
    // Validate form
    if (recipients.length === 0) {
      setError('Please add at least one recipient');
      return;
    }
    
    if (selectedCertificateIds.length === 0) {
      setError('Please select at least one certificate');
      return;
    }
    
    setIsLoading(true);
    setProgress(0);
    setError('');
    setSuccess('');
    
    try {
      // Get selected certificates
      const selectedCertificates = certificates.filter(cert => 
        selectedCertificateIds.includes(cert.id)
      );
      
      if (selectedCertificates.length === 0) {
        throw new Error('No certificates selected');
      }
      
      // Create certificate files array
      const certificateFiles = selectedCertificates.map(cert => {
        // If the certificate has a file, use it
        if (cert.file) {
          return {
            file: cert.file,
            title: cert.title
          };
        }
        
        // Otherwise, create a mock text file with certificate details
        const certDetails = `
          Certificate: ${cert.title}
          Type: ${cert.type}
          Issuer: ${cert.issuer}
          Certificate Number: ${cert.certNumber}
          Completion Date: ${new Date(cert.completionDate).toLocaleDateString()}
          Expiry Date: ${cert.noExpiry ? 'No Expiry' : cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'No Expiry'}
          Description: ${cert.description || 'No description provided'}
        `;
        
        // Create a text file with certificate details
        const blob = new Blob([certDetails], { type: 'text/plain' });
        const file = new File([blob], `${cert.title}.txt`, { type: 'text/plain' });
        
        return {
          file,
          title: cert.title
        };
      });
      
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
      
      // Send email
      const result = await sendCertificateEmail(
        recipients,
        subject,
        message,
        certificateFiles,
        {
          name: profile.name,
          position: profile.position
        }
      );
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }
      
      // Update recent recipients
      const newRecentRecipients = Array.from(new Set([...recipients, ...recentRecipients])).slice(0, 20);
      setRecentRecipients(newRecentRecipients);
      localStorage.setItem('recentRecipients', JSON.stringify(newRecentRecipients));
      
      setSuccess('Certificates sent successfully!');
      
      // Reset form after a delay
      setTimeout(() => {
        setRecipients([]);
        setSubject(`Certificates shared by ${profile.name}`);
        setMessage('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error sending email:', error);
      setError(error.message || 'Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Certificates via Email</DialogTitle>
        </DialogHeader>
        
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
            
            <div className="space-y-2">
              <Label>Selected Certificates</Label>
              <div className="space-y-2">
                {certificates
                  .filter(cert => selectedCertificateIds.includes(cert.id))
                  .map(cert => (
                    <div key={cert.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{cert.title}</span>
                      </div>
                      <Badge variant="secondary">{cert.type}</Badge>
                    </div>
                  ))}
              </div>
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

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={isLoading || recipients.length === 0 || selectedCertificateIds.length === 0}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailShareDialog;