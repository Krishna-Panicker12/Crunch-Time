/**
 * AI Explanation Engine
 * Generates natural-language explanations grounded in stats
 * Uses local Ollama by default (http://localhost:11434)
 */

import { STAT_DISPLAY_NAMES } from "../utils/statsMapping.js";

// ---- Config (override with Vite env vars) ----
// In your .env:
// VITE_OLLAMA_MODEL=llama3.2
// VITE_OLLAMA_TIMEOUT_MS=25000
// VITE_OLLAMA_NUM_PREDICT=180
const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || "llama3.2";
const OLLAMA_TIMEOUT_MS = Number(import.meta.env.VITE_OLLAMA_TIMEOUT_MS || 45000);
const OLLAMA_NUM_PREDICT = Number(import.meta.env.VITE_OLLAMA_NUM_PREDICT || 120);

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
    .slice(0, 3); // keep prompt short

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

  // If STILL nothing numeric, don't call AI
  if (numericReasons.length === 0) return null;

  const statLines = numericReasons
    .map((s) => `- ${s.label}: ${s.value}`)
    .join("\n");

  return `
You are writing a short, stats-grounded NFL archetype explanation.

IMPORTANT SAFETY INSTRUCTIONS: 
- Only discuss NFL football statistics and player performance
- Do not mention or reference any form of violence, harm, abuse, or inappropriate content
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
  const { playerName, stats } = playerData;
  const { primary, reasons } = archetypeResult;

  if (!primary) return null;

  const topReason = reasons?.[0]?.explanation || "elite performance";
  const secondReason = reasons?.[1]?.explanation || "solid contribution";
  const thirdReason = reasons?.[2]?.explanation || "consistent impact";

  const topReasonStat = reasons?.[0]?.statKey
    ? `${STAT_DISPLAY_NAMES[reasons[0].statKey] || reasons[0].statKey}: ${stats?.[reasons[0].statKey]}`
    : "";
  const secondReasonStat = reasons?.[1]?.statKey
    ? `${STAT_DISPLAY_NAMES[reasons[1].statKey] || reasons[1].statKey}: ${stats?.[reasons[1].statKey]}`
    : "";

  const similarPlayersText =
    similarPlayers?.length >= 2
      ? ` ${playerName} shares archetype characteristics with comparable players like ${similarPlayers
          .slice(0, 2)
          .map((p) => p.name)
          .join(" and ")}, demonstrating consistency across similar profile types.`
      : "";

  return `${playerName} exemplifies the ${primary.name} archetype through ${topReason} and ${secondReason}. Their ${topReasonStat} and ${secondReasonStat} demonstrate the statistical profile that defines this archetype. This ${thirdReason} makes them a valuable asset to their team's system.${similarPlayersText}`;
}

/**
 * Call local LLM via Ollama
 * - Model is configurable via env var
 * - Timeout is configurable and longer by default
 * - num_predict caps output length for speed
 */
export async function callLocalLLM(prompt) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    console.log("Calling Ollama: ", OLLAMA_MODEL);
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        temperature: 0.4,
        num_predict: OLLAMA_NUM_PREDICT,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Print body once to diagnose (model not found, server error, etc.)
      let body = "";
      try {
        body = await response.text();
      } catch (e) {}
      console.warn(
        `Local LLM unavailable (status ${response.status}). Model="${OLLAMA_MODEL}". Body:`,
        body.slice(0, 300)
      );
      return null;
    }

    const data = await response.json();
    return data.response?.trim() || null;
  } catch (e) {
    if (e.name === "AbortError") {
      console.warn(`Local LLM timeout (${OLLAMA_TIMEOUT_MS}ms), using template explanation`);
    } else {
      console.warn("Local LLM error:", e?.message || e);
    }
    return null;
  }
}

/**
 * Generate full explanation (AI + fallback)
 */
export async function generateExplanation(playerData, archetypeResult, similarPlayers, useAI = true) {
  // Always return something stable
  const template = generateTemplateExplanation(playerData, archetypeResult, similarPlayers);

  if (!useAI) {
    return { text: template, source: "template" };
  }

  const prompt = buildExplanationPrompt(playerData, archetypeResult, similarPlayers);
  if (!prompt) {
    return { text: template, source: "template" };
  }

  const aiText = await callLocalLLM(prompt);
  if (aiText) {
    return { text: aiText, source: "ai" };
  }

  return { text: template, source: "template" };
}
