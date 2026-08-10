// functions/api/chat.js

export async function onRequestPost(context) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    // 1. Guard against missing Workers AI binding
    if (!context.env || !context.env.AI) {
      return new Response(
        JSON.stringify({ 
          error: "Workers AI binding is missing. Set variable name 'AI' under Settings > Functions." 
        }), 
        { status: 500, headers }
      );
    }

    const body = await context.request.json().catch(() => ({}));
    
    // 2. Extract input text from various possible frontend request formats
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
        JSON.stringify({ error: "No message content was found in the request." }), 
        { status: 400, headers }
      );
    }

    // 3. Call Cloudflare Workers AI
    const aiResult = await context.env.AI.run("@cf/meta/llama-3.2-3b-instruct", {
      messages: [
        { role: "system", content: "You are Prasun AI, a helpful, friendly, and precise assistant." },
        { role: "user", content: promptText }
      ]
    });

    // 4. Safely extract generated text from Workers AI output
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
      generatedText = "I received your prompt, but no response text was generated. Please try again.";
    }

    // 5. Payload containing all standard JSON keys so app.js parses it smoothly
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
