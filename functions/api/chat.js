export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const { message } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Call Gemini API securely from Cloudflare's server
    const model = env.GEMINI_MODEL || "gemini-2.5-flash";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

    const apiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "Gemini API error" }), {
        status: apiResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
