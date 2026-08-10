export async function onRequestOptions() {
  // Handle CORS preflight requests
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
    // 1. Verify the AI binding exists
    if (!context.env || !context.env.AI) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Workers AI binding is missing. Please set variable name 'AI' under Settings > Functions in Cloudflare Pages."
        }),
        { status: 500, headers }
      );
    }

    // 2. Parse the request body safely
    const body = await context.request.json().catch(() => ({}));

    // 3. Validate conversation memory payload
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request format. A 'messages' array is required."
        }),
        { status: 400, headers }
      );
    }

    // 4. Prepend system instructions
    const payloadMessages = [
      {
        role: "system",
        content: "You are Prasun AI, an intelligent, helpful, precise, and friendly AI assistant. Format your responses in clean Markdown."
      },
      ...body.messages
    ];

    // 5. Call the Google Gemma 3 model via Cloudflare Workers AI
    const aiResult = await context.env.AI.run(
      "@cf/google/gemma-3-12b-it",
      { messages: payloadMessages }
    );

    // 6. Parse the AI response safely
    let generatedText = "";
    if (typeof aiResult === "string") {
      generatedText = aiResult;
    } else if (aiResult && typeof aiResult === "object") {
      generatedText = aiResult.response || aiResult.result || "";
    }

    if (!generatedText) {
      throw new Error("Model returned an empty response.");
    }

    // 7. Return strict, clean JSON payload
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
