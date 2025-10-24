import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ProfileData {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  age: number | null;
  birth_date: string | null;
  avatar_url: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  interests: string[] | null;
  notes_visible: boolean | null;
  find_friends_visible: boolean | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  interest: "namoro" | "network" | "curtição" | "amizade" | "casual" | null;
  relationship_status: "solteiro" | "namorando" | "casado" | "relacionamento_aberto" | "preferencia_nao_informar" | null;
  created_at: string;
  updated_at: string;
}

// Helper function to calculate age from birth_date
export function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;

  const today = new Date();
  const birth = new Date(birthDate);
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1;
  }

  return age;
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  // Fetch profile data
  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        toast.error('Erro ao carregar perfil');
        return;
      }

      setProfile(data || null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Update profile data
  const updateProfile = async (updates: Partial<ProfileData>) => {
    if (!user || !profile) return false;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Erro ao salvar perfil');
        return false;
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Perfil salvo com sucesso!');
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao salvar perfil');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Upload avatar with automatic 1:1 crop
  const uploadAvatar = async (file: File) => {
    if (!user) return null;

    try {
      setSaving(true);

      const croppedFile = await cropImageToSquare(file);
      if (!croppedFile) {
        toast.error('Erro ao processar a imagem');
        return null;
      }

      const fileName = `${user.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, croppedFile, { upsert: true });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast.error('Erro ao fazer upload da foto');
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(fileName);

      const success = await updateProfile({ avatar_url: publicUrl });

      if (success) {
        toast.success('Foto de perfil atualizada!');
        return publicUrl;
      }

      return null;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao atualizar foto');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Helper function to crop image to 1:1 ratio
  const cropImageToSquare = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = Math.min(img.width, img.height);
          const outputSize = 800;

          canvas.width = outputSize;
          canvas.height = outputSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          const offsetX = (img.width - size) / 2;
          const offsetY = (img.height - size) / 2;

          ctx.drawImage(
            img,
            offsetX, offsetY, size, size,
            0, 0, outputSize, outputSize
          );

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/jpeg', 0.95);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    saving,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile
  };
}