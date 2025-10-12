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

    const now = new Date().toISOString();
    console.log('Searching for events to end. Current time:', now);

    // Buscar eventos regulares que deveriam ter sido encerrados
    const { data: eventsToEnd, error: selectEventsError } = await supabase
      .from('events')
      .select('id, title, end_date')
      .not('end_date', 'is', null)
      .lt('end_date', now)
      .neq('status', 'completed');

    if (selectEventsError) {
      console.error('Error selecting events:', selectEventsError);
      throw selectEventsError;
    }

    // Buscar eventos de plataforma que deveriam ter sido encerrados
    const { data: platformEventsToEnd, error: selectPlatformError } = await supabase
      .from('platform_events')
      .select('id, title, end_date')
      .not('end_date', 'is', null)
      .lt('end_date', now)
      .neq('status', 'completed')
      .neq('status', 'ended');

    if (selectPlatformError) {
      console.error('Error selecting platform events:', selectPlatformError);
      throw selectPlatformError;
    }

    const totalEvents = (eventsToEnd?.length || 0) + (platformEventsToEnd?.length || 0);
    console.log(`Found ${eventsToEnd?.length || 0} regular events and ${platformEventsToEnd?.length || 0} platform events to end`);

    if (totalEvents === 0) {
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

    const endedEvents = [];

    // Encerrar eventos regulares
    if (eventsToEnd && eventsToEnd.length > 0) {
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

      console.log(`Successfully ended ${eventsToEnd.length} regular events:`, eventsToEnd.map(e => e.title).join(', '));
      endedEvents.push(...eventsToEnd.map(e => ({ ...e, type: 'regular' })));
    }

    // Encerrar eventos de plataforma
    if (platformEventsToEnd && platformEventsToEnd.length > 0) {
      const platformEventIds = platformEventsToEnd.map(e => e.id);
      
      const { error: updatePlatformError } = await supabase
        .from('platform_events')
        .update({ 
          status: 'ended',
          updated_at: now
        })
        .in('id', platformEventIds);

      if (updatePlatformError) {
        console.error('Error updating platform events:', updatePlatformError);
        throw updatePlatformError;
      }

      console.log(`Successfully ended ${platformEventsToEnd.length} platform events:`, platformEventsToEnd.map(e => e.title).join(', '));
      endedEvents.push(...platformEventsToEnd.map(e => ({ ...e, type: 'platform' })));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Ended ${totalEvents} events`,
        endedCount: totalEvents,
        events: endedEvents
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
