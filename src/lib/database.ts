import { supabase } from './supabase';
import { Profile, Settings, Certificate } from './types';

// Mock data for demo mode
const mockData = {
  profiles: {
    get: async () => {
      return {
        id: '1',
        name: 'John Doe',
        position: 'Software Engineer',
        avatar_url: null
      };
    },
    upsert: async (profile) => {
      return {
        ...profile,
        id: '1',
        updated_at: new Date().toISOString()
      };
    }
  },
  settings: {
    get: async () => {
      return {
        id: '1',
        user_id: '1',
        email_notifications: true,
        push_notifications: true,
        expiry_reminders_days: 30,
        auto_renewal_reminders: true
      };
    },
    upsert: async (settings) => {
      return {
        ...settings,
        id: '1',
        user_id: '1',
        updated_at: new Date().toISOString()
      };
    }
  },
  certificates: {
    list: async () => {
      return [
        {
          id: '1',
          user_id: '1',
          title: 'AWS Certified Solutions Architect',
          type: 'Professional Certification',
          expiry_date: new Date(2025, 5, 15).toISOString(),
          completion_date: new Date(2023, 5, 15).toISOString(),
          status: 'valid',
          issuer: 'Amazon Web Services',
          cert_number: 'AWS-123456',
          description: 'Professional level certification for AWS architecture',
          file_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: '1',
          title: 'React Developer Certification',
          type: 'Technical Certification',
          expiry_date: null,
          completion_date: new Date(2023, 2, 10).toISOString(),
          status: 'valid',
          issuer: 'Meta',
          cert_number: 'REACT-789012',
          description: 'Advanced certification for React development',
          file_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    },
    create: async (certificate) => {
      return {
        ...certificate,
        id: Math.random().toString(36).substring(2, 11),
        user_id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    },
    update: async (id, certificate) => {
      return {
        ...certificate,
        id,
        updated_at: new Date().toISOString()
      };
    },
    delete: async (id) => {
      return true;
    },
    uploadFile: async (file) => {
      // Simulate file upload
      return URL.createObjectURL(file);
    }
  }
};

export const database = {
  profiles: {
    async upsert(profile: Partial<Profile>) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('No authenticated user, using demo mode');
          return mockData.profiles.upsert(profile);
        }

        // Check if profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching profile:', fetchError);
          throw fetchError;
        }
        
        // If profile doesn't exist, create it
        if (!existingProfile) {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              ...profile,
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (insertError) {
            console.error('Error creating profile:', insertError);
            throw insertError;
          }
          
          return newProfile;
        }
        
        // Update existing profile
        const { data, error: updateError } = await supabase
          .from('profiles')
          .update({
            ...profile,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }
        
        return data;
      } catch (err) {
        console.error('Error upserting profile, using demo mode:', err);
        return mockData.profiles.upsert(profile);
      }
    },

    async get() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('No authenticated user, using demo mode');
          return mockData.profiles.get();
        }

        // Try to get existing profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // Profile doesn't exist, create default profile
            const defaultProfile = {
              id: user.id,
              name: 'New User',
              position: 'Position'
            };

            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert(defaultProfile)
              .select()
              .single();

            if (createError) {
              console.error('Error creating default profile:', createError);
              throw createError;
            }
            
            return newProfile;
          }
          
          console.error('Error getting profile:', error);
          throw error;
        }

        return data;
      } catch (err) {
        console.error('Error getting profile, using demo mode:', err);
        return mockData.profiles.get();
      }
    }
  },

  settings: {
    async upsert(settings: Partial<Settings>) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('No authenticated user, using demo mode');
          return mockData.settings.upsert(settings);
        }

        // Check if settings exist
        const { data: existingSettings, error: fetchError } = await supabase
          .from('settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching settings:', fetchError);
          throw fetchError;
        }
        
        // If settings don't exist, create them
        if (!existingSettings) {
          const { data: newSettings, error: insertError } = await supabase
            .from('settings')
            .insert({
              user_id: user.id,
              ...settings,
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (insertError) {
            console.error('Error creating settings:', insertError);
            throw insertError;
          }
          
          return newSettings;
        }
        
        // Update existing settings
        const { data, error: updateError } = await supabase
          .from('settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('Error updating settings:', updateError);
          throw updateError;
        }
        
        return data;
      } catch (err) {
        console.error('Error upserting settings, using demo mode:', err);
        return mockData.settings.upsert(settings);
      }
    },

    async get() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('No authenticated user, using demo mode');
          return mockData.settings.get();
        }

        // Try to get existing settings
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // Settings don't exist, create default settings
            const defaultSettings = {
              user_id: user.id,
              email_notifications: true,
              push_notifications: true,
              expiry_reminders_days: 30,
              auto_renewal_reminders: true
            };

            const { data: newSettings, error: createError } = await supabase
              .from('settings')
              .insert(defaultSettings)
              .select()
              .single();

            if (createError) {
              console.error('Error creating default settings:', createError);
              throw createError;
            }
            
            return newSettings;
          }
          
          console.error('Error getting settings:', error);
          throw error;
        }

        return data;
      } catch (err) {
        console.error('Error getting settings, using demo mode:', err);
        return mockData.settings.get();
      }
    }
  },

  certificates: {
    async create(certificate: Omit<Certificate, 'id' | 'user_id'>) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('No authenticated user, using demo mode');
          return mockData.certificates.create(certificate);
        }

        // Ensure dates are properly formatted or null
        const formattedCertificate = {
          ...certificate,
          expiry_date: certificate.expiry_date || null,
          completion_date: certificate.completion_date || new Date().toISOString().split('T')[0]
        };

        const { data, error } = await supabase
          .from('certificates')
          .insert({
            user_id: user.id,
            ...formattedCertificate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error creating certificate:', error);
          throw error;
        }
        
        return data;
      } catch (err) {
        console.error('Error creating certificate, using demo mode:', err);
        return mockData.certificates.create(certificate);
      }
    },

    async update(id: string, certificate: Partial<Certificate>) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('No authenticated user, using demo mode');
          return mockData.certificates.update(id, certificate);
        }

        // Ensure dates are properly formatted or null
        const formattedCertificate = {
          ...certificate,
          expiry_date: certificate.expiry_date || null
        };

        const { data, error } = await supabase
          .from('certificates')
          .update({
            ...formattedCertificate,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user.id) // Ensure user can only update their own certificates
          .select()
          .single();
        
        if (error) {
          console.error('Error updating certificate:', error);
          throw error;
        }
        
        return data;
      } catch (err) {
        console.error('Error updating certificate, using demo mode:', err);
        return mockData.certificates.update(id, certificate);
      }
    },

    async delete(id: string) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('No authenticated user, using demo mode');
          return mockData.certificates.delete(id);
        }

        const { error } = await supabase
          .from('certificates')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id); // Ensure user can only delete their own certificates
        
        if (error) {
          console.error('Error deleting certificate:', error);
          throw error;
        }
        
        return true;
      } catch (err) {
        console.error('Error deleting certificate, using demo mode:', err);
        return mockData.certificates.delete(id);
      }
    },

    async list() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('No authenticated user, using demo mode');
          return mockData.certificates.list();
        }

        const { data, error } = await supabase
          .from('certificates')
          .select('*')
          .eq('user_id', user.id) // Only get user's own certificates
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error listing certificates:', error);
          throw error;
        }
        
        return data;
      } catch (err) {
        console.error('Error listing certificates, using demo mode:', err);
        return mockData.certificates.list();
      }
    },

    async uploadFile(file: File) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('No authenticated user, using demo mode');
          return mockData.certificates.uploadFile(file);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
          const { error: uploadError } = await supabase.storage
            .from('certificates')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('certificates')
            .getPublicUrl(filePath);

          return publicUrl;
        } catch (error) {
          console.error('Supabase request failed', error);
          throw error;
        }
      } catch (err) {
        console.error('Error uploading file, using demo mode:', err);
        return mockData.certificates.uploadFile(file);
      }
    }
  }
};