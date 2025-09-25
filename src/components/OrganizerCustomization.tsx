import { useState, useEffect } from "react";
import { Edit3, Upload, Palette, Type, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganizer } from "@/hooks/useOrganizer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function OrganizerCustomization() {
  const { organizerData, updateOrganizerProfile, loading } = useOrganizer();
  const [pageSettings, setPageSettings] = useState({
    title: "",
    subtitle: "",
    description: "",
    theme: "dark",
    primaryColor: "#8B5CF6",
    showStats: true,
    showEvents: true,
    showContact: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (organizerData) {
      setPageSettings({
        title: organizerData.page_title || "",
        subtitle: organizerData.page_subtitle || "",
        description: organizerData.page_description || "",
        theme: organizerData.theme || "dark",
        primaryColor: organizerData.primary_color || "#8B5CF6",
        showStats: organizerData.show_statistics,
        showEvents: organizerData.show_events,
        showContact: organizerData.show_contact,
      });
    }
  }, [organizerData]);

  const themes = [
    { value: "dark", label: "Escuro" },
    { value: "light", label: "Claro" },
    { value: "colorful", label: "Colorido" },
  ];

  const colors = [
    { name: "Roxo", value: "#8B5CF6" },
    { name: "Azul", value: "#3B82F6" },
    { name: "Verde", value: "#10B981" },
    { name: "Rosa", value: "#EC4899" },
    { name: "Laranja", value: "#F59E0B" },
  ];

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateOrganizerProfile({
        page_title: pageSettings.title,
        page_subtitle: pageSettings.subtitle,
        page_description: pageSettings.description,
        theme: pageSettings.theme,
        primary_color: pageSettings.primaryColor,
        show_statistics: pageSettings.showStats,
        show_events: pageSettings.showEvents,
        show_contact: pageSettings.showContact,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organizerData) return;

    try {
      setIsUploadingAvatar(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${organizerData.id}/cover.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(fileName);

      await updateOrganizerProfile({ cover_image_url: publicUrl });
      toast.success('Imagem de capa atualizada!');
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Personalizar Página</h2>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Título da Página</Label>
            <Input
              id="title"
              value={pageSettings.title}
              onChange={(e) => setPageSettings({...pageSettings, title: e.target.value})}
              placeholder="Nome do organizador/empresa"
            />
          </div>
          
          <div>
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Input
              id="subtitle"
              value={pageSettings.subtitle}
              onChange={(e) => setPageSettings({...pageSettings, subtitle: e.target.value})}
              placeholder="Descrição curta"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={pageSettings.description}
              onChange={(e) => setPageSettings({...pageSettings, description: e.target.value})}
              placeholder="Descrição detalhada do seu trabalho"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Visual Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Tema Visual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tema</Label>
            <Select value={pageSettings.theme} onValueChange={(value) => setPageSettings({...pageSettings, theme: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themes.map((theme) => (
                  <SelectItem key={theme.value} value={theme.value}>
                    {theme.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Cor Principal</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    pageSettings.primaryColor === color.value 
                      ? 'border-foreground scale-110' 
                      : 'border-border hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setPageSettings({...pageSettings, primaryColor: color.value})}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Imagem de Capa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center overflow-hidden">
              {organizerData?.cover_image_url ? (
                <img 
                  src={organizerData.cover_image_url} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-foreground">
                  {pageSettings.title.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
              />
              <label htmlFor="avatar-upload">
                <Button 
                  variant="outline" 
                  className="w-full cursor-pointer"
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Alterar Foto de Capa
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Recomendado: 1200x400px, máximo 5MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Seções da Página</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Estatísticas</p>
              <p className="text-sm text-muted-foreground">Mostrar seguidores, eventos, etc.</p>
            </div>
            <Switch 
              checked={pageSettings.showStats}
              onCheckedChange={(checked) => setPageSettings({...pageSettings, showStats: checked})}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Lista de Eventos</p>
              <p className="text-sm text-muted-foreground">Exibir eventos atuais e futuros</p>
            </div>
            <Switch 
              checked={pageSettings.showEvents}
              onCheckedChange={(checked) => setPageSettings({...pageSettings, showEvents: checked})}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Informações de Contato</p>
              <p className="text-sm text-muted-foreground">Links e formas de contato</p>
            </div>
            <Switch 
              checked={pageSettings.showContact}
              onCheckedChange={(checked) => setPageSettings({...pageSettings, showContact: checked})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Changes */}
      <div className="flex gap-3">
        <Button 
          className="flex-1" 
          onClick={handleSave}
          disabled={isSaving || loading}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            'Salvar Alterações'
          )}
        </Button>
        <Button variant="outline">
          Visualizar
        </Button>
      </div>
    </div>
  );
}