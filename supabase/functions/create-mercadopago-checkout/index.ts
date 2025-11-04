import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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
    console.log("[MercadoPago PIX] Starting PIX checkout process");

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    console.log("[MercadoPago PIX] Access Token present:", !!accessToken);

    if (!accessToken) {
      console.error("[MercadoPago PIX] MERCADOPAGO_ACCESS_TOKEN not found in environment");
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado. Por favor, configure o Access Token do Mercado Pago nos secrets do Supabase.");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") ?? "",
          },
        },
      }
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Não autorizado. Faça login para continuar.");
    }

    const {
      ticketTypeId,
      quantity,
      eventId,
      totalAmount,
      platformFee,
      processingFee,
      subtotal,
      promoCodeId,
      promoDiscount
    } = await req.json();

    console.log("[MercadoPago PIX] Request data:", {
      ticketTypeId,
      quantity,
      eventId,
      totalAmount,
    });

    const { data: ticketType, error: ticketError } = await supabaseService
      .from("ticket_types")
      .select(`
        *,
        events!inner(
          id,
          title,
          organizer_id
        )
      `)
      .eq("id", ticketTypeId)
      .single();

    if (ticketError || !ticketType) {
      throw new Error(`Tipo de ingresso não encontrado: ${ticketError?.message || "ID inválido"}`);
    }

    const event = ticketType.events;

    const { data: profile } = await supabaseService
      .from("profiles")
      .select("display_name, phone, email")
      .eq("user_id", user.id)
      .maybeSingle();

    const unitPrice = Number(ticketType.price);
    const calculatedSubtotal = Number(subtotal ?? unitPrice * quantity);
    const calculatedPlatformFee = Number(platformFee ?? 0);
    const calculatedProcessingFee = Number(processingFee ?? 0);
    const calculatedTotalAmount = Number(totalAmount ?? calculatedSubtotal);

    console.log("[MercadoPago PIX] Calculated values:", {
      unitPrice,
      calculatedSubtotal,
      calculatedPlatformFee,
      calculatedProcessingFee,
      calculatedTotalAmount,
      quantity
    });

    if (isNaN(calculatedTotalAmount) || calculatedTotalAmount <= 0) {
      throw new Error(`Invalid total amount: ${calculatedTotalAmount}. Original value: ${totalAmount}`);
    }

    const roundedTotalAmount = Math.round(calculatedTotalAmount * 100) / 100;

    console.log("[MercadoPago PIX] Rounded total amount:", roundedTotalAmount);
    console.log("[MercadoPago PIX] Creating ticket sale record");
    const ticketSale = await supabaseService
      .from("ticket_sales")
      .insert({
        user_id: user.id,
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        quantity: quantity,
        unit_price: unitPrice,
        subtotal: calculatedSubtotal,
        platform_fee: calculatedPlatformFee,
        payment_processing_fee: calculatedProcessingFee,
        total_amount: calculatedTotalAmount,
        buyer_name: profile?.display_name || user.email?.split("@")[0] || "Usuário",
        buyer_email: user.email || "",
        buyer_phone: profile?.phone || null,
        payment_status: "pending",
        payment_method: "pix",
        payment_gateway: "mercadopago",
        promo_code_id: promoCodeId || null,
        promo_discount: promoDiscount || 0,
      })
      .select()
      .single();

    if (ticketSale.error) {
      throw new Error(`Erro ao criar registro de venda: ${ticketSale.error.message}`);
    }

    console.log("[MercadoPago PIX] Ticket sale created:", ticketSale.data.id);

    const paymentData = {
      transaction_amount: roundedTotalAmount,
      description: `${quantity}x ${ticketType.name} - ${event.title}`,
      payment_method_id: "pix",
      payer: {
        email: user.email || "",
        first_name: profile?.display_name || user.email?.split("@")[0] || "Usuário",
        last_name: "",
      },
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
      external_reference: ticketSale.data.id,
      metadata: {
        ticket_sale_id: ticketSale.data.id,
        ticket_type_id: ticketTypeId,
        event_id: eventId,
        user_id: user.id,
        quantity: quantity.toString(),
      },
    };

    console.log("[MercadoPago PIX] Creating PIX payment with data:", JSON.stringify(paymentData, null, 2));

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": ticketSale.data.id,
      },
      body: JSON.stringify(paymentData),
    });

    console.log("[MercadoPago PIX] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[MercadoPago PIX] API Error Response:", errorText);

      let errorMessage = "Erro ao criar pagamento PIX";
      try {
        const errorJson = JSON.parse(errorText);
        console.error("[MercadoPago PIX] Parsed error:", JSON.stringify(errorJson, null, 2));

        if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        } else if (errorJson.cause && errorJson.cause.length > 0) {
          errorMessage = errorJson.cause.map((c: any) => `${c.code}: ${c.description}`).join(", ");
        }
      } catch (e) {
        errorMessage = errorText;
      }

      throw new Error(`${errorMessage} (Status: ${response.status})`);
    }

    const paymentResponse = await response.json();
    console.log("[MercadoPago PIX] Payment created successfully:", paymentResponse.id);
    console.log("[MercadoPago PIX] Payment status:", paymentResponse.status);

    const qrCode = paymentResponse.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = paymentResponse.point_of_interaction?.transaction_data?.qr_code_base64;
    const ticketUrl = paymentResponse.point_of_interaction?.transaction_data?.ticket_url;

    console.log("[MercadoPago PIX] QR Code present:", !!qrCode);
    console.log("[MercadoPago PIX] QR Code Base64 present:", !!qrCodeBase64);

    if (!qrCode) {
      console.error("[MercadoPago PIX] Full payment response:", JSON.stringify(paymentResponse, null, 2));
      throw new Error("QR Code PIX não foi gerado. Verifique se sua conta está configurada para aceitar PIX.");
    }

    await supabaseService
      .from("ticket_sales")
      .update({
        mercadopago_payment_id: paymentResponse.id.toString(),
        mercadopago_preference_id: paymentResponse.id.toString(),
      })
      .eq("id", ticketSale.data.id);

    console.log("[MercadoPago PIX] Success! Returning PIX QR Code data");

    return new Response(
      JSON.stringify({
        paymentId: paymentResponse.id,
        qrCode: qrCode,
        qrCodeBase64: qrCodeBase64,
        ticketUrl: ticketUrl,
        expirationDate: paymentResponse.date_of_expiration,
        transactionAmount: roundedTotalAmount,
        ticketSaleId: ticketSale.data.id,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[MercadoPago PIX] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[MercadoPago PIX] Error details:", errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
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