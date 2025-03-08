import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bell, Settings, User, Shield, Mail, Calendar } from 'lucide-react';

const NotificationCenter = ({ notifications = [] }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <Badge variant="secondary">{notifications.length} New</Badge>
      </div>
      
      <div className="space-y-2">
        {notifications.map((notification, index) => (
          <Card key={index} className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-full ${notification.type === 'expiry' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                  {notification.type === 'expiry' ? (
                    <Calendar className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <Bell className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium">{notification.title}</h3>
                  <p className="text-sm text-gray-500">{notification.message}</p>
                  <span className="text-xs text-gray-400">{notification.time}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const SettingsPanel = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications Continuing with the SettingsPanel component code exactly where we left off:

    pushNotifications: true,
    expiryReminders: 30,
    autoRenewal: false,
    twoFactorAuth: true,
    darkMode: false
  });

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Notification Preferences</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-500">Receive certificate updates via email</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-gray-500">Receive notifications in your browser</p>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Expiry Reminders</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="1"
                max="90"
                value={settings.expiryReminders}
                onChange={(e) => handleSettingChange('expiryReminders', parseInt(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-gray-500">days before expiry</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Security Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
              onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automatic Renewal Reminders</Label>
              <p className="text-sm text-gray-500">Get prompted to renew certificates</p>
            </div>
            <Switch
              checked={settings.autoRenewal}
              onCheckedChange={(checked) => handleSettingChange('autoRenewal', checked)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Appearance</h2>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Dark Mode</Label>
            <p className="text-sm text-gray-500">Switch to dark theme</p>
          </div>
          <Switch
            checked={settings.darkMode}
            onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
          />
        </div>
      </div>

      <Button className="w-full">Save Settings</Button>
    </div>
  );
};

// Export both components
export { NotificationCenter, SettingsPanel };
export default SettingsPanel;