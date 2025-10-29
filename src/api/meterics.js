

export const POSITION_CONFIG = Object.freeze({
  QB: {
    metrics: [
      'completions',
      'attempts',
      'passing_yards',
      'passing_tds',
      'passing_interceptions',
      'sacks_suffered',
      'passing_epa',
      'rushing_epa',
      'rushing_yards',
      'rushing_tds',
      'passing_cpoe',
      'pacr',
      'fantasy_points',
    ],
  },
  RB: {
    metrics: [
      'carries',
      'rushing_yds',
      'rushing_tds',
      'rushing_fumbles',
      'receptions',
      'receiving_yards',
      'receiving_tds',
      'fantasy_points',
    ],
  },
  WR: {
    metrics: [
      'receptions',
      'targets',
      'receiving_yards',
      'receiving_tds',
      'receiving_fumbles',
      'receving_ards_after_catch',
      'fantasy_points',
      'receiving_epa',
      'racr',
      'target_share',
      'air_yards_share',
      'wopr',
    ],
  },
  TE: {
    metrics: [
      'receptions',
      'targets',
      'receiving_yards',
      'receiving_tds',
      'receiving_fumbles',
      'receving_ards_after_catch',
      'fantasy_points',
      'receiving_epa',
      'racr',
      'target_share',
      'air_yards_share',
      'wopr',
    ],
  },
  DB: {
    metrics: [
      'def_tackles_solo',
      'def_tackles_with_assists',
      'def_tackles_assists',
      'def_tackles_for_loss',
      'def_fumbles_forced',
      'def_sacks',
      'def_qb_hits',
      'def_interceptions',
      'def_pass_defended',
      'def_tds',
      'penalties',
    ],
  },
});

export const METRIC_LABELS = {
  completions: 'CMP',
  attempts: 'ATT',
  passing_yards: 'Pass Yds',
  passing_tds: 'Pass TD',
  passing_interceptions: 'INT',
  sacks_suffered: 'Sacks',
  passing_epa: 'Pass EPA',
  rushing_epa: 'Rush EPA',
  rushing_yards: 'Rush Yds',
  rushing_tds: 'Rush TD',
  passing_cpoe: 'CPOE',
  pacr: 'PACR',
  fantasy_points: 'Fantasy Pts',

  carries: 'Carries',
  rushing_yds: 'Rush Yds',
  rushing_tds: 'Rush TD',
  rushing_fumbles: 'Rush FUM',
  receptions: 'REC',
  receiving_yards: 'Rec Yds',
  receiving_tds: 'Rec TD',

  targets: 'TGT',
  receiving_fumbles: 'Rec FUM',
  receving_ards_after_catch: 'YAC',
  receiving_epa: 'Rec EPA',
  racr: 'RACR',
  target_share: 'Target Share',
  air_yards_share: 'Air Yards Share',
  wopr: 'WOPR',

  def_tackles_solo: 'Solo TKL',
  def_tackles_with_assists: 'TKL (with A)',
  def_tackles_assists: 'AST',
  def_tackles_for_loss: 'TFL',
  def_fumbles_forced: 'FF',
  def_sacks: 'Sacks',
  def_qb_hits: 'QB Hits',
  def_interceptions: 'INT',
  def_pass_defended: 'PD',
  def_tds: 'DEF TD',
  penalties: 'Penalties',
};


export function getDisplayColumnsForPosition(pos) {
  const keys = POSITION_CONFIG[pos]?.metrics ?? [];
  return keys.map((key) => ({
    key,
    header: METRIC_LABELS[key] ?? key
  }));
}
