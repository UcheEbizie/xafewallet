import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Loader2, Pencil, Check } from 'lucide-react';
import { Profile } from '@/lib/types';
import { database } from '@/lib/database';

interface ProfileSectionProps {
  profile: Profile;
  onProfileUpdate: (profile: Partial<Profile>) => Promise<void>;
}

const ProfileSection = ({ profile, onProfileUpdate }: ProfileSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      // Validate inputs
      if (!editedProfile.name.trim()) {
        setError('Name is required');
        return;
      }
      
      // Update profile in database
      await database.profiles.upsert({
        name: editedProfile.name,
        position: editedProfile.position,
        avatar_url: editedProfile.avatar_url
      });
      
      // Update local state via callback
      await onProfileUpdate(editedProfile);
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Error updating profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="relative bg-gray-50">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditing(!isEditing)}
        className="absolute right-2 top-2"
        disabled={isLoading}
      >
        {isEditing ? (
          'Cancel'
        ) : (
          <Pencil className="h-4 w-4 text-gray-500" />
        )}
      </Button>
      <CardContent className="pt-4">
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-8 w-8 text-blue-500" />
              </div>
              <div className="flex-1">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editedProfile.name}
                    onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                    placeholder="Enter your name"
                    className="mt-1"
                  />
                </div>
                <div className="mt-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={editedProfile.position}
                    onChange={(e) => setEditedProfile({ ...editedProfile, position: e.target.value })}
                    placeholder="Enter your position"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            
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
            
            <div className="flex justify-end space-x-2 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditedProfile(profile);
                  setError(null);
                  setSuccess(null);
                }}
                size="sm"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">{profile.name}</p>
              <p className="text-sm text-gray-500">{profile.position}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileSection;