import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-TICKET-CHECKOUT] ${step}${detailsStr}`);
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { ticketTypeId, quantity, eventId } = await req.json();
    logStep("Request received", { ticketTypeId, quantity, eventId });

    if (!ticketTypeId || !quantity || !eventId) {
      throw new Error("Missing required parameters: ticketTypeId, quantity, eventId");
    }

    const { data: ticketType, error: ticketError } = await supabaseClient
      .from("ticket_types")
      .select("*, event:events(id, title, organizer_id)")
      .eq("id", ticketTypeId)
      .maybeSingle();

    if (ticketError) {
      logStep("Error fetching ticket type", { error: ticketError });
      throw new Error(`Erro ao buscar tipo de ingresso: ${ticketError.message}`);
    }

    if (!ticketType) {
      logStep("Ticket type not found", { ticketTypeId });
      throw new Error("Tipo de ingresso não encontrado");
    }
    logStep("Ticket type found", { ticketType });

    const { data: organizer, error: organizerError } = await supabaseClient
      .from("organizers")
      .select("user_id")
      .eq("id", ticketType.event.organizer_id)
      .maybeSingle();

    if (organizerError) {
      logStep("Error fetching organizer", { error: organizerError });
      throw new Error(`Erro ao buscar organizador: ${organizerError.message}`);
    }

    if (!organizer) {
      logStep("Organizer not found", { organizerId: ticketType.event.organizer_id });
      throw new Error("Organizador não encontrado");
    }

    if (organizer.user_id === user.id) {
      throw new Error("Organizadores não podem comprar ingressos dos próprios eventos");
    }

    logStep("User is not the organizer, proceeding with purchase");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const PLATFORM_FEE_PERCENTAGE = 3;
    const PROCESSING_FEE_PERCENTAGE = 4.99;
    const PROCESSING_FEE_FIXED = 0.39;

    const subtotal = ticketType.price * quantity;
    const platformFee = subtotal * (PLATFORM_FEE_PERCENTAGE / 100);
    const processingFee = (subtotal * (PROCESSING_FEE_PERCENTAGE / 100)) + PROCESSING_FEE_FIXED;
    const totalAmount = subtotal + platformFee + processingFee;

    logStep("Fees calculated", {
      subtotal,
      platformFee,
      processingFee,
      totalAmount
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = newCustomer.id;
      logStep("New customer created", { customerId });
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("display_name, phone")
      .eq("user_id", user.id)
      .maybeSingle();

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: existingSale } = await supabaseClient
      .from("ticket_sales")
      .select("id, stripe_checkout_session_id, created_at")
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .eq("ticket_type_id", ticketTypeId)
      .eq("payment_status", "pending")
      .gte("created_at", fiveMinutesAgo)
      .maybeSingle();

    if (existingSale?.stripe_checkout_session_id) {
      logStep("Found existing pending sale", { saleId: existingSale.id });
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(existingSale.stripe_checkout_session_id);
        if (existingSession.status === "open" && existingSession.url) {
          logStep("Reusing existing checkout session", { sessionId: existingSession.id });
          return new Response(
            JSON.stringify({
              url: existingSession.url,
              sessionId: existingSession.id,
              totalAmount: totalAmount,
              platformFee: platformFee,
              subtotal: subtotal
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        }
      } catch (stripeError) {
        logStep("Existing session no longer valid", { error: stripeError });
      }
    }

    const { data: saleData, error: saleError } = await supabaseClient
      .from("ticket_sales")
      .insert({
        user_id: user.id,
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        quantity,
        unit_price: ticketType.price,
        subtotal,
        platform_fee: platformFee,
        payment_processing_fee: processingFee,
        total_amount: totalAmount,
        buyer_name: profile?.display_name || user.email,
        buyer_email: user.email,
        buyer_phone: profile?.phone,
        payment_status: "pending",
      })
      .select()
      .single();

    if (saleError) {
      logStep("Error creating sale record", { error: saleError });
      throw new Error(`Failed to create sale record: ${saleError.message}`);
    }
    logStep("Sale record created", { saleId: saleData.id });

    const stripeProductId = Deno.env.get("STRIPE_PRODUCT_ID");
    if (!stripeProductId) {
      logStep("STRIPE_PRODUCT_ID not configured, using dynamic product");
    }

    const sessionParams: any = {
      customer: customerId,
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product: stripeProductId || undefined,
            product_data: stripeProductId ? undefined : {
              name: `Ingresso Meetlines`,
              description: `${quantity}x ${ticketType.name} - ${ticketType.event.title}`,
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/ticket-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/event/${eventId}?payment=cancelled`,
      payment_method_types: ["card"],
      payment_intent_data: {
        description: `${quantity}x ${ticketType.name} - ${ticketType.event.title}`,
        metadata: {
          ticket_sale_id: saleData.id,
          ticket_type: ticketType.name,
          event_name: ticketType.event.title,
          quantity: quantity.toString(),
        }
      },
      metadata: {
        ticket_sale_id: saleData.id,
        event_id: eventId,
        user_id: user.id,
        organizer_id: ticketType.event.organizer_id,
        ticket_type_id: ticketTypeId,
        quantity: quantity.toString(),
        event_title: ticketType.event.title,
        ticket_name: ticketType.name,
        subtotal: subtotal.toFixed(2),
        platform_fee: platformFee.toFixed(2),
        processing_fee: processingFee.toFixed(2),
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    const { error: updateError } = await supabaseService
      .from("ticket_sales")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", saleData.id);

    if (updateError) {
      logStep("Error updating sale with session ID", { error: updateError });
    } else {
      logStep("Sale updated with session ID", { saleId: saleData.id, sessionId: session.id });
    }

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
        totalAmount: totalAmount,
        platformFee: platformFee,
        subtotal: subtotal
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
