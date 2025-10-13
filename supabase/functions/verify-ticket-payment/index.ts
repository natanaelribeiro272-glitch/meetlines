import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-TICKET-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error("Missing required parameter: sessionId");
    }
    logStep("Request received", { sessionId });

    // Authenticated user (for ownership validation)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    // Service role client to bypass RLS for the update
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
    if (!user?.id || !user.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    // Load sale by sessionId and ensure it belongs to the user
    const { data: sale, error: saleError } = await supabaseClient
      .from("ticket_sales")
      .select("id, user_id, payment_status, total_amount")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();

    if (saleError) throw new Error(`Error fetching sale: ${saleError.message}`);
    if (!sale) throw new Error("Sale not found for provided sessionId");
    if (sale.user_id !== user.id) throw new Error("Sale does not belong to current user");
    logStep("Sale loaded", { saleId: sale.id, status: sale.payment_status });

    // If already completed, just return
    if (sale.payment_status === "completed") {
      logStep("Sale already completed");
      return new Response(
        JSON.stringify({ ok: true, payment_status: "completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Verify with Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Stripe session retrieved", { status: session.status, payment_status: session.payment_status });

    const isPaid = session.payment_status === "paid" || session.status === "complete";
    if (!isPaid) {
      logStep("Session not paid yet");
      return new Response(
        JSON.stringify({ ok: false, payment_status: session.payment_status ?? session.status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Update sale to completed
    const { error: updateError } = await supabaseService
      .from("ticket_sales")
      .update({
        payment_status: "completed",
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent as any)?.id || null
      })
      .eq("id", sale.id);

    if (updateError) {
      logStep("Error updating sale to completed", { error: updateError });
      throw new Error(`Failed to update sale: ${updateError.message}`);
    }

    logStep("Sale marked as completed", { saleId: sale.id });

    return new Response(
      JSON.stringify({ ok: true, payment_status: "completed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});