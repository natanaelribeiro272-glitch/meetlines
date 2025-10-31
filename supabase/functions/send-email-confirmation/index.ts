import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  email: string;
  name: string;
  confirmationToken: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, name, confirmationToken }: EmailRequest = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurada");
    }

    const confirmationUrl = `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?token=${confirmationToken}&type=signup`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirme seu email - Meetlines</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                        Meetlines
                      </h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                        Olá, ${name}!
                      </h2>

                      <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                        Obrigado por se cadastrar no <strong>Meetlines</strong>! Estamos muito felizes em ter você conosco.
                      </p>

                      <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                        Para começar a usar sua conta, precisamos confirmar seu endereço de email. Clique no botão abaixo para confirmar:
                      </p>

                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 10px 0 30px;">
                            <a href="${confirmationUrl}"
                               style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                              Confirmar Email
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0 0 10px; color: #6b6b6b; font-size: 14px; line-height: 1.5;">
                        Ou copie e cole este link no seu navegador:
                      </p>

                      <p style="margin: 0 0 30px; padding: 12px; background-color: #f5f5f5; border-radius: 4px; color: #4a4a4a; font-size: 13px; word-break: break-all; font-family: monospace;">
                        ${confirmationUrl}
                      </p>

                      <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 20px;">
                        <p style="margin: 0; color: #6b6b6b; font-size: 13px; line-height: 1.5;">
                          <strong>Importante:</strong> Este link expira em 24 horas por motivos de segurança.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9f9f9; padding: 30px 40px; border-top: 1px solid #e0e0e0;">
                      <p style="margin: 0 0 10px; color: #6b6b6b; font-size: 13px; line-height: 1.5;">
                        Se você não criou esta conta, por favor ignore este email.
                      </p>
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        © ${new Date().getFullYear()} Meetlines. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const emailText = `
Olá, ${name}!

Obrigado por se cadastrar no Meetlines! Estamos muito felizes em ter você conosco.

Para começar a usar sua conta, precisamos confirmar seu endereço de email.
Clique no link abaixo para confirmar:

${confirmationUrl}

Este link expira em 24 horas por motivos de segurança.

Se você não criou esta conta, por favor ignore este email.

© ${new Date().getFullYear()} Meetlines. Todos os direitos reservados.
    `.trim();

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Meetlines <noreply@meetlines.app>",
        to: [email],
        subject: "Confirme seu email - Meetlines",
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error("Erro Resend:", errorData);
      throw new Error(`Erro ao enviar email: ${errorData}`);
    }

    const responseData = await resendResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email enviado com sucesso",
        emailId: responseData.id
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao enviar email:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
