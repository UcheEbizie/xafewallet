import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Mail, Clock, RefreshCw, LogOut, Loader2, User, Check } from 'lucide-react';
import { Settings } from '@/lib/types';
import { database } from '@/lib/database';

interface SettingsSectionProps {
  settings: Settings;
  onSettingsUpdate: (settings: Partial<Settings>) => Promise<void>;
  userEmail: string;
  onSignOut: () => Promise<void>;
}

const SettingsSection = ({
  settings,
  onSettingsUpdate,
  userEmail,
  onSignOut
}: SettingsSectionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSettingChange = (key: keyof Settings, value: boolean | number | string) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      // Update settings in database
      await database.settings.upsert(localSettings);
      
      // Update local state via callback
      await onSettingsUpdate(localSettings);
      
      setSuccess('Settings updated successfully');
    } catch (err) {
      setError('Failed to update settings. Please try again.');
      console.error('Error updating settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setSignOutLoading(true);
      await onSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    } finally {
      setSignOutLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <Label>Email Address</Label>
              </div>
              <p className="text-sm text-gray-500">{userEmail}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={signOutLoading}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              {signOutLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <Label htmlFor="email-notifications">Email Notifications</Label>
              </div>
              <p className="text-sm text-gray-500">
                Receive certificate updates via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={localSettings.email_notifications}
              onCheckedChange={(checked) => handleSettingChange('email_notifications', checked)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-gray-500" />
                <Label htmlFor="push-notifications">Push Notifications</Label>
              </div>
              <p className="text-sm text-gray-500">
                Receive notifications in your browser
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={localSettings.push_notifications}
              onCheckedChange={(checked) => handleSettingChange('push_notifications', checked)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 text-gray-500" />
                <Label htmlFor="auto-renewal">Automatic Renewal Reminders</Label>
              </div>
              <p className="text-sm text-gray-500">
                Get prompted to renew certificates
              </p>
            </div>
            <Switch
              id="auto-renewal"
              checked={localSettings.auto_renewal_reminders}
              onCheckedChange={(checked) => handleSettingChange('auto_renewal_reminders', checked)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <Label htmlFor="expiry-reminders">Expiry Reminders</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                id="expiry-reminders"
                type="number"
                min={1}
                max={90}
                value={localSettings.expiry_reminders_days}
                onChange={(e) => handleSettingChange('expiry_reminders_days', parseInt(e.target.value))}
                className="w-24"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-500">days before expiry</span>
            </div>
            <p className="text-sm text-gray-500">
              Get notified before your certificates expire
            </p>
          </div>
          
          <Button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="w-full mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsSection;