// functions/api/chat.js

// Handle CORS Preflight requests
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
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    // 1. Check for Workers AI binding
    if (!context.env || !context.env.AI) {
      return new Response(
        JSON.stringify({ 
          error: "Workers AI binding is missing. Please set variable name 'AI' under Settings > Functions in Cloudflare Pages." 
        }), 
        { status: 500, headers }
      );
    }

    const body = await context.request.json().catch(() => ({}));
    
    // 2. Extract user input flexible to different request formats
    let promptText = "";
    if (typeof body === "string") {
      promptText = body;
    } else if (body.message) {
      promptText = typeof body.message === "string" ? body.message : body.message.content;
    } else if (body.prompt) {
      promptText = body.prompt;
    } else if (body.text) {
      promptText = body.text;
    } else if (Array.isArray(body.messages) && body.messages.length > 0) {
      const lastMsg = body.messages[body.messages.length - 1];
      promptText = typeof lastMsg === "string" ? lastMsg : (lastMsg.content || lastMsg.text);
    }

    if (!promptText) {
      return new Response(
        JSON.stringify({ error: "Message content is required." }), 
        { status: 400, headers }
      );
    }

    // 3. Call Cloudflare Workers AI with active model
    const aiResult = await context.env.AI.run("@cf/meta/llama-3.2-3b-instruct", {
      messages: [
        { role: "system", content: "You are Prasun AI, an intelligent, helpful, precise, and friendly AI assistant." },
        { role: "user", content: promptText }
      ]
    });

    // 4. Safely extract generated output string
    let generatedText = "";
    if (typeof aiResult === "string") {
      generatedText = aiResult;
    } else if (aiResult && typeof aiResult === "object") {
      generatedText = aiResult.response || aiResult.result || aiResult.text || "";
      if (!generatedText && aiResult.choices && aiResult.choices[0]) {
        generatedText = aiResult.choices[0].message?.content || aiResult.choices[0].text || "";
      }
    }

    if (!generatedText) {
      generatedText = "I received your message, but no output text was generated.";
    }

    // 5. Flexible JSON payload ensuring frontend app.js reads response smoothly
    const payload = {
      response: generatedText,
      reply: generatedText,
      text: generatedText,
      message: generatedText,
      result: generatedText,
      choices: [
        {
          message: { role: "assistant", content: generatedText },
          text: generatedText
        }
      ]
    };

    return new Response(JSON.stringify(payload), { status: 200, headers });

  } catch (err) {
    return new Response(
      JSON.stringify({ 
        error: err.message || "Internal Server Error",
        response: "An error occurred: " + err.message
      }), 
      { status: 500, headers }
    );
  }
}
