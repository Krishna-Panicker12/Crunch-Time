import { supabase } from "./supabaseClient";

// list players (for dropdowns/search)
export async function listPlayers({ position = null, limit = 5000 } = {}) {
  let q = supabase
    .from("players")
    .select("id, display_name, position, team, headshot")
    .order("display_name", { ascending: true })
    .limit(limit);

  if (position && position !== "All") q = q.eq("position", position);

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
    .eq("season", season)
    .single();

  if (error) throw error;
  return data; // { season, stats }
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
