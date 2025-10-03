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
  avatar_url: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
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

  // Upload avatar
  const uploadAvatar = async (file: File) => {
    if (!user) return null;

    try {
      setSaving(true);
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast.error('Erro ao fazer upload da foto');
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
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