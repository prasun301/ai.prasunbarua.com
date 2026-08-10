export async function onRequestPost(context) {
  try {
    if (!context.env || !context.env.AI) {
      return new Response(
        JSON.stringify({ 
          error: "Workers AI binding is missing. Please add variable name 'AI' under Settings > Functions in Cloudflare Pages." 
        }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await context.request.json();
    const userMessage = body.message || body.prompt || "";

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: "Message content is required." }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Using active model identifier
    const aiResult = await context.env.AI.run("@cf/meta/llama-3.2-3b-instruct", {
      messages: [
        { role: "system", content: "You are Prasun AI, an intelligent and helpful assistant." },
        { role: "user", content: userMessage }
      ]
    });

    return new Response(
      JSON.stringify({ response: aiResult.response || aiResult }), 
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal Server Error" }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
