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
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1",
          input: userInput.messages,
          tools: [
            {
              type: "web_search",
              search_context_size: "medium",
            },
          ],
          max_output_tokens: 800,
        }),
      },
    );

    const data = await response.json();
    const replyText =
      data.output_text ||
      data.output
        ?.filter((item) => item.type === "message")
        .flatMap((item) => item.content || [])
        .filter((content) => content.type === "output_text")
        .map((content) => content.text)
        .join("\n") ||
      "";

    const citations = [];
    data.output?.forEach((item) => {
      item.content?.forEach((content) => {
        content.annotations?.forEach((annotation) => {
          if (annotation.type === "url_citation" && annotation.url) {
            const duplicate = citations.some(
              (citation) => citation.url === annotation.url,
            );
            if (!duplicate) {
              citations.push({
                title: annotation.title || annotation.url,
                url: annotation.url,
              });
            }
          }
        });
      });
    });

    // Keep a chat-completions-shaped reply for the existing frontend.
    const normalized = {
      ...data,
      citations,
      choices: [
        {
          message: {
            role: "assistant",
            content: replyText,
          },
        },
      ],
    };

    return new Response(JSON.stringify(normalized), {
      status: response.status,
      headers: corsHeaders,
    });
  },
};
