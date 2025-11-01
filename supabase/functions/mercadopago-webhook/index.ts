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
    console.log("[MercadoPago Webhook] Received notification");

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const body = await req.json();
    console.log("[MercadoPago Webhook] Body:", JSON.stringify(body));

    if (body.type === "payment") {
      const paymentId = body.data?.id;
      if (!paymentId) {
        console.log("[MercadoPago Webhook] No payment ID found");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("[MercadoPago Webhook] Fetching payment:", paymentId);
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!paymentResponse.ok) {
        console.error("[MercadoPago Webhook] Failed to fetch payment");
        return new Response(JSON.stringify({ error: "Failed to fetch payment" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payment = await paymentResponse.json();
      console.log("[MercadoPago Webhook] Payment data:", JSON.stringify(payment));

      const ticketSaleId = payment.external_reference;
      if (!ticketSaleId) {
        console.log("[MercadoPago Webhook] No external reference found");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("[MercadoPago Webhook] Ticket sale ID:", ticketSaleId);
      console.log("[MercadoPago Webhook] Payment status:", payment.status);

      let paymentStatus = "pending";
      if (payment.status === "approved") {
        paymentStatus = "completed";
      } else if (payment.status === "rejected" || payment.status === "cancelled") {
        paymentStatus = "failed";
      }

      console.log("[MercadoPago Webhook] Updating ticket sale with status:", paymentStatus);
      const { error: updateError } = await supabaseService
        .from("ticket_sales")
        .update({
          payment_status: paymentStatus,
          payment_intent_id: payment.id.toString(),
          paid_at: paymentStatus === "completed" ? new Date().toISOString() : null,
          mercadopago_payment_id: payment.id.toString(),
          payment_gateway: "mercadopago",
          payment_method: payment.payment_method_id || payment.payment_type_id || "pix"
        })
        .eq("id", ticketSaleId);

      if (updateError) {
        console.error("[MercadoPago Webhook] Error updating ticket sale:", updateError);
        throw updateError;
      }

      if (paymentStatus === "completed") {
        console.log("[MercadoPago Webhook] Payment completed, processing ticket generation");

        const { data: ticketSale } = await supabaseService
          .from("ticket_sales")
          .select(`
            id,
            quantity,
            ticket_type_id,
            event_id,
            user_id,
            promo_code_id
          `)
          .eq("id", ticketSaleId)
          .single();

        if (ticketSale) {
          console.log("[MercadoPago Webhook] Incrementing tickets sold");
          await supabaseService.rpc("increment_tickets_sold", {
            p_ticket_type_id: ticketSale.ticket_type_id,
            p_quantity: ticketSale.quantity,
          });

          if (ticketSale.promo_code_id) {
            console.log("[MercadoPago Webhook] Incrementing promo code uses");
            await supabaseService.rpc("increment_promo_code_uses", {
              p_promo_code_id: ticketSale.promo_code_id,
            });
          }

          console.log("[MercadoPago Webhook] Generating tickets");
          const tickets = [];
          for (let i = 0; i < ticketSale.quantity; i++) {
            tickets.push({
              ticket_sale_id: ticketSale.id,
              event_id: ticketSale.event_id,
              user_id: ticketSale.user_id,
              ticket_type_id: ticketSale.ticket_type_id,
              status: "valid",
            });
          }

          const { error: ticketsError } = await supabaseService
            .from("tickets")
            .insert(tickets);

          if (ticketsError) {
            console.error("[MercadoPago Webhook] Error generating tickets:", ticketsError);
          } else {
            console.log("[MercadoPago Webhook] Tickets generated successfully");
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
            console.error("[MercadoPago Webhook] Error fetching full sale data for transaction:", fullSaleError);
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
                payment_id: payment.id.toString(),
                transfer_scheduled_date: transferScheduledDate
              });

            if (transactionError) {
              console.error("[MercadoPago Webhook] Error creating transaction record:", transactionError);
            } else {
              console.log("[MercadoPago Webhook] Transaction record created successfully", {
                ticketSaleId,
                grossAmount,
                netAmount,
                organizerId: fullSale.events.organizer_id
              });
            }
          }
        }
      }

      console.log("[MercadoPago Webhook] Processing complete");
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[MercadoPago Webhook] Not a payment notification");
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[MercadoPago Webhook] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});