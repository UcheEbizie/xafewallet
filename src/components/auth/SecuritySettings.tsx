import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { checkPasswordStrength, invalidateAllUserSessions } from '@/lib/security-utils';
import { 
  Shield, 
  AlertTriangle, 
  Loader2, 
  Lock, 
  Eye, 
  EyeOff, 
  Bell, 
  Clock, 
  LogOut, 
  Check,
  Smartphone
} from 'lucide-react';

interface SecuritySetting {
  id: string;
  user_id: string;
  two_factor_enabled: boolean;
  two_factor_method: string | null;
  login_notifications: boolean;
  suspicious_activity_notifications: boolean;
  allowed_ips: string[] | null;
  max_sessions: number;
  session_timeout_minutes: number;
  created_at: string;
  updated_at: string;
}

const SecuritySettings = () => {
  const { user, updatePassword } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySetting | null>(null);
  
  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });
  
  // Active sessions state
  const [activeSessions, setActiveSessions] = useState([]);
  const [showSessions, setShowSessions] = useState(false);

  useEffect(() => {
    if (user) {
      loadSecuritySettings();
    }
  }, [user]);

  useEffect(() => {
    if (newPassword) {
      setPasswordStrength(checkPasswordStrength(newPassword));
    } else {
      setPasswordStrength({ score: 0, feedback: '' });
    }
  }, [newPassword]);

  const loadSecuritySettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get security settings
      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error loading security settings:', error);
        throw new Error('Failed to load security settings');
      }
      
      setSecuritySettings(data);
    } catch (err) {
      setError('Failed to load security settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get active sessions
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_active_at', { ascending: false });
      
      if (error) {
        console.error('Error loading sessions:', error);
        throw new Error('Failed to load active sessions');
      }
      
      setActiveSessions(data || []);
      setShowSessions(true);
    } catch (err) {
      setError('Failed to load active sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Update security settings
      const { error } = await supabase
        .from('security_settings')
        .update({
          two_factor_enabled: securitySettings.two_factor_enabled,
          two_factor_method: securitySettings.two_factor_method,
          login_notifications: securitySettings.login_notifications,
          suspicious_activity_notifications: securitySettings.suspicious_activity_notifications,
          max_sessions: securitySettings.max_sessions,
          session_timeout_minutes: securitySettings.session_timeout_minutes
        })
        .eq('id', securitySettings.id);
      
      if (error) {
        console.error('Error updating security settings:', error);
        throw new Error('Failed to update security settings');
      }
      
      setSuccess('Security settings updated successfully');
    } catch (err) {
      setError('Failed to update security settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Validate passwords
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError('All password fields are required');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      
      if (passwordStrength.score < 3) {
        setError('Password is too weak. ' + passwordStrength.feedback);
        return;
      }
      
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });
      
      if (signInError) {
        setError('Current password is incorrect');
        return;
      }
      
      // Update password
      const { success, error } = await updatePassword(newPassword);
      
      if (!success) {
        throw new Error(error || 'Failed to update password');
      }
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
      
      setSuccess('Password updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Terminate session
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);
      
      if (error) {
        console.error('Error terminating session:', error);
        throw new Error('Failed to terminate session');
      }
      
      // Refresh sessions list
      const { data, error: loadError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_active_at', { ascending: false });
      
      if (loadError) {
        console.error('Error reloading sessions:', loadError);
        throw new Error('Failed to reload active sessions');
      }
      
      setActiveSessions(data || []);
      setSuccess('Session terminated successfully');
    } catch (err) {
      setError('Failed to terminate session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateAllSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      const currentToken = session?.access_token;
      
      // Terminate all other sessions
      const success = await invalidateAllUserSessions(user.id, currentToken);
      
      if (!success) {
        throw new Error('Failed to terminate all sessions');
      }
      
      // Refresh sessions list
      const { data, error: loadError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_active_at', { ascending: false });
      
      if (loadError) {
        console.error('Error reloading sessions:', loadError);
        throw new Error('Failed to reload active sessions');
      }
      
      setActiveSessions(data || []);
      setSuccess('All other sessions terminated successfully');
    } catch (err) {
      setError('Failed to terminate sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !securitySettings) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
          
          {securitySettings && (
            <>
              {/* Password Security */}
              <div className="space-y-4">
                <h3 className="text-md font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-500" />
                  Password Security
                </h3>
                
                {!showPasswordChange ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPasswordChange(true)}
                  >
                    Change Password
                  </Button>
                ) : (
                  <div className="space-y-4 border p-4 rounded-md">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      
                      {/* Password strength indicator */}
                      {newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  passwordStrength.score <= 1 ? 'bg-red-500' : 
                                  passwordStrength.score === 2 ? 'bg-yellow-500' : 
                                  passwordStrength.score === 3 ? 'bg-green-500' : 'bg-green-600'
                                }`}
                                style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {passwordStrength.score <= 1 ? 'Weak' : 
                               passwordStrength.score === 2 ? 'Fair' : 
                               passwordStrength.score === 3 ? 'Good' : 'Strong'}
                            </span>
                          </div>
                          {passwordStrength.feedback && (
                            <p className="text-xs text-gray-500 mt-1">{passwordStrength.feedback}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowPasswordChange(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleChangePassword}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Two-Factor Authentication */}
              <div className="space-y-4">
                <h3 className="text-md font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-gray-500" />
                  Two-Factor Authentication
                </h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Enable two-factor authentication</p>
                    <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    checked={securitySettings.two_factor_enabled}
                    onCheckedChange={(checked) => setSecuritySettings({
                      ...securitySettings,
                      two_factor_enabled: checked
                    })}
                  />
                </div>
                
                {securitySettings.two_factor_enabled && (
                  <div className="space-y-2">
                    <Label>Authentication Method</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={securitySettings.two_factor_method || 'app'}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
                        two_factor_method: e.target.value
                      })}
                    >
                      <option value="app">Authenticator App</option>
                      <option value="sms">SMS</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                )}
              </div>
              
              {/* Notification Settings */}
              <div className="space-y-4">
                <h3 className="text-md font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4 text-gray-500" />
                  Notification Settings
                </h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Login notifications</p>
                    <p className="text-xs text-gray-500">Receive notifications when someone logs into your account</p>
                  </div>
                  <Switch
                    checked={securitySettings.login_notifications}
                    onCheckedChange={(checked) => setSecuritySettings({
                      ...securitySettings,
                      login_notifications: checked
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Suspicious activity alerts</p>
                    <p className="text-xs text-gray-500">Get notified about unusual account activity</p>
                  </div>
                  <Switch
                    checked={securitySettings.suspicious_activity_notifications}
                    onCheckedChange={(checked) => setSecuritySettings({
                      ...securitySettings,
                      suspicious_activity_notifications: checked
                    })}
                  />
                </div>
              </div>
              
              {/* Session Settings */}
              <div className="space-y-4">
                <h3 className="text-md font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  Session Settings
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min={15}
                    max={1440}
                    value={securitySettings.session_timeout_minutes}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      session_timeout_minutes: parseInt(e.target.value) || 60
                    })}
                  />
                  <p className="text-xs text-gray-500">
                    How long until your session expires due to inactivity
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxSessions">Maximum Active Sessions</Label>
                  <Input
                    id="maxSessions"
                    type="number"
                    min={1}
                    max={10}
                    value={securitySettings.max_sessions}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      max_sessions: parseInt(e.target.value) || 5
                    })}
                  />
                  <p className="text-xs text-gray-500">
                    Maximum number of devices that can be logged in simultaneously
                  </p>
                </div>
                
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    onClick={loadActiveSessions}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Manage Active Sessions'
                    )}
                  </Button>
                </div>
                
                {showSessions && (
                  <div className="border rounded-md p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Active Sessions</h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleTerminateAllSessions}
                        disabled={loading || activeSessions.length <= 1}
                        className="text-red-500 hover:text-red-700"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out All Other Devices
                      </Button>
                    </div>
                    
                    {activeSessions.length === 0 ? (
                      <p className="text-sm text-gray-500">No active sessions found</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {activeSessions.map((session) => (
                          <div key={session.id} className="flex justify-between items-center p-2 border rounded-md">
                            <div>
                              <p className="text-sm font-medium">
                                {session.user_agent?.split(' ')[0] || 'Unknown Device'}
                              </p>
                              <p className="text-xs text-gray-500">
                                Last active: {new Date(session.last_active_at).toLocaleString()}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleTerminateSession(session.id)}
                              disabled={loading}
                              className="text-red-500 hover:text-red-700"
                            >
                              Terminate
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={handleUpdateSettings}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Security Settings'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;