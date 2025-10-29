import React, { useMemo, useState } from "react";
import { PlayerCard } from "../components/PlayerCard";
import { PlayerPicker } from "../components/PlayerPicker";
import { loadPlayers, loadWeekly } from "../api/loadCSV";

/**
 * Minimal mock data — replace later with your API results.
 * Each player should include: id, name, team, position, headshot(optional), and stats object.
 */



loadPlayers()

const MOCK_PLAYERS = [
  {
    id: "qb-allen",
    name: "Josh Allen",
    team: "BUF",
    position: "QB",
    headshot: "https://static.www.nfl.com/image/upload/f_auto,q_auto/league/servs1fpsynfxep4rz2z",
    jerseyNum: 17,
    height: "6'5",
    weight: 237,
    college: "Wyoming",
    birthDate: "21/05/1996",
    stats: {
      "Pass Yds": 4306,
      "Pass TD": 35,
      "INT": 16,
      "Rush Yds": 524,
      "Rush TD": 9,
      "Comp%": 66.5,
      "Sacks Taken": 24,
      "EPA/Play": 0.19,     // placeholder numeric
      "Success%": 48.2       // placeholder numeric
    },
  },
  {
    id: "qb-mahomes",
    name: "Patrick Mahomes",
    team: "KC",
    position: "QB",
    jerseyNum: 15,
    height: "6'3",
    weight: 230,
    college: "Texas Tech",
    birthDate: "17/09/1995",
    headshot: "https://a.espncdn.com/i/headshots/nfl/players/full/3139477.png",
    stats: {
      "Pass Yds": 4525,
      "Pass TD": 33,
      "INT": 12,
      "Rush Yds": 389,
      "Rush TD": 2,
      "Comp%": 67.2,
      "Sacks Taken": 27,
      "EPA/Play": 0.21,
      "Success%": 49.8
    },
  },
  {
    id: "wr-jefferson",
    name: "Justin Jefferson",
    team: "MIN",
    position: "WR",
    jerseyNum: 18,
    height: "6'1",
    weight: 202,
    college: "LSU",
    birthDate: "06/06/1999",
    headshot: "https://a.espncdn.com/i/headshots/nfl/players/full/4262921.png",
    stats: {
      "Rec": 103,
      "Targets": 158,
      "Rec Yds": 1552,
      "Rec TD": 9,
      "YPRR": 2.7,          // yards per route run
      "Drop%": 3.5,
      "EPA/Target": 0.35,
      "Success%": 54.1
    },
  },
  {
    id: "wr-chase",
    name: "Ja'Marr Chase",
    team: "CIN",
    position: "WR",
    jerseyNum: 1,
    height: "6'0",
    weight: 201,
    college: "LSU",
    birthDate: "08/03/2000",
    headshot: "https://static.www.nfl.com/image/upload/f_auto,q_auto/league/qya3dtjb5kgofcuj2tuw",
    stats: {
      "Rec": 98,
      "Targets": 156,
      "Rec Yds": 1455,
      "Rec TD": 11,
      "YPRR": 2.5,
      "Drop%": 5.1,
      "EPA/Target": 0.31,
      "Success%": 52.0
    },
  },
];

/** For each metric, define whether higher is better. If a key is missing, default = "higher is better". */
const BETTER_DIRECTION = {
  "INT": "lower",
  "Sacks Taken": "lower",
  "Drop%": "lower",
};

/** Lightweight utility */
const classNames = (...xs) => xs.filter(Boolean).join(" ");

// Helper to format values
function formatVal(val) {
  if (typeof val === "number") {
    if (Number.isInteger(val)) return val;
    return val.toFixed(2);
  }
  return val;
}

export default function Compare() {
  // UI state
  const [position, setPosition] = useState("");
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [playerAId, setPlayerAId] = useState("");
  const [playerBId, setPlayerBId] = useState("");

  // Positions available from data
  const positions = useMemo(
    () => Array.from(new Set(MOCK_PLAYERS.map(p => p.position))).sort(),
    []
  );

  // Filter players by selected position
  const pool = useMemo(
    () => MOCK_PLAYERS.filter(p => (position ? p.position === position : true)),
    [position]
  );

  const filteredA = useMemo(
    () => pool.filter(p => p.name.toLowerCase().includes(searchA.toLowerCase())),
    [pool, searchA]
  );
  const filteredB = useMemo(
    () => pool.filter(p => p.name.toLowerCase().includes(searchB.toLowerCase())),
    [pool, searchB]
  );

  const playerA = useMemo(() => pool.find(p => p.id === playerAId) || null, [pool, playerAId]);
  const playerB = useMemo(() => pool.find(p => p.id === playerBId) || null, [pool, playerBId]);

  // Collect comparable stat keys (intersection) to keep the table tidy
  const statKeys = useMemo(() => {
    if (!playerA || !playerB) return [];
    const aKeys = Object.keys(playerA.stats);
    const bKeys = Object.keys(playerB.stats);
    return aKeys.filter(k => bKeys.includes(k));
  }, [playerA, playerB]);

  // Simple comparison helpers
  const compareValues = (k, aVal, bVal) => {
    const dir = BETTER_DIRECTION[k] || "higher";
    if (aVal == null || bVal == null) return 0;
    if (dir === "higher") return aVal === bVal ? 0 : aVal > bVal ? 1 : -1;
    return aVal === bVal ? 0 : aVal < bVal ? 1 : -1;
  };

  const winner = useMemo(() => {
    if (!playerA || !playerB) return null;
    let scoreA = 0, scoreB = 0;
    statKeys.forEach(k => {
      const cmp = compareValues(k, playerA.stats[k], playerB.stats[k]);
      if (cmp > 0) scoreA++;
      else if (cmp < 0) scoreB++;
    });
    if (scoreA === scoreB) return "Tie";
    return scoreA > scoreB ? playerA.name : playerB.name;
  }, [playerA, playerB, statKeys]);

  // Tiny rule-based blurb (non-AI): focuses on the top 2 deltas
  const summaryBlurb = useMemo(() => {
    if (!playerA || !playerB) return "";
    if (winner === "Tie") return "On balance, it’s a toss-up based on the selected metrics.";
    const diffs = statKeys.map(k => {
      const a = playerA.stats[k];
      const b = playerB.stats[k];
      const dir = BETTER_DIRECTION[k] || "higher";
      // normalized edge: positive means playerA edge, negative means playerB edge
      let edge = 0;
      if (a != null && b != null) {
        const denom = Math.abs(a) + Math.abs(b) || 1;
        if (dir === "higher") edge = (a - b) / denom;
        else edge = (b - a) / denom;
      }
      return { k, edge, a, b };
    }).sort((x, y) => Math.abs(y.edge) - Math.abs(x.edge));

    const top = diffs.slice(0, 2).filter(d => Math.abs(d.edge) > 0);
    const who = winner === playerA?.name ? playerA : playerB;
    const lines = top.map(d => {
      const leader = compareValues(d.k, playerA.stats[d.k], playerB.stats[d.k]) > 0 ? playerA : playerB;
      return `${leader.name} leads in ${d.k} (${playerA.stats[d.k]} vs ${playerB.stats[d.k]}).`;
    });

    return `${who.name} gets the edge overall. ${lines.join(" ")}`.trim();
  }, [playerA, playerB, statKeys, winner]);

  const resetPlayers = () => {
    setPlayerAId("");
    setPlayerBId("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Compare Players</h1>
          <button
            onClick={resetPlayers}
            className="px-3 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 transition"
          >
            Clear
          </button>
        </header>

        {/* Position selector (locks both sides) */}
        <section className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4">
          <label className="block text-sm mb-2">Position</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={position}
              onChange={(e) => { setPosition(e.target.value); setPlayerAId(""); setPlayerBId(""); }}
              className="w-full sm:w-64 px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10"
            >
              <option value="">All</option>
              {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
            {position && (
              <div className="text-xs text-slate-300 self-center">
                Only {position}s will be shown for both selectors.
              </div>
            )}
          </div>
        </section>

        {/* Pickers */}
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
        {(playerA && playerB && playerA.position !== playerB.position) && (
          <p className="text-rose-300 text-sm">
            Please pick players from the same position to compare.
          </p>
        )}

        {/* Result / Table */}
        {(playerA && playerB && playerA.position === playerB.position) && (
          <section className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-medium">Head-to-Head</h2>
              <span className="text-sm text-slate-300">
                Position: {playerA.position}
              </span>
            </div>

            {/* Player header cards */}
            <div className="grid md:grid-cols-2 gap-4 p-4">
              <PlayerCard player={playerA} />
              <PlayerCard player={playerB} />
            </div>

            {/* Stats table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-4 py-3">Metric</th>
                    <th className="text-left px-4 py-3">{playerA.name}</th>
                    <th className="text-left px-4 py-3">{playerB.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {statKeys.map((k) => {
                    const aVal = playerA.stats[k];
                    const bVal = playerB.stats[k];
                    const cmp = compareValues(k, aVal, bVal);
                    return (
                      <tr key={k} className="border-t border-white/10">
                        <td className="px-4 py-2 text-slate-300">{k}</td>
                        <td className={classNames(
                          "px-4 py-2",
                          cmp > 0 ? "font-semibold text-emerald-300" : "",
                          cmp === 0 ? "text-slate-200" : ""
                        )}>
                          {formatVal(aVal)}
                          <span className="ml-2 text-xs text-slate-400">
                            {BETTER_DIRECTION[k] === "lower" ? "↓ better" : "↑ better"}
                          </span>
                        </td>
                        <td className={classNames(
                          "px-4 py-2",
                          cmp < 0 ? "font-semibold text-emerald-300" : "",
                          cmp === 0 ? "text-slate-200" : ""
                        )}>
                          {formatVal(bVal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Winner + blurb */}
            <div className="p-4 border-t border-white/10">
              <div className="text-base">
                <span className="text-slate-300">Result: </span>
                <span className="font-semibold">
                  {winner || "—"}
                </span>
              </div>
              {summaryBlurb && (
                <p className="mt-2 text-slate-300 text-sm">{summaryBlurb}</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}





