/**
 * Archetype Definitions & Scoring Logic
 * Each archetype is a weighted profile of features
 * Scoring determines primary archetype and provides explanations
 */

/**
 * QB Archetypes
 */
const QB_ARCHETYPES = {
  field_general: {
    name: "Field General",
    icon: "🎖️",
    description: "Conservative quarterback with consistent all-around performance, moderate passing production, low interception totals, and limited rushing contribution.",
    profile: {
      accuracy: 0.35,
      efficiency: 0.25,
      riskControl: 0.30,
      mobility: 0.05,
      aggressiveness: 0.05,
      clutch: 0.0,
    },
  },
  dual_threat: {
    name: "Dual Threat",
    icon: "⚡",
    description: "Quarterback defined by high rushing yardage relative to other quarterbacks, with mobility being a primary offensive weapon.",
    profile: {
      accuracy: 0.25,
      efficiency: 0.20,
      riskControl: 0.15,
      mobility: 0.25,
      aggressiveness: 0.15,
      clutch: 0.0,
    },
  },
  gunslinger: {
    name: "Gunslinger",
    icon: "🔫",
    description: "High-variance passer with high passing yards and touchdowns, high interception totals, and lower completion percentages.",
    profile: {
      accuracy: 0.25,
      efficiency: 0.20,
      riskControl: 0.05,
      mobility: 0.05,
      aggressiveness: 0.45,
      clutch: 0.0,
    },
  },
  game_changer: {
    name: "Game Changer",
    icon: "🎯",
    description: "Elite tier quarterback combining high passing yards, high passing touchdowns, low interceptions, and some rushing contribution, indicating franchise-level talent with minimal weaknesses.",
    profile: {
      accuracy: 0.20,
      efficiency: 0.25,
      riskControl: 0.15,
      mobility: 0.15,
      aggressiveness: 0.15,
      clutch: 0.10,
    },
  },
};

/**
 * RB Archetypes
 */
const RB_ARCHETYPES = {
  workhorse: {
    name: "Workhorse",
    icon: "🐴",
    description: "Early-down volume runner with at least 800 rushing yards and fewer than 200 receiving yards. Dominates through carries and forms the foundation of ground-based offenses.",
    profile: {
      workload: 0.40,
      rushingEfficiency: 0.25,
      receivingRole: 0.10,
      yacAbility: 0.10,
      scoring: 0.10,
      clutch: 0.05,
    },
  },
  receiving: {
    name: "Receiving Back",
    icon: "📡",
    description: "Passing-down specialist with fewer than 800 rushing yards and at least 200 receiving yards. Excels in the receiving game and contributes through receptions.",
    profile: {
      workload: 0.15,
      rushingEfficiency: 0.10,
      receivingRole: 0.40,
      yacAbility: 0.20,
      scoring: 0.10,
      clutch: 0.05,
    },
  },
  all_purpose: {
    name: "All-Purpose Back",
    icon: "🌟",
    description: "True dual threat with at least 500 rushing yards and at least 400 receiving yards. Balances rushing and receiving production effectively.",
    profile: {
      workload: 0.25,
      rushingEfficiency: 0.20,
      receivingRole: 0.25,
      yacAbility: 0.15,
      scoring: 0.10,
      clutch: 0.05,
    },
  },
};

/**
 * WR Archetypes
 */
const WR_ARCHETYPES = {
  yac_monster: {
    name: "YAC Monster",
    icon: "🏃",
    description: "Shifty, elusive receiver who transforms short completions into explosive gains through evasion and vision. Excels breaking tackles, finding running lanes, and turning underneath routes into chunk plays. Creates massive value in space.",
    profile: {
      usage: 0.15,
      efficiency: 0.15,
      yacAbility: 0.25,
      downfieldRole: 0.10,
      scoring: 0.15,
      opportunity: 0.10,
      clutch: 0.0,
    },
  },
  red_zone_threat: {
    name: "Red Zone Threat",
    icon: "🎯",
    description: "Touchdown machine operating as primary target inside the 20-yard line. Combines size, skill, and scoring instincts to convert opportunities into touchdowns. Reliable finisher in critical situations affecting game outcomes.",
    profile: {
      usage: 0.15,
      efficiency: 0.15,
      yacAbility: 0.10,
      downfieldRole: 0.10,
      scoring: 0.40,
      opportunity: 0.10,
      clutch: 0.0,
    },
  },
  x_factor: {
    name: "X-Factor",
    icon: "✨",
    description: "Explosive, dynamic playmaker who creates explosive opportunities on virtually every touch. Combines receiving efficiency with playmaking ability and consistent scoring. Game-changers who elevate entire offense and create unpredictable matchup problems.",
    profile: {
      usage: 0.10,
      efficiency: 0.10,
      yacAbility: 0.10,
      downfieldRole: 0.15,
      scoring: 0.35,
      opportunity: 0.25,
      clutch: 0.0,
    },
  },
  deep_threat: {
    name: "Deep Threat",
    icon: "🚀",
    description: "Vertical receiver who commands air yards and stretches the field with speed and leaping ability. Operates effectively on deep routes, opening up underneath passing options. Keeps opposing defenses honest in coverage.",
    profile: {
      usage: 0.15,
      efficiency: 0.20,
      yacAbility: 0.05,
      downfieldRole: 0.40,
      scoring: 0.15,
      opportunity: 0.05,
      clutch: 0.0,
    },
  },
  chain_mover: {
    name: "Chain Mover",
    icon: "⛓️",
    description: "Reliable possession receiver and primary target who advances chains consistently with high catch rates. Excels on route combinations advancing drives methodically. Quarterbacks' security blanket in critical situations requiring conversions.",
    profile: {
      usage: 0.30,
      efficiency: 0.25,
      yacAbility: 0.15,
      downfieldRole: 0.10,
      scoring: 0.10,
      opportunity: 0.15,
      clutch: 0.0,
    },
  },
};

/**
 * DB Archetypes
 */
const DB_ARCHETYPES = {
  lockdown: {
    name: "Lockdown",
    icon: "�",
    description: "Elite coverage specialist who effectively shuts down receivers in man coverage and controls his assigned area. Combines physical tools, technique, and competitive toughness to minimize passing options. Consistently limits separation and forces difficult throws.",
    profile: {
      coverage: 0.30,
      disruption: 0.15,
      tackling: 0.20,
      ballSkills: 0.20,
      clutch: 0.05,
    },
  },
  ballhawk: {
    name: "Ballhawk",
    icon: "🦅",
    description: "Playmaker with ball-hawking instincts who anticipates throws, forces turnovers consistently, and creates splash plays. Excels at reading quarterback tendencies and route concepts. Generates game-changing interceptions in critical moments.",
    profile: {
      coverage: 0.20,
      disruption: 0.25,
      tackling: 0.10,
      ballSkills: 0.50,
      clutch: 0.05,
    },
  },
  swiss_army_knife: {
    name: "Swiss Army Knife",
    icon: "�",
    description: "Versatile, multi-skilled defender who excels aligned in multiple positions and defensive schemes. Handles man coverage, zone responsibilities, and blitz duties effectively. Provides defensive flexibility and fills multiple needs simultaneously.",
    profile: {
      coverage: 0.25,
      disruption: 0.20,
      tackling: 0.25,
      ballSkills: 0.20,
      clutch: 0.10,
    },
  },
};

const ARCHETYPE_SETS = {
  QB: QB_ARCHETYPES,
  RB: RB_ARCHETYPES,
  WR: WR_ARCHETYPES,
  TE: WR_ARCHETYPES,
  DB: DB_ARCHETYPES,
};

/**
 * Score features against archetype profile
 * @returns {number} 0-1 archetype match score
 */
function scoreArchetypeProfile(features, profile) {
  let score = 0;
  let totalWeight = 0;

  Object.entries(profile).forEach(([feature, weight]) => {
    const featureValue = features[feature] ?? 0;
    score += featureValue * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? score : 0;
}

/**
 * Determine primary archetype and generate explanation
 * @param {string} position - QB, RB, WR, TE, DB
 * @param {object} features - feature vector { feature: 0-1, ... }
 * @param {object} normalizedStats - normalized stats { stat_key: 0-1, ... }
 * @param {object} rawStats - raw stats { stat_key: value, ... }
 * @returns {object} archetype result with explanations
 */
export function scoreArchetypeMatch(position, features, normalizedStats, rawStats) {
  const archetypes = ARCHETYPE_SETS[position];
  if (!archetypes) {
    return {
      primary: null,
      confidence: 0,
      scores: {},
      reasons: [],
      error: `Unknown position: ${position}`,
    };
  }

  const scores = {};
  Object.entries(archetypes).forEach(([key, archetype]) => {
    scores[key] = scoreArchetypeProfile(features, archetype.profile);
  });

  // Apply position-specific thresholds
  if (position === 'WR') {
    // X-Factor requirements: 1100+ yards, 12+ YPR, 7+ TDs
    if (rawStats.rec_yards < 1100 || 
        (rawStats.receptions > 0 && (rawStats.rec_yards / rawStats.receptions) < 12) || 
        rawStats.rec_tds < 7) {
      scores.x_factor = 0;
    }
    // Yardage caps for mutual exclusivity
    if (rawStats.rec_yards > 1100) {
      scores.deep_threat = 0;
      scores.chain_mover = 0;
    }
    // Reception counts
    if (rawStats.receptions >= 90) {
      scores.deep_threat = 0;
      scores.chain_mover = 0;
    } else if (rawStats.receptions >= 80) {
      scores.deep_threat = 0;
    } else {
      scores.chain_mover = 0;
      scores.x_factor = 0;
    }
  } else if (position === 'RB') {
    // Workhorse: >=800 rush, <200 rec
    if (rawStats.rush_yards < 800 || rawStats.rec_yards >= 200) {
      scores.workhorse = 0;
    }
    // Receiving: <800 rush, >=200 rec
    if (rawStats.rush_yards >= 800 || rawStats.rec_yards < 200) {
      scores.receiving = 0;
    }
    // All-Purpose: >=500 rush, >=400 rec
    if (rawStats.rush_yards < 500 || rawStats.rec_yards < 400) {
      scores.all_purpose = 0;
    }
  } else if (position === 'QB') {
    // Priority order: Game Changer > Dual Threat > Gunslinger > Field General

    // Game Changer: over 4000 pass yards OR over 30 passing TDs OR at least 3500 pass yards and 300 rush yards
    if (rawStats.pass_yards > 4000 || rawStats.pass_tds > 30 || (rawStats.pass_yards >= 3500 && rawStats.rush_yards >= 300)) {
      scores.game_changer = Math.max(scores.game_changer, 0.8); // Ensure high score
      scores.dual_threat = 0;
      scores.gunslinger = 0;
      scores.field_general = 0;
    }
    // Dual Threat: over 300 rush yards but below 3500 pass yards
    else if (rawStats.rush_yards > 300 && rawStats.pass_yards < 3500) {
      scores.dual_threat = Math.max(scores.dual_threat, 0.8);
      scores.game_changer = 0;
      scores.gunslinger = 0;
      scores.field_general = 0;
    }
    // Gunslinger: volatile players with high interception ratio (high INTs)
    else if (rawStats.interceptions >= 10) {
      scores.gunslinger = Math.max(scores.gunslinger, 0.8);
      scores.game_changer = 0;
      scores.dual_threat = 0;
      scores.field_general = 0;
    }
    // Field General: no rushing ability (< 300 rush yards), decent pass ability (< 4000 yards)
    else if (rawStats.rush_yards < 300 && rawStats.pass_yards < 4000) {
      scores.field_general = Math.max(scores.field_general, 0.8);
      scores.game_changer = 0;
      scores.dual_threat = 0;
      scores.gunslinger = 0;
    }
  } else if (position === 'DB') {
    // Ballhawk: 4+ interceptions
    if (rawStats.interceptions < 4) {
      scores.ballhawk *= 0.3; // Reduce score significantly
    }
    // Swiss Army Knife: <4 interceptions, high tackles
    if (rawStats.interceptions >= 4 || rawStats.solo_tackles < 80) {
      scores.swiss_army_knife *= 0.5;
    }
    // Lockdown: 10+ passes defended, low interceptions
    if (rawStats.passes_defended < 10 || rawStats.interceptions >= 2) {
      scores.lockdown *= 0.4;
    }
  }

  // Sort by score
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [primaryKey, primaryScore] = sorted[0] || [null, 0];
  const [, secondaryScore] = sorted[1] || [null, 0];

  const primary = primaryKey ? archetypes[primaryKey] : null;
  const confidence = primaryScore - secondaryScore;

  // Generate reasons (top contributing features)
  const reasons = generateReasons(primaryKey, features, archetypes[primaryKey]?.profile, rawStats);

  return {
    primary,
    primaryKey,
    confidence,
    scores,
    reasons,
    chartKeys: reasons.slice(0, 2).map((r) => r.feature),
  };
}

/**
 * Generate human-readable explanations for why an archetype was selected
 */
function generateReasons(archetypeKey, features, profile, rawStats) {
  if (!profile) return [];

  const reasons = [];

  // Rank features by contribution
  Object.entries(profile)
    .map(([feature, weight]) => ({
      feature,
      weight,
      featureValue: features[feature] ?? 0,
      contribution: (features[feature] ?? 0) * weight,
    }))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 4)
    .forEach(({ feature, featureValue, weight }) => {
      reasons.push({
        feature,
        featureValue,
        weight,
        explanation: getFeatureExplanation(feature, featureValue, rawStats),
      });
    });

  return reasons;
}

/**
 * Convert feature scores into natural language
 */
function getFeatureExplanation(feature, value, rawStats) {
  const level = value >= 0.75 ? "Elite" : value >= 0.5 ? "Above Average" : value >= 0.25 ? "Average" : "Below Average";

  const descriptions = {
    accuracy: `${level} accuracy and ball placement`,
    efficiency: `${level} overall efficiency and production`,
    riskControl: `${level} decision-making and risk management`,
    mobility: `${level} mobility and ability to extend plays`,
    aggressiveness: `${level} aggressiveness downfield`,
    clutch: `${level} performance in high-pressure moments`,
    workload: `${level} workload and volume share`,
    rushingEfficiency: `${level} rushing efficiency`,
    receivingRole: `${level} passing game involvement`,
    yacAbility: `${level} ability to create after the catch`,
    scoring: `${level} scoring ability`,
    usage: `${level} target/carry share`,
    downfieldRole: `${level} vertical/explosive play capability`,
    opportunity: `${level} opportunity and involvement`,
    coverage: `${level} coverage and man skills`,
    disruption: `${level} ability to disrupt plays`,
    tackling: `${level} tackling and gap accountability`,
    ballSkills: `${level} turnover creation and ball skills`,
  };

  return descriptions[feature] || `${level} performance`;
}

export { QB_ARCHETYPES, RB_ARCHETYPES, WR_ARCHETYPES, DB_ARCHETYPES };
