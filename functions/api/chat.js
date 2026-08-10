// functions/api/chat.js

function headers() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: headers()
  });
}

export async function onRequestPost(context) {
  const responseHeaders = headers();

  try {
    // --------------------------------------------------
    // TEST 1 — Is the AI binding available?
    // --------------------------------------------------

    if (!context.env) {
      return new Response(
        JSON.stringify({
          ok: false,
          step: "environment",
          error: "context.env is missing"
        }),
        {
          status: 500,
          headers: responseHeaders
        }
      );
    }

    if (!context.env.AI) {
      return new Response(
        JSON.stringify({
          ok: false,
          step: "binding",
          error:
            "Workers AI binding 'AI' was not found. Check Cloudflare Pages > Settings > Functions > Bindings."
        }),
        {
          status: 500,
          headers: responseHeaders
        }
      );
    }

    // --------------------------------------------------
    // TEST 2 — Read request
    // --------------------------------------------------

    let body;

    try {
      body = await context.request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          ok: false,
          step: "json",
          error: "Request body is not valid JSON.",
          details: error.message
        }),
        {
          status: 400,
          headers: responseHeaders
        }
      );
    }

    // --------------------------------------------------
    // TEST 3 — Get user message
    // --------------------------------------------------

    let userMessage = "";

    if (
      Array.isArray(body?.messages) &&
      body.messages.length > 0
    ) {
      const lastMessage =
        body.messages[body.messages.length - 1];

      if (
        lastMessage &&
        typeof lastMessage.content === "string"
      ) {
        userMessage =
          lastMessage.content.trim();
      }
    }

    if (
      !userMessage &&
      typeof body?.message === "string"
    ) {
      userMessage =
        body.message.trim();
    }

    if (
      !userMessage &&
      typeof body?.prompt === "string"
    ) {
      userMessage =
        body.prompt.trim();
    }

    if (!userMessage) {
      return new Response(
        JSON.stringify({
          ok: false,
          step: "message",
          error: "No user message was received.",
          received: body
        }),
        {
          status: 400,
          headers: responseHeaders
        }
      );
    }

    // --------------------------------------------------
    // TEST 4 — Call Gemini
    // --------------------------------------------------

    let result;

    try {
      result = await context.env.AI.run(
        "google/gemini-3-flash",
        {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: userMessage
                }
              ]
            }
          ]
        }
      );
    } catch (error) {
      console.error(
        "AI.run ERROR:",
        error
      );

      return new Response(
        JSON.stringify({
          ok: false,
          step: "AI.run",
          error:
            error?.message ||
            "AI.run failed.",
          name:
            error?.name || null,
          stack:
            error?.stack || null
        }),
        {
          status: 502,
          headers: responseHeaders
        }
      );
    }

    // --------------------------------------------------
    // TEST 5 — Return RAW Gemini result
    // --------------------------------------------------

    return new Response(
      JSON.stringify({
        ok: true,
        step: "complete",
        model: "google/gemini-3-flash",
        result: result
      }),
      {
        status: 200,
        headers: responseHeaders
      }
    );

  } catch (error) {

    console.error(
      "CHAT FUNCTION ERROR:",
      error
    );

    return new Response(
      JSON.stringify({
        ok: false,
        step: "unknown",
        error:
          error?.message ||
          "Unknown server error.",
        name:
          error?.name || null,
        stack:
          error?.stack || null
      }),
      {
        status: 500,
        headers: responseHeaders
      }
    );
  }
}
