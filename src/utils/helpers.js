import { weeklyIndexByPlayerSeason, seasonTotalsByPlayer } from '../data/statsIndexes.js';

// Helper function to create uniform keys to access players' stats
export const makeKey = (gsis_id, season) => `${gsis_id}|${Number(season)}`;

// Retrieves player stats for a specific week
export const getWeekStats = (id, season, week) => {
    weeklyIndexByPlayerSeason.get(makeKey(id, season))?.get(Number(week)) || null;
};

// Retreives and sorts weekly stats array for a player in a given season
export const getWeeklyArray = (id, season) => {
  const m = weeklyIndexByPlayerSeason.get(makeKey(id, season));
  if (!m) return [];
  return [...m.entries()]
    .sort(([a], [b]) => a - b)
    .map(([week, stats]) => ({ week, ...stats }));
};

// Retrieves player stats for the entire season
export const getSeasonTotals = (id, season) =>
  seasonTotalsByPlayer.get(makeKey(id, season)) ?? null;