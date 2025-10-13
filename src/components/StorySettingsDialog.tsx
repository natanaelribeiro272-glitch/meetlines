import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function StorySettingsDialog() {
  const [open, setOpen] = useState(false);
  const [storyVisibility, setStoryVisibility] = useState<string>("both");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      loadSettings();
    }
  }, [open, user]);

  const loadSettings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('story_visible_to')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setStoryVisibility(data.story_visible_to || 'both');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ story_visible_to: storyVisibility })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Configurações salvas!');
      setOpen(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-surface border-border">
        <DialogHeader>
          <DialogTitle>Configurações de Stories</DialogTitle>
          <DialogDescription>
            Escolha quem pode ver seus stories
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={storyVisibility} onValueChange={setStoryVisibility}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="both" />
              <Label htmlFor="both" className="cursor-pointer">
                Todos (amigos e pessoas próximas)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="friends_only" id="friends_only" />
              <Label htmlFor="friends_only" className="cursor-pointer">
                Apenas amigos
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nearby_only" id="nearby_only" />
              <Label htmlFor="nearby_only" className="cursor-pointer">
                Apenas pessoas próximas
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
