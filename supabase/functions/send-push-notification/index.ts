import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface NotificationPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    const { user_id, title, body, data } = payload;

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Buscar tokens de push do usuário
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', user_id);

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No push tokens found for user', sent: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // NOTA: Esta função está preparada para FCM (Firebase Cloud Messaging)
    // Para ativar notificações push, você precisará:
    // 1. Criar um projeto no Firebase Console
    // 2. Obter a chave de servidor (Server Key)
    // 3. Adicionar FCM_SERVER_KEY nas variáveis de ambiente do Supabase
    // 4. Configurar o Firebase no app mobile (Android/iOS)

    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    
    if (!fcmServerKey) {
      console.log('FCM_SERVER_KEY not configured. Push notifications disabled.');
      return new Response(
        JSON.stringify({ 
          message: 'Push notifications not configured. Add FCM_SERVER_KEY to enable.',
          sent: 0 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Enviar notificações para cada token
    const results = await Promise.allSettled(
      tokens.map(async ({ token, platform }) => {
        const fcmPayload = {
          to: token,
          notification: {
            title,
            body,
            sound: 'default',
            badge: '1',
          },
          data: data || {},
          priority: 'high',
        };

        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${fcmServerKey}`,
          },
          body: JSON.stringify(fcmPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to send to ${platform}:`, errorText);
          throw new Error(`FCM error: ${errorText}`);
        }

        return await response.json();
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({ 
        message: 'Push notifications sent',
        sent: successCount,
        failed: failureCount,
        total: tokens.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});