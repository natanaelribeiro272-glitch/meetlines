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
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    console.log("Access Token present:", !!accessToken);
    console.log("Access Token length:", accessToken?.length);
    console.log("Access Token starts with:", accessToken?.substring(0, 10));

    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
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

    console.log("Sending test payment:", JSON.stringify(testPayment, null, 2));

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(testPayment),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", JSON.stringify([...response.headers.entries()]));

    const responseText = await response.text();
    console.log("Response body:", responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw: responseText };
    }

    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        tokenInfo: {
          present: !!accessToken,
          length: accessToken?.length,
          prefix: accessToken?.substring(0, 15),
        }
      }, null, 2),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Test error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
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
