export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    // Check if Cloudflare sees your API key
    if (!env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is missing in Cloudflare settings." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const model = body.model || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

    const apiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: body.messages })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      throw new Error(data.error?.message || "Error from Gemini API");
    }

    const replyText = data.candidates[0].content.parts[0].text;
    
    return new Response(
      JSON.stringify({ response: replyText }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
