/**
 * Feature Vector Builder
 * Converts normalized stats into football-concept features
 * Output drives archetype assignment and explanations
 */

import { computeFeature } from "../utils/normalize.js";

/**
 * QB Feature Vector (5 dimensions)
 */
export function buildQBFeatures(normalized) {
  return {
    accuracy: computeFeature(normalized, [
      { key: "completions_pct", weight: 0.4 },
      { key: "cpoe", weight: 0.3 },
      { key: "pacr", weight: 0.3 },
    ]),
    efficiency: computeFeature(normalized, [
      { key: "pass_epa", weight: 0.5 },
      { key: "qbr_total", weight: 0.5 },
    ]),
    riskControl: computeFeature(normalized, [
      { key: "interceptions", weight: 1.0 },
    ]),
    mobility: computeFeature(normalized, [
      { key: "rush_yards", weight: 0.6 },
      { key: "rush_tds", weight: 0.4 },
    ]),
    aggressiveness: computeFeature(normalized, [
      { key: "pacr", weight: 0.5 },
      { key: "pass_tds", weight: 0.5 },
    ]),
    clutch: computeFeature(normalized, [
      { key: "crunch_time_grade", weight: 1.0 },
    ]),
  };
}

/**
 * RB Feature Vector (6 dimensions)
 */
export function buildRBFeatures(normalized) {
  return {
    workload: computeFeature(normalized, [
      { key: "carries", weight: 0.6 },
      { key: "receptions", weight: 0.4 },
    ]),
    rushingEfficiency: computeFeature(normalized, [
      { key: "rush_yards", weight: 0.7 },
      { key: "rush_tds", weight: 0.3 },
    ]),
    receivingRole: computeFeature(normalized, [
      { key: "receptions", weight: 0.6 },
      { key: "rec_yards", weight: 0.4 },
    ]),
    yacAbility: computeFeature(normalized, [
      { key: "rec_yac", weight: 1.0 },
    ]),
    scoring: computeFeature(normalized, [
      { key: "rush_tds", weight: 0.5 },
      { key: "rec_tds", weight: 0.5 },
    ]),
    clutch: computeFeature(normalized, [
      { key: "crunch_time_grade", weight: 1.0 },
    ]),
  };
}

/**
 * WR Feature Vector (7 dimensions)
 */
export function buildWRFeatures(normalized) {
  return {
    usage: computeFeature(normalized, [
      { key: "targets", weight: 0.6 },
      { key: "receptions", weight: 0.4 },
    ]),
    efficiency: computeFeature(normalized, [
      { key: "rec_yards", weight: 0.5 },
      { key: "target_share", weight: 0.5 },
    ]),
    yacAbility: computeFeature(normalized, [
      { key: "rec_yac", weight: 1.0 },
    ]),
    downfieldRole: computeFeature(normalized, [
      { key: "rec_yards", weight: 0.6 },
      { key: "wopr", weight: 0.4 },
    ]),
    scoring: computeFeature(normalized, [
      { key: "rec_tds", weight: 1.0 },
    ]),
    opportunity: computeFeature(normalized, [
      { key: "wopr", weight: 0.6 },
      { key: "target_share", weight: 0.4 },
    ]),
    clutch: computeFeature(normalized, [
      { key: "crunch_time_grade", weight: 1.0 },
    ]),
  };
}

/**
 * DB Feature Vector (5 dimensions)
 */
export function buildDBFeatures(normalized) {
  return {
    coverage: computeFeature(normalized, [
      { key: "passes_defended", weight: 1.0 },
    ]),
    disruption: computeFeature(normalized, [
      { key: "tackles_for_loss", weight: 0.5 },
      { key: "fumbles_forced", weight: 0.5 },
    ]),
    tackling: computeFeature(normalized, [
      { key: "solo_tackles", weight: 1.0 },
    ]),
    ballSkills: computeFeature(normalized, [
      { key: "passes_defended", weight: 0.6 },
      { key: "fumbles_forced", weight: 0.4 },
    ]),
    clutch: computeFeature(normalized, [
      { key: "crunch_time_grade", weight: 1.0 },
    ]),
  };
}

/**
 * Generic feature builder dispatcher
 */
export function buildFeatures(position, normalized) {
  switch (position) {
    case "QB":
      return buildQBFeatures(normalized);
    case "RB":
      return buildRBFeatures(normalized);
    case "WR":
    case "TE":
      return buildWRFeatures(normalized);
    case "DB":
      return buildDBFeatures(normalized);
    default:
      return {};
  }
}
