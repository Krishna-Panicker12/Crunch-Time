import React, { useEffect, useMemo, useState, useRef } from "react";
import { PlayerCard } from "../components/PlayerCard";
import { PlayerPicker } from "../components/PlayerPicker";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { STAT_DISPLAY_NAMES, BETTER_DIRECTION, STAT_ORDER } from "../utils/statsMapping";
import { StatTooltip } from "../components/StatTooltip";

// NEW: Supabase reads
import { listPlayers, getPlayerSeason, getPlayerWeeks } from "../db/playerReads";
import { generateCompareExplanation } from "../archetypes/compareAiExplainer";
import { calculateWinner } from "../archetypes/compareWinnerCalculator";

const CURRENT_YEAR = 2025;
const HIGHLIGHTED_STATS = new Set(["crunch_time_grade"]);
const HIDDEN_STATS_FOR_DROPDOWN = new Set(["qbr_total", "qbr_epa_total"]);

// Utility: conditional classNames
const cx = (...xs) => xs.filter(Boolean).join(" ");

// Utility: consistent value format
const fmt = (v) => {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return 0;
  return typeof v === "number"
    ? Number.isInteger(v)
      ? v
      : Number(v.toFixed(2))
    : Number.isNaN(Number(v))
      ? 0
      : v;
};

export default function Compare() {
  /** ---------- STATE ---------- */
  const [position, setPosition] = useState("");
  const [playerAId, setPlayerAId] = useState("");
  const [playerBId, setPlayerBId] = useState("");
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [selectedStat, setSelectedStat] = useState("");
  const [expandedPosition, setExpandedPosition] = useState(null);

  // NEW: Supabase data state
  const [allPlayers, setAllPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);

  const [aTotals, setATotals] = useState({});
  const [bTotals, setBTotals] = useState({});
  const [weeklyA, setWeeklyA] = useState([]);
  const [weeklyB, setWeeklyB] = useState([]);
  const [aLoading, setALoading] = useState(false);
  const [bLoading, setBLoading] = useState(false);

  // AI explanation state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const aiReqIdRef = useRef(0);
  const aiAbortRef = useRef(null);

  /** ---------- LOAD PLAYERS FROM SUPABASE ONCE ---------- */
  useEffect(() => {
    let alive = true;
    setPlayersLoading(true);

    (async () => {
      try {
        // Load all players once; then filter locally (same behavior as old Maps)
        const data = await listPlayers({ position: "All", limit: 20000 });
      
  // Look for names like "Zach Wilson", "Zay Flowers", etc.
        if (!alive) return;
        setAllPlayers(data || []);
      } catch (e) {
        console.error("Failed to load players from Supabase:", e);
      } finally {
        if (alive) setPlayersLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  /** ---------- DATA (same pattern as before) ---------- */
  const positions = useMemo(() => {
    return Array.from(new Set((allPlayers || []).map((p) => p.position).filter(Boolean))).sort();
  }, [allPlayers]);

  const pool = useMemo(() => {
    return (allPlayers || []).filter((p) => (position ? p.position === position : true));
  }, [allPlayers, position]);

  const filteredA = useMemo(() => {
    const q = searchA.toLowerCase();
    return pool.filter((p) => (p.display_name || "").toLowerCase().includes(q));
  }, [pool, searchA]);

  const filteredB = useMemo(() => {
    const q = searchB.toLowerCase();
    return pool.filter((p) => (p.display_name || "").toLowerCase().includes(q));
  }, [pool, searchB]);

  const playerA = pool.find((p) => p.id === playerAId) || null;
  const playerB = pool.find((p) => p.id === playerBId) || null;

  /** ---------- FETCH PLAYER A DATA (season + weekly) ---------- */
  useEffect(() => {
    let alive = true;

    if (!playerAId) {
      setATotals({});
      setWeeklyA([]);
      return;
    }

    setALoading(true);
    (async () => {
      try {
        const [seasonRow, weeksRows] = await Promise.all([
          getPlayerSeason(playerAId, CURRENT_YEAR), // {season, stats} or null
          getPlayerWeeks(playerAId, CURRENT_YEAR),  // [{week, stats}, ...]
        ]);

        if (!alive) return;

        // Season totals
        setATotals(seasonRow?.stats || {});

        // Weekly array in the SAME shape you used before: {week, stat1, stat2...}
        const weeks = (weeksRows || []).map((r) => ({
          week: Number(r.week),
          ...(r.stats || {}),
        }));
        setWeeklyA(weeks);
      } catch (e) {
        console.error("Failed to load Player A data:", e);
        if (!alive) return;
        setATotals({});
        setWeeklyA([]);
      } finally {
        if (alive) setALoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [playerAId]);

  /** ---------- FETCH PLAYER B DATA (season + weekly) ---------- */
  useEffect(() => {
    let alive = true;

    if (!playerBId) {
      setBTotals({});
      setWeeklyB([]);
      return;
    }

    setBLoading(true);
    (async () => {
      try {
        const [seasonRow, weeksRows] = await Promise.all([
          getPlayerSeason(playerBId, CURRENT_YEAR),
          getPlayerWeeks(playerBId, CURRENT_YEAR),
        ]);

        if (!alive) return;

        setBTotals(seasonRow?.stats || {});
        const weeks = (weeksRows || []).map((r) => ({
          week: Number(r.week),
          ...(r.stats || {}),
        }));
        setWeeklyB(weeks);
      } catch (e) {
        console.error("Failed to load Player B data:", e);
        if (!alive) return;
        setBTotals({});
        setWeeklyB([]);
      } finally {
        if (alive) setBLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [playerBId]);

  /** ---------- COMPARISON LOGIC ---------- */
  const statKeys = useMemo(() => {
    if (!playerA || !playerB) return [];
    
    // Get the stat order for this position
    const posOrder = STAT_ORDER[playerA.position] || [];
    const aKeys = Object.keys(aTotals || {});
    const bKeys = Object.keys(bTotals || {});
    const commonKeys = aKeys.filter((k) => bKeys.includes(k));
    
    // Sort by position order, then add any extra keys not in the predefined order
    const ordered = posOrder.filter((k) => commonKeys.includes(k));
    const extra = commonKeys.filter((k) => !posOrder.includes(k)).sort();
    
    return [...ordered, ...extra];
  }, [playerA, playerB, aTotals, bTotals]);

  const compareValues = (k, a, b) => {
    const dir = BETTER_DIRECTION[k] || "higher";
    if (a == null || b == null) return 0;
    const numA = Number(a);
    const numB = Number(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) return 0;
    if (dir === "higher") return numA > numB ? 1 : numA < numB ? -1 : 0;
    return numA < numB ? 1 : numA > numB ? -1 : 0;
  };

  const winnerData = useMemo(() => {
    return calculateWinner(playerA, playerB, aTotals, bTotals, statKeys);
  }, [playerA, playerB, aTotals, bTotals, statKeys]);

  const winner = winnerData ? 
    (winnerData.isTie ? 
      `Tie (${winnerData.aGrade}% vs ${winnerData.bGrade}% CTG)` : 
      `${winnerData.winner.display_name} (${winnerData.winner === playerA ? winnerData.aGrade : winnerData.bGrade}% CTG)`) : 
    null;

  /** ---------- AI EXPLANATION ---------- */
  /** ---------- AI EXPLANATION (race-condition safe) ---------- */
useEffect(() => {
  // If not ready, clear
  if (
    !winnerData || !winnerData.winner || !playerA || !playerB ||
    !aTotals || !bTotals ||
    Object.keys(aTotals).length === 0 || Object.keys(bTotals).length === 0
  ) {
    // cancel any in-flight request
    if (aiAbortRef.current) aiAbortRef.current.abort();
    setAiExplanation(null);
    setAiLoading(false);
    return;
  }

  // --- Create a "snapshot" so async can't read live-changing state ---
  const snapshotA = {
    playerName: playerA.display_name,
    position: playerA.position,
    stats: { ...aTotals },
  };
  const snapshotB = {
    playerName: playerB.display_name,
    position: playerB.position,
    stats: { ...bTotals },
  };

  const winnerString = winnerData.isTie
    ? `Tie (${winnerData.aGrade}% vs ${winnerData.bGrade}% CTG)`
    : `${winnerData.winner.display_name} (${winnerData.winner === playerA ? winnerData.aGrade : winnerData.bGrade}% CTG)`;

  const winnerReason = winnerData.reason;

  // --- request ownership ---
  const reqId = ++aiReqIdRef.current;

  // --- cancel previous request ---
  if (aiAbortRef.current) aiAbortRef.current.abort();
  const controller = new AbortController();
  aiAbortRef.current = controller;

  setAiLoading(true);
  setAiExplanation(null);

  (async () => {
    try {
      const explanation = await generateCompareExplanation(
        snapshotA,
        snapshotB,
        winnerString,
        winnerReason,
        true,
        { signal: controller.signal } // <--- NEW (see file #2)
      );

      // Only the latest request can update the UI
      if (reqId !== aiReqIdRef.current) return;

      setAiExplanation(explanation);
    } catch (e) {
      // If aborted, ignore (this is expected)
      if (e?.name === "AbortError") return;

      console.warn("AI explanation failed:", e);

      if (reqId !== aiReqIdRef.current) return;
      setAiExplanation({ text: "Unable to generate explanation at this time.", source: "error" });
    } finally {
      // Only latest request can end loading state
      if (reqId !== aiReqIdRef.current) return;
      setAiLoading(false);
    }
  })();

  // Cleanup abort on dependency change/unmount
  return () => controller.abort();
}, [winnerData, playerA, playerB, aTotals, bTotals]);


  /** ---------- CHART DATA ---------- */
  const mergedWeeks = useMemo(() => {
    if (!selectedStat || !playerA || !playerB) return [];

    const map = new Map();

    for (const w of weeklyA) {
      const wk = Number(w.week);
      const val = Number(w[selectedStat]);
      map.set(wk, { week: wk, [playerA.display_name]: Number.isFinite(val) ? val : 0 });
    }

    for (const w of weeklyB) {
      const wk = Number(w.week);
      const val = Number(w[selectedStat]);
      const entry = map.get(wk) || { week: wk, [playerA.display_name]: 0 };
      entry[playerB.display_name] = Number.isFinite(Number(val)) ? Number(val) : 0;
      map.set(wk, entry);
    }

    const weeks = Array.from(map.keys()).map(Number).sort((a, b) => a - b);
    if (weeks.length === 0) return [];

    const minW = weeks[0];
    const maxW = weeks[weeks.length - 1];
    const out = [];

    for (let wk = minW; wk <= maxW; wk++) {
      const e = map.get(wk) || { week: wk };
      e[playerA.display_name] = Number.isFinite(Number(e[playerA.display_name])) ? Number(e[playerA.display_name]) : 0;
      e[playerB.display_name] = Number.isFinite(Number(e[playerB.display_name])) ? Number(e[playerB.display_name]) : 0;
      out.push(e);
    }

    return out;
  }, [weeklyA, weeklyB, playerA, playerB, selectedStat]);

  const xTicks = useMemo(() => {
    if (!mergedWeeks || mergedWeeks.length === 0) return [];
    const min = mergedWeeks[0].week;
    const max = mergedWeeks[mergedWeeks.length - 1].week;
    const ticks = [];
    for (let i = min; i <= max; i++) ticks.push(i);
    return ticks;
  }, [mergedWeeks]);

  const availableStats = useMemo(() => {
    if (!playerA || !playerB) return [];
    return statKeys
      .filter((key) => !HIDDEN_STATS_FOR_DROPDOWN.has(key))
      .map((key) => ({
        value: key,
        label: STAT_DISPLAY_NAMES[key] || key,
      }));
  }, [statKeys, playerA, playerB]);

  const ctgBreakdown = {
    QB: [
      { metric: "Completion %", weight: "25%", note: "Normalized to 75%" },
      { metric: "Passing Yards", weight: "20%", note: "Normalized to 300 yards" },
      { metric: "Passing TDs", weight: "24%", note: "2 TDs = max" },
      { metric: "Rush Yards", weight: "8%", note: "Normalized to 35 yards" },
      { metric: "Pass EPA", weight: "16%", note: "Normalized to +0.5" },
      { metric: "CPOE", weight: "12%", note: "Normalized to +10" },
      { metric: "Penalties", weight: "-7.5%", note: "Per sack suffered" },
      { metric: "Interceptions", weight: "-15%", note: "Per 3 INTs" },
      { metric: "PACR", weight: "5%", note: "Receiver-adjusted comp rate" },
    ],
    RB: [
      { metric: "Rush Yards", weight: "35%", note: "Normalized to 100 yards" },
      { metric: "Rushing TDs", weight: "20%", note: "1 TD = max" },
      { metric: "Receiving Yards", weight: "15%", note: "Normalized to 50 yards" },
      { metric: "Receiving TDs", weight: "15%", note: "1 TD = max" },
      { metric: "Yards After Catch", weight: "10%", note: "Normalized to 40 YAC" },
      { metric: "Receptions", weight: "-10%", note: "Per 5 receptions" },
      { metric: "Fumbles", weight: "-16%", note: "Per 1 fumble (rushing + receiving)" },
    ],
    "WR/TE": [
      { metric: "Receiving Yards", weight: "30%", note: "Normalized to 100 yards" },
      { metric: "Receiving TDs", weight: "20%", note: "1 TD = max" },
      { metric: "Receptions", weight: "15%", note: "Normalized to 8 receptions" },
      { metric: "Yards After Catch", weight: "10%", note: "Normalized to 50 YAC" },
      { metric: "Receiving EPA", weight: "10%", note: "Normalized to +0.3" },
      { metric: "WOPR", weight: "15%", note: "Weighted Opportunity Rating" },
      { metric: "Target Share", weight: "5%", note: "Normalized to 50% share" },
      { metric: "RACR", weight: "-5%", note: "Receiver-adjusted catch rate" },
      { metric: "Fumbles", weight: "-10%", note: "Per 1 fumble" },
    ],
    DB: [
      { metric: "Solo Tackles", weight: "45%", note: "Per 15 solo tackles" },
      { metric: "Passes Defended", weight: "35%", note: "Per ~3 passes defended" },
      { metric: "Tackles for Loss", weight: "10%", note: "Per 2 TFLs" },
      { metric: "Interceptions", weight: "15%", note: "Per 1 INT" },
      { metric: "Fumbles Forced", weight: "5%", note: "Per 1 FF" },
      { metric: "Defensive TDs", weight: "10%", note: "Per 1 TD" },
      { metric: "Penalties", weight: "-21%", note: "Per 3 penalties" },
    ],
  };

  const resetPlayers = () => {
    setPlayerAId("");
    setPlayerBId("");
  };

  /** ---------- RENDER ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 md:mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1">
              Compare Players
            </h1>
            <p className="text-slate-400 text-sm md:text-base">Head-to-head player statistics and performance metrics</p>
          </div>
          <button
            onClick={resetPlayers}
            className="mt-4 md:mt-0 px-6 py-2.5 rounded-xl bg-gradient-to-r from-slate-700/60 to-slate-600/60 hover:from-slate-600/80 hover:to-slate-500/80 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 font-medium text-sm"
          >
            Clear All
          </button>
        </header>

        {/* Position Selector */}
        <section className="mb-8">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all duration-300 shadow-xl">
            <label className="block text-sm font-semibold mb-3 text-slate-200">Filter by Position</label>
            <select
              value={position}
              onChange={(e) => {
                setPosition(e.target.value);
                setPlayerAId("");
                setPlayerBId("");
                setSelectedStat("");
              }}
              className="w-full md:w-72 px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 hover:border-white/20 focus:border-blue-500/50 focus:outline-none transition-all duration-300 backdrop-blur-sm cursor-pointer"
            >
              <option value="">All Positions</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
            {playersLoading && (
              <div className="mt-3 text-sm text-slate-400 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
                Loading players…
              </div>
            )}
          </div>
        </section>

        {/* Player Pickers */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="transform transition-all duration-300 hover:scale-105 scale-z-200">
            <PlayerPicker
              title="Player A"
              search={searchA}
              onSearch={setSearchA}
              options={filteredA}
              valueId={playerAId}
              onChangeId={(id) => {
                setPlayerAId(id);
                setSelectedStat("");
              }}
            />
          </div>
          <div className="transform transition-all duration-300 hover:scale-105 scale-z-200">
            <PlayerPicker
              title="Player B"
              search={searchB}
              onSearch={setSearchB}
              options={filteredB}
              valueId={playerBId}
              onChangeId={(id) => {
                setPlayerBId(id);
                setSelectedStat("");
              }}
            />
          </div>
        </section>

        {/* Loading hints */}
        {(aLoading || bLoading) && (
          <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
            <p className="text-slate-300 text-sm font-medium">Loading player data…</p>
          </div>
        )}

        {/* Validation */}
        {playerA && playerB && playerA.position !== playerB.position && (
          <div className="backdrop-blur-xl bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6">
            <p className="text-rose-200 text-sm font-medium">⚠ Please pick players from the same position.</p>
          </div>
        )}

        {/* Result */}
        {playerA && playerB && playerA.position === playerB.position && (
          <section className="backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b border-white/10">
              <div className="transform transition-all duration-300 hover:scale-105">
                <PlayerCard player={playerA} />
              </div>
              <div className="transform transition-all duration-300 hover:scale-105">
                <PlayerCard player={playerB} />
              </div>
            </div>

            <div className="px-6 py-5 bg-white/[0.02]">
              <label className="block text-sm font-semibold mb-3 text-slate-200">Select Stat to Compare</label>
              <select
                value={selectedStat}
                onChange={(e) => setSelectedStat(e.target.value)}
                className="w-full md:w-80 px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 hover:border-white/20 focus:border-blue-500/50 focus:outline-none transition-all duration-300 backdrop-blur-sm cursor-pointer"
              >
                <option value="">Choose a statistic...</option>
                {availableStats.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {selectedStat && (
              <div className="px-6 py-8">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white">{STAT_DISPLAY_NAMES[selectedStat] || selectedStat}</h3>
                  <p className="text-slate-400 text-sm mt-1">Weekly comparison throughout the season</p>
                </div>
                <div style={{ width: "100%", height: 500, minHeight: 400 }} className="rounded-xl overflow-hidden backdrop-blur-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mergedWeeks} margin={{ top: 110, right: 32, left: 48, bottom: 96 }}>
                      <XAxis
                        dataKey="week"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        ticks={xTicks}
                        interval={0}
                        allowDecimals={false}
                        label={{ value: "Week", position: "bottom", offset: 36 }}
                        tick={{ fontSize: 13, fill: "#cbd5e1" }}
                      />
                      <YAxis
                        label={{
                          value: STAT_DISPLAY_NAMES[selectedStat] || selectedStat,
                          angle: -90,
                          position: "insideLeft",
                          offset: 12,
                          style: { textAnchor: "middle", fontSize: 13 },
                        }}
                        allowDecimals={false}
                        tick={{ fontSize: 13, fill: "#cbd5e1" }}
                      />
                      <Tooltip />
                      <Legend verticalAlign="top" align="center" height={64} wrapperStyle={{ top: 12 }} />
                      <Line
                        type="monotone"
                        dataKey={playerA.display_name}
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={true}
                        name={`${playerA.display_name} ${STAT_DISPLAY_NAMES[selectedStat] || selectedStat}`}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey={playerB.display_name}
                        stroke="#82ca9d"
                        strokeWidth={2}
                        dot={true}
                        name={`${playerB.display_name} ${STAT_DISPLAY_NAMES[selectedStat] || selectedStat}`}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* AI Explanation */}
            {winner && (
              <div className="px-6 py-5 border-t border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Analysis</h3>
                {aiLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-4"></div>
                    <p className="text-slate-300">Generating AI analysis. This can take sometime, your patience is appreciated.</p>
                  </div>
                ) : aiExplanation ? (
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">
                    {aiExplanation.text}
                  </p>
                ) : null}
              </div>
            )}

            {/* Stats table */}
            <div className="overflow-x-auto">
              <div className="px-6 py-5 border-t border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Season Statistics</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left">Metric</th>
                    <th className="px-4 py-3 text-left">{playerA.display_name}</th>
                    <th className="px-4 py-3 text-left">{playerB.display_name}</th>
                  </tr>
                </thead>
                <tbody>
                  {statKeys.map((k) => {
                    const a = fmt(aTotals?.[k]);
                    const b = fmt(bTotals?.[k]);
                    const cmp = compareValues(k, a, b);
                    const isHighlighted = HIGHLIGHTED_STATS.has(k);

                    return (
                      <tr
                        key={k}
                        className={cx("border-t border-white/10", isHighlighted && "bg-white/5")}
                      >
                        <td
                          className={cx(
                            "px-4 py-2",
                            isHighlighted ? "text-white font-medium" : "text-slate-300"
                          )}
                        >
                          <StatTooltip statKey={k}>
                            <span className="cursor-help border-b border-dotted border-slate-600">
                              {STAT_DISPLAY_NAMES[k] || k}
                            </span>
                          </StatTooltip>
                        </td>
                        <td
                          className={cx(
                            "px-4 py-2",
                            cmp > 0 && "font-semibold text-emerald-300",
                            isHighlighted && "text-lg"
                          )}
                        >
                          {isHighlighted ? `${a}%` : a}
                          {!isHighlighted && (
                            <span className="ml-2 text-xs text-slate-400">
                              {BETTER_DIRECTION[k] === "lower" ? "↓ better" : "↑ better"}
                            </span>
                          )}
                        </td>
                        <td
                          className={cx(
                            "px-4 py-2",
                            cmp < 0 && "font-semibold text-emerald-300",
                            isHighlighted && "text-lg"
                          )}
                        >
                          {isHighlighted ? `${b}%` : b}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* CTG Breakdown Section */}
      <div className="max-w-7xl mx-auto mt-12">
        <section className="backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/10">
            <h2 className=" text-center text-3xl font-bold bg-gradient-to-r  from-purple-500 via-cyan-400
                                    animate-gradient-x bg-clip-text text-transparent mb-2">
              The Crunch Time Grade (CTG)
            </h2>
            <p className="text-slate text-sm pt-4 text-center ">
              CTG is a comprehensive metric combining key statistics with position-specific weightings. These grades help us better asses player performance and impact during games.  Crunch-time grades are only available for skill positions (QB, RB, WR/TE, DB), because the other positions lack sufficient individual statistics to generate meaningful grades. Note that these grades are not fully comprehensive evaluations of player ability, and there is room for further refinement and additional context.
            </p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(ctgBreakdown).map(([pos, metrics]) => (
                <button
                  key={pos}
                  onClick={() => setExpandedPosition(expandedPosition === pos ? null : pos)}
                  className="text-left transition-all duration-300 group"
                >
                  <div className="backdrop-blur-sm bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl p-5 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-13 h-10 rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center border border-blue-400/50">
                          <span className="font-bold text-blue-300 text-sm">{pos}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                            {pos}
                          </h3>
                          <p className="text-xs text-slate-400">{metrics.length} metrics</p>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center transition-transform duration-300 ${
                          expandedPosition === pos ? "rotate-180" : ""
                        }`}
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    </div>

                    {expandedPosition === pos && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3 animate-in fade-in duration-300">
                        {metrics.map((metric, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-white font-bold">{metric.metric}</span>
                                <span className="text-blue-300 font-semibold text-xs px-2 py-1 bg-blue-500/20 rounded-full">
                                  {metric.weight}
                                </span>
                              </div>
                              <p className="text-xs text-slate-200">{metric.note}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="backdrop-blur-sm bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-400/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-300 text-sm mb-1">How It Works</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Each metric is normalized to realistic performance benchmarks for its position. Positive contributions (yards, TDs, etc.) 
                      increase the grade while negative plays (turnovers, penalties) decrease it. The final grade ranges from 0-99%, providing a 
                      comprehensive view of clutch-time performance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
