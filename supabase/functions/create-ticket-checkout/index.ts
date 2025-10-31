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
      throw new Error("Unauthorized");
    }

    const { ticketTypeId, quantity, eventId } = await req.json();

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
      throw new Error("Ticket type not found");
    }

    const event = ticketType.events;

    const { data: profile } = await supabaseService
      .from("profiles")
      .select("display_name, phone")
      .eq("user_id", user.id)
      .maybeSingle();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    const unitPrice = ticketType.price;
    const subtotal = unitPrice * quantity;
    const platformFeePercent = 0.10;
    const platformFee = subtotal * platformFeePercent;
    const totalAmount = subtotal;

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
        payment_processing_fee: 0,
        total_amount: totalAmount,
        buyer_name: profile?.display_name || user.email?.split("@")[0] || "Usuário",
        buyer_email: user.email || "",
        buyer_phone: profile?.phone || null,
        payment_status: "pending",
      })
      .select()
      .single();

    if (ticketSale.error) {
      throw new Error(`Failed to create ticket sale: ${ticketSale.error.message}`);
    }

    const stripeProductId = Deno.env.get("STRIPE_PRODUCT_ID");
    
    const lineItems: any[] = [];
    
    if (stripeProductId) {
      const prices = await stripe.prices.list({
        product: stripeProductId,
        active: true,
        limit: 1,
      });

      if (prices.data.length > 0) {
        lineItems.push({
          price: prices.data[0].id,
          quantity: quantity,
        });
      } else {
        lineItems.push({
          price_data: {
            currency: "brl",
            product: stripeProductId,
            unit_amount: Math.round(unitPrice * 100),
          },
          quantity: quantity,
        });
      }
    } else {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: {
            name: `${ticketType.name} - ${event.title}`,
            description: `${quantity}x ${ticketType.name}`,
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity: quantity,
      });
    }

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
        platform_fee_percentage: (platformFeePercent * 100).toFixed(1),
      },
    });

    await supabaseService
      .from("ticket_sales")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", ticketSale.data.id);

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
    return new Response(
      JSON.stringify({ error: error.message }),
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
