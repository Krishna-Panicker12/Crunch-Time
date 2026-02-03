export const STAT_META = {
  QB: {
    completions_pct: {
      label: "Completion %",
      better: "higher",
      format: "pct1",
      concept: "Accuracy",
      description: "Percentage of passes completed",
    },

    cpoe: {
      label: "CPOE",
      better: "higher",
      format: "pct1",
      concept: "Accuracy vs Expectation",
      description: "Completion percentage over expected",
    },

    pass_epa: {
      label: "Pass EPA",
      better: "higher",
      format: "float2",
      concept: "Passing Efficiency",
      description: "Expected points added from passing",
    },

    pacr: {
      label: "PACR",
      better: "higher",
      format: "float2",
      concept: "Aggressiveness",
      description: "Passing yards per air yard",
    },

    pass_yards: {
      label: "Passing Yards",
      better: "higher",
      format: "int",
      concept: "Volume",
      description: "Total passing yards",
    },

    pass_tds: {
      label: "Passing TDs",
      better: "higher",
      format: "int",
      concept: "Scoring",
      description: "Passing touchdowns",
    },

    interceptions: {
      label: "Interceptions",
      better: "lower",
      format: "int",
      concept: "Risk",
      description: "Passes intercepted by defenders",
    },

    sacks: {
      label: "Sacks Taken",
      better: "lower",
      format: "int",
      concept: "Pocket Awareness",
      description: "Times sacked",
    },

    rush_yards: {
      label: "Rush Yards",
      better: "higher",
      format: "int",
      concept: "Mobility",
      description: "Rushing yards gained",
    },

    rush_epa: {
      label: "Rush EPA",
      better: "higher",
      format: "float2",
      concept: "Rushing Impact",
      description: "Expected points added from rushing",
    },

    rush_tds: {
      label: "Rush TDs",
      better: "higher",
      format: "int",
      concept: "Dual-Threat Scoring",
      description: "Rushing touchdowns",
    },

    crunch_time_grade: {
      label: "Crunch Time Grade",
      better: "higher",
      format: "float1",
      concept: "Clutch Performance",
      description: "Performance in high-leverage moments",
    },
  },
  RB: {
    carries: {
      label: "Carries",
      better: "higher",
      format: "int",
      concept: "Volume",
      description: "Rushing attempts (workload indicator)",
    },
    rush_yards: {
      label: "Rush Yards",
      better: "higher",
      format: "int",
      concept: "Rushing Production",
      description: "Total rushing yards",
    },
    rush_tds: {
      label: "Rush TDs",
      better: "higher",
      format: "int",
      concept: "Scoring",
      description: "Rushing touchdowns (red-zone finishing)",
    },
    rush_fumbles: {
      label: "Rush Fumbles",
      better: "lower",
      format: "int",
      concept: "Ball Security",
      description: "Fumbles on rushing plays",
    },
    receptions: {
      label: "Receptions",
      better: "higher",
      format: "int",
      concept: "Receiving Role",
      description: "Catches (pass-game involvement)",
    },
    rec_yards: {
      label: "Rec Yards",
      better: "higher",
      format: "int",
      concept: "Receiving Production",
      description: "Total receiving yards",
    },
    rec_tds: {
      label: "Rec TDs",
      better: "higher",
      format: "int",
      concept: "Scoring",
      description: "Receiving touchdowns",
    },
    rec_fumbles: {
      label: "Rec Fumbles",
      better: "lower",
      format: "int",
      concept: "Ball Security",
      description: "Fumbles after catches/receptions",
    },
    rec_yac: {
      label: "Rec YAC",
      better: "higher",
      format: "int",
      concept: "YAC Ability",
      description: "Yards after catch (open-field creation)",
    },
  },

  // -------------------------
  // WR
  // -------------------------
  WR: {
    receptions: {
      label: "Receptions",
      better: "higher",
      format: "int",
      concept: "Reliability",
      description: "Catches (chain-moving + hands)",
    },
    targets: {
      label: "Targets",
      better: "higher",
      format: "int",
      concept: "Usage",
      description: "Passes thrown to the receiver",
    },
    target_share: {
      label: "Target Share",
      better: "higher",
      format: "pct1",
      concept: "Usage",
      description: "Share of team targets (role/importance)",
    },
    rec_yards: {
      label: "Rec Yards",
      better: "higher",
      format: "int",
      concept: "Production",
      description: "Total receiving yards",
    },
    rec_tds: {
      label: "Rec TDs",
      better: "higher",
      format: "int",
      concept: "Scoring",
      description: "Receiving touchdowns (red-zone value)",
    },
    rec_fumbles: {
      label: "Fumbles",
      better: "lower",
      format: "int",
      concept: "Ball Security",
      description: "Ball security after the catch",
    },
    rec_yac: {
      label: "YAC",
      better: "higher",
      format: "int",
      concept: "YAC Ability",
      description: "Yards after catch (creating extra yards)",
    },
    air_yards_share: {
      label: "Air Yards Share",
      better: "higher",
      format: "pct1",
      concept: "Downfield Role",
      description: "Share of team air yards (deep usage proxy)",
    },
    racr: {
      label: "RACR",
      better: "higher",
      format: "float2",
      concept: "Efficiency",
      description: "Receiving yards per air yard (conversion efficiency)",
    },
    rec_epa: {
      label: "Rec EPA",
      better: "higher",
      format: "float2",
      concept: "Impact",
      description: "Expected points added from receiving plays",
    },
    wopr: {
      label: "WOPR",
      better: "higher",
      format: "float2",
      concept: "Role Importance",
      description: "Weighted opportunity rating (targets + air yards influence)",
    },
  },

  // -------------------------
  // TE  (same keys as WR, different “concept emphasis”)
  // -------------------------
  TE: {
    receptions: {
      label: "Receptions",
      better: "higher",
      format: "int",
      concept: "Reliability",
      description: "Catches (trusted target / safety valve)",
    },
    targets: {
      label: "Targets",
      better: "higher",
      format: "int",
      concept: "Usage",
      description: "Targets (involvement in passing game)",
    },
    target_share: {
      label: "Target Share",
      better: "higher",
      format: "pct1",
      concept: "Usage",
      description: "Share of team targets (importance to offense)",
    },
    rec_yards: {
      label: "Rec Yards",
      better: "higher",
      format: "int",
      concept: "Production",
      description: "Total receiving yards",
    },
    rec_tds: {
      label: "Rec TDs",
      better: "higher",
      format: "int",
      concept: "Scoring",
      description: "Receiving touchdowns (red-zone finishing)",
    },
    rec_fumbles: {
      label: "Fumbles",
      better: "lower",
      format: "int",
      concept: "Ball Security",
      description: "Ball security after receptions",
    },
    rec_yac: {
      label: "YAC",
      better: "higher",
      format: "int",
      concept: "YAC Ability",
      description: "Yards after catch (run-after-catch threat)",
    },
    air_yards_share: {
      label: "Air Yards Share",
      better: "higher",
      format: "pct1",
      concept: "Vertical Threat",
      description: "Downfield usage proxy (seam/vertical role)",
    },
    racr: {
      label: "RACR",
      better: "higher",
      format: "float2",
      concept: "Efficiency",
      description: "Receiving yards per air yard (efficiency)",
    },
    rec_epa: {
      label: "Rec EPA",
      better: "higher",
      format: "float2",
      concept: "Impact",
      description: "Impact of targets on points added",
    },
    wopr: {
      label: "WOPR",
      better: "higher",
      format: "float2",
      concept: "Role Importance",
      description: "Weighted opportunity (targets + air yards)",
    },
  },

  // -------------------------
  // DB (TEMPLATE — rename keys to match YOUR DB stats)
  // Lockdown / Ballhawk / Swiss Army Knife
  // -------------------------
  DB: {
    // Coverage quality
    passes_defended: {
      label: "Passes Defended",
      better: "higher",
      format: "int",
      concept: "Disruption",
      description: "Pass breakups + interceptions (if combined)",
    },

    // Ballhawk stats
    interceptions: {
      label: "Interceptions",
      better: "higher",
      format: "int",
      concept: "Turnovers",
      description: "Interceptions created (ball skills)",
    },

    // Tackling / versatility
    solo_tackles: {
      label: "Solo Tackles",
      better: "higher",
      format: "int",
      concept: "Tackling",
      description: "Solo tackles (run support + finishing)",
    },
    assisted_tackles: {
      label: "Assisted Tackles",
      better: "higher",
      format: "int",
      concept: "Tackling",
      description: "Assisted tackles",
    },
  },
};
