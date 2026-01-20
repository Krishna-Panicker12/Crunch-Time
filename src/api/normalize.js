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
  const pos = row['position_group'];

  if (pos === 'QB') {
    const completions = Number(row['completions']);
    const attempts = Number(row['attempts']);
    const completions_pct = Number(attempts > 0 ? (completions / attempts) * 100 : 0);
    const pass_yards = Number(row['passing_yards']);
    const pass_tds = Number(row['passing_tds']);
    const interceptions = Number(row['passing_interceptions']);
    const sacks = Number(row['sacks_suffered']);
    const pass_epa = Number(row['passing_epa']);
    const rush_yards = Number(row['rushing_yards']);
    const rush_tds = Number(row['rushing_tds']);
    const rush_epa = Number(row['rushing_epa']);
    const fantasy_points = Number(row['fantasy_points']);
    const cpoe = Number(row['passing_cpoe']);
    const pacr = Number(row['pacr']);
    const qbr_total = 0;
    const qbr_epa_total = 0;
    
    const rawGrade = (
      (Math.min(completions_pct, 75)/75 * 25) +     // Max 25% - normalized to 75% completion
      (Math.min(pass_yards, 300)/300 * 20) +        // Max 20% - normalized to 300 yards
      (Math.min(pass_tds * 12, 24)) +               // Max 24% - 2 TDs
      (Math.min(rush_yards, 35)/35 * 8) +           // Max 8% - normalized to 35 rush yards
      (Math.min((pass_epa + 0.5) * 16, 16)) +       // Max 16% - normalized to 0.5 EPA
      (Math.min((cpoe + 10)/20 * 12, 12)) +         // Max 12% - normalized to +10 CPOE
      (Math.min(pacr * 5, 5)) -                     // Max 5% - PACR
      (Math.min(interceptions * 5, 15)) -           // Max -15% - 3 INTs
      (Math.min(sacks * 0.75, 7.5))                 // Max -7.5% - 10 sacks
    );

    return {
      completions,
      attempts,
      completions_pct,
      pass_yards,
      pass_tds,
      interceptions,
      sacks,
      pass_epa,
      rush_yards,
      rush_tds,
      rush_epa,
      fantasy_points,
      cpoe,
      pacr,
      qbr_total,
      qbr_epa_total,
      crunch_time_grade: Number(Math.min(99, Math.max(0, rawGrade)).toFixed(1))
    };
  }

  if (pos === 'RB') {
    const carries = Number(row['carries']);
    const rush_yards = Number(row['rushing_yards']);
    const rush_tds = Number(row['rushing_tds']);
    const rush_fumbles = Number(row['rushing_fumbles']);
    const receptions = Number(row['receptions']);
    const rec_yards = Number(row['receiving_yards']);
    const rec_tds = Number(row['receiving_tds']);
    const rec_fumbles = Number(row['receiving_fumbles']);
    const rec_yac = Number(row['receiving_yards_after_catch'] ?? row['receving_yards_after_catch']);
    const fantasy_points = Number(row['fantasy_points']);

    const rawGrade = (
      (Math.min(rush_yards, 100)/100 * 35) +        // Max 35% - normalized to 100 yards
      (Math.min(rush_tds * 20, 20)) +               // Max 20% - 1 TD
      (Math.min(rec_yards, 50)/50 * 15) +           // Max 15% - normalized to 50 rec yards
      (Math.min(rec_tds * 15, 15)) +                // Max 15% - 1 rec TD
      (Math.min(rec_yac, 40)/40 * 10) +             // Max 10% - normalized to 40 YAC
      (Math.min(receptions * 2, 10)) -              // Max 10% - 5 receptions
      (Math.min(rush_fumbles * 8, 8)) -             // Max -8% - 1 fumble
      (Math.min(rec_fumbles * 8, 8))                // Max -8% - 1 fumble
    );

    return {
      carries,
      rush_yards,
      rush_tds,
      rush_fumbles,
      receptions,
      rec_yards,
      rec_tds,
      rec_fumbles,
      rec_yac,
      fantasy_points,
      crunch_time_grade: Number(Math.min(99, Math.max(0, rawGrade)).toFixed(1))
    };
  }

  if (pos === 'WR' || pos === 'TE') {
    const receptions = Number(row['receptions']);
    const targets = Number(row['targets']);
    const rec_yards = Number(row['receiving_yards']);
    const rec_tds = Number(row['receiving_tds']);
    const rec_fumbles = Number(row['receiving_fumbles']);
    const rec_yac = Number(row['receiving_yards_after_catch'] ?? row['receving_yards_after_catch']);
    const rec_epa = Number(row['receiving_epa']);
    const racr = Number(row['racr']);
    const target_share = Number(row['target_share']);
    const air_yards_share = Number(row['air_yards_share']);
    const wopr = Number(row['wopr']);
    const fantasy_points = Number(row['fantasy_points']);

    const rawGrade = (
      (Math.min(rec_yards, 100)/100 * 30) +         // Max 30% - normalized to 100 yards
      (Math.min(rec_tds * 20, 20)) +                // Max 20% - 1 TD
      (Math.min(receptions/8 * 15, 15)) +           // Max 15% - 8 receptions
      (Math.min(rec_yac, 50)/50 * 10) +             // Max 10% - normalized to 50 YAC
      (Math.min((rec_epa + 0.3) * 10, 10)) +        // Max 10% - normalized to 0.3 EPA
      (Math.min(target_share * 50, 5)) +            // Max 5% - normalized to 50% share
      (Math.min(wopr * 15, 15)) +                   // Max 15% - WOPR
      (Math.min(racr * 5, 5)) -                     // Max 5% - RACR
      (Math.min(rec_fumbles * 10, 10))              // Max -10% - 1 fumble
    );

    return {
      receptions,
      targets,
      rec_yards,
      rec_tds,
      rec_fumbles,
      rec_yac,
      fantasy_points,
      rec_epa,
      racr,
      target_share,
      air_yards_share,
      wopr,
      crunch_time_grade: Number(Math.min(99, Math.max(0, rawGrade)).toFixed(1))
    };
  }

  if (pos === 'DB') {
    const solo = Number(row['def_tackles_solo']);
    const withAssist = Number(row['def_tackles_with_assist']);
    const assists = Number(row['def_tackles_assists']);
    const tackles_for_loss = Number(row['def_tackles_for_loss']);
    const fumbles_forced = Number(row['def_fumbles_forced']);
    const sacks = Number(row['def_sacks']);
    const qb_hits = Number(row['def_qb_hits']);
    const interceptions = Number(row['def_interceptions']);
    const passes_defended = Number(row['def_pass_defended']);
    const defensive_tds = Number(row['def_tds']);
    const penalties = Number(row['penalties']);
    const total_tackles = solo + withAssist + assists;

    const rawGrade = (
      (Math.min(solo * 3, 45)) +                    // Max 45% - 15 solo tackles
      (Math.min(passes_defended * 12, 35)) +        // Max 35% - ~3 passes defended
      (Math.min(tackles_for_loss * 5, 10)) +        // Max 10% - 2 TFLs
      (Math.min(interceptions * 15, 15)) +          // Max 15% - 1 INT
      (Math.min(fumbles_forced * 5, 5)) +           // Max 5% - 1 FF
      (Math.min(defensive_tds * 10, 10)) -          // Max 10% - 1 TD
      (Math.min(penalties * 7, 21))                 // Max -21% - 3 penalties
    );

    return {
      solo_tackles: solo,
      assisted_tackles: assists,
      tackles_with_assist: withAssist,
      tackles_for_loss,
      fumbles_forced,
      sacks,
      qb_hits,
      interceptions,
      passes_defended,
      defensive_tds,
      penalties,
      total_tackles,
      crunch_time_grade: Number(Math.min(99, Math.max(0, rawGrade)).toFixed(1))
    };
  }

  return null; // positions you're not handling yet
}