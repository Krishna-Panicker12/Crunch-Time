import React, { useMemo, useState } from "react";
import { PlayerCard } from "../components/PlayerCard";
import { PlayerPicker } from "../components/PlayerPicker";
import { getSeasonTotals, getWeeklyArray, makeKey } from "../utils/helpers";
import { playersById, weeklyIndexByPlayerSeason } from "../api/loadCSV";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { STAT_DISPLAY_NAMES, BETTER_DIRECTION } from '../utils/statsMapping';

const CURRENT_YEAR = 2025;

// Utility: conditional classNames
const cx = (...xs) => xs.filter(Boolean).join(" ");

// Utility: consistent value format
const fmt = (v) => {
  if (v === null || v === undefined || isNaN(v)) return 0;
  return typeof v === "number" ? 
    (Number.isInteger(v) ? v : Number(v.toFixed(2))) 
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
    if (isNaN(numA) || isNaN(numB)) return 0;
    if (dir === "higher") return numA > numB ? 1 : numA < numB ? -1 : 0;
    return numA < numB ? 1 : numA > numB ? -1 : 0;
  };

  // Update winner calculation to use season totals
  const winner = useMemo(() => {
    if (!playerA || !playerB) return null;
    const aStats = getSeasonTotals(playerA.id, CURRENT_YEAR) || {};
    const bStats = getSeasonTotals(playerB.id, CURRENT_YEAR) || {};
    let scoreA = 0, scoreB = 0;
    statKeys.forEach((k) => {
      const cmp = compareValues(k, aStats[k], bStats[k]);
      if (cmp > 0) scoreA++;
      else if (cmp < 0) scoreB++;
    });
    if (scoreA === scoreB) return "Tie";
    return scoreA > scoreB ? playerA.display_name : playerB.display_name;
  }, [playerA, playerB, statKeys]);

  /** ---------- CHART DATA ---------- */
  const aTotals = playerA ? getSeasonTotals(playerA.id, CURRENT_YEAR) : {};
  const bTotals = playerB ? getSeasonTotals(playerB.id, CURRENT_YEAR) : {};


  // Merge weeks for joint chart
  const mergedWeeks = useMemo(() => {
    if (!selectedStat || !playerA || !playerB) return [];
    
    const keyA = makeKey(playerA.id, CURRENT_YEAR);
    const keyB = makeKey(playerB.id, CURRENT_YEAR);
    
    const weeksA = weeklyIndexByPlayerSeason.get(keyA) || new Map();
    const weeksB = weeklyIndexByPlayerSeason.get(keyB) || new Map();
    
    const allWeeks = new Set([
      ...Array.from(weeksA.keys()),
      ...Array.from(weeksB.keys())
    ]);
    
    return Array.from(allWeeks)
      .sort((a, b) => a - b)
      .map(week => {
        const aStats = weeksA.get(week) || {};
        const bStats = weeksB.get(week) || {};
        
        return {
          week,
          [playerA.display_name]: fmt(aStats[selectedStat]),
          [playerB.display_name]: fmt(bStats[selectedStat])
        };
      });
  }, [weeklyIndexByPlayerSeason, playerA, playerB, selectedStat]);

  // Get available stats for chart selection
  const availableStats = useMemo(() => {
    if (!playerA || !playerB) return [];
    return statKeys.map(key => ({
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
            className="px-3 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 transition"
          >
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
            className="w-full sm:w-64 px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10"
          >
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

            {/* Stats selector for chart - Added padding and margin */}
            <div className="px-4 pb-4 pt-2">
              <select
                value={selectedStat}
                onChange={(e) => setSelectedStat(e.target.value)}
                className="w-full md:w-auto px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10"
              >
                <option value="">Select stat to chart</option>
                {availableStats.map(({value, label}) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Chart container with fixed dimensions */}
            {selectedStat && (
              <div className="px-4 pb-8">
                <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <LineChart data={mergedWeeks}>
                      <XAxis 
                        dataKey="week"
                        type="number"
                        domain={[1, 'dataMax']}
                        tickCount={17}  // For weeks 1-17
                        interval={0}    // Force show all ticks
                        allowDecimals={false}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey={playerA.display_name}
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={true}
                        name={`${playerA.display_name} ${STAT_DISPLAY_NAMES[selectedStat] || selectedStat}`}
                      />
                      <Line
                        type="monotone"
                        dataKey={playerB.display_name}
                        stroke="#82ca9d"
                        strokeWidth={2}
                        dot={true}
                        name={`${playerB.display_name} ${STAT_DISPLAY_NAMES[selectedStat] || selectedStat}`}
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
                    return (
                      <tr key={k} className="border-t border-white/10">
                        <td className="px-4 py-2 text-slate-300">
                          {STAT_DISPLAY_NAMES[k] || k}
                        </td>
                        <td className={cx("px-4 py-2", cmp > 0 && "font-semibold text-emerald-300")}>
                          {a}
                          <span className="ml-2 text-xs text-slate-400">
                            {BETTER_DIRECTION[k] === "lower" ? "↓ better" : "↑ better"}
                          </span>
                        </td>
                        <td className={cx("px-4 py-2", cmp < 0 && "font-semibold text-emerald-300")}>
                          {b}
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
