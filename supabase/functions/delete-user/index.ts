import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Delete user function called');

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deleting user:', user.id);

    // Create admin client to delete user from auth
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );

    // Delete the user from auth.users
    // This will cascade delete all related data due to ON DELETE CASCADE constraints
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user', details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User deleted successfully:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conta deletada com sucesso. Você pode criar uma nova conta a qualquer momento.' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});