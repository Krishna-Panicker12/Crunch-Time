import Papa from "papaparse";
import { PLAYERS_CSV_URL, WEEKLY_CSV_URL, SEASON_CSV_URL ,QUARTERBACK_WEEKLY_ESPN_CSV_URL, QUARTERBACK_SEASON_ESPN_CSV_URL } from "./constants.js";
import { normalizePlayerStats } from "./normalize.js";
import { fetchCsvViaProxy } from "./proxyFetch.js";

// In-memory caches
const playersById = new Map();
const idByEspnId = new Map();
const playersByPosition = new Map();
const weeklyIndexByPlayerSeason = new Map();
const seasonTotalsByPlayer = new Map();
const loadedSeasons = new Set();
const loadedSeasonsTotals = new Set();
const loadedQbrWeekly = new Set();
const loadedQbrSeason = new Set();
const mergedWeekly = new Set();
const mergedSeason = new Set();

// Helper function to create standardized keys for maps
function makeKey(id,season){
    const key = `${id}|${season}`;
    return key;
}

// This function loads and parses a CSV file from a URL using PapaParse
export async function loadCSV(url) {
    try{
        const csvText = await fetchCsvViaProxy(url);
        const result = Papa.parse(csvText,{
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
        });
        return result.data;
    } catch (error){
        console.error(`Error loading CSV from ${url}:`, error);
        throw error;
    }
}

// This function reads and assigns basic player background information
export async function loadPlayers(){
    const rows = await loadCSV(PLAYERS_CSV_URL)
    rows.forEach(row => {
        const latestYearActive = row['last_season'];
        const position = row['position_group'];
        if (latestYearActive !== 2025) return; // Only includes active players
        else if (!['QB', 'RB', 'WR', 'TE', 'DB'].includes(position)) return; // Only includes certain positions for v1.0 (QB, RB, WR, TE, DB)
        else {
            const p = {
                id: String(row['gsis_id']),
                espn_id: String(row['espn_id']),
                display_name : row['display_name'],
                birthDate : row['birth_date'],
                height : row['height'],
                weight : row['weight'],
                college : row['college_name'],
                team : row['latest_team'],
                headShot : row['headshot'],
                num : row['jersey_number'],
                position : position
            };
            // Must have your internal ID; otherwise skip entirely.
            if (!p.id) return;

            // Map ESPN → internal ID only if espn_id exists
            if (p.espn_id) {
                const existing = idByEspnId.get(p.espn_id);
                if (existing && existing !== p.id) {
                // optional: log/handle collision
                console.warn(`ESPN ${p.espn_id} already mapped to ${existing}, got ${p.id}`);
                } else {
                idByEspnId.set(p.espn_id, p.id);
                }
            }
            // Always store the player and index by position
            playersById.set(p.id, p);
            let arr = playersByPosition.get(position);
            if (!Array.isArray(arr)) arr = [];
            if (!arr.includes(p.id)) arr.push(p.id);
            playersByPosition.set(position, arr);
        }
    });
}

// This function looks through weekly stats
export async function loadWeekly(season){
    const rows = await loadCSV(WEEKLY_CSV_URL(season));
    const TARGET_POS = new Set(['QB','RB','WR','TE','DB']);

    rows.forEach(r => {
        if (r['season_type'] !== 'REG') return;
        const pos = r['position_group'];
        if (!TARGET_POS.has(pos)) return;

        const playerId = r['player_id'];
        if (!playerId) return;

        const s = Number(r['season']);
        if (s !== Number(season)) return;

        const week = Number(r['week']);
        const stats = normalizePlayerStats(r);
        if (!stats) return;

        const key = `${playerId}|${s}`;                    // meta in the key
        let weekMap = weeklyIndexByPlayerSeason.get(key);  // inner map keyed by week
        if (!weekMap) {
            weekMap = new Map();
            weeklyIndexByPlayerSeason.set(key, weekMap);
        }
        weekMap.set(week, stats);                          // value = stats only
    });
    loadedSeasons.add(Number(season));
}

// This function looks through full season total stats
export async function loadSeason(season) {
  const rows = await loadCSV(SEASON_CSV_URL(season));
  const TARGET_POS = new Set(['QB','RB','WR','TE','DB']);

  rows.forEach(r => {
    const pos = r['position_group'];
    if (!TARGET_POS.has(pos)) return;

    const playerId = r['player_id'];
    if (!playerId) return;

    const s = Number(r['season']);
    if (s !== Number(season)) return;

    const stats = normalizePlayerStats(r);
    if (!stats) return;

    const key = `${playerId}|${s}`;
    if (!seasonTotalsByPlayer.has(key)) {
      seasonTotalsByPlayer.set(key, stats); // stats only
    }
  });

  loadedSeasonsTotals.add(Number(season));
}

// Creates a map holding weekly QBR data for all QBs in a given season
async function loadQbrWeekly(season){
    if(loadedQbrWeekly.has(season)) return null;

    const rows = await loadCSV(QUARTERBACK_WEEKLY_ESPN_CSV_URL);
    const outPut = new Map() // Stores ESPN_ID as the key and another map of the week and stats

    rows.forEach(row=>{
        const csvSeason = Number(row['season']);
        if (csvSeason !== season) return;
        const espnID = row['player_id'];
        const seasonType = String(row['season_type']).toLowerCase();
        if(seasonType !== "regular") return;
        const week = Number(row['game_week']);
        
        const qbrRow= {
            week,
            qbr_total: Number(row['qbr_total']),
            epa_total: Number(row['epa_total'])

        }
        if (!outPut.has(espnID)) outPut.set(espnID, new Map());
        outPut.get(espnID).set(week, qbrRow);
    })
    loadedQbrWeekly.add(season);
    return outPut;
}

// Creates a map holding season QBR data for all QBs in a given season
async function loadQbrSeason(season){
    if(loadedQbrSeason.has(season)) return null;

    const rows = await loadCSV(QUARTERBACK_SEASON_ESPN_CSV_URL);
    const outPut = new Map() // Stores ESPN_ID as the key and stats object as the value

    rows.forEach(row=>{
        const csvSeason = Number(row['season']);
        if (csvSeason !== season) return;
        const espnID = row['player_id'];
        const seasonType = String(row['season_type']).toLowerCase();
        if(seasonType !== "regular") return;
        
        const qbrRow= {
            qbr_total: Number(row['qbr_total']),
            epa_total: Number(row['epa_total'])

        }
        if (!outPut.has(espnID)) outPut.set(espnID, qbrRow);
    });
    loadedQbrSeason.add(season);
    return outPut;
}

// Merges QBR ESPN data into the existing weekly stats map
export async function mergeQbrWeekly(season){
    if (mergedWeekly.has(season)) return;

    const qbr = await loadQbrWeekly(season);
    if (!qbr) { mergedWeekly.add(season); return; }

    for (const [espnIdRaw, weekMap] of qbr.entries()) {
        const espnId = String(espnIdRaw);
        const internalId = idByEspnId.get(espnId);
        if (!internalId) continue; // can't join

        const key = `${internalId}|${season}`;
        const weeks = weeklyIndexByPlayerSeason.get(key);
        if (!weeks) continue;

        for (const [weekRaw, q] of weekMap.entries()) {
        const week = Number(weekRaw);
        const stats = weeks.get(week); // stats-only object
        if (!stats) continue;          // bye week or missing in nflverse
        stats.qbr_total = q.qbr_total;
        stats.qbr_epa_total = q.epa_total;
        }
    }
    mergedWeekly.add(season);
}

// Merges QBR ESPN data into the existing season totals stats map
export async function mergeQBRSeason(season) {
  if (mergedSeason.has(season)) return;

  const qbr = await loadQbrSeason(season);
  if (!qbr) { mergedSeason.add(season); return; }

  for (const [espnIdRaw, q] of qbr.entries()) {
    const espnId = String(espnIdRaw);
    const internalId = idByEspnId.get(espnId);
    if (!internalId) continue;

    const key = `${internalId}|${Number(season)}`;
    const stats = seasonTotalsByPlayer.get(key);
    if (!stats) continue; // no nflverse season row (rookie no snaps, etc.)
    stats.qbr_total = q.qbr_total ?? stats.qbr_total ?? null;
    stats.qbr_epa_total = q.epa_total ?? stats.qbr_epa_total ?? null;
  }

  mergedSeason.add(season);
}

export async function loadAllData(season){
    await loadPlayers();
    await loadWeekly(season);
    await loadSeason(season);
    await mergeQbrWeekly(season);
    await mergeQBRSeason(season);
}

// Export all libraries
export{
    playersById,
    playersByPosition,
    weeklyIndexByPlayerSeason,
    seasonTotalsByPlayer,
    idByEspnId
}