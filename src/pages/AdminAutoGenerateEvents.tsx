import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Sparkles, Loader2, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminAutoGenerateEvents() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cityName, setCityName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  if (adminLoading) {
    return null;
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const handleSearchByCity = async () => {
    if (!cityName.trim()) {
      toast.error('Por favor, insira o nome da cidade');
      return;
    }

    setIsProcessing(true);

    try {
      const query = searchQuery.trim() || `eventos ${cityName.trim()}`;

      const { data, error } = await supabase.functions.invoke('search-events-by-city', {
        body: {
          city: cityName.trim(),
          searchQuery: query
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.success) {
        const count = data.eventsCreated || 0;
        toast.success(`${count} evento(s) encontrado(s) e criado(s) com sucesso!`);

        setTimeout(() => {
          navigate('/admin/pending-events');
        }, 1500);
      } else {
        const errorMsg = data?.error || 'Erro ao buscar eventos';

        if (errorMsg.includes('OPENAI_API_KEY')) {
          toast.error('Configuração necessária: OPENAI_API_KEY não está configurada no Supabase', {
            description: 'Configure em: Dashboard → Edge Functions → Secrets',
            duration: 8000
          });
        } else if (errorMsg.includes('Nenhum evento encontrado')) {
          toast.error(`Nenhum evento encontrado para "${cityName}"`, {
            description: 'Tente outra cidade ou termo de busca diferente.',
            duration: 5000
          });
        } else {
          toast.error(errorMsg, {
            duration: 5000
          });
        }
        return;
      }
    } catch (error) {
      console.error('Error searching by city:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao processar busca';

      if (errorMsg.includes('OPENAI_API_KEY') || errorMsg.includes('não configurada')) {
        toast.error('Configure OPENAI_API_KEY no Supabase Dashboard', {
          description: 'Acesse: Dashboard → Edge Functions → Secrets',
          duration: 8000
        });
      } else {
        toast.error(`Erro: ${errorMsg}`, {
          duration: 5000
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Gerar Eventos Automaticamente</h1>
          <p className="text-muted-foreground">Busque eventos por cidade usando IA</p>
        </div>
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">Configuração Necessária</AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          Esta funcionalidade requer que a <strong>OPENAI_API_KEY</strong> esteja configurada no Supabase.
          <br />
          <span className="text-sm">
            Configure em: <strong>Supabase Dashboard → Edge Functions → Secrets</strong>
          </span>
          <br />
          <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 block">
            Opcional: Configure <strong>SERPAPI_API_KEY</strong> para resultados mais precisos (https://serpapi.com)
          </span>
        </AlertDescription>
      </Alert>

      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MapPin className="h-6 w-6" />
            Buscar Eventos por Cidade
          </CardTitle>
          <CardDescription className="text-base">
            Nossa IA irá buscar eventos no Google para a cidade especificada, analisar os resultados
            e criar eventos automaticamente como "pendentes" para sua revisão e aprovação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="cityName" className="text-base font-semibold">
              Nome da Cidade *
            </Label>
            <Input
              id="cityName"
              type="text"
              placeholder="Ex: São Paulo, Rio de Janeiro, Belo Horizonte, Porto Alegre"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              disabled={isProcessing}
              className="text-base h-12"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && cityName.trim()) {
                  handleSearchByCity();
                }
              }}
            />
            <p className="text-sm text-muted-foreground">
              Digite o nome da cidade onde deseja buscar eventos
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="searchQuery" className="text-base font-semibold">
              Termo de Busca (opcional)
            </Label>
            <Input
              id="searchQuery"
              type="text"
              placeholder="Ex: shows, festas, teatro, exposições, baladas, música ao vivo"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isProcessing}
              className="text-base h-12"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && cityName.trim()) {
                  handleSearchByCity();
                }
              }}
            />
            <p className="text-sm text-muted-foreground">
              Deixe em branco para buscar todos os tipos de eventos, ou especifique um tipo
            </p>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSearchByCity}
              disabled={isProcessing || !cityName.trim()}
              className="w-full h-14 text-lg"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Buscando e criando eventos...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Buscar e Criar Eventos
                </>
              )}
            </Button>
          </div>

          <div className="pt-6 border-t space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Como funciona:
            </h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside pl-2">
              <li className="pl-2">
                <strong>Busca Inteligente:</strong> A IA realiza uma busca no Google pelos eventos na cidade especificada
              </li>
              <li className="pl-2">
                <strong>Análise Automática:</strong> Os resultados são analisados e as informações dos eventos são extraídas (título, data, local, preço, categoria, etc)
              </li>
              <li className="pl-2">
                <strong>Criação Automática:</strong> Os eventos são criados automaticamente no sistema com status "pendente"
              </li>
              <li className="pl-2">
                <strong>Revisão:</strong> Você pode revisar, editar e aprovar cada evento antes de publicá-lo na plataforma
              </li>
              <li className="pl-2">
                <strong>Publicação:</strong> Após aprovação, os eventos ficam visíveis para todos os usuários
              </li>
            </ol>
          </div>

          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-900 dark:text-amber-100">Dica</AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                <li>Seja específico no termo de busca para obter melhores resultados</li>
                <li>A IA retorna até 5 eventos por busca</li>
                <li>Eventos com datas passadas são automaticamente filtrados</li>
                <li>Todos os eventos criados precisam ser revisados antes da publicação</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Exemplos de Buscas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start h-auto p-4 text-left"
              onClick={() => {
                setCityName('São Paulo');
                setSearchQuery('shows de rock');
              }}
              disabled={isProcessing}
            >
              <div className="flex flex-col items-start gap-1">
                <span className="font-semibold">Shows de Rock</span>
                <span className="text-xs text-muted-foreground">em São Paulo</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto p-4 text-left"
              onClick={() => {
                setCityName('Rio de Janeiro');
                setSearchQuery('festas');
              }}
              disabled={isProcessing}
            >
              <div className="flex flex-col items-start gap-1">
                <span className="font-semibold">Festas</span>
                <span className="text-xs text-muted-foreground">no Rio de Janeiro</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto p-4 text-left"
              onClick={() => {
                setCityName('Belo Horizonte');
                setSearchQuery('teatro');
              }}
              disabled={isProcessing}
            >
              <div className="flex flex-col items-start gap-1">
                <span className="font-semibold">Teatro</span>
                <span className="text-xs text-muted-foreground">em Belo Horizonte</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto p-4 text-left"
              onClick={() => {
                setCityName('Porto Alegre');
                setSearchQuery('');
              }}
              disabled={isProcessing}
            >
              <div className="flex flex-col items-start gap-1">
                <span className="font-semibold">Todos os Eventos</span>
                <span className="text-xs text-muted-foreground">em Porto Alegre</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
