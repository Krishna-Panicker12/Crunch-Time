import { supabase } from "./supabaseClient";

// list players (for dropdowns/search)
export async function listPlayers({ position = null, limit = 100000 } = {}) {
  let q = supabase
    .from("players")
    .select("id, display_name, position, team, headshot, college, jersey_number, height, weight, birth_date");

  if (position && position !== "All") q = q.eq("position", position);

  q = q.order("display_name", { ascending: true }).limit(limit);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

// season totals for a player
export async function getPlayerSeason(id, season) {
  const { data, error } = await supabase
    .from("player_seasons")
    .select("season, stats")
    .eq("id", id)
    .eq("season", season);

  // Return null if no data found, don't throw error
  if (error) {
    console.warn(`No season data for player ${id} in season ${season}:`, error.message);
    return null;
  }
  
  return data && data.length > 0 ? data[0] : null;
}

// weekly stats for a player
export async function getPlayerWeeks(id, season) {
  const { data, error } = await supabase
    .from("player_weeks")
    .select("week, stats")
    .eq("id", id)
    .eq("season", season)
    .order("week", { ascending: true });

  if (error) throw error;
  return data ?? []; // [{ week, stats }, ...]
}
