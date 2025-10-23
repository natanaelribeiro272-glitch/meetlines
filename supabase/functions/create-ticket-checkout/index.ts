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

    // Create Supabase client
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        {
          global: {
            headers: { Authorization: req.headers.get("Authorization") ?? "" },
          },
        }
      );

      // Privileged client for server-side updates (bypasses RLS)
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body
    const { ticketTypeId, quantity, eventId } = await req.json();
    logStep("Request received", { ticketTypeId, quantity, eventId });

    if (!ticketTypeId || !quantity || !eventId) {
      throw new Error("Missing required parameters: ticketTypeId, quantity, eventId");
    }

    // Get ticket type details
    const { data: ticketType, error: ticketError } = await supabaseClient
      .from("ticket_types")
      .select("*, event:events(id, title, organizer_id)")
      .eq("id", ticketTypeId)
      .single();

    if (ticketError || !ticketType) {
      throw new Error("Ticket type not found");
    }
    logStep("Ticket type found", { ticketType });

    // Check if user is the organizer of the event and get Stripe Connect account
    const { data: organizer, error: organizerError } = await supabaseClient
      .from("organizers")
      .select("user_id, stripe_account_id, stripe_charges_enabled")
      .eq("id", ticketType.event.organizer_id)
      .single();

    if (organizerError || !organizer) {
      throw new Error("Organizer not found");
    }

    if (organizer.user_id === user.id) {
      throw new Error("Organizadores não podem comprar ingressos dos próprios eventos");
    }

    if (!organizer.stripe_account_id || !organizer.stripe_charges_enabled) {
      throw new Error("Este organizador ainda não configurou pagamentos. Entre em contato com o organizador.");
    }

    logStep("User is not the organizer, proceeding with purchase", {
      stripeAccountId: organizer.stripe_account_id
    });

    // Get event ticket settings (for fee configuration)
    const { data: ticketSettings, error: settingsError } = await supabaseClient
      .from("event_ticket_settings")
      .select("*")
      .eq("event_id", eventId)
      .single();

    if (settingsError || !ticketSettings) {
      throw new Error("Ticket settings not found for this event");
    }
    logStep("Ticket settings found", { ticketSettings });

    // Calculate fees
    const subtotal = ticketType.price * quantity;
    const platformFee = subtotal * (ticketSettings.platform_fee_percentage / 100);
    const processingFee = subtotal * (ticketSettings.payment_processing_fee_percentage / 100) +
                          (ticketSettings.payment_processing_fee_fixed * quantity);

    // Calculate application fee (platform keeps this)
    const applicationFeeAmount = Math.round((platformFee + processingFee) * 100);

    // Total amount buyer pays
    const totalAmount = ticketSettings.fee_payer === 'buyer'
      ? subtotal + platformFee + processingFee
      : subtotal;

    logStep("Fees calculated", {
      subtotal,
      platformFee,
      processingFee,
      totalAmount,
      applicationFeeAmount,
      feePayer: ticketSettings.fee_payer
    });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
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

    // Get user profile for additional info
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("display_name, phone")
      .eq("user_id", user.id)
      .maybeSingle();

    // Create pending sale record
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

    // Create Stripe checkout session with Connect (destination charge)
    const sessionParams: any = {
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `${ticketType.name} - ${ticketType.event.title}`,
              description: ticketType.description || undefined,
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/ticket-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/event/${eventId}?payment=cancelled`,
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: organizer.stripe_account_id,
        },
      },
      metadata: {
        ticket_sale_id: saleData.id,
        event_id: eventId,
        user_id: user.id,
        organizer_id: ticketType.event.organizer_id,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Update sale record with Stripe session ID
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
      JSON.stringify({ url: session.url, sessionId: session.id }),
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