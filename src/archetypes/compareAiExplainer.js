/**
 * AI Explanation Engine for Compare Page
 * Generates natural-language explanations for why a winner was chosen
 * NOW uses Vercel serverless route: /api/compare-explain (Gemini runs server-side)
 */

import { STAT_DISPLAY_NAMES, BETTER_DIRECTION } from "../utils/statsMapping.js";

// Client-side timeout for the HTTP request to your Vercel API route.
// (This is not the Gemini timeout; it's just how long the browser waits.)
const CLIENT_TIMEOUT_MS = Number(import.meta.env.VITE_GEMINI_TIMEOUT_MS || 60000);

// Basic quality gate: prevents showing cut-off / incomplete AI outputs.
function isBadAiText(t) {
  if (!t) return true;
  const text = String(t).trim();
  if (!text) return true;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 10) return true;
  if (!/[.!?]["')\]]?\s*$/.test(text)) return true;
  return false;
}

/**
 * Format comparison data into a structured prompt
 */
export function buildCompareExplanationPrompt(playerAData, playerBData, winner, winnerReason) {
  const { playerName: nameA, position: posA, stats: statsA } = playerAData;
  const { playerName: nameB, position: posB, stats: statsB } = playerBData;

  if (!statsA || !statsB || !winner) return null;

  // Get key stats for comparison (exclude CTG)
  const statKeys = Object.keys(statsA).filter(
    (key) =>
      Object.prototype.hasOwnProperty.call(statsB, key) &&
      !Number.isNaN(Number(statsA[key])) &&
      !Number.isNaN(Number(statsB[key])) &&
      key !== "crunch_time_grade"
  );

  const comparisons = statKeys
    .slice(0, 8)
    .map((key) => {
      const label = STAT_DISPLAY_NAMES[key] || key;
      const valA = Number(statsA[key]);
      const valB = Number(statsB[key]);
      const dir = BETTER_DIRECTION[key] || "higher";

      let better;
      if (dir === "higher") {
        better = valA > valB ? nameA : valB > valA ? nameB : "tie";
      } else {
        better = valA < valB ? nameA : valB < valA ? nameB : "tie";
      }

      return `${label}: ${nameA} ${valA} vs ${nameB} ${valB} (${better} better)`;
    })
    .join("\n");

  const prompt = `
    You are an NFL analyst. Explain why ${winner} won this comparison between:
    - ${nameA} (${posA})
    - ${nameB} (${posB})

    Hard rules:
    - Write EXACTLY 3–4 sentences.
    - Each sentence must reference at least THREE numeric stat from the list below (use the numbers exactly).
    - Do NOT mention "Crunch Time Grade", "CTG", "grade", or any overall score.
    - Be specific (not generic).

    Winner context (do not mention CTG): ${winnerReason}

    Stats you must reference:
    ${comparisons}

    Return only the explanation text.
    `.trim();

    return prompt;
}

/**
 * Call hosted AI via Vercel API route (Gemini runs server-side)
 */
async function callLocalLLM(prompt, opts = {}) {
  const { signal } = opts;
  if (!prompt) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  const onAbort = () => controller.abort();
  if (signal) signal.addEventListener("abort", onAbort);

  try {
    const response = await fetch("/api/compare-explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      let body = "";
      try {
        body = await response.text();
      } catch (e) {}
      console.warn(`Compare AI route error (${response.status}):`, body.slice(0, 300));
      return null;
    }

    const data = await response.json();
    const text = data?.text?.trim() || null;

    if (import.meta.env.DEV && data?.finishReason) {
      console.debug("[compare AI] finishReason:", data.finishReason);
    }

    return isBadAiText(text) ? null : text;
  } catch (error) {
    if (error?.name === "AbortError") return null;
    console.warn("Failed to call /api/compare-explain:", error);
    return null;
  } finally {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener("abort", onAbort);
  }
}

/**
 * Generate template explanation as fallback
 */
function generateTemplateExplanation(playerAData, playerBData, winner) {
  const { position: posA } = playerAData;
  return `${winner} was selected as the winner based on a comprehensive comparison of their season statistics, with particular emphasis on key performance metrics for the ${posA} position.`;
}

/**
 * Main function: Generate AI explanation for comparison winner
 */
export async function generateCompareExplanation(
  playerAData,
  playerBData,
  winner,
  winnerReason,
  useAI = true,
  opts = {}
) {
  const template = generateTemplateExplanation(playerAData, playerBData, winner);

  if (!useAI) return { text: template, source: "template" };

  const prompt = buildCompareExplanationPrompt(playerAData, playerBData, winner, winnerReason);
  if (!prompt) return { text: template, source: "template" };

  const aiText = await callLocalLLM(prompt, opts);
  if (!isBadAiText(aiText)) return { text: aiText, source: "ai" };

  return { text: template, source: "template" };
}
