import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Sparkles, Loader2, Upload, Image as ImageIcon } from 'lucide-react';

export default function AdminAutoGenerateEvents() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  if (adminLoading) {
    return null;
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractFromImage = async () => {
    if (!selectedImage) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const { data, error } = await supabase.functions.invoke('extract-event-from-image', {
          body: { image: base64Image }
        });

        if (error) throw error;

        if (data?.success) {
          const message = data.message || 'Evento extraído da imagem com sucesso!';
          toast.success(message + ' Verifique e complete os campos necessários na revisão.');
          navigate('/admin/pending-events');
        } else {
          throw new Error(data?.error || 'Erro ao extrair evento da imagem');
        }
      };
      reader.readAsDataURL(selectedImage);
    } catch (error) {
      console.error('Error extracting from image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar imagem';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtractEvents = async () => {
    if (!apiEndpoint.trim()) {
      toast.error('Por favor, insira um endpoint de API');
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('extract-events', {
        body: {
          apiEndpoint: apiEndpoint.trim(),
          apiKey: apiKey.trim() || undefined
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message || 'Eventos extraídos com sucesso!');
        navigate('/admin/pending-events');
      } else {
        throw new Error(data?.error || 'Erro ao extrair eventos');
      }
    } catch (error) {
      console.error('Error extracting events:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar dados');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Gerar Eventos Automaticamente</h1>
          <p className="text-muted-foreground">Use IA para extrair eventos de APIs externas</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Extrair de Imagem
          </CardTitle>
          <CardDescription>
            Faça upload de uma imagem de evento (flyer, cartaz, banner promocional) e nossa IA irá extrair todas as informações 
            disponíveis automaticamente. Não precisa ter todos os dados - você pode completar manualmente os campos que 
            faltarem. O evento será salvo como "pendente" para revisão e edição antes da publicação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image">Upload de Imagem *</Label>
            <div className="flex flex-col gap-4">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={isProcessing}
                className="cursor-pointer"
              />
              {imagePreview && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-contain bg-muted"
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: JPG, PNG, WEBP
            </p>
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleExtractFromImage} 
              disabled={isProcessing || !selectedImage}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando imagem...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Extrair Evento da Imagem
                </>
              )}
            </Button>
          </div>

          <div className="pt-4 border-t space-y-2">
            <h3 className="font-semibold text-sm">Como funciona:</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>A IA analisa a imagem e identifica informações do evento</li>
              <li>Extrai título, data, local, preço e outras informações disponíveis</li>
              <li>Cria o evento como "pendente" mesmo com dados incompletos</li>
              <li>Você completa os campos faltantes e aprova antes de publicar</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Extração de API Externa
          </CardTitle>
          <CardDescription>
            Forneça um endpoint de API que retorne dados de eventos. Nossa IA irá analisar os dados e extrair 
            automaticamente as informações dos eventos. Os eventos serão salvos como "pendentes" para sua aprovação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="endpoint">Endpoint da API *</Label>
            <Input
              id="endpoint"
              type="url"
              placeholder="https://api.exemplo.com/eventos"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              URL completa do endpoint que retorna dados de eventos (JSON ou HTML)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">Chave API (opcional)</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Bearer token ou API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Se a API requer autenticação, insira a chave aqui
            </p>
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleExtractEvents} 
              disabled={isProcessing || !apiEndpoint.trim()}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Extrair Eventos com IA
                </>
              )}
            </Button>
          </div>

          <div className="pt-4 border-t space-y-2">
            <h3 className="font-semibold text-sm">Como funciona:</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>A IA busca dados do endpoint fornecido</li>
              <li>Analisa e extrai informações de eventos automaticamente</li>
              <li>Cria eventos como "pendentes" para revisão</li>
              <li>Você revisa e aprova os eventos antes de publicá-los</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}