import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.21.0";
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
    console.log("[Checkout] Starting checkout process");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY não configurado. Configure no Supabase Dashboard → Edge Functions → Secrets");
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

    console.log("[Checkout] Getting user");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Não autorizado. Faça login para continuar.");
    }

    console.log("[Checkout] User authenticated:", user.id);
    const {
      ticketTypeId,
      quantity,
      eventId,
      totalAmount: providedTotal,
      platformFee: providedPlatformFee,
      processingFee: providedProcessingFee,
      subtotal: providedSubtotal
    } = await req.json();
    console.log("[Checkout] Request data:", {
      ticketTypeId,
      quantity,
      eventId,
      providedTotal,
      providedPlatformFee,
      providedProcessingFee,
      providedSubtotal
    });

    console.log("[Checkout] Fetching ticket type");
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
      console.error("[Checkout] Ticket type error:", ticketError);
      throw new Error(`Tipo de ingresso não encontrado: ${ticketError?.message || "ID inválido"}`);
    }

    console.log("[Checkout] Ticket type found:", ticketType.name);
    const event = ticketType.events;

    const { data: profile } = await supabaseService
      .from("profiles")
      .select("display_name, phone")
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("[Checkout] Initializing Stripe");
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const unitPrice = Number(ticketType.price);

    // Use values from frontend if provided, otherwise calculate
    const subtotal = providedSubtotal ?? unitPrice * quantity;
    const platformFee = providedPlatformFee ?? 0;
    const processingFee = providedProcessingFee ?? 0;
    const totalAmount = providedTotal ?? subtotal;

    console.log("[Checkout] Price calculation:", {
      unitPrice,
      quantity,
      subtotal,
      platformFee,
      processingFee,
      totalAmount
    });

    console.log("[Checkout] Creating ticket sale record");
    const ticketSale = await supabaseService
      .from("ticket_sales")
      .insert({
        user_id: user.id,
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        quantity: quantity,
        unit_price: unitPrice,
        subtotal: subtotal,
        platform_fee: platformFee,
        payment_processing_fee: processingFee,
        total_amount: totalAmount,
        buyer_name: profile?.display_name || user.email?.split("@")[0] || "Usuário",
        buyer_email: user.email || "",
        buyer_phone: profile?.phone || null,
        payment_status: "pending",
      })
      .select()
      .single();

    if (ticketSale.error) {
      console.error("[Checkout] Failed to create ticket sale:", ticketSale.error);
      throw new Error(`Erro ao criar registro de venda: ${ticketSale.error.message}`);
    }

    console.log("[Checkout] Ticket sale created:", ticketSale.data.id);
    console.log("[Checkout] Amount to charge:", totalAmount);

    // Stripe charges the TOTAL amount (including fees)
    const lineItems = [{
      price_data: {
        currency: "brl",
        product_data: {
          name: `${ticketType.name} - ${event.title}`,
          description: `${quantity}x ${ticketType.name} (inclui taxas)`,
        },
        unit_amount: Math.round((totalAmount / quantity) * 100),
      },
      quantity: quantity,
    }];

    console.log("[Checkout] Line items:", JSON.stringify(lineItems));

    console.log("[Checkout] Creating Stripe session");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/ticket-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/event/${eventId}`,
      metadata: {
        ticket_sale_id: ticketSale.data.id,
        ticket_type_id: ticketTypeId,
        event_id: eventId,
        user_id: user.id,
        quantity: quantity.toString(),
        product_name: "ingressos meetlines",
        platform_fee: platformFee.toFixed(2),
        processing_fee: processingFee.toFixed(2),
        subtotal: subtotal.toFixed(2),
        total_amount: totalAmount.toFixed(2),
      },
    });

    console.log("[Checkout] Stripe session created:", session.id);

    await supabaseService
      .from("ticket_sales")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", ticketSale.data.id);

    console.log("[Checkout] Success! Returning URL:", session.url);

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error creating checkout:", error);
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