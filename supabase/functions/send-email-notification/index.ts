import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailNotificationPayload {
  notification_id: string;
  user_email: string;
  user_name: string;
  notification_type: string;
  notification_title: string;
  notification_message: string;
  from_user_name?: string;
  event_title?: string;
  organizer_name?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");

    if (!brevoApiKey) {
      console.error("BREVO_API_KEY not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "BREVO_API_KEY not configured"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload: EmailNotificationPayload = await req.json();
    const {
      user_email,
      user_name,
      notification_type,
      notification_title,
      notification_message,
      from_user_name,
      event_title,
      organizer_name,
    } = payload;

    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #4F46E5; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Meetlines</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">Você tem uma nova notificação</p>
        </div>

        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1F2937; margin-top: 0;">${notification_title}</h2>
          <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
            ${notification_message}
          </p>
    `;

    if (from_user_name) {
      htmlContent += `<p style="color: #6B7280; font-size: 14px; margin-top: 20px;"><strong>De:</strong> ${from_user_name}</p>`;
    }

    if (event_title) {
      htmlContent += `<p style="color: #6B7280; font-size: 14px;"><strong>Evento:</strong> ${event_title}</p>`;
    }

    if (organizer_name) {
      htmlContent += `<p style="color: #6B7280; font-size: 14px;"><strong>Organizador:</strong> ${organizer_name}</p>`;
    }

    htmlContent += `
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://meetlines.com.br/notifications"
               style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Ver Notificação
            </a>
          </div>

          <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px; text-align: center;">
            Você recebeu este email porque está cadastrado no Meetlines.
          </p>
        </div>
      </div>
    `;

    const brevoPayload = {
      sender: {
        name: "Meetlines",
        email: "notificacoes@meetlines.com.br",
      },
      to: [
        {
          email: user_email,
          name: user_name,
        },
      ],
      subject: notification_title,
      htmlContent: htmlContent,
    };

    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify(brevoPayload),
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text();
      console.error("Brevo API error:", errorData);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send email via Brevo",
          details: errorData,
        }),
        {
          status: brevoResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const responseData = await brevoResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email de notificação enviado com sucesso",
        messageId: responseData.messageId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in send-email-notification:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});