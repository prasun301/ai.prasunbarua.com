export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    // ---------------------------------------------------------
    // 1. Check Gemini API key
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // 2. Read request body
    // ---------------------------------------------------------
    const body = await request.json();

    if (!body || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({
          error: "Invalid request. 'messages' must be an array."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // ---------------------------------------------------------
    // 3. Select Gemini model
    //
    // Gemini 2.0 Flash was shut down.
    // If the old frontend sends gemini-2.0-flash,
    // automatically migrate it to Gemini 3.6 Flash.
    // ---------------------------------------------------------

    let model = body.model || "gemini-3.6-flash";

    if (
      model === "gemini-2.0-flash" ||
      model === "gemini-2.0-flash-001" ||
      model === "gemini-2.0-flash-exp"
    ) {
      model = "gemini-3.6-flash";
    }

    // Only allow supported models that we intentionally expose.
    const allowedModels = [
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite"
    ];

    if (!allowedModels.includes(model)) {
      model = "gemini-3.6-flash";
    }

    // ---------------------------------------------------------
    // 4. Gemini API endpoint
    // ---------------------------------------------------------

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // ---------------------------------------------------------
    // 5. Call Gemini API
    // ---------------------------------------------------------

    const apiResponse = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY
      },

      body: JSON.stringify({
        contents: body.messages
      })
    });

    // ---------------------------------------------------------
    // 6. Read Gemini response
    // ---------------------------------------------------------

    const data = await apiResponse.json();

    // ---------------------------------------------------------
    // 7. Handle Gemini API errors
    // ---------------------------------------------------------

    if (!apiResponse.ok) {
      console.error("Gemini API error:", data);

      return new Response(
        JSON.stringify({
          error:
            data?.error?.message ||
            "Gemini API returned an error.",
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

    // ---------------------------------------------------------
    // 8. Safely extract AI response
    // ---------------------------------------------------------

    const replyText =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "";

    if (!replyText) {
      console.error("Unexpected Gemini response:", data);

      return new Response(
        JSON.stringify({
          error: "Gemini returned an empty response."
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // ---------------------------------------------------------
    // 9. Return response to frontend
    // ---------------------------------------------------------

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
    // ---------------------------------------------------------
    // 10. Unexpected server error
    // ---------------------------------------------------------

    console.error("Cloudflare Function error:", err);

    return new Response(
      JSON.stringify({
        error: err?.message || "Internal server error."
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
