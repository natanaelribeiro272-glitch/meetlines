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
    console.log("[Verify MercadoPago Payment] Starting verification");

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
    }

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
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Não autorizado");
    }

    const { paymentId, ticketSaleId } = await req.json();
    console.log("[Verify MercadoPago Payment] Received:", { paymentId, ticketSaleId });

    if (!paymentId) {
      throw new Error("paymentId is required");
    }

    console.log("[Verify MercadoPago Payment] Fetching payment from MercadoPago API");
    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      console.error("[Verify MercadoPago Payment] Failed to fetch payment");
      throw new Error("Erro ao consultar pagamento no Mercado Pago");
    }

    const payment = await paymentResponse.json();
    console.log("[Verify MercadoPago Payment] Payment status:", payment.status);

    const saleId = ticketSaleId || payment.external_reference;
    if (!saleId) {
      throw new Error("Não foi possível identificar a venda");
    }

    const { data: sale, error: saleError } = await supabaseService
      .from("ticket_sales")
      .select("id, user_id, payment_status, quantity, ticket_type_id, event_id, promo_code_id, total_amount, platform_fee, payment_processing_fee")
      .eq("id", saleId)
      .single();

    if (saleError || !sale) {
      throw new Error("Venda não encontrada");
    }

    if (sale.user_id !== user.id) {
      throw new Error("Esta venda não pertence a você");
    }

    if (sale.payment_status === "completed") {
      console.log("[Verify MercadoPago Payment] Sale already completed");
      return new Response(
        JSON.stringify({
          payment_status: "completed",
          message: "Pagamento já confirmado"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let paymentStatus = "pending";
    if (payment.status === "approved") {
      paymentStatus = "completed";
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      paymentStatus = "failed";
    }

    console.log("[Verify MercadoPago Payment] Updating ticket sale with status:", paymentStatus);
    const { error: updateError } = await supabaseService
      .from("ticket_sales")
      .update({
        payment_status: paymentStatus,
        payment_intent_id: payment.id.toString(),
        paid_at: paymentStatus === "completed" ? new Date().toISOString() : null,
        mercadopago_payment_id: payment.id.toString(),
      })
      .eq("id", saleId);

    if (updateError) {
      console.error("[Verify MercadoPago Payment] Error updating sale:", updateError);
      throw updateError;
    }

    if (paymentStatus === "completed") {
      console.log("[Verify MercadoPago Payment] Payment completed, processing tickets");

      await supabaseService.rpc("increment_tickets_sold", {
        p_ticket_type_id: sale.ticket_type_id,
        p_quantity: sale.quantity,
      });

      if (sale.promo_code_id) {
        await supabaseService.rpc("increment_promo_code_uses", {
          p_promo_code_id: sale.promo_code_id,
        });
      }

      console.log("[Verify MercadoPago Payment] Generating tickets");
      const tickets = [];
      for (let i = 0; i < sale.quantity; i++) {
        tickets.push({
          ticket_sale_id: sale.id,
          event_id: sale.event_id,
          user_id: sale.user_id,
          ticket_type_id: sale.ticket_type_id,
          status: "valid",
        });
      }

      const { error: ticketsError } = await supabaseService
        .from("tickets")
        .insert(tickets);

      if (ticketsError) {
        console.error("[Verify MercadoPago Payment] Error generating tickets:", ticketsError);
      } else {
        console.log("[Verify MercadoPago Payment] Tickets generated successfully");
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
        .eq("id", saleId)
        .single();

      if (fullSaleError || !fullSale) {
        console.error("[Verify MercadoPago Payment] Error fetching full sale data:", fullSaleError);
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
            ticket_sale_id: saleId,
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
          console.error("[Verify MercadoPago Payment] Error creating transaction:", transactionError);
        } else {
          console.log("[Verify MercadoPago Payment] Transaction created successfully");
        }
      }
    }

    return new Response(
      JSON.stringify({
        payment_status: paymentStatus,
        mercadopago_status: payment.status,
        message: paymentStatus === "completed"
          ? "Pagamento confirmado!"
          : paymentStatus === "pending"
          ? "Pagamento ainda pendente"
          : "Pagamento não aprovado"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Verify MercadoPago Payment] Error:", error);
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