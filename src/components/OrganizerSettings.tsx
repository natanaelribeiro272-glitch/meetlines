import { Users, Download, Shield, User, Bell, HelpCircle, LogOut, Trash2, Lock, Link as LinkIcon, MessageCircle, Instagram, Music, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useOrganizer } from "@/hooks/useOrganizer";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
export default function OrganizerSettings() {
  const {
    signOut
  } = useAuth();
  const {
    organizerData,
    updateOrganizerProfile
  } = useOrganizer();
  const [isSaving, setIsSaving] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    whatsapp_url: "",
    instagram_url: "",
    playlist_url: "",
    location_url: "",
    website_url: "",
    show_whatsapp: false,
    show_instagram: false,
    show_playlist: false,
    show_location: false,
    show_website: false
  });
  useEffect(() => {
    if (organizerData) {
      setSocialLinks({
        whatsapp_url: organizerData.whatsapp_url || "",
        instagram_url: organizerData.instagram_url || "",
        playlist_url: organizerData.playlist_url || "",
        location_url: organizerData.location_url || "",
        website_url: organizerData.website_url || "",
        show_whatsapp: organizerData.show_whatsapp || false,
        show_instagram: organizerData.show_instagram || false,
        show_playlist: organizerData.show_playlist || false,
        show_location: organizerData.show_location || false,
        show_website: organizerData.show_website || false
      });
    }
  }, [organizerData]);
  const handleLogout = () => {
    signOut();
  };
  const handleDeleteAccount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Você precisa estar logado para deletar sua conta');
        return;
      }

      const { error } = await supabase.functions.invoke('delete-user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error deleting account:', error);
        toast.error('Erro ao deletar conta. Tente novamente.');
        return;
      }

      toast.success('Conta deletada com sucesso!');
      
      // Sign out and redirect to auth page
      await supabase.auth.signOut();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao deletar conta. Tente novamente.');
    }
  };
  const handleSaveLinks = async () => {
    try {
      setIsSaving(true);
      await updateOrganizerProfile(socialLinks);
    } catch (error) {
      console.error('Error saving links:', error);
    } finally {
      setIsSaving(false);
    }
  };
  return <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Configurações</h2>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Editar Perfil</p>
              <p className="text-sm text-muted-foreground">Alterar informações pessoais</p>
            </div>
            <Button variant="outline" size="sm">
              Editar
            </Button>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Alterar Senha</p>
              <p className="text-sm text-muted-foreground">Atualizar sua senha de acesso</p>
            </div>
            <Button variant="outline" size="sm">
              <Lock className="h-4 w-4 mr-1" />
              Alterar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Novos Cadastros</p>
              <p className="text-sm text-muted-foreground">Receber quando alguém se cadastrar</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Lembrete de Eventos</p>
              <p className="text-sm text-muted-foreground">Notificar 1 hora antes do evento</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Email Marketing</p>
              <p className="text-sm text-muted-foreground">Receber dicas e novidades</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Privacidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Página Pública</p>
              <p className="text-sm text-muted-foreground">Permitir que outros vejam sua página</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Mostrar Estatísticas</p>
              <p className="text-sm text-muted-foreground">Exibir número de seguidores e eventos</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Ajuda e Suporte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            <HelpCircle className="h-4 w-4 mr-2" />
            Central de Ajuda
          </Button>
          
          <Button variant="outline" className="w-full justify-start">
            <Bell className="h-4 w-4 mr-2" />
            Reportar Problema
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardContent className="p-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                <LogOut className="h-4 w-4 mr-2" />
                Sair da Conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Logout</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja sair da sua conta? Você precisará fazer login novamente para acessar.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>
                  Sair
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            Zona de Perigo
          </CardTitle>
        </CardHeader>
        <CardContent>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => window.open('/registrations', '_blank')}>
                <Users className="h-4 w-4 mr-2" />
                Ver Todos os Cadastros
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </Button>
            </CardContent>
          </Card>
            <div>
              <p className="font-medium text-foreground">Excluir Conta</p>
              <p className="text-sm text-muted-foreground">
                Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.
              </p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Conta Permanentemente</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é irreversível. Todos os seus eventos, cadastros e dados serão permanentemente excluídos.
                    Você poderá criar uma nova conta a qualquer momento com o mesmo email.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                    Excluir Definitivamente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>;
}