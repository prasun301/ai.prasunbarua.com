export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function onRequestPost(context) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    if (!context.env || !context.env.AI) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Workers AI binding is missing. Please set variable name 'AI' under Settings > Functions in Cloudflare Pages."
        }),
        { status: 500, headers }
      );
    }

    const body = await context.request.json().catch(() => ({}));

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request format. A 'messages' array is required."
        }),
        { status: 400, headers }
      );
    }

    const payloadMessages = [
      {
        role: "system",
        content: "You are Prasun AI, an intelligent, helpful, precise, and friendly AI assistant. Format your responses in clean Markdown."
      },
      ...body.messages
    ];

    // Using Llama 3.2 3B Instruct, which is universally available on all Cloudflare Workers AI accounts
    const aiResult = await context.env.AI.run(
      "@cf/meta/llama-3.2-3b-instruct",
      { messages: payloadMessages }
    );

    let generatedText = "";
    if (typeof aiResult === "string") {
      generatedText = aiResult;
    } else if (aiResult && typeof aiResult === "object") {
      generatedText = aiResult.response || aiResult.result || "";
    }

    if (!generatedText) {
      throw new Error("Model returned an empty response.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: generatedText
      }),
      { status: 200, headers }
    );

  } catch (err) {
    console.error("AI API Error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Internal Server Error"
      }),
      { status: 500, headers }
    );
  }
}
