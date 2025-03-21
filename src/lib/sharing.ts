import { generateSecureToken, hashPassword } from './security';
import { supabase } from './supabase';
import { logAccess } from './analytics';

export interface ShareLinkOptions {
  certificateIds: string[];
  expiryDays: number;
  isPasswordProtected: boolean;
  password?: string;
  maxDownloads?: number;
}

/**
 * Generates a secure sharing link for certificates
 * @param options Options for the share link
 * @returns Promise resolving to the generated share link URL
 */
export const generateShareLink = async (options: ShareLinkOptions): Promise<string> => {
  try {
    // Generate secure token
    const token = generateSecureToken(16);
    
    // Calculate expiry date
    const expiresAt = options.expiryDays > 0 
      ? new Date(Date.now() + options.expiryDays * 24 * 60 * 60 * 1000).toISOString()
      : null;
    
    // Hash password if provided
    let passwordHash = null;
    if (options.isPasswordProtected && options.password) {
      passwordHash = await hashPassword(options.password);
    }
    
    // Generate full URL
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/share/${token}`;
    
    // Try to store in database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('link_shares')
          .insert({
            user_id: user.id,
            token: token,
            url: url,
            certificate_ids: options.certificateIds,
            expires_at: expiresAt,
            is_password_protected: options.isPasswordProtected,
            password_hash: passwordHash,
            max_downloads: options.maxDownloads,
            download_count: 0,
            view_count: 0,
            is_revoked: false,
            created_at: new Date().toISOString()
          });
          
        if (error) {
          console.error('Error storing share link:', error);
        }
      }
    } catch (err) {
      console.error('Error storing share link:', err);
      // Continue even if database storage fails
    }
    
    return url;
  } catch (err) {
    console.error('Error generating share link:', err);
    throw new Error('Failed to generate share link');
  }
};

/**
 * Revokes a sharing link
 * @param shareId ID of the share to revoke
 * @returns Promise resolving to boolean indicating success
 */
export const revokeShareLink = async (shareId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('link_shares')
      .update({ is_revoked: true })
      .eq('id', shareId);
      
    if (error) {
      console.error('Error revoking share link:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error revoking share link:', err);
    return false;
  }
};

/**
 * Validates a share token
 * @param token The token to validate
 * @returns Promise resolving to the share data or null if invalid
 */
export const validateShareToken = async (token: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('link_shares')
      .select('*')
      .eq('token', token)
      .single();
      
    if (error) {
      console.error('Error validating share token:', error);
      return null;
    }
    
    // Check if revoked
    if (data.is_revoked) {
      return { isValid: false, reason: 'revoked' };
    }
    
    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { isValid: false, reason: 'expired' };
    }
    
    // Check max downloads
    if (data.max_downloads && data.download_count >= data.max_downloads) {
      return { isValid: false, reason: 'download_limit' };
    }
    
    return { isValid: true, data };
  } catch (err) {
    console.error('Error validating share token:', err);
    return null;
  }
};