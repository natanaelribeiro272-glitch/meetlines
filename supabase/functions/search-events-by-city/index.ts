import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SearchRequest {
  city: string;
  searchQuery?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { city, searchQuery }: SearchRequest = await req.json();

    if (!city) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Nome da cidade é obrigatório",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const serperApiKey = Deno.env.get("SERPER_API_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "OPENAI_API_KEY não configurada",
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

    if (!serperApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SERPER_API_KEY não configurada",
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

    const query = searchQuery || `eventos ${city}`;
    console.log(`Buscando: ${query}`);

    const serperResponse = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": serperApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        gl: "br",
        hl: "pt-br",
        num: 10,
      }),
    });

    if (!serperResponse.ok) {
      throw new Error(`Erro na busca do Google: ${serperResponse.statusText}`);
    }

    const searchResults = await serperResponse.json();
    console.log("Resultados da busca:", JSON.stringify(searchResults, null, 2));

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Você é um assistente especializado em extrair informações de eventos a partir de resultados de busca do Google.

Sua tarefa é analisar os resultados da busca e extrair informações sobre eventos reais que encontrar.

Para cada evento encontrado, extraia:
- title: título do evento
- description: descrição detalhada (mínimo 100 caracteres)
- event_date: data no formato ISO 8601 (YYYY-MM-DDTHH:MM:SS)
- end_date: data de término no formato ISO 8601 (se houver)
- location: local específico (nome do lugar, endereço)
- city: ${city}
- price: preço em reais (número) ou 0 se for gratuito
- category: uma categoria adequada (musica, teatro, esportes, gastronomia, arte, tecnologia, etc)
- event_url: URL oficial do evento (se disponível)

IMPORTANTE:
- Retorne APENAS eventos com data futura (não eventos passados)
- Se não encontrar a data exata, NÃO invente uma data
- A descrição deve ter no mínimo 100 caracteres
- Retorne no máximo 5 eventos
- Se não encontrar eventos válidos, retorne um array vazio

Responda APENAS com um JSON válido no formato:
{
  "events": [
    {
      "title": "...",
      "description": "...",
      "event_date": "...",
      "end_date": "...",
      "location": "...",
      "city": "...",
      "price": 0,
      "category": "...",
      "event_url": "..."
    }
  ]
}`,
            },
            {
              role: "user",
              content: `Extraia informações de eventos a partir destes resultados de busca para "${query}":\n\n${JSON.stringify(
                searchResults
              )}`,
            },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!openaiResponse.ok) {
      throw new Error(`Erro na OpenAI: ${openaiResponse.statusText}`);
    }

    const aiResult = await openaiResponse.json();
    const aiContent = JSON.parse(
      aiResult.choices[0].message.content
    );

    console.log("Eventos extraídos pela IA:", aiContent);

    if (!aiContent.events || aiContent.events.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Nenhum evento encontrado para esta cidade",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Autorização necessária");
    }

    const token = authHeader.replace("Bearer ", "");
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
      },
    });

    if (!userResponse.ok) {
      throw new Error("Usuário não autenticado");
    }

    const user = await userResponse.json();

    const eventsToCreate = aiContent.events.map((event: any) => ({
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      end_date: event.end_date || null,
      location: event.location,
      city: event.city || city,
      price: event.price || 0,
      category: event.category || "outros",
      event_url: event.event_url || null,
      status: "pending",
      created_by: user.id,
      max_attendees: 1000,
      is_private: false,
    }));

    console.log("Criando eventos:", eventsToCreate);

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(eventsToCreate),
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      throw new Error(`Erro ao criar eventos: ${errorText}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventsCreated: eventsToCreate.length,
        message: `${eventsToCreate.length} evento(s) criado(s) com sucesso`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
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