// scripts/ingestSupabase.js
import "dotenv/config";
import Papa from "papaparse";
import { supabaseAdmin } from "./supabaseAdmin.js";

import {
  PLAYERS_CSV_URL,
  WEEKLY_CSV_URL,
  SEASON_CSV_URL,
  QUARTERBACK_WEEKLY_ESPN_CSV_URL,
  QUARTERBACK_SEASON_ESPN_CSV_URL,
} from "../src/api/constants.js";

import { normalizePlayerRow, normalizePlayerStats } from "../src/api/normalize.js";
const season = 2025;
function assertEnv() {
  if (!process.env.SUPABASE_URL) throw new Error("Missing SUPABASE_URL in .env");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
}

// Node fetch CSV directly (no proxy, no browser)
async function fetchCsvRows(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  const text = await res.text();
  const parsed = Papa.parse(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return parsed.data;
}

async function upsertChunked(table, rows, chunkSize = 1000) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabaseAdmin.from(table).upsert(chunk);
    if (error) throw error;
    console.log(`✅ Upserted ${chunk.length} rows into ${table}`);
  }
}

function makeKey(id, season) {
  return `${id}|${season}`;
}

async function ingestSeason(season) {
  const TARGET_POS = new Set(["QB", "RB", "WR", "TE", "DB"]);

  // --------------------------
  // 1) PLAYERS
  // --------------------------
  const playerRows = await fetchCsvRows(PLAYERS_CSV_URL);

  const players = playerRows
    .map(normalizePlayerRow)
    .filter((p) => p?.id && p.last_season === season && TARGET_POS.has(p.position)) // keep your filter
    .map((p) => ({
      id: String(p.id),
      espn_id: p.espn_id ?? null,
      display_name: p.display_name ?? null,
      position: p.position ?? null,
      team: p.team ?? null,
      birth_date: p.birth_date ?? null,
      height: Number(p.height ?? 0),
      weight: Number(p.weight ?? 0),
      college: p.college ?? null,
      headshot: p.headshot ?? null,
      jersey_number: p.jersey_number ?? null,
      last_season: Number(p.last_season ?? 0),
      updated_at: new Date().toISOString(),
    }));

  await upsertChunked("players", players);

  // Build ESPN -> internal ID join map
  const idByEspnId = new Map();
  for (const p of players) {
    if (p.espn_id) idByEspnId.set(String(p.espn_id), String(p.id));
  }

  // --------------------------
  // 2) WEEKLY STATS (nflverse)
  // --------------------------
  const weeklyRowsRaw = await fetchCsvRows(WEEKLY_CSV_URL(season));

  // id|season -> Map(week -> statsObj)
  const weeklyIndexByPlayerSeason = new Map();

  for (const r of weeklyRowsRaw) {
    if (r["season_type"] !== "REG") continue;

    const pos = r["position_group"];
    if (!TARGET_POS.has(pos)) continue;

    const id = r["player_id"];
    if (!id) continue;

    const s = Number(r["season"]);
    if (s !== Number(season)) continue;

    const week = Number(r["week"]);
    const stats = normalizePlayerStats(r);
    if (!stats) continue;

    const key = makeKey(String(id), s);
    let weekMap = weeklyIndexByPlayerSeason.get(key);
    if (!weekMap) {
      weekMap = new Map();
      weeklyIndexByPlayerSeason.set(key, weekMap);
    }
    weekMap.set(week, stats);
  }

  // --------------------------
  // 3) SEASON TOTALS (nflverse)
  // --------------------------
  const seasonRowsRaw = await fetchCsvRows(SEASON_CSV_URL(season));
  const seasonTotalsByPlayer = new Map();

  for (const r of seasonRowsRaw) {
    const pos = r["position_group"];
    if (!TARGET_POS.has(pos)) continue;

    const id = r["player_id"];
    if (!id) continue;

    const s = Number(r["season"]);
    if (s !== Number(season)) continue;

    const stats = normalizePlayerStats(r);
    if (!stats) continue;

    const key = makeKey(String(id), s);
    if (!seasonTotalsByPlayer.has(key)) seasonTotalsByPlayer.set(key, stats);
  }

  // --------------------------
  // 4) MERGE ESPN QBR (weekly)
  // --------------------------
  const qbrWeeklyRows = await fetchCsvRows(QUARTERBACK_WEEKLY_ESPN_CSV_URL);

  for (const row of qbrWeeklyRows) {
    const csvSeason = Number(row["season"]);
    if (csvSeason !== Number(season)) continue;

    const seasonType = String(row["season_type"]).toLowerCase();
    if (seasonType !== "regular") continue;

    const espnId = String(row["player_id"]);
    const internalId = idByEspnId.get(espnId);
    if (!internalId) continue;

    const week = Number(row["game_week"]);
    const key = makeKey(internalId, Number(season));
    const weekMap = weeklyIndexByPlayerSeason.get(key);
    if (!weekMap) continue;

    const stats = weekMap.get(week);
    if (!stats) continue;

    stats.qbr_total = Number(row["qbr_total"]);
    stats.qbr_epa_total = Number(row["epa_total"]);
  }

  // --------------------------
  // 5) MERGE ESPN QBR (season)
  // --------------------------
  const qbrSeasonRows = await fetchCsvRows(QUARTERBACK_SEASON_ESPN_CSV_URL);

  for (const row of qbrSeasonRows) {
    const csvSeason = Number(row["season"]);
    if (csvSeason !== Number(season)) continue;

    const seasonType = String(row["season_type"]).toLowerCase();
    if (seasonType !== "regular") continue;

    const espnId = String(row["player_id"]);
    const internalId = idByEspnId.get(espnId);
    if (!internalId) continue;

    const key = makeKey(internalId, Number(season));
    const stats = seasonTotalsByPlayer.get(key);
    if (!stats) continue;

    stats.qbr_total = Number(row["qbr_total"]);
    stats.qbr_epa_total = Number(row["epa_total"]);
  }

  // --------------------------
  // 6) WRITE TO SUPABASE TABLES
  // --------------------------

  const seasonUpserts = [];
  for (const [key, stats] of seasonTotalsByPlayer.entries()) {
    const [id, s] = key.split("|");
    seasonUpserts.push({
      id,
      season: Number(s),
      stats,
      updated_at: new Date().toISOString(),
    });
  }
  await upsertChunked("player_seasons", seasonUpserts);

  const weekUpserts = [];
  for (const [key, weekMap] of weeklyIndexByPlayerSeason.entries()) {
    const [id, s] = key.split("|");
    for (const [week, stats] of weekMap.entries()) {
      weekUpserts.push({
        id,
        season: Number(s),
        week: Number(week),
        stats,
        updated_at: new Date().toISOString(),
      });
    }
  }
  await upsertChunked("player_weeks", weekUpserts);

  console.log(`🎉 Done ingesting season ${season}`);
}

async function main() {
  assertEnv();
  await ingestSeason(season);
}

main().catch((e) => {
  console.error("❌ Ingest failed:", e);
  process.exit(1);
});
