// Helper function to call Gemini with exponential backoff on 429 errors
async function callGeminiWithRetry(apiKey, payload, retries = 3, delay = 2000) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.status === 429 && retries > 0) {
    console.warn(`[429 Quota Exceeded] Retrying in ${delay / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return callGeminiWithRetry(apiKey, payload, retries - 1, delay * 2);
  }

  return response;
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    // Retrieve your API key from environment variables
    const apiKey = env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY environment variable is missing.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Forward the payload from frontend directly to Gemini API
    const geminiResponse = await callGeminiWithRetry(apiKey, body);
    const data = await geminiResponse.json();

    return new Response(JSON.stringify(data), {
      status: geminiResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
