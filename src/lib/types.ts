export interface Profile {
  id: string;
  name: string;
  position: string;
  avatar_url?: string;
  updated_at?: string;
}

export interface Settings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  expiry_reminders_days: number;
  auto_renewal_reminders: boolean;
  dark_mode?: boolean;
  notification_frequency?: string;
  updated_at?: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  title: string;
  type: string;
  expiry_date: string | null;
  completion_date: string;
  status: 'valid' | 'expiring' | 'expired';
  issuer: string;
  cert_number: string;
  description: string;
  file_url?: string;
  created_at?: string;
  updated_at?: string;
  owner_name?: string; // Added for email sharing
}

export interface EmailShare {
  id: string;
  user_id: string;
  recipients: string[];
  subject: string;
  message?: string;
  certificate_ids: string[];
  sent_at: string;
  status: 'sent' | 'failed';
}

export interface LinkShare {
  id: string;
  user_id: string;
  url: string;
  token: string;
  certificate_ids: string[];
  created_at: string;
  expires_at: string | null;
  is_password_protected: boolean;
  password_hash?: string;
  max_downloads?: number;
  download_count: number;
  is_revoked: boolean;
}

export interface AccessLog {
  id: string;
  certificate_id: string;
  user_id?: string;
  access_type: 'view' | 'download' | 'email' | 'print';
  access_method: 'link' | 'email' | 'direct' | 'qrcode';
  ip_address?: string;
  user_agent?: string;
  recipient_email?: string;
  share_id?: string;
  timestamp: string;
}