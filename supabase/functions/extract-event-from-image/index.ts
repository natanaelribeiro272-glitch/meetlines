import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractEventRequest {
  image: string; // base64 image
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

    const { image }: ExtractEventRequest = await req.json();

    console.log('Processing image for event extraction');

    // Use Lovable AI to extract event information from image
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get current date for filtering
    const currentDate = new Date().toISOString();
    console.log('Current date for filtering:', currentDate);

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
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analise esta imagem de evento (flyer, cartaz, banner) e extraia TODAS as informações visíveis.

IMPORTANTE: A data atual de referência é: ${currentDate}
NÃO inclua eventos com datas anteriores à data atual.

Retorne um objeto JSON com os seguintes campos (deixe null se não encontrar a informação):
- title (obrigatório - título do evento)
- description (opcional - descrição completa se houver, ou null para gerar depois)
- organizer_name (obrigatório - nome do organizador/promoter)
- event_date (obrigatório - data/hora do evento em formato ISO 8601, DEVE SER >= ${currentDate})
- end_date (opcional - data/hora de término em formato ISO 8601, ou igual a event_date)
- location (obrigatório - local do evento)
- location_link (opcional - link do Google Maps se houver)
- image_url (null - será preenchido depois)
- category (opcional - categoria do evento: shows, festas, esportes, etc)
- ticket_price (obrigatório - número: 0 para eventos gratuitos, valor em reais se for pago)
- ticket_link (opcional - link de compra de ingressos se houver)
- max_attendees (opcional - capacidade máxima se informada)

TAREFAS CRÍTICAS:
1. **Identificar se é pago ou gratuito**: Procure por "grátis", "free", "entrada franca", ou valores de ingresso
2. **Extrair data corretamente**: Converta datas em português/inglês para ISO 8601
3. **Verificar se é evento futuro**: APENAS retorne se event_date >= ${currentDate}

Se a imagem não contém informações de evento ou o evento já passou, retorne null.
Retorne APENAS o JSON, sem texto adicional.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API request failed: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const extractedContent = aiData.choices?.[0]?.message?.content;
    
    if (!extractedContent) {
      throw new Error('No content extracted from AI');
    }

    console.log('AI extracted content:', extractedContent);

    // Parse the extracted event
    let eventData;
    try {
      // Remove markdown code blocks if present
      let cleanedContent = extractedContent.trim();
      cleanedContent = cleanedContent.replace(/^```json\s*/i, '');
      cleanedContent = cleanedContent.replace(/^```\s*/i, '');
      cleanedContent = cleanedContent.replace(/\s*```$/i, '');
      cleanedContent = cleanedContent.trim();
      
      // Check if the response is null or contains null
      if (cleanedContent === 'null' || cleanedContent === '') {
        console.log('AI returned null - no event found in image');
        eventData = null;
      } else {
        // Try to extract JSON from the response
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          eventData = JSON.parse(jsonMatch[0]);
        } else {
          eventData = JSON.parse(cleanedContent);
        }
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      console.error('Content was:', extractedContent);
      throw new Error('Failed to parse extracted event data');
    }

    if (!eventData || eventData === null) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível identificar nenhuma informação de evento nesta imagem. Por favor, tente com uma imagem de flyer/cartaz de evento.',
          count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate that at least some basic info was extracted
    const hasMinimumInfo = eventData.title || eventData.organizer_name || eventData.location || eventData.event_date;
    
    if (!hasMinimumInfo) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível extrair informações suficientes. A imagem deve conter ao menos o título, organizador, local ou data do evento.',
          count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Set defaults for missing required fields
    if (!eventData.title) eventData.title = 'Evento sem título (completar manualmente)';
    if (!eventData.organizer_name) eventData.organizer_name = 'A definir';
    if (!eventData.location) eventData.location = 'Local a definir';
    
    // Set default date to tomorrow if not found
    if (!eventData.event_date) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      eventData.event_date = tomorrow.toISOString();
    }

    // Verify event is in the future
    const eventDate = new Date(eventData.event_date);
    const currentDateObj = new Date();
    if (eventDate < currentDateObj) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'O evento identificado já aconteceu',
          count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracted future event, checking for duplicates');

    // Check for duplicates
    const { data: existingEvent } = await supabaseClient
      .from('platform_events')
      .select('id')
      .eq('title', eventData.title)
      .eq('location', eventData.location)
      .eq('event_date', eventData.event_date)
      .maybeSingle();

    if (existingEvent) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Este evento já existe no sistema',
          count: 0,
          duplicates: 1
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the event
    const { data: insertedEvent, error: insertError } = await supabaseClient
      .from('platform_events')
      .insert({
        title: eventData.title,
        description: eventData.description || null,
        organizer_name: eventData.organizer_name,
        event_date: eventData.event_date,
        end_date: eventData.end_date || eventData.event_date,
        location: eventData.location,
        location_link: eventData.location_link || null,
        image_url: eventData.image_url || null,
        category: eventData.category || null,
        ticket_price: eventData.ticket_price || 0,
        ticket_link: eventData.ticket_link || null,
        max_attendees: eventData.max_attendees || null,
        auto_generated: true,
        approval_status: 'pending',
        created_by_admin_id: user.id,
        source_data: eventData,
        status: 'upcoming'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to save event: ${insertError.message}`);
    }

    console.log('Successfully inserted event from image');

    // Build success message based on what was extracted
    const extractedFields = [];
    if (eventData.title && !eventData.title.includes('sem título')) extractedFields.push('título');
    if (eventData.organizer_name && eventData.organizer_name !== 'A definir') extractedFields.push('organizador');
    if (eventData.location && eventData.location !== 'Local a definir') extractedFields.push('local');
    if (eventData.event_date) extractedFields.push('data');
    if (eventData.ticket_price !== null && eventData.ticket_price !== undefined) extractedFields.push('preço');
    if (eventData.description) extractedFields.push('descrição');
    
    const fieldsMessage = extractedFields.length > 0 
      ? ` Campos extraídos: ${extractedFields.join(', ')}.`
      : ' Complete os campos manualmente.';

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: 1,
        message: 'Evento extraído da imagem e salvo para aprovação!' + fieldsMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-event-from-image function:', error);
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
