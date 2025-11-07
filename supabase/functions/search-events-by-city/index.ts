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
    console.log("=== Iniciando busca de eventos por cidade ===");

    const { city, searchQuery }: SearchRequest = await req.json();
    console.log("Cidade:", city);
    console.log("Query:", searchQuery);

    if (!city) {
      console.error("Erro: cidade não fornecida");
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

    console.log("Verificando variáveis de ambiente...");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const serpApiKey = Deno.env.get("SERPAPI_API_KEY");

    console.log("OPENAI_API_KEY presente:", !!openaiApiKey);
    console.log("SERPAPI_API_KEY presente:", !!serpApiKey);

    if (!openaiApiKey) {
      console.error("ERRO: OPENAI_API_KEY não está configurada!");
      console.error("Configure em: Supabase Dashboard → Edge Functions → Secrets");
      return new Response(
        JSON.stringify({
          success: false,
          error: "OPENAI_API_KEY não configurada. Configure em: Supabase Dashboard → Edge Functions → Secrets",
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

    let searchResults: any;

    if (serpApiKey) {
      const serpApiUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&location=Brazil&hl=pt-br&gl=br&num=10&api_key=${serpApiKey}`;

      const serpResponse = await fetch(serpApiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!serpResponse.ok) {
        throw new Error(`Erro na SerpAPI: ${serpResponse.statusText}`);
      }

      const serpData = await serpResponse.json();

      searchResults = {
        organic: serpData.organic_results || [],
        answerBox: serpData.answer_box,
        knowledgeGraph: serpData.knowledge_graph,
      };

      console.log("Resultados da SerpAPI:", searchResults);
    } else {
      const encodedQuery = encodeURIComponent(`${query} brasil 2025`);
      const searchUrl = `https://www.google.com/search?q=${encodedQuery}&gl=br&hl=pt-br`;

      const htmlResponse = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!htmlResponse.ok) {
        throw new Error(`Erro ao buscar no Google: ${htmlResponse.statusText}`);
      }

      const html = await htmlResponse.text();

      searchResults = {
        organic: [{
          title: "Resultados de busca",
          snippet: html.substring(0, 10000),
          link: searchUrl,
        }],
      };
    }

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
              content: `Você é um assistente especializado em extrair informações de eventos a partir de resultados de busca do Google.\n\nSua tarefa é analisar os resultados da busca e extrair informações sobre eventos reais que encontrar.\n\nPara cada evento encontrado, extraia:\n- title: título do evento\n- description: descrição detalhada (mínimo 100 caracteres)\n- event_date: data no formato ISO 8601 (YYYY-MM-DDTHH:MM:SS)\n- end_date: data de término no formato ISO 8601 (se houver)\n- location: local específico (nome do lugar, endereço)\n- city: ${city}\n- price: preço em reais (número) ou 0 se for gratuito\n- category: uma categoria adequada (musica, teatro, esportes, gastronomia, arte, tecnologia, etc)\n- event_url: URL oficial do evento (se disponível)\n\nIMPORTANTE:\n- Retorne APENAS eventos com data futura (não eventos passados)\n- Se não encontrar a data exata, NÃO invente uma data\n- A descrição deve ter no mínimo 100 caracteres\n- Retorne no máximo 5 eventos\n- Se não encontrar eventos válidos, retorne um array vazio\n\nResponda APENAS com um JSON válido no formato:\n{\n  \"events\": [\n    {\n      \"title\": \"...\",\n      \"description\": \"...\",\n      \"event_date\": \"...\",\n      \"end_date\": \"...\",\n      \"location\": \"...\",\n      \"city\": \"...\",\n      \"price\": 0,\n      \"category\": \"...\",\n      \"event_url\": \"...\"\n    }\n  ]\n}`,
            },
            {
              role: "user",
              content: `Extraia informações de eventos a partir destes resultados de busca para \"${query}\":\\n\\n${JSON.stringify(
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
    console.error("=== ERRO AO BUSCAR EVENTOS ===");
    console.error("Tipo do erro:", error?.constructor?.name);
    console.error("Mensagem:", error instanceof Error ? error.message : String(error));
    console.error("Stack:", error instanceof Error ? error.stack : "N/A");

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          type: error?.constructor?.name,
          stack: error instanceof Error ? error.stack : undefined
        } : undefined
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