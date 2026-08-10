/**
 * Cloudflare Pages Function: POST /api/chat
 * Integrates with Cloudflare Workers AI using Google Gemini 3 Flash
 */

const MODEL_ID = "google/gemini-3-flash";

const SYSTEM_INSTRUCTION = `You are Prasun AI, a professional, intelligent, helpful, accurate, and friendly AI assistant.
Answer the user's question directly and clearly.
Do not invent facts. If you are uncertain, clearly say so.
For technical questions, provide technically accurate explanations.
For programming questions, provide clean, working, well-formatted code.
For engineering questions, give practical and technically sound answers.
Use Markdown when it improves readability.
Do not mention internal implementation details unless the user asks.
Do not claim to have performed actions that you did not perform.
Keep answers appropriately concise unless the user asks for detailed explanation.`;

export async function onRequestPost(context) {
  try {
    // 1. Ensure Cloudflare AI Binding exists
    if (!context.env || !context.env.AI) {
      return new Response(
        JSON.stringify({
          error: "Cloudflare AI binding ('AI') is not configured or context.env.AI is missing."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 2. Parse incoming JSON body
    let body;
    try {
      body = await context.request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON request body." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Request body must include a non-empty 'messages' array." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 3. Limit conversation history to the last 12 messages to keep requests light & performant
    const MAX_HISTORY = 12;
    const recentMessages = messages.slice(-MAX_HISTORY);

    // 4. Sanitize and format messages for Cloudflare AI / Gemini
    const formattedMessages = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      ...recentMessages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: String(msg.content || "").trim()
      }))
    ];

    // 5. Run inference through Cloudflare Workers AI binding
    const aiResult = await context.env.AI.run(MODEL_ID, {
      messages: formattedMessages
    });

    // 6. Extract textual output safely
    let aiResponseText = "";

    if (typeof aiResult === "string") {
      aiResponseText = aiResult;
    } else if (aiResult && typeof aiResult.response === "string") {
      aiResponseText = aiResult.response;
    } else if (aiResult && aiResult.choices && aiResult.choices[0] && aiResult.choices[0].message) {
      aiResponseText = aiResult.choices[0].message.content || "";
    } else if (aiResult && typeof aiResult.result === "string") {
      aiResponseText = aiResult.result;
    } else {
      aiResponseText = JSON.stringify(aiResult);
    }

    if (!aiResponseText || aiResponseText.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Gemini returned an empty response." }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 7. Return standard JSON response
    return new Response(
      JSON.stringify({ response: aiResponseText.trim() }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        }
      }
    );

  } catch (error) {
    console.error("Error inside /api/chat Pages Function:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred on the server."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

// Block non-POST methods
export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed. Use POST." }),
      {
        status: 405,
        headers: { "Content-Type": "application/json", "Allow": "POST" }
      }
    );
  }
}
