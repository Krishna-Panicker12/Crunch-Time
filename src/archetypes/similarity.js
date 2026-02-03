/**
 * Similarity Engine
 * Finds stylistically similar players by comparing feature vectors
 */

/**
 * Calculate cosine similarity between two feature vectors
 * Returns value between 0-100, dampened to be more realistic
 */
function cosineSimilarity(vec1, vec2) {
  const keys = Object.keys(vec1);
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  keys.forEach((key) => {
    const v1 = vec1[key] ?? 0;
    const v2 = vec2[key] ?? 0;
    dotProduct += v1 * v2;
    magnitude1 += v1 * v1;
    magnitude2 += v2 * v2;
  });

  const denominator = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
  const rawSimilarity = denominator === 0 ? 0 : (dotProduct / denominator);
  
  // Convert to 0-100 scale, then dampen to make comparisons more realistic
  // This prevents all comparisons from being 85%+
  const percentSimilarity = rawSimilarity * 100;
  const dampenedSimilarity = 30 + (percentSimilarity * 0.5); // Range: 30-80%
  
  return Math.min(dampenedSimilarity, 99); // Cap at 99%
}

/**
 * Find similar players from a pool
 * @param {object} playerFeatures - feature vector of target player
 * @param {array} playerPool - [{ id, name, team, position, features }, ...]
 * @param {number} limit - max similar players to return (default 3)
 * @returns {array} sorted by similarity
 */
export function findSimilarPlayers(playerFeatures, playerPool, limit = 3) {
  if (!playerPool || playerPool.length === 0) {
    return [];
  }

  const similarities = playerPool
    .map((player) => ({
      id: player.id,
      name: player.display_name,
      team: player.team,
      position: player.position,
      similarity: cosineSimilarity(playerFeatures, player.features),
      sharedTraits: getSharedTraits(playerFeatures, player.features),
    }))
    .filter((p) => p.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return similarities;
}

/**
 * Identify which features are similar between two players
 */
function getSharedTraits(features1, features2) {
  const traits = [];
  const threshold = 0.15; // features within 0.15 of each other

  Object.keys(features1).forEach((key) => {
    const f1 = features1[key] ?? 0;
    const f2 = features2[key] ?? 0;
    const diff = Math.abs(f1 - f2);

    if (diff < threshold) {
      traits.push(key);
    }
  });

  return traits.slice(0, 3); // top 3 shared traits
}
