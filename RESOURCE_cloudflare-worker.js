export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST for chat messages." }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    if (!env.MY_API_KEY) {
      return new Response(
        JSON.stringify({ error: "The MY_API_KEY binding is not configured." }),
        { status: 500, headers: corsHeaders },
      );
    }

    const apiKey =
      typeof env.MY_API_KEY === "string"
        ? env.MY_API_KEY
        : await env.MY_API_KEY.get();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "The MY_API_KEY secret was not found in Secrets Store." }),
        { status: 500, headers: corsHeaders },
      );
    }

    const userInput = await request.json();
    if (!Array.isArray(userInput.messages)) {
      return new Response(JSON.stringify({ error: "A messages array is required." }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1",
          messages: userInput.messages,
          max_completion_tokens: 300,
        }),
      },
    );

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: corsHeaders,
    });
  },
};
