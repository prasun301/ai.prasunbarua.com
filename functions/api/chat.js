// functions/api/chat.js

// Handle CORS Preflight requests for local development or cross-origin calls
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
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const body = await context.request.json();
    
    // Support either single message or array of past messages
    const userMessage = body.message || body.prompt;
    const history = body.history || []; // Pass array of [{role: 'user', content: '...'}, ...] from frontend if available

    if (!userMessage && history.length === 0) {
      return new Response(
        JSON.stringify({ error: "Message content is required." }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Prepare message payload
    const systemPrompt = { 
      role: "system", 
      content: "You are Prasun AI, a helpful, precise, and friendly AI assistant." 
    };

    let messages = [systemPrompt];

    if (history.length > 0) {
      messages = messages.concat(history);
    } else if (userMessage) {
      messages.push({ role: "user", content: userMessage });
    }

    // Call Cloudflare Workers AI model
    const aiResult = await context.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: messages
    });

    return new Response(
      JSON.stringify({ response: aiResult.response || aiResult }), 
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal Server Error" }), 
      { status: 500, headers: corsHeaders }
    );
  }
}
