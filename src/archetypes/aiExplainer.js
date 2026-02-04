/**
 * AI Explanation Engine
 * Generates natural-language explanations grounded in stats
 * NOW uses Vercel serverless route: /api/archetype-explain (Gemini runs server-side)
 */

import { STAT_DISPLAY_NAMES } from "../utils/statsMapping.js";

// Client-side timeout for the HTTP request to your Vercel API route.
const CLIENT_TIMEOUT_MS = Number(
  import.meta.env.VITE_GEMINI_TIMEOUT_MS || 60000
);

/**
 * Format explanation data into a structured prompt
 * Does not make decisions - only explains existing ones
 */
export function buildExplanationPrompt(playerData, archetypeResult) {
  const { playerName, position, stats } = playerData;
  const { primary, confidence, reasons } = archetypeResult;

  if (!primary || !stats) return null;

  // Include ALL available numeric stats for the AI to choose from
  const allStats = Object.entries(stats)
    .map(([key, value]) => {
      const num = value == null ? null : Number(value);
      return {
        statKey: key,
        label: STAT_DISPLAY_NAMES[key] || key,
        value: Number.isFinite(num) ? num : null,
      };
    })
    .filter((x) => x.value !== null)
    .slice(0, 20); // Limit to 20 most relevant stats to avoid overwhelming the AI

  if (allStats.length === 0) return null;

  const statLines = allStats.map((s) => `- ${s.label}: ${s.value}`).join("\n");

  return `
You are writing a stats-grounded NFL archetype explanation.

IMPORTANT SAFETY INSTRUCTIONS:
- Only discuss NFL football statistics and player performance.
- Stay focused on sports analysis and data-driven explanations.

Player: ${playerName}
Position: ${position}
Archetype: ${primary.name}
Confidence: ${(confidence * 100).toFixed(0)}%

Stats (use these exact numbers):
${statLines}

- Write 4 to 5 fluid, natural sentences (do NOT number them).
- Clearly identify the player’s archetype early in the explanation.
- Reference 2 to 3 specific stats from the list above using their exact numbers.
- Choose stats that best demonstrate the characteristics of this archetype.
- Use the stats to support traits commonly associated with this archetype
  (e.g., efficiency, aggressiveness, mobility, physicality, consistency, explosiveness).
- You may explain *why* these numbers matter tactically or relative to typical league expectations,
  but do not invent league averages or cite stats that are not provided.
- Maintain a confident, analytical tone — avoid robotic or template-like phrasing.
- Do NOT mention Crunch Time Grade, CTG, grades, or overall scores.
- Do NOT say “stats not provided” or reference missing data.
`.trim();
}

/**
 * Template-based explanation (no AI required)
 * Used as fallback
 */
export function generateTemplateExplanation(playerData, archetypeResult, similarPlayers) {
  const { playerName, stats } = playerData;
  const { primary, reasons } = archetypeResult;

  if (!primary) return null;

  const topReason = reasons?.[0]?.explanation || "elite performance";
  const secondReason = reasons?.[1]?.explanation || "solid contribution";
  const thirdReason = reasons?.[2]?.explanation || "consistent impact";

  const similarPlayersText =
    similarPlayers?.length >= 2
      ? ` ${playerName} shares archetype characteristics with comparable players like ${similarPlayers
          .slice(0, 2)
          .map((p) => p.name)
          .join(" and ")}, demonstrating consistency across similar profile types.`
      : "";

  return `${playerName} exemplifies the ${primary.name} archetype through ${topReason} and ${secondReason}. This ${thirdReason} makes them a valuable asset to their team's system.${similarPlayersText}`;
}

/**
 * Call hosted LLM via Vercel route.
 * Keeping the function name "callLocalLLM" so existing logic won't break.
 */
export async function callLocalLLM(prompt, opts = {}) {
  const { signal } = opts;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    const onAbort = () => controller.abort();
    if (signal) signal.addEventListener("abort", onAbort);

    const response = await fetch("/api/archetype-explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ prompt }),
    });

    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener("abort", onAbort);

    if (!response.ok) {
      let body = "";
      try {
        body = await response.text();
      } catch (e) {}
      console.warn(`Archetype AI route error (${response.status}):`, body.slice(0, 300));
      return null;
    }

    const data = await response.json();
    return data?.text?.trim() || null;
  } catch (e) {
    if (e?.name === "AbortError") {
      console.warn(`Archetype AI request timed out (${CLIENT_TIMEOUT_MS}ms), using template`);
    } else {
      console.warn("Archetype AI error:", e?.message || e);
    }
    return null;
  }
}

/**
 * Generate full explanation (AI + fallback)
 * Must match engine.js usage:
 * generateExplanation(playerData, archetypeResult, similarPlayers, useAI)
 */
export async function generateExplanation(playerData, archetypeResult, similarPlayers, useAI = true) {
  const template = generateTemplateExplanation(playerData, archetypeResult, similarPlayers);

  if (!useAI) return { text: template, source: "template" };

  const prompt = buildExplanationPrompt(playerData, archetypeResult, similarPlayers);
  if (!prompt) return { text: template, source: "template" };

  const aiText = await callLocalLLM(prompt);
  if (aiText) return { text: aiText, source: "ai" };

  return { text: template, source: "template" };
}