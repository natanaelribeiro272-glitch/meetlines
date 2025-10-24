import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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

    console.log('Fetching cities from IBGE API...');
    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
    const cities = await response.json();

    console.log(`Received ${cities.length} cities from IBGE`);

    const citiesToInsert = cities
      .filter((city: any) => city?.microrregiao?.mesorregiao?.UF?.sigla)
      .map((city: any) => ({
        name: city.nome,
        state: city.microrregiao.mesorregiao.UF.sigla,
        country: 'Brasil'
      }));

    console.log(`Prepared ${citiesToInsert.length} cities for insertion`);

    console.log('Inserting cities in batches (upsert mode)...');
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < citiesToInsert.length; i += batchSize) {
      const batch = citiesToInsert.slice(i, i + batchSize);
      const { error } = await supabase
        .from('cities')
        .upsert(batch, { 
          onConflict: 'name,state,country',
          ignoreDuplicates: true 
        });

      if (error) {
        console.error('Error inserting batch:', error);
        throw error;
      }

      inserted += batch.length;
      console.log(`Processed ${inserted}/${citiesToInsert.length} cities`);
    }

    const { count } = await supabase
      .from('cities')
      .select('*', { count: 'exact', head: true });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully populated Brazilian cities`,
        processed: inserted,
        totalInDatabase: count
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});