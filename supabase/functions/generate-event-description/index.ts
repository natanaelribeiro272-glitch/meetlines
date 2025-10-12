import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateDescriptionRequest {
  title: string;
  organizerName: string;
  eventDate: string;
  location: string;
  category?: string;
  ticketPrice?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify admin role
    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      throw new Error('Unauthorized: Admin role required');
    }

    const { title, organizerName, eventDate, location, category, ticketPrice }: GenerateDescriptionRequest = await req.json();

    console.log('Generating description for:', title);

    // Use Lovable AI to generate description
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const eventInfo = `
Título: ${title}
Organizador: ${organizerName}
Data: ${new Date(eventDate).toLocaleDateString('pt-BR', { 
  day: 'numeric', 
  month: 'long', 
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
Local: ${location}
${category ? `Categoria: ${category}` : ''}
${ticketPrice !== undefined ? `Preço: ${ticketPrice === 0 ? 'Gratuito' : `R$ ${ticketPrice.toFixed(2)}`}` : ''}
    `.trim();

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em marketing de eventos. Sua tarefa é criar descrições atraentes e envolventes para eventos.

INSTRUÇÕES:
- Crie uma descrição de 2-3 frases que capture a essência do evento
- Use linguagem convidativa e motivadora
- Destaque os pontos fortes e o que torna o evento especial
- Seja específico sobre o que os participantes podem esperar
- Use emojis quando apropriado para tornar mais visual
- NÃO repita informações já presentes (título, data, local)
- Foque no VALOR e EXPERIÊNCIA que o evento oferece

Retorne APENAS a descrição, sem texto adicional ou formatação.`
          },
          {
            role: 'user',
            content: `Crie uma descrição atraente para este evento:\n\n${eventInfo}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos de IA esgotados. Adicione créditos ao workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API request failed: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const description = aiData.choices?.[0]?.message?.content?.trim();
    
    if (!description) {
      throw new Error('No description generated');
    }

    console.log('Generated description:', description);

    return new Response(
      JSON.stringify({ 
        success: true,
        description
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-event-description function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
