import { useEffect, useMemo, useState } from "react";
import { listPlayers, getPlayerSeason, getPlayerWeeks } from "../db/playerReads";
import { normalizePlayerStats } from "../api/normalize";


export function usePlayerArchetypeData(player_id, season){
    const [players, setPlayers] = useState([]);
    const [player, setPlayer] = useState(null);

    const [seasonStats, setSeasonStats] = useState(null);
    const [weeklyStats, setWeeklyStats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let alive = true;

        async function run () {
            try{
                const arr = await listPlayers({ position: "All", limit: 20000 });
                if (!alive) return;
                setPlayers(arr  || []);
            } catch (e) {
                if (!alive) return;
                setError(e?.message || "failed to load players list");
            }
        }

        run()
        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
    if (!player_id || players.length === 0) {
      setPlayer(null);
      return;
    }
    const found = players.find((p) => p.id === player_id) || null;
    setPlayer(found);
  }, [player_id, players]);

  // Load season + weekly stats (depends on player + season)
  useEffect(() => {
    let alive = true;

    async function run() {
        setError("");
        setSeasonStats(null);
        setWeeklyStats([]);
        
        if (!player_id || !season) return;

      setLoading(true);
      try {
        const [seasonRow, weeks] = await Promise.all([
          getPlayerSeason(player_id, season),
          getPlayerWeeks(player_id, season),
        ]);

        if (!alive) return;

        // seasonRow shape assumed: { stats: {...}, position: "...", ... }
        // If your row stores position elsewhere, replace this accordingly.
        const position =
          seasonRow?.position || player?.position || seasonRow?.pos || null;

        const rawStats = seasonRow?.stats || {};
        const normalized = position
          ? normalizePlayerStats(position, rawStats)
          : rawStats;

        setSeasonStats({
          ...seasonRow,
          position,
          stats: normalized,
        });

        // weekly normalization (optional)
        // If your weekly rows are like { week, stats: {...} }
        const normalizedWeeks = (weeks || []).map((w) => {
          const wPos = w?.position || position;
          const wStats = w?.stats || w || {};
          const wNorm = wPos ? normalizePlayerStats(wPos, wStats) : wStats;
          return { ...w, position: wPos, stats: wNorm };
        });

        setWeeklyStats(normalizedWeeks);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load player season data");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [player_id, season, player?.position]); // includes player in case position is needed

  return { player, seasonStats, weeklyStats, loading, error };
}