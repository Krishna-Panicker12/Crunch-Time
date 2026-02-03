/**
 * Archetype Analytics Engine
 * Orchestrates all analysis from raw stats to archetype + explanations
 * Single entry point for UI
 */

import { normalizeAllStats } from "../utils/normalize.js";
import { buildFeatures } from "./featureVectors.js";
import { scoreArchetypeMatch } from "./archetypeScorer.js";
import { findSimilarPlayers } from "./similarity.js";
import { generateExplanation } from "./aiExplainer.js";

/**
 * Main engine function
 * @param {object} player - { id, display_name, position, team, ... }
 * @param {object} seasonStats - raw season stats { stat_key: value, ... }
 * @param {array} weeklyStats - [{ week, stats: { stat_key: value } }, ...]
 * @param {array} playerPool - all players for similarity matching
 * @param {boolean} useAI - whether to attempt AI explanation
 * @returns {object} complete analysis result
 */
export async function analyzePlayer(player, seasonStats, weeklyStats, playerPool, useAI = true) {
  if (!player || !seasonStats) {
    return { error: "Missing player or stats data" };
  }

  const position = player.position;

  // Step 1: Normalize stats
  const normalized = normalizeAllStats(position, seasonStats);

  // Step 2: Build feature vector
  const features = buildFeatures(position, normalized);

  // Step 3: Score against archetypes
  const archetypeResult = scoreArchetypeMatch(position, features, normalized, seasonStats);

  if (archetypeResult.error) {
    return archetypeResult;
  }

  // Step 4: Find similar players
  // Filter pool to same position, exclude self
  const similarPlayerPool = (playerPool || []).filter((p) => p.position === position && p.id !== player.id);

  // Build features for each player in pool (expensive, but needed for similarity)
  // Only process players that have stats data available
  const poolWithFeatures = similarPlayerPool
    .filter((p) => p.seasonStats) // Only include players with stats
    .slice(0, 100) // Limit to first 100 for performance
    .map((p) => {
      try {
        return {
          ...p,
          features: buildFeatures(position, normalizeAllStats(position, p.seasonStats || {})),
        };
      } catch (err) {
        // Skip players with invalid stats
        console.warn(`Skipping player ${p.id} due to stats error:`, err.message);
        return null;
      }
    })
    .filter((p) => p !== null); // Remove failed players

  const similarPlayers = poolWithFeatures.length > 0 ? findSimilarPlayers(features, poolWithFeatures, 3) : [];

  // Step 5: Generate AI explanation
  const explanation = await generateExplanation(
    { playerName: player.display_name, position, stats: seasonStats },
    archetypeResult,
    similarPlayers,
    useAI
  );

  return {
    player,
    position,
    archetype: archetypeResult.primary,
    archetypeKey: archetypeResult.primaryKey,
    confidence: archetypeResult.confidence,
    features,
    reasons: archetypeResult.reasons,
    chartKeys: archetypeResult.chartKeys,
    weeklyStats,
    similarPlayers,
    explanation,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Lightweight version for batch processing
 * Returns only archetype (no AI, no similarity)
 */
export function analyzePlayerQuick(player, seasonStats) {
  if (!player || !seasonStats) {
    return null;
  }

  const position = player.position;
  const normalized = normalizeAllStats(position, seasonStats);
  const features = buildFeatures(position, normalized);
  const archetypeResult = scoreArchetypeMatch(position, features, normalized, seasonStats);

  return {
    player,
    archetype: archetypeResult.primary,
    confidence: archetypeResult.confidence,
  };
}

/**
 * Get all stats for a player pool (pre-process for similarity)
 * Call this once to prepare pool for similarity matching
 */
export function preparePlayerPool(players, statsMap) {
  return players.map((player) => ({
    ...player,
    seasonStats: statsMap[player.id] || {},
  }));
}
