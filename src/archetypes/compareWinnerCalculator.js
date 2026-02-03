/**
 * Winner Calculator for Compare Page
 * Calculates the winner based on player statistics
 * Only calculates if players have the same position
 */

import { BETTER_DIRECTION } from "../utils/statsMapping.js";

/**
 * Utility: conditional value comparison
 */
const compareValues = (k, a, b) => {
  const dir = BETTER_DIRECTION[k] || "higher";
  if (a == null || b == null) return 0;
  const numA = Number(a);
  const numB = Number(b);
  if (Number.isNaN(numA) || Number.isNaN(numB)) return 0;
  if (dir === "higher") return numA > numB ? 1 : numA < numB ? -1 : 0;
  return numA < numB ? 1 : numA > numB ? -1 : 0;
};

/**
 * Calculate winner between two players
 * Returns null if positions don't match
 */
export function calculateWinner(playerA, playerB, aTotals, bTotals, statKeys) {
  if (!playerA || !playerB || playerA.position !== playerB.position) {
    return null;
  }

  // Define position-specific key stats (excluding CTG)
  const positionKeyStats = {
    QB: ['completion_percentage', 'pass_yards', 'pass_tds', 'interceptions', 'pass_epa', 'cpoe', 'pacr'],
    RB: ['rush_yards', 'rush_tds', 'rec_yards'],
    WR: ['receptions', 'rec_yards', 'rec_tds', 'yac', 'racr', 'rec_epa', 'wopr'],
    TE: ['receptions', 'rec_yards', 'rec_tds', 'yac', 'racr', 'rec_epa', 'wopr'],
    DB: ['passes_defended', 'solo_tackles', 'interceptions'],
  };

  const keyStats = positionKeyStats[playerA.position] || [];
  const relevantStats = statKeys.filter(k => keyStats.includes(k) && k !== 'crunch_time_grade');

  let scoreA = 0,
    scoreB = 0;

  relevantStats.forEach((k) => {
    const cmp = compareValues(k, aTotals[k], bTotals[k]);
    if (cmp > 0) scoreA++;
    else if (cmp < 0) scoreB++;
  });

  if (scoreA === scoreB) {
    // Tie breaker: use CTG as last resort
    const aGrade = Number(aTotals?.crunch_time_grade || 0);
    const bGrade = Number(bTotals?.crunch_time_grade || 0);
    if (Math.abs(aGrade - bGrade) >= 2) {
      const winner = aGrade > bGrade ? playerA : playerB;
      const reason = `Tie broken by Crunch Time Grade: ${Math.abs(aGrade - bGrade)}% difference`;
      return { winner, reason, aGrade, bGrade };
    }
    const reason = `Equal advantages in key stats and similar CTG`;
    return { winner: null, reason, aGrade, bGrade, isTie: true };
  }

  const winner = scoreA > scoreB ? playerA : playerB;
  const aGrade = Number(aTotals?.crunch_time_grade || 0);
  const bGrade = Number(bTotals?.crunch_time_grade || 0);
  const higherScore = Math.max(scoreA, scoreB);
  const lowerScore = Math.min(scoreA, scoreB);
  const reason = `Winner determined by advantages in key stats: ${higherScore} vs ${lowerScore}`;
  return { winner, reason, aGrade, bGrade };
}