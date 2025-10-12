import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractEventsRequest {
  apiEndpoint: string;
  apiKey?: string;
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

    const { apiEndpoint, apiKey }: ExtractEventsRequest = await req.json();

    console.log('Fetching data from:', apiEndpoint);

    // Fetch data from the provided API
    let finalUrl = apiEndpoint;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Check if API key should be in URL (common for SerpApi, etc)
    if (apiKey) {
      // If URL already has query params, add with &, otherwise with ?
      const separator = apiEndpoint.includes('?') ? '&' : '?';
      finalUrl = `${apiEndpoint}${separator}api_key=${encodeURIComponent(apiKey)}`;
    }

    console.log('Final URL (key hidden):', finalUrl.replace(/api_key=[^&]+/, 'api_key=***'));

    const apiResponse = await fetch(finalUrl, { headers });
    
    if (!apiResponse.ok) {
      throw new Error(`API request failed: ${apiResponse.statusText}`);
    }

    const apiData = await apiResponse.text();
    console.log('API data received, length:', apiData.length);

    // Use Lovable AI to extract event information
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
            role: 'system',
            content: `Você é um assistente especializado em extrair informações de eventos de dados JSON ou HTML. 
            
            IMPORTANTE: Extraia APENAS eventos que ainda não aconteceram. A data atual de referência é: ${currentDate}
            NÃO inclua eventos com datas anteriores à data atual.
            
            Extraia o máximo de informações possível sobre eventos FUTUROS e retorne um array JSON com os seguintes campos para cada evento:
            - title (obrigatório)
            - description (opcional)
            - organizer_name (obrigatório)
            - event_date (obrigatório, formato ISO 8601, DEVE SER >= ${currentDate})
            - end_date (opcional, formato ISO 8601)
            - location (obrigatório)
            - location_link (opcional)
            - image_url (opcional)
            - category (opcional)
            - ticket_price (opcional, número)
            - ticket_link (opcional)
            - max_attendees (opcional, número)
            
            Se não conseguir extrair eventos futuros, retorne um array vazio.
            Retorne APENAS o JSON, sem texto adicional.`
          },
          {
            role: 'user',
            content: `Extraia todos os eventos FUTUROS (a partir de ${currentDate}) destes dados:\n\n${apiData.substring(0, 50000)}`
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

    // Parse the extracted events
    let events;
    try {
      // Try to extract JSON from the response
      const jsonMatch = extractedContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        events = JSON.parse(jsonMatch[0]);
      } else {
        events = JSON.parse(extractedContent);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error('Failed to parse extracted events');
    }

    if (!Array.isArray(events) || events.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum evento encontrado nos dados fornecidos',
          count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Extracted ${events.length} events, filtering and inserting into database`);

    // Filter out past events and insert only future ones
    const currentDateObj = new Date();
    const futureEvents = events.filter((event: any) => {
      const eventDate = new Date(event.event_date);
      return eventDate >= currentDateObj;
    });

    console.log(`Filtered to ${futureEvents.length} future events`);

    if (futureEvents.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum evento futuro encontrado nos dados fornecidos',
          count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicates based on title, location, and event_date
    const eventsToInsert = [];
    let duplicateCount = 0;

    for (const event of futureEvents) {
      const { data: existingEvent } = await supabaseClient
        .from('platform_events')
        .select('id')
        .eq('title', event.title)
        .eq('location', event.location)
        .eq('event_date', event.event_date)
        .maybeSingle();

      if (!existingEvent) {
        eventsToInsert.push({
          title: event.title,
          description: event.description || null,
          organizer_name: event.organizer_name,
          event_date: event.event_date,
          end_date: event.end_date || event.event_date,
          location: event.location,
          location_link: event.location_link || null,
          image_url: event.image_url || null,
          category: event.category || null,
          ticket_price: event.ticket_price || 0,
          ticket_link: event.ticket_link || null,
          max_attendees: event.max_attendees || null,
          auto_generated: true,
          approval_status: 'pending',
          created_by_admin_id: user.id,
          source_data: event,
          status: 'upcoming'
        });
      } else {
        duplicateCount++;
        console.log(`Duplicate event found: ${event.title} at ${event.location} on ${event.event_date}`);
      }
    }

    if (eventsToInsert.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Todos os ${futureEvents.length} eventos já existem no sistema (duplicados)`,
          count: 0,
          duplicates: duplicateCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Inserting ${eventsToInsert.length} new events (${duplicateCount} duplicates skipped)`);

    const { data: insertedEvents, error: insertError } = await supabaseClient
      .from('platform_events')
      .insert(eventsToInsert)
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to save events: ${insertError.message}`);
    }

    console.log(`Successfully inserted ${insertedEvents?.length} events`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: insertedEvents?.length || 0,
        duplicates: duplicateCount,
        message: `${insertedEvents?.length} eventos novos salvos para aprovação${duplicateCount > 0 ? ` (${duplicateCount} duplicados ignorados)` : ''}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-events function:', error);
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