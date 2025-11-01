import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("[TEST] Starting MercadoPago test");

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    console.log("[TEST] Environment variables check:");
    console.log("[TEST] - MERCADOPAGO_ACCESS_TOKEN present:", !!accessToken);
    console.log("[TEST] - Token length:", accessToken?.length || 0);
    console.log("[TEST] - Token prefix:", accessToken?.substring(0, 15) || "N/A");
    console.log("[TEST] - SUPABASE_URL:", Deno.env.get("SUPABASE_URL"));

    if (!accessToken) {
      const error = {
        error: "MERCADOPAGO_ACCESS_TOKEN não configurado",
        message: "O Access Token do Mercado Pago não está configurado nas variáveis de ambiente do Supabase.",
        instructions: "Configure o secret MERCADOPAGO_ACCESS_TOKEN no painel do Supabase."
      };
      console.error("[TEST] Error:", error);
      return new Response(
        JSON.stringify(error),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const testPayment = {
      transaction_amount: 10.50,
      description: "Teste PIX - MeetLines",
      payment_method_id: "pix",
      payer: {
        email: "teste@teste.com",
        first_name: "Teste",
        last_name: "Usuario",
      },
    };

    console.log("[TEST] Sending test payment to MercadoPago API:", JSON.stringify(testPayment, null, 2));

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(testPayment),
    });

    console.log("[TEST] Response status:", response.status);
    console.log("[TEST] Response status text:", response.statusText);

    const responseText = await response.text();
    console.log("[TEST] Response body:", responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw: responseText, parseError: String(e) };
    }

    const result = {
      success: response.ok,
      httpStatus: response.status,
      statusText: response.statusText,
      mercadopagoResponse: responseData,
      tokenInfo: {
        configured: true,
        length: accessToken.length,
        prefix: accessToken.substring(0, 15),
      },
      testData: testPayment
    };

    console.log("[TEST] Final result:", JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify(result, null, 2),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[TEST] Unexpected error:", error);
    const errorResult = {
      error: "Erro inesperado no teste",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    return new Response(
      JSON.stringify(errorResult),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
