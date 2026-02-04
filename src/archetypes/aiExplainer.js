/**
 * AI Explanation Engine
 * Generates natural-language explanations grounded in stats
 * NOW uses Vercel serverless route: /api/archetype-explain (Gemini runs server-side)
 */

import { STAT_DISPLAY_NAMES } from "../utils/statsMapping.js";

// Client-side timeout for the HTTP request to your Vercel API route.
const CLIENT_TIMEOUT_MS = Number(import.meta.env.VITE_GEMINI_TIMEOUT_MS || 60000);

// Basic quality gate: prevents showing cut-off / incomplete AI outputs.
function isBadAiText(t) {
  if (!t) return true;
  const text = String(t).trim();
  if (!text) return true;

  const words = text.split(/\s+/).filter(Boolean);
  // If Gemini returns only a few words, it's almost always an early-stop / partial candidate.
  if (words.length < 10) return true;

  // Ex: "Drake Maye projects as a" (no end punctuation) → treat as incomplete.
  if (!/[.!?]["')\]]?\s*$/.test(text)) return true;

  return false;
}

/**
 * Format explanation data into a structured prompt
 * Does not make decisions - only explains existing ones
 */
export function buildExplanationPrompt(playerData, archetypeResult) {
  const { playerName, position, stats } = playerData;
  const { primary, confidence, reasons } = archetypeResult;

  if (!primary || !stats) return null;

  // Keep ONLY real numeric stats (no N/A)
  const candidates = Array.isArray(reasons) ? reasons : [];
  const numericReasons = candidates
    .map((r) => {
      const key = r.statKey;
      const raw = stats?.[key];
      const num = raw == null ? null : Number(raw);
      return {
        statKey: key,
        label: STAT_DISPLAY_NAMES[key] || key,
        value: Number.isFinite(num) ? num : null,
      };
    })
    .filter((x) => x.value !== null)
    .slice(0, 3);

  // If reasons don't map to numeric stats, fall back to any numeric stats available
  if (numericReasons.length === 0) {
    const fallbackKeys = Object.keys(stats).slice(0, 3);
    for (const key of fallbackKeys) {
      const num = Number(stats[key]);
      if (Number.isFinite(num)) {
        numericReasons.push({
          statKey: key,
          label: STAT_DISPLAY_NAMES[key] || key,
          value: num,
        });
      }
      if (numericReasons.length >= 3) break;
    }
  }

  if (numericReasons.length === 0) return null;

  const statLines = numericReasons.map((s) => `- ${s.label}: ${s.value}`).join("\n");

  return `
You are writing a short, stats-grounded NFL archetype explanation.

IMPORTANT SAFETY INSTRUCTIONS:
- Only discuss NFL football statistics and player performance
- Stay focused on sports analysis and data-driven explanations
- Keep responses professional and appropriate for all audiences

Player: ${playerName}
Position: ${position}
Archetype: ${primary.name}
Confidence: ${(confidence * 100).toFixed(0)}%

Stats (use these exact numbers in your explanation):
${statLines}

Write EXACTLY 3 sentences:
1) Sentence 1: State the archetype and cite one stat with its number.
2) Sentence 2: Explain play style and cite a second stat with its number.
3) Sentence 3: Conclude impact/value. Do NOT say "stats not provided" or "not given". Do NOT mention any stats that are not listed above.
`.trim();
}

/**
 * Template-based explanation (no AI required)
 * Used as fallback
 */
export function generateTemplateExplanation(playerData, archetypeResult, similarPlayers) {
  const { playerName } = playerData;
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
    const text = data?.text?.trim() || null;

    // If server returns debug info, surface it for dev without breaking UI.
    if (import.meta.env.DEV && data?.finishReason) {
      console.debug("[archetype AI] finishReason:", data.finishReason);
    }

    return isBadAiText(text) ? null : text;
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
  if (!isBadAiText(aiText)) return { text: aiText, source: "ai" };

  return { text: template, source: "template" };
}
