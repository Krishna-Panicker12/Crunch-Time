// crunch time api route to interface with Groq (OpenAI-compatible)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing prompt" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const timeoutMs = Number(process.env.GROQ_TIMEOUT_MS || 20000);

  if (!apiKey) {
    console.error("GROQ_API_KEY is not set");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const url = "https://api.groq.com/openai/v1/chat/completions";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are an NFL analyst comparing two players using stats." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 180, // matches your Gemini compare token limit
      }),
    });

    if (!r.ok) {
      let errText = "";
      try {
        errText = await r.text();
      } catch {}
      return res.status(502).json({
        error: "Groq error",
        status: r.status,
        details: errText.slice(0, 300),
      });
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || null;
    const finishReason = data?.choices?.[0]?.finish_reason || null;

    return res.status(200).json({ text, finishReason });
  } catch (e) {
    const isAbort = e?.name === "AbortError";
    return res.status(isAbort ? 504 : 500).json({
      error: isAbort ? "Groq timeout" : "Server error",
      details: isAbort ? undefined : String(e?.message || e),
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
