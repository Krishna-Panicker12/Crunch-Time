// --- Normalizers (no I/O, no Maps here) ---

export function normalizePlayerRow(row) {
  // Only keep active and target positions here if you want
  return {
    id: row['gsis_id'] || null,
    espn_id: row['espn_id'] ? String(row['espn_id']) : null,
    display_name: (row['display_name'] || '').trim(),
    position: row['position_group'],
    team: row['latest_team'] || null,
    birth_date: row['birth_date'] || null,
    height: Number(row['height'] ?? 0),
    weight: Number(row['weight'] ?? 0),
    college: row['college_name'] || null,
    headshot: row['headshot'] || null,
    jersey_number: row['jersey_number'] ?? null,
    last_season: Number(row['last_season'] ?? 0),
  };
}

export function normalizePlayerStats(row) {
  // Guard season_type here so loaders can be simpler
  if (row['season_type'] !== 'REG') return null;

  const pos = row['position_group'];

  if (pos === 'QB') {
    return {
      completions: Number(row['completions']),
      attempts: Number(row['attempts']),
      pass_yards: Number(row['passing_yards']),
      pass_tds: Number(row['passing_tds']),
      interceptions: Number(row['passing_interceptions']),
      sacks: Number(row['sacks_suffered']),
      pass_epa: Number(row['passing_epa']),
      rush_yards: Number(row['rushing_yards']),
      rush_tds: Number(row['rushing_tds']),
      rush_epa: Number(row['rushing_epa']),
      fumbles_lost: Number(row['fumbles_lost']),
      fantasy_points: Number(row['fantasy_points']),
      cpoe: Number(row['passing_cpoe']),
      pacr: Number(row['pacr']),
      // qbr merge placeholders:
      qbr_total: null,
      qbr_epa_total: null,
    };
  }

  if (pos === 'RB') {
    return {
      carries: Number(row['carries']),
      rush_yards: Number(row['rushing_yards']),
      rush_tds: Number(row['rushing_tds']),
      rush_fumbles: Number(row['rushing_fumbles']),
      receptions: Number(row['receptions']),
      rec_yards: Number(row['receiving_yards']),
      rec_tds: Number(row['receiving_tds']),
      rec_fumbles: Number(row['receiving_fumbles']),
      rec_yac: Number(row['receiving_yards_after_catch'] ?? row['receving_yards_after_catch']),
      fantasy_points: Number(row['fantasy_points']),
    };
  }

  if (pos === 'WR' || pos === 'TE') {
    return {
      receptions: Number(row['receptions']),
      targets: Number(row['targets']),
      rec_yards: Number(row['receiving_yards']),
      rec_tds: Number(row['receiving_tds']),
      rec_fumbles: Number(row['receiving_fumbles']),
      rec_yac: Number(row['receiving_yards_after_catch'] ?? row['receving_yards_after_catch']),
      fantasy_points: Number(row['fantasy_points']),
      rec_epa: Number(row['receiving_epa']),
      racr: Number(row['racr']),
      target_share: Number(row['target_share']),
      air_yards_share: Number(row['air_yards_share']),
      wopr: Number(row['wopr']),
    };
  }

  if (pos === 'DB') {
    const solo = Number(row['def_tackles_solo']);
    const withAssist = Number(row['def_tackles_with_assist']);
    const assists = Number(row['def_tackles_assists']);
    return {
      solo_tackles: solo,
      assisted_tackles: assists,
      tackles_with_assist: withAssist,
      tackles_for_loss: Number(row['def_tackles_for_loss']),
      fumbles_forced: Number(row['def_fumbles_forced']),
      sacks: Number(row['def_sacks']),
      qb_hits: Number(row['def_qb_hits']),
      interceptions: Number(row['def_interceptions']),
      passes_defended: Number(row['def_pass_defended']),
      defensive_tds: Number(row['def_tds']),
      penalties: Number(row['penalties']),
      total_tackles: solo + withAssist + assists,
    };
  }

  return null; // positions you’re not handling yet
}
