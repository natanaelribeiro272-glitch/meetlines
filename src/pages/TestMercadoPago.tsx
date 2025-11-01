import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function TestMercadoPago() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testMercadoPago = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke('test-mercadopago', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });

      console.log('Test response:', response);
      setResult(response);
    } catch (error) {
      console.error('Test error:', error);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Teste Mercado Pago API</h1>

      <Card className="p-6">
        <Button onClick={testMercadoPago} disabled={loading}>
          {loading ? "Testando..." : "Testar API Mercado Pago"}
        </Button>

        {result && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Resultado:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}
