import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

/**
 * Sign up a new user with email and password
 * @param email User's email
 * @param password User's password
 * @returns Promise resolving to success status and optional error
 */
export const signUp = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate email and password
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long' };
    }

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Sign up error:', error);
      await logAuthEvent(null, 'signup', false, error.message);
      return { success: false, error: error.message };
    }

    // Check if user was created
    if (!data.user) {
      await logAuthEvent(null, 'signup', false, 'Failed to create user');
      return { success: false, error: 'Failed to create user' };
    }

    // Check if user already exists
    if (data.user && !data.session) {
      // This typically means the user exists but email confirmation is required
      // For our app, we'll treat this as a user already exists error
      await logAuthEvent(null, 'signup', false, 'user_already_exists');
      return { success: false, error: 'user_already_exists' };
    }

    // Log the signup event
    await logAuthEvent(data.user.id, 'signup', true);

    return { success: true };
  } catch (error) {
    console.error('Unexpected error during sign up:', error);
    await logAuthEvent(null, 'signup', false, error.message);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Sign in an existing user with email and password
 * @param email User's email
 * @param password User's password
 * @returns Promise resolving to success status and optional error
 */
export const signIn = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate email and password
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      await logAuthEvent(null, 'signin', false, error.message);
      return { success: false, error: error.message };
    }

    // Check if user was authenticated
    if (!data.user) {
      await logAuthEvent(null, 'signin', false, 'No user returned');
      return { success: false, error: 'Authentication failed' };
    }

    // Log the signin event
    await logAuthEvent(data.user.id, 'signin', true);

    return { success: true };
  } catch (error) {
    console.error('Unexpected error during sign in:', error);
    await logAuthEvent(null, 'signin', false, error.message);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Sign out the current user
 * @returns Promise resolving to void
 */
export const signOut = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
      await logAuthEvent(userId, 'signout', false, error.message);
      throw error;
    }
    
    await logAuthEvent(userId, 'signout', true);
  } catch (error) {
    console.error('Unexpected error during sign out:', error);
    throw error;
  }
};

/**
 * Send a password reset email to the user
 * @param email User's email
 * @returns Promise resolving to success status and optional error
 */
export const resetPassword = async (
  email: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate email
    if (!email) {
      return { success: false, error: 'Email is required' };
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      await logAuthEvent(null, 'password_reset_request', false, error.message);
      return { success: false, error: error.message };
    }

    // Log the password reset request
    await logAuthEvent(null, 'password_reset_request', true, null, { email });

    return { success: true };
  } catch (error) {
    console.error('Unexpected error during password reset:', error);
    await logAuthEvent(null, 'password_reset_request', false, error.message);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Update the current user's password
 * @param password New password
 * @returns Promise resolving to success status and optional error
 */
export const updatePassword = async (
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate password
    if (!password) {
      return { success: false, error: 'Password is required' };
    }

    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long' };
    }

    // Update password
    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error('Password update error:', error);
      await logAuthEvent(data?.user?.id, 'password_update', false, error.message);
      return { success: false, error: error.message };
    }

    // Log the password update
    await logAuthEvent(data.user.id, 'password_update', true);

    return { success: true };
  } catch (error) {
    console.error('Unexpected error during password update:', error);
    await logAuthEvent(null, 'password_update', false, error.message);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Log an authentication event for audit purposes
 * @param userId User ID (if available)
 * @param eventType Type of auth event
 * @param success Whether the event was successful
 * @param errorMessage Error message (if any)
 * @param metadata Additional metadata
 */
export const logAuthEvent = async (
  userId: string | null,
  eventType: 'signup' | 'signin' | 'signout' | 'password_reset_request' | 'password_update',
  success: boolean,
  errorMessage?: string | null,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    // Create log entry
    const logEntry = {
      user_id: userId,
      event_type: eventType,
      success,
      error_message: errorMessage || null,
      ip_address: null, // We don't collect IP in client-side code
      user_agent: navigator.userAgent,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    };

    // Insert log entry into auth_logs table
    const { error } = await supabase
      .from('auth_logs')
      .insert([logEntry]);

    if (error) {
      console.error('Error logging auth event:', error);
    }
  } catch (error) {
    console.error('Unexpected error logging auth event:', error);
    // Non-blocking - continue even if logging fails
  }
};

/**
 * Get the current session
 * @returns Promise resolving to the current session
 */
export const getSession = async (): Promise<Session | null> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Get session error:', error);
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error('Unexpected error getting session:', error);
    return null;
  }
};

/**
 * Get the current user
 * @returns Promise resolving to the current user
 */
export const getUser = async (): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Get user error:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Unexpected error getting user:', error);
    return null;
  }
};

/**
 * Check if the current user is authenticated
 * @returns Promise resolving to boolean indicating if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getSession();
  return !!session;
};