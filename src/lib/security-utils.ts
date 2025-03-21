import { supabase } from './supabase';

/**
 * Encrypt sensitive data using AES-GCM
 * @param data Data to encrypt
 * @param key Encryption key
 * @returns Promise resolving to encrypted data as base64 string
 */
export const encryptData = async (data: string, key: string): Promise<string> => {
  try {
    // Convert the key to a CryptoKey
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data
    const dataBuffer = encoder.encode(data);
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBuffer
    );

    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...result));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data using AES-GCM
 * @param encryptedData Encrypted data as base64 string
 * @param key Encryption key
 * @returns Promise resolving to decrypted data
 */
export const decryptData = async (encryptedData: string, key: string): Promise<string> => {
  try {
    // Convert the key to a CryptoKey
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Convert base64 to Uint8Array
    const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = encryptedBytes.slice(0, 12);
    const encryptedBuffer = encryptedBytes.slice(12);

    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encryptedBuffer
    );

    // Convert the decrypted data to a string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Check password strength
 * @param password Password to check
 * @returns Object with score (0-4) and feedback
 */
export const checkPasswordStrength = (password: string): { score: number; feedback: string } => {
  // Simple password strength checker
  let score = 0;
  let feedback = '';

  if (password.length < 8) {
    return { score: 0, feedback: 'Password should be at least 8 characters long' };
  }

  // Check for length
  if (password.length >= 12) {
    score += 1;
  }

  // Check for mixed case
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback += 'Add both uppercase and lowercase letters. ';
  }

  // Check for numbers
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback += 'Add at least one number. ';
  }

  // Check for special characters
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback += 'Add at least one special character. ';
  }

  if (score >= 4) {
    feedback = 'Strong password!';
  } else if (score === 0) {
    feedback = 'Password is too weak.';
  } else if (feedback === '') {
    feedback = 'Password could be stronger.';
  }

  return { score, feedback };
};

/**
 * Invalidate all user sessions except the current one
 * @param userId User ID
 * @param currentToken Current session token to preserve
 * @returns Promise resolving to boolean indicating success
 */
export const invalidateAllUserSessions = async (userId: string, currentToken?: string): Promise<boolean> => {
  try {
    // Update all sessions to inactive except the current one
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .neq('session_token', currentToken || '');
    
    if (error) {
      console.error('Error invalidating sessions:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error invalidating sessions:', error);
    return false;
  }
};