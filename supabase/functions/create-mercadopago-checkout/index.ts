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
    console.log("[MercadoPago] Starting checkout process");

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("Sistema de pagamento Mercado Pago não configurado.");
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
    const calculatedSubtotal = subtotal ?? unitPrice * quantity;
    const calculatedPlatformFee = platformFee ?? 0;
    const calculatedProcessingFee = processingFee ?? 0;
    const calculatedTotalAmount = totalAmount ?? calculatedSubtotal;

    console.log("[MercadoPago] Creating ticket sale record");
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

    console.log("[MercadoPago] Ticket sale created:", ticketSale.data.id);

    const origin = req.headers.get("origin") || "https://meetlines.app";

    const preference = {
      items: [
        {
          id: ticketTypeId,
          title: `${ticketType.name} - ${event.title}`,
          description: `${quantity}x ${ticketType.name}`,
          quantity: 1,
          unit_price: calculatedTotalAmount,
          currency_id: "BRL",
        },
      ],
      payer: {
        name: profile?.display_name || user.email?.split("@")[0] || "Usuário",
        email: user.email || "",
        phone: profile?.phone ? {
          area_code: profile.phone.substring(0, 2),
          number: profile.phone.substring(2),
        } : undefined,
      },
      back_urls: {
        success: `${origin}/ticket-success`,
        failure: `${origin}/event/${eventId}`,
        pending: `${origin}/ticket-success`,
      },
      auto_return: "approved",
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
      external_reference: ticketSale.data.id,
      statement_descriptor: "MEETLINES",
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      metadata: {
        ticket_sale_id: ticketSale.data.id,
        ticket_type_id: ticketTypeId,
        event_id: eventId,
        user_id: user.id,
        quantity: quantity.toString(),
      },
    };

    console.log("[MercadoPago] Creating preference for Payment Brick");

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[MercadoPago] API Error:", errorText);

      let errorMessage = "Erro ao criar checkout";
      try {
        const errorJson = JSON.parse(errorText);
        console.error("[MercadoPago] Parsed error:", JSON.stringify(errorJson, null, 2));

        if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        } else if (errorJson.cause && errorJson.cause.length > 0) {
          errorMessage = errorJson.cause.map((c: any) => c.description || c.code).join(", ");
        }
      } catch (e) {
        errorMessage = errorText;
      }

      throw new Error(`${errorMessage} (Status: ${response.status})`);
    }

    const preferenceData = await response.json();
    console.log("[MercadoPago] Preference created:", preferenceData.id);

    await supabaseService
      .from("ticket_sales")
      .update({
        mercadopago_preference_id: preferenceData.id,
      })
      .eq("id", ticketSale.data.id);

    console.log("[MercadoPago] Success! Returning preference ID for Payment Brick");

    return new Response(
      JSON.stringify({
        preferenceId: preferenceData.id,
        ticketSaleId: ticketSale.data.id,
        amount: calculatedTotalAmount,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error creating MercadoPago checkout:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error details:", errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
