// nflverse-data (GitHub Releases) — same host as your players/weekly season stats
export const PLAYERS_CSV_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/players/players.csv";

export const WEEKLY_CSV_URL = (season) =>
  `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_${season}.csv`;

export const SEASON_CSV_URL = (season) =>
  `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_regpost_${season}.csv`;

// ESPN QBR (from the nflverse-data "espn_data" release)
export const QUARTERBACK_WEEKLY_ESPN_CSV_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/espn_data/qbr_week_level.csv";

export const QUARTERBACK_SEASON_ESPN_CSV_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/espn_data/qbr_season_level.csv";
