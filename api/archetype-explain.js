// crunch time api route to interface with Gemini API

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing prompt" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  // 12s is often too aggressive for serverless + model latency (causes partial/aborted outputs).
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 25000);

  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          // Lower temperature → fewer weird early stops / fragment outputs.
          temperature: 0.3,
          maxOutputTokens: 300,
        },
      }),
    });

    if (!r.ok) {
      let errText = "";
      try {
        errText = await r.text();
      } catch {}
      return res.status(502).json({
        error: "Gemini error",
        status: r.status,
        details: errText.slice(0, 300),
      });
    }

    const data = await r.json();
    const candidate = data?.candidates?.[0];
    const text =
      candidate?.content?.parts?.map((p) => p?.text).filter(Boolean).join("")?.trim() || null;

    // Return finishReason for debugging (client will ignore in prod UI).
    return res.status(200).json({
      text,
      finishReason: candidate?.finishReason || null,
    });
  } catch (e) {
    const isAbort = e?.name === "AbortError";
    return res.status(isAbort ? 504 : 500).json({
      error: isAbort ? "Gemini timeout" : "Server error",
      details: isAbort ? undefined : String(e?.message || e),
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
