import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting auto-end-events function...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar eventos que deveriam ter sido encerrados (end_date passou e status não é 'completed')
    const now = new Date().toISOString();
    console.log('Searching for events to end. Current time:', now);

    const { data: eventsToEnd, error: selectError } = await supabase
      .from('events')
      .select('id, title, end_date')
      .not('end_date', 'is', null)
      .lt('end_date', now)
      .neq('status', 'completed');

    if (selectError) {
      console.error('Error selecting events:', selectError);
      throw selectError;
    }

    console.log(`Found ${eventsToEnd?.length || 0} events to end`);

    if (!eventsToEnd || eventsToEnd.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No events to end',
          endedCount: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Encerrar cada evento
    const eventIds = eventsToEnd.map(e => e.id);
    
    const { error: updateError } = await supabase
      .from('events')
      .update({ 
        status: 'completed',
        is_live: false,
        updated_at: now
      })
      .in('id', eventIds);

    if (updateError) {
      console.error('Error updating events:', updateError);
      throw updateError;
    }

    console.log(`Successfully ended ${eventsToEnd.length} events:`, eventsToEnd.map(e => e.title).join(', '));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Ended ${eventsToEnd.length} events`,
        endedCount: eventsToEnd.length,
        events: eventsToEnd.map(e => ({ id: e.id, title: e.title, end_date: e.end_date }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in auto-end-events function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
