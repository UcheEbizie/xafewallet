import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  Mail, 
  Calendar, 
  Loader2, 
  Check, 
  AlertTriangle,
  Camera
} from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  position: string;
  avatar_url?: string;
  updated_at?: string;
}

const UserProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error loading profile:', error);
        throw new Error('Failed to load profile');
      }
      
      setProfile(data);
      
      // Load avatar if exists
      if (data.avatar_url) {
        setAvatarPreview(data.avatar_url);
      }
    } catch (err) {
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be less than 2MB');
      return;
    }
    
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      if (!profile) return;
      
      // Upload avatar if changed
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, avatarFile);
        
        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          throw new Error('Failed to upload avatar');
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
        
        avatarUrl = publicUrl;
      }
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          position: profile.position,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error updating profile:', error);
        throw new Error('Failed to update profile');
      }
      
      setSuccess('Profile updated successfully');
      
      // Reset avatar file
      setAvatarFile(null);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
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
            <User className="h-5 w-5 text-blue-500" />
            User Profile
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
          
          {profile && (
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full cursor-pointer"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500">Click the camera icon to change your profile picture</p>
              </div>
              
              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  value={user.email}
                  readOnly
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              {/* Account Created */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Account Created
                </Label>
                <p className="text-sm">
                  {new Date(user.created_at).toLocaleDateString()} at {new Date(user.created_at).toLocaleTimeString()}
                </p>
              </div>
              
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              
              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position">Position / Title</Label>
                <Input
                  id="position"
                  value={profile.position}
                  onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                  placeholder="Enter your position or title"
                />
              </div>
              
              <Button 
                onClick={handleUpdateProfile}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;