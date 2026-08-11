export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    const body = await request.json();

    // Check API key
    if (!env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY is missing in Cloudflare settings."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Current Gemini models
    const allowedModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.1-pro"
    ];

    // Default model
    const model = allowedModels.includes(body.model)
      ? body.model
      : "gemini-3.5-flash-lite";

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

    const apiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: body.messages
      })
    });

    const data = await apiResponse.json();

    // Handle Gemini API errors
    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({
          error:
            data?.error?.message ||
            `Gemini API request failed with status ${apiResponse.status}.`,
          status: apiResponse.status,
          model: model
        }),
        {
          status: apiResponse.status,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Check response safely
    const replyText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      return new Response(
        JSON.stringify({
          error: "Gemini returned an empty response.",
          model: model
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        response: replyText,
        model: model
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err?.message || "Unexpected server error."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
