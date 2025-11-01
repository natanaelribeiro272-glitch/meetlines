import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function TestMercadoPago() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testMercadoPago = async () => {
    setLoading(true);
    setResult({ status: 'Iniciando teste...' });

    try {
      console.log('Getting session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session ? 'OK' : 'NO SESSION');

      setResult({ status: 'Chamando função edge...' });

      const response = await supabase.functions.invoke('test-mercadopago', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });

      console.log('Full test response:', response);
      console.log('Response data:', response.data);
      console.log('Response error:', response.error);

      setResult({
        success: !response.error,
        data: response.data,
        error: response.error,
        fullResponse: response
      });
    } catch (error) {
      console.error('Test error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Teste Mercado Pago API</h1>

      <Card className="p-6">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Este teste vai verificar se o Access Token do Mercado Pago está configurado corretamente
            e se a API está funcionando.
          </p>

          <Button onClick={testMercadoPago} disabled={loading} className="w-full">
            {loading ? "Testando..." : "🔍 Testar API Mercado Pago"}
          </Button>

          {loading && (
            <div className="text-center text-sm text-gray-500">
              Aguarde, testando conexão com Mercado Pago...
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Resultado:</h2>
                {result.success && <span className="text-green-600">✓ Sucesso</span>}
                {result.error && <span className="text-red-600">✗ Erro</span>}
              </div>

              <div className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-96 text-xs font-mono">
                {JSON.stringify(result, null, 2)}
              </div>

              <div className="text-sm text-gray-600">
                ⚠️ Verifique também o Console do navegador (F12) para logs detalhados
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
