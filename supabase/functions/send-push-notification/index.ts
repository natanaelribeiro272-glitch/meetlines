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

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

async function createJWT(serviceAccount: ServiceAccount): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');

  const encoder = new TextEncoder();
  const data = encoder.encode(unsignedToken);

  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = privateKey.substring(
    pemHeader.length,
    privateKey.length - pemFooter.length
  ).replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data);

  const signatureArray = new Uint8Array(signature);
  const encodedSignature = btoa(String.fromCharCode(...signatureArray))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${unsignedToken}.${encodedSignature}`;
}

async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const jwt = await createJWT(serviceAccount);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to get access token:', errorText);
    throw new Error(`OAuth error: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
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

    const fcmServiceAccountJson = Deno.env.get('FCM_SERVICE_ACCOUNT');

    if (!fcmServiceAccountJson) {
      console.log('FCM_SERVICE_ACCOUNT not configured. Push notifications disabled.');
      return new Response(
        JSON.stringify({
          message: 'Push notifications not configured. Add FCM_SERVICE_ACCOUNT to enable.',
          sent: 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const serviceAccount: ServiceAccount = JSON.parse(fcmServiceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;

    const results = await Promise.allSettled(
      tokens.map(async ({ token, platform }) => {
        const fcmPayload = {
          message: {
            token,
            notification: {
              title,
              body,
            },
            data: data || {},
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                channel_id: 'default',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                },
              },
            },
          },
        };

        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(fcmPayload),
          }
        );

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