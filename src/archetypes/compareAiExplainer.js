/**
 * AI Explanation Engine for Compare Page
 * Generates natural-language explanations for why a winner was chosen
 * Uses local Ollama by default (http://localhost:11434)
 */

import { STAT_DISPLAY_NAMES, BETTER_DIRECTION } from "../utils/statsMapping.js";

// ---- Config (same as aiExplainer.js) ----
const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || "llama3.2";
const OLLAMA_TIMEOUT_MS = Number(import.meta.env.VITE_OLLAMA_TIMEOUT_MS || 45000);
const OLLAMA_NUM_PREDICT = Number(import.meta.env.VITE_OLLAMA_NUM_PREDICT || 120);

/**
 * Format comparison data into a structured prompt
 */
export function buildCompareExplanationPrompt(playerAData, playerBData, winner, winnerReason) {
  const { playerName: nameA, position: posA, stats: statsA } = playerAData;
  const { playerName: nameB, position: posB, stats: statsB } = playerBData;

  if (!statsA || !statsB || !winner) return null;

  // Get key stats for comparison (exclude CTG)
  const statKeys = Object.keys(statsA).filter(key => statsB.hasOwnProperty(key) && !isNaN(Number(statsA[key])) && !isNaN(Number(statsB[key])) && key !== 'crunch_time_grade');

  const comparisons = statKeys.slice(0, 8).map(key => {
    const label = STAT_DISPLAY_NAMES[key] || key;
    const valA = Number(statsA[key]);
    const valB = Number(statsB[key]);
    const dir = BETTER_DIRECTION[key] || "higher";
    let better;
    if (dir === "higher") {
      better = valA > valB ? nameA : valB > valA ? nameB : 'tie';
    } else {
      better = valA < valB ? nameA : valB < valA ? nameB : 'tie';
    }
    return `${label}: ${nameA} ${valA} vs ${nameB} ${valB} (${better} better)`;
  }).join('\n');

  const prompt = `You are an NFL expert analyst. Explain why ${winner} was chosen as the winner in a comparison between ${nameA} (${posA}) and ${nameB} (${posB}).

IMPORTANT SAFETY INSTRUCTIONS: 
- Only discuss NFL football statistics and player performance
- Do not mention or reference any form of violence, harm, abuse, or inappropriate content
- Stay focused on sports analysis and data-driven explanations
- Keep responses professional and appropriate for all audiences

Winner determination: ${winnerReason}

Key statistics comparison (Crunch Time Grade excluded):
${comparisons}

Provide a concise, insightful explanation (2-3 sentences) focusing on the most important factors that determined the winner. Be objective and data-driven.`;

  return prompt;
}

/**
 * Call local Ollama LLM
 */
async function callLocalLLM(prompt, opts = {}) {
    const { signal } = opts;
  if (!prompt) return null;

  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          num_predict: OLLAMA_NUM_PREDICT,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      console.warn("Ollama API error:", response.status);
      return null;
    }

    const data = await response.json();
    const text = data?.response?.trim();
    return text || null;
  } catch (error) {
    console.warn("Failed to call Ollama:", error);
    return null;
  }
}

/**
 * Generate template explanation as fallback
 */
function generateTemplateExplanation(playerAData, playerBData, winner) {
  const { playerName: nameA, position: posA } = playerAData;
  const { playerName: nameB, position: posB } = playerBData;

  return `${winner} was selected as the winner based on a comprehensive comparison of their season statistics, with particular emphasis on key performance metrics for the ${posA} position.`;
}

/**
 * Main function: Generate AI explanation for comparison winner
 */
export async function generateCompareExplanation(playerAData, playerBData, winner, winnerReason, useAI = true, opts = {}) {
  const template = generateTemplateExplanation(playerAData, playerBData, winner);

  if (!useAI) {
    return { text: template, source: "template" };
  }

  const prompt = buildCompareExplanationPrompt(playerAData, playerBData, winner, winnerReason);
  if (!prompt) {
    return { text: template, source: "template" };
  }

  const aiText = await callLocalLLM(prompt, opts);
  if (aiText) {
    return { text: aiText, source: "ai" };
  }

  // If AI fails, return template
  return { text: template, source: "template" };
}