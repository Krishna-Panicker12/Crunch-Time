import React, { useMemo, useState } from "react";
import { PlayerCard } from "../components/PlayerCard";
import { PlayerPicker } from "../components/PlayerPicker";
import { getSeasonTotals, getWeeklyArray, makeKey } from "../utils/helpers";
import { playersById, weeklyIndexByPlayerSeason } from "../api/loadCSV";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { STAT_DISPLAY_NAMES, BETTER_DIRECTION } from '../utils/statsMapping';
import { StatTooltip } from "../components/StatTooltip";

const CURRENT_YEAR = 2025;
const HIGHLIGHTED_STATS = new Set(['crunch_time_grade']);

// Utility: conditional classNames
const cx = (...xs) => xs.filter(Boolean).join(" ");

// Utility: consistent value format
const fmt = (v) => {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return 0;
  return typeof v === "number" ?
    (Number.isInteger(v) ? v : Number(v.toFixed(2)))
    : (Number.isNaN(Number(v)) ? 0 : v);
};

export default function Compare() {
  /** ---------- STATE ---------- */
  const [position, setPosition] = useState("");
  const [playerAId, setPlayerAId] = useState("");
  const [playerBId, setPlayerBId] = useState("");
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [selectedStat, setSelectedStat] = useState("");

  /** ---------- DATA ---------- */
  const MOCK_PLAYERS = [...playersById.values()];

  const positions = useMemo(
    () => Array.from(new Set(MOCK_PLAYERS.map((p) => p.position))).sort(),
    [MOCK_PLAYERS]
  );

  const pool = useMemo(
    () => MOCK_PLAYERS.filter((p) => (position ? p.position === position : true)),
    [MOCK_PLAYERS, position]
  );

  const filteredA = useMemo(
    () => pool.filter(p =>
      (p.display_name || "").toLowerCase().includes(searchA.toLowerCase())
    ),
    [pool, searchA]
  );

  const filteredB = useMemo(
    () => pool.filter(p =>
      (p.display_name || "").toLowerCase().includes(searchB.toLowerCase())
    ),
    [pool, searchB]
  );

  const playerA = pool.find((p) => p.id === playerAId) || null;
  const playerB = pool.find((p) => p.id === playerBId) || null;

  /** ---------- COMPARISON LOGIC ---------- */
  // Update stats access to handle missing data
  const statKeys = useMemo(() => {
    if (!playerA || !playerB) return [];
    const aStats = getSeasonTotals(playerA.id, CURRENT_YEAR) || {};
    const bStats = getSeasonTotals(playerB.id, CURRENT_YEAR) || {};
    const aKeys = Object.keys(aStats);
    const bKeys = Object.keys(bStats);
    return aKeys.filter((k) => bKeys.includes(k));
  }, [playerA, playerB]);

  const compareValues = (k, a, b) => {
    const dir = BETTER_DIRECTION[k] || "higher";
    if (a == null || b == null) return 0;
    // Convert to numbers for comparison
    const numA = Number(a);
    const numB = Number(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) return 0;
    if (dir === "higher") return numA > numB ? 1 : numA < numB ? -1 : 0;
    return numA < numB ? 1 : numA > numB ? -1 : 0;
  };

  // Update winner calculation to prioritize crunch time grade
  const winner = useMemo(() => {
    if (!playerA || !playerB) return null;
    const aStats = getSeasonTotals(playerA.id, CURRENT_YEAR) || {};
    const bStats = getSeasonTotals(playerB.id, CURRENT_YEAR) || {};

    // Compare crunch time grades first
    const aGrade = Number(aStats.crunch_time_grade || 0);
    const bGrade = Number(bStats.crunch_time_grade || 0);
    
    if (Math.abs(aGrade - bGrade) >= 5) {  // If difference is significant (5+ points)
      return aGrade > bGrade ? 
        `${playerA.display_name} (${aGrade}% CTG)` : 
        `${playerB.display_name} (${bGrade}% CTG)`;
    }

    // If grades are close, use other stats as tiebreaker
    let scoreA = 0, scoreB = 0;
    statKeys.forEach((k) => {
      if (k === 'crunch_time_grade') return; // Skip as we already compared it
      const cmp = compareValues(k, aStats[k], bStats[k]);
      if (cmp > 0) scoreA++;
      else if (cmp < 0) scoreB++;
    });

    // If still tied after comparing all stats
    if (scoreA === scoreB) {
      return `Tie (${aGrade}% vs ${bGrade}% CTG)`;
    }

    // Return winner with their crunch time grade
    return scoreA > scoreB ? 
      `${playerA.display_name} (${aGrade}% CTG)` : 
      `${playerB.display_name} (${bGrade}% CTG)`;
  }, [playerA, playerB, statKeys]);

  /** ---------- CHART DATA ---------- */
  const aTotals = playerA ? getSeasonTotals(playerA.id, CURRENT_YEAR) : {};
  const bTotals = playerB ? getSeasonTotals(playerB.id, CURRENT_YEAR) : {};

  // Use helper to get weekly arrays (ensures stats are spread at top level)
  const weeklyA = playerA ? getWeeklyArray(playerA.id, CURRENT_YEAR) : [];
  const weeklyB = playerB ? getWeeklyArray(playerB.id, CURRENT_YEAR) : [];

  // Merge weeks for joint chart — use getWeeklyArray outputs and build contiguous integer ticks
  const mergedWeeks = useMemo(() => {
    if (!selectedStat || !playerA || !playerB) return [];

    const map = new Map();

    // add A values
    for (const w of weeklyA) {
      const wk = Number(w.week);
      const val = Number(w[selectedStat]);
      map.set(wk, { week: wk, [playerA.display_name]: Number.isFinite(val) ? val : 0 });
    }

    // add B values (merge)
    for (const w of weeklyB) {
      const wk = Number(w.week);
      const val = Number(w[selectedStat]);
      const entry = map.get(wk) || { week: wk, [playerA.display_name]: 0 };
      entry[playerB.display_name] = Number.isFinite(Number(val)) ? Number(val) : 0;
      map.set(wk, entry);
    }

    // ensure contiguous weeks from min to max (fill missing with 0)
    const weeks = Array.from(map.keys()).map(Number).sort((a, b) => a - b);
    if (weeks.length === 0) return [];

    const minW = weeks[0];
    const maxW = weeks[weeks.length - 1];
    const out = [];
    for (let wk = minW; wk <= maxW; wk++) {
      const e = map.get(wk) || { week: wk };
      // ensure both keys exist and are numbers
      e[playerA.display_name] = Number.isFinite(Number(e[playerA.display_name])) ? Number(e[playerA.display_name]) : 0;
      e[playerB.display_name] = Number.isFinite(Number(e[playerB.display_name])) ? Number(e[playerB.display_name]) : 0;
      out.push(e);
    }
    return out;
  }, [weeklyA, weeklyB, playerA, playerB, selectedStat]);

  // compute integer ticks for XAxis
  const xTicks = useMemo(() => {
    if (!mergedWeeks || mergedWeeks.length === 0) return [];
    const min = mergedWeeks[0].week;
    const max = mergedWeeks[mergedWeeks.length - 1].week;
    const ticks = [];
    for (let i = min; i <= max; i++) ticks.push(i);
    return ticks;
  }, [mergedWeeks]);

  const HIDDEN_STATS_FOR_DROPDOWN = new Set(["qbr_total", "qbr_epa_total"]);

  // Get available stats for chart selection
  const availableStats = useMemo(() => {
    if (!playerA || !playerB) return [];
    return statKeys
      .filter((key) => !HIDDEN_STATS_FOR_DROPDOWN.has(key))
      .map(key => ({
        value: key,
        label: STAT_DISPLAY_NAMES[key] || key
      }));
  }, [statKeys]);

  const resetPlayers = () => {
    setPlayerAId("");
    setPlayerBId("");
  };

  /** ---------- RENDER ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Compare Players</h1>
          <button
            onClick={resetPlayers}
            className="px-3 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 transition">
            Clear
          </button>
        </header>

        {/* Position Selector */}
        <section className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4">
          <label className="block text-sm mb-2">Position</label>
          <select
            value={position}
            onChange={(e) => {
              setPosition(e.target.value);
              setPlayerAId("");
              setPlayerBId("");
            }}
            className="w-full sm:w-64 px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10">
            <option value="">All</option>
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </section>

        {/* Player Pickers */}
        <section className="grid md:grid-cols-2 gap-4">
          <PlayerPicker
            title="Player A"
            search={searchA}
            onSearch={setSearchA}
            options={filteredA}
            valueId={playerAId}
            onChangeId={setPlayerAId}
          />
          <PlayerPicker
            title="Player B"
            search={searchB}
            onSearch={setSearchB}
            options={filteredB}
            valueId={playerBId}
            onChangeId={setPlayerBId}
          />
        </section>

        {/* Validation */}
        {playerA && playerB && playerA.position !== playerB.position && (
          <p className="text-rose-300 text-sm">
            Please pick players from the same position.
          </p>
        )}

        {/* Result */}
        {playerA && playerB && playerA.position === playerB.position && (
          <section className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {/* Player headers */}
            <div className="grid md:grid-cols-2 gap-4 p-4 border-b border-white/10">
              <PlayerCard player={playerA} />
              <PlayerCard player={playerB} />
            </div>

            {/* Stats selector for chart - added more horizontal padding */}
            <div className="px-6 pb-4 pt-2">
              <select
                value={selectedStat}
                onChange={(e) => setSelectedStat(e.target.value)}
                className="w-full md:w-auto px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10">
                <option value="">Select stat to chart</option>
                {availableStats.map(({value, label}) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Chart container with larger fixed dimensions and more room for labels/legend */}
            {selectedStat && (
              <div className="px-4 pb-8">
                <div style={{ width: "100%", height: 680, minHeight: 480 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={mergedWeeks}
                      /* more top margin for legend, bottom for X label, left for Y label */
                      margin={{ top: 110, right: 32, left: 48, bottom: 96 }}
                    >
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
                          style: { textAnchor: "middle", fontSize: 13 }
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

            {/* Stats table */}
            <div className="overflow-x-auto">
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
                    const a = fmt(aTotals[k]);
                    const b = fmt(bTotals[k]);
                    const cmp = compareValues(k, a, b);
                    const isHighlighted = HIGHLIGHTED_STATS.has(k);
                    
                    return (
                      <tr key={k} className={cx(
                        "border-t border-white/10",
                        isHighlighted && "bg-white/5"
                      )}>
                        <td className={cx(
                          "px-4 py-2",
                          isHighlighted ? "text-white font-medium" : "text-slate-300"
                        )}>
                          <StatTooltip statKey={k}>
                            <span className="cursor-help border-b border-dotted border-slate-600">
                              {STAT_DISPLAY_NAMES[k] || k}
                            </span>
                          </StatTooltip>
                        </td>
                        <td className={cx(
                          "px-4 py-2",
                          cmp > 0 && "font-semibold text-emerald-300",
                          isHighlighted && "text-lg"
                        )}>
                          {isHighlighted ? `${a}%` : a}
                          {!isHighlighted && (
                            <span className="ml-2 text-xs text-slate-400">
                              {BETTER_DIRECTION[k] === "lower" ? "↓ better" : "↑ better"}
                            </span>
                          )}
                        </td>
                        <td className={cx(
                          "px-4 py-2",
                          cmp < 0 && "font-semibold text-emerald-300",
                          isHighlighted && "text-lg"
                        )}>
                          {isHighlighted ? `${b}%` : b}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Winner */}
            <div className="p-4 border-t border-white/10 text-base">
              <span className="text-slate-300">Result: </span>
              <span className="font-semibold">{winner || "—"}</span>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
