export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: { message: "GEMINI_API_KEY environment variable is not configured on the server." } }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const requestedModel = body.model || "gemini-2.0-flash";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${requestedModel}:generateContent?key=${apiKey}`;

    // Transform app chat history into Gemini API contents structure
    const contents = (body.messages || []).map((msg) => {
      const parts = [];
      if (msg.attachment && msg.attachment.data) {
        parts.push({
          inline_data: {
            mime_type: msg.attachment.mimeType,
            data: msg.attachment.data
          }
        });
      }
      if (msg.content) {
        parts.push({ text: msg.content });
      }
      return {
        role: msg.role === "assistant" ? "model" : "user",
        parts: parts
      };
    });

    const payload = {
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    };

    const apiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `API error (${apiResponse.status})`;
      return new Response(
        JSON.stringify({ error: { message: errorMessage } }),
        { status: apiResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await apiResponse.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";

    return new Response(
      JSON.stringify({ response: replyText }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: { message: err.message || "Failed to process chat request." } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
