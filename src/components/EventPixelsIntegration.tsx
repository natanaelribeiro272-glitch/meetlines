import { useState, useEffect } from "react";
import { Plus, Trash2, Settings2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EventPixel {
  id: string;
  platform: string;
  pixel_id: string;
  is_active: boolean;
  conversion_events?: any;
}

interface EventPixelsIntegrationProps {
  eventId: string;
}

const PIXEL_PLATFORMS = [
  { value: "facebook", label: "Meta Pixel (Facebook/Instagram)", icon: "📘" },
  { value: "google_ads", label: "Google Ads", icon: "🔍" },
  { value: "tiktok", label: "TikTok Pixel", icon: "🎵" },
  { value: "linkedin", label: "LinkedIn Insight Tag", icon: "💼" },
  { value: "twitter", label: "Twitter Pixel", icon: "🐦" },
  { value: "custom", label: "Pixel Personalizado", icon: "⚙️" }
];

export default function EventPixelsIntegration({ eventId }: EventPixelsIntegrationProps) {
  const [pixels, setPixels] = useState<EventPixel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPixel, setEditingPixel] = useState<EventPixel | null>(null);
  const [formData, setFormData] = useState({
    platform: "",
    pixel_id: "",
    is_active: true
  });

  useEffect(() => {
    loadPixels();
  }, [eventId]);

  const loadPixels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("event_pixels")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPixels(data || []);
    } catch (error) {
      console.error("Error loading pixels:", error);
      toast.error("Erro ao carregar pixels");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (pixel?: EventPixel) => {
    if (pixel) {
      setEditingPixel(pixel);
      setFormData({
        platform: pixel.platform,
        pixel_id: pixel.pixel_id,
        is_active: pixel.is_active
      });
    } else {
      setEditingPixel(null);
      setFormData({
        platform: "",
        pixel_id: "",
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleSavePixel = async () => {
    try {
      if (!formData.platform || !formData.pixel_id) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      if (editingPixel) {
        const { error } = await supabase
          .from("event_pixels")
          .update({
            platform: formData.platform,
            pixel_id: formData.pixel_id,
            is_active: formData.is_active
          })
          .eq("id", editingPixel.id);

        if (error) throw error;
        toast.success("Pixel atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("event_pixels")
          .insert({
            event_id: eventId,
            platform: formData.platform,
            pixel_id: formData.pixel_id,
            is_active: formData.is_active
          });

        if (error) throw error;
        toast.success("Pixel adicionado com sucesso");
      }

      setDialogOpen(false);
      loadPixels();
    } catch (error: any) {
      console.error("Error saving pixel:", error);
      toast.error(error.message || "Erro ao salvar pixel");
    }
  };

  const handleDeletePixel = async (pixelId: string) => {
    if (!confirm("Tem certeza que deseja remover este pixel?")) return;

    try {
      const { error } = await supabase
        .from("event_pixels")
        .delete()
        .eq("id", pixelId);

      if (error) throw error;
      toast.success("Pixel removido com sucesso");
      loadPixels();
    } catch (error) {
      console.error("Error deleting pixel:", error);
      toast.error("Erro ao remover pixel");
    }
  };

  const handleToggleActive = async (pixel: EventPixel) => {
    try {
      const { error } = await supabase
        .from("event_pixels")
        .update({ is_active: !pixel.is_active })
        .eq("id", pixel.id);

      if (error) throw error;
      toast.success(pixel.is_active ? "Pixel desativado" : "Pixel ativado");
      loadPixels();
    } catch (error) {
      console.error("Error toggling pixel:", error);
      toast.error("Erro ao alterar status do pixel");
    }
  };

  const getPlatformInfo = (platform: string) => {
    return PIXEL_PLATFORMS.find(p => p.value === platform) || { label: platform, icon: "📊" };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Carregando pixels...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Integrações de Pixels</CardTitle>
              <CardDescription>
                Adicione pixels de rastreamento para monitorar conversões e criar audiências
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Pixel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Os pixels serão disparados quando usuários visualizarem o evento, se registrarem e comprarem ingressos.
            </AlertDescription>
          </Alert>

          {pixels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum pixel configurado ainda</p>
              <p className="text-xs mt-1">Adicione pixels para rastrear suas conversões</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pixels.map((pixel) => {
                const platformInfo = getPlatformInfo(pixel.platform);
                return (
                  <div
                    key={pixel.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{platformInfo.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium">{platformInfo.label}</p>
                        <p className="text-sm text-muted-foreground">ID: {pixel.pixel_id}</p>
                      </div>
                      <Switch
                        checked={pixel.is_active}
                        onCheckedChange={() => handleToggleActive(pixel)}
                      />
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(pixel)}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePixel(pixel.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPixel ? "Editar Pixel" : "Adicionar Pixel"}
            </DialogTitle>
            <DialogDescription>
              Configure o pixel de rastreamento para este evento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Plataforma</Label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData({ ...formData, platform: value })}
              >
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Selecione a plataforma" />
                </SelectTrigger>
                <SelectContent>
                  {PIXEL_PLATFORMS.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      {platform.icon} {platform.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pixel_id">ID do Pixel</Label>
              <Input
                id="pixel_id"
                placeholder="Ex: 1234567890"
                value={formData.pixel_id}
                onChange={(e) => setFormData({ ...formData, pixel_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Cole o ID do pixel fornecido pela plataforma
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="active">Pixel ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePixel}>
              {editingPixel ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
