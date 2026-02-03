/**
 * Normalization - Convert raw stats to 0-1 scale
 * MVP method: linear scaling within bounds
 */

import { STAT_BOUNDS } from "../constants/statMeta.js";
import { BETTER_DIRECTION } from "../utils/statsMapping.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Normalize a single stat value to 0-1 range
 * @param {string} position - QB, RB, WR, DB
 * @param {string} statKey - stat identifier
 * @param {number} value - raw stat value
 * @returns {number} 0-1 normalized value
 */
export function normalizeStat(position, statKey, value) {
  if (value == null) return 0;

  const bounds = STAT_BOUNDS[position]?.[statKey];
  if (!bounds) return 0;

  const { min, max } = bounds;
  let normalized = (value - min) / (max - min);
  normalized = clamp(normalized, 0, 1);

  // Flip if lower is better
  const isBetter = BETTER_DIRECTION[statKey] === "lower";
  if (isBetter) {
    normalized = 1 - normalized;
  }

  return normalized;
}

/**
 * Normalize all stats for a player
 * @param {string} position - QB, RB, WR, DB
 * @param {object} stats - raw stats object { stat_key: value, ... }
 * @returns {object} normalized stats { stat_key: 0-1, ... }
 */
export function normalizeAllStats(position, stats) {
  const result = {};

  if (!stats || typeof stats !== "object") {
    return result;
  }

  Object.entries(stats).forEach(([key, value]) => {
    result[key] = normalizeStat(position, key, value);
  });

  return result;
}

/**
 * Calculate a weighted feature from multiple normalized stats
 * @param {object} normalized - normalized stats { stat_key: 0-1, ... }
 * @param {array} statWeights - [{ key, weight }, ...]
 * @returns {number} 0-1 feature value
 */
export function computeFeature(normalized, statWeights) {
  if (!statWeights || statWeights.length === 0) return 0;

  let sum = 0;
  let totalWeight = 0;

  statWeights.forEach(({ key, weight }) => {
    const value = normalized[key] ?? 0;
    sum += value * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? sum / totalWeight : 0;
}
