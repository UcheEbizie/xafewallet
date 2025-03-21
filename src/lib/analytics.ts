export interface AccessLogEntry {
  certificate_id: string;
  access_type: 'view' | 'download' | 'email';
  access_method: 'link' | 'email' | 'direct';
  ip_address?: string;
  user_agent?: string;
  recipient_email?: string;
  share_id?: string;
}

/**
 * Logs an access event for a certificate
 * @param entry Access log entry details
 * @returns Promise resolving to void
 */
export const logAccess = async (entry: AccessLogEntry): Promise<void> => {
  try {
    console.log('Logging access:', entry);
    // In demo mode, just log to console
  } catch (err) {
    console.error('Error logging access:', err);
    // Non-blocking - continue even if logging fails
  }
};

/**
 * Gets access statistics for a certificate
 * @param certificateId ID of the certificate
 * @returns Promise resolving to access statistics
 */
export const getAccessStats = async (certificateId: string): Promise<any> => {
  // In demo mode, return mock stats
  return {
    totalViews: 5,
    totalDownloads: 2,
    accessByMethod: {
      link: 4,
      email: 2,
      direct: 1,
    },
    recentAccess: []
  };
};

/**
 * Increments the download count for a share link
 * @param shareId ID of the share
 * @returns Promise resolving to the updated download count
 */
export const incrementDownloadCount = async (shareId: string): Promise<number> => {
  try {
    console.log('Incrementing download count for share:', shareId);
    return 1; // Mock return value
  } catch (err) {
    console.error('Error incrementing download count:', err);
    return -1;
  }
};