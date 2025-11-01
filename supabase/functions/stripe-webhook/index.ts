import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err });
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    logStep("Event type received", { type: event.type });

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout.session.completed", {
          sessionId: session.id,
          metadata: session.metadata
        });

        const ticketSaleId = session.metadata?.ticket_sale_id;

        if (!ticketSaleId) {
          logStep("No ticket_sale_id in metadata");
          break;
        }

        const { data: sale, error: fetchError } = await supabaseService
          .from("ticket_sales")
          .select("id, payment_status, quantity, ticket_type_id, promo_code_id, promo_discount, user_id")
          .eq("id", ticketSaleId)
          .single();

        if (fetchError || !sale) {
          logStep("Sale not found", { ticketSaleId, error: fetchError });
          break;
        }

        if (sale.payment_status === "completed") {
          logStep("Sale already completed", { ticketSaleId });
          break;
        }

        const isPaid = session.payment_status === "paid" || session.status === "complete";

        if (isPaid) {
          const { error: updateError } = await supabaseService
            .from("ticket_sales")
            .update({
              payment_status: "completed",
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: typeof session.payment_intent === 'string'
                ? session.payment_intent
                : null
            })
            .eq("id", ticketSaleId);

          if (updateError) {
            logStep("Error updating sale", { error: updateError });
          } else {
            logStep("Sale marked as completed", { ticketSaleId });

            const { error: quantityError } = await supabaseService
              .rpc("increment_ticket_sold", {
                ticket_type_id: sale.ticket_type_id,
                quantity_to_add: sale.quantity
              });

            if (quantityError) {
              logStep("Error updating ticket quantity_sold", { error: quantityError });
            } else {
              logStep("Ticket quantity_sold updated successfully", {
                ticket_type_id: sale.ticket_type_id,
                quantity: sale.quantity
              });
            }

            if (sale.promo_code_id) {
              const { error: promoUseError } = await supabaseService
                .from("promo_code_uses")
                .insert({
                  promo_code_id: sale.promo_code_id,
                  ticket_sale_id: sale.id,
                  user_id: sale.user_id,
                  discount_applied: sale.promo_discount || 0
                });

              if (promoUseError) {
                logStep("Error recording promo code use", { error: promoUseError });
              } else {
                const { error: promoIncrementError } = await supabaseService
                  .rpc("increment_promo_code_uses", {
                    promo_code_id_param: sale.promo_code_id
                  });

                if (promoIncrementError) {
                  logStep("Error incrementing promo code uses", { error: promoIncrementError });
                } else {
                  logStep("Promo code use recorded successfully", {
                    promo_code_id: sale.promo_code_id
                  });
                }
              }
            }

            const { data: fullSale, error: fullSaleError } = await supabaseService
              .from("ticket_sales")
              .select(`
                id,
                event_id,
                total_amount,
                platform_fee,
                payment_processing_fee,
                events!inner(organizer_id)
              `)
              .eq("id", ticketSaleId)
              .single();

            if (fullSaleError || !fullSale) {
              logStep("Error fetching full sale data for transaction", { error: fullSaleError });
            } else {
              const grossAmount = Number(fullSale.total_amount);
              const platformFee = Number(fullSale.platform_fee);
              const paymentGatewayFee = Number(fullSale.payment_processing_fee);
              const netAmount = grossAmount - platformFee - paymentGatewayFee;

              const { data: financialData } = await supabaseService
                .from("organizer_financial_data")
                .select("auto_transfer, transfer_day")
                .eq("organizer_id", fullSale.events.organizer_id)
                .maybeSingle();

              let transferScheduledDate = null;
              if (financialData?.auto_transfer) {
                const now = new Date();
                const transferDay = financialData.transfer_day || 5;
                const scheduledDate = new Date(now.getFullYear(), now.getMonth(), transferDay);

                if (scheduledDate < now) {
                  scheduledDate.setMonth(scheduledDate.getMonth() + 1);
                }
                transferScheduledDate = scheduledDate.toISOString();
              }

              const { error: transactionError } = await supabaseService
                .from("ticket_sales_transactions")
                .insert({
                  ticket_sale_id: ticketSaleId,
                  organizer_id: fullSale.events.organizer_id,
                  event_id: fullSale.event_id,
                  gross_amount: grossAmount,
                  platform_fee: platformFee,
                  payment_gateway_fee: paymentGatewayFee,
                  net_amount: netAmount,
                  transaction_status: "pending",
                  payment_date: new Date().toISOString(),
                  payment_id: typeof session.payment_intent === 'string'
                    ? session.payment_intent
                    : null,
                  transfer_scheduled_date: transferScheduledDate
                });

              if (transactionError) {
                logStep("Error creating transaction record", { error: transactionError });
              } else {
                logStep("Transaction record created successfully", {
                  ticketSaleId,
                  grossAmount,
                  netAmount,
                  organizerId: fullSale.events.organizer_id
                });
              }
            }
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout.session.expired", { sessionId: session.id });

        const ticketSaleId = session.metadata?.ticket_sale_id;
        if (!ticketSaleId) {
          logStep("No ticket_sale_id in metadata");
          break;
        }

        const { error: updateError } = await supabaseService
          .from("ticket_sales")
          .update({
            payment_status: "cancelled",
            cancelled_at: new Date().toISOString()
          })
          .eq("id", ticketSaleId)
          .eq("payment_status", "pending");

        if (updateError) {
          logStep("Error updating expired sale", { error: updateError });
        } else {
          logStep("Sale marked as cancelled", { ticketSaleId });
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Processing payment_intent.succeeded", {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          description: paymentIntent.description
        });
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Processing payment_intent.payment_failed", {
          paymentIntentId: paymentIntent.id
        });

        const { error: updateError } = await supabaseService
          .from("ticket_sales")
          .update({
            payment_status: "failed"
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        if (updateError) {
          logStep("Error updating failed payment", { error: updateError });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        logStep("Processing charge.refunded", { chargeId: charge.id });

        const { error: updateError } = await supabaseService
          .from("ticket_sales")
          .update({
            payment_status: "refunded",
            refunded_at: new Date().toISOString()
          })
          .eq("stripe_payment_intent_id", charge.payment_intent);

        if (updateError) {
          logStep("Error updating refunded sale", { error: updateError });
        } else {
          logStep("Sale marked as refunded");
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(
      JSON.stringify({ received: true }),
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