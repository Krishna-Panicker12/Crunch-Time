import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import { PlayerPicker } from "../components/PlayerPicker";
import { PlayerCard } from "../components/PlayerCard";

// 🔁 Adjust these imports to match your project
import { listPlayers, getPlayerWeeks } from "../db/playerReads";
import { STAT_DISPLAY_NAMES } from "../utils/statsMapping";

const CURRENT_YEAR = 2025;

export default function Compare() {
  const [players, setPlayers] = useState([]);
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [playerAId, setPlayerAId] = useState("");
  const [playerBId, setPlayerBId] = useState("");

  const [weeksA, setWeeksA] = useState([]);
  const [weeksB, setWeeksB] = useState([]);

  const [selectedStat, setSelectedStat] = useState("pass_attempts");

  // ✅ mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // Load player list
  useEffect(() => {
    (async () => {
      const data = await listPlayers();
      setPlayers(data || []);
      // optional: set defaults
      if (data?.length && !playerAId) setPlayerAId(data[0].id);
      if (data?.length > 1 && !playerBId) setPlayerBId(data[1].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playerA = useMemo(
    () => players.find((p) => p.id === playerAId),
    [players, playerAId]
  );
  const playerB = useMemo(
    () => players.find((p) => p.id === playerBId),
    [players, playerBId]
  );

  // Load weekly data when players change
  useEffect(() => {
    (async () => {
      if (!playerAId) return;
      const w = await getPlayerWeeks(playerAId, CURRENT_YEAR);
      setWeeksA(w || []);
    })();
  }, [playerAId]);

  useEffect(() => {
    (async () => {
      if (!playerBId) return;
      const w = await getPlayerWeeks(playerBId, CURRENT_YEAR);
      setWeeksB(w || []);
    })();
  }, [playerBId]);

  // ✅ Build X ticks from weeks found (1..18)
  const xTicks = useMemo(() => {
    const allWeeks = new Set();
    (weeksA || []).forEach((r) => allWeeks.add(Number(r.week)));
    (weeksB || []).forEach((r) => allWeeks.add(Number(r.week)));
    const arr = Array.from(allWeeks)
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
    return arr.length ? arr : Array.from({ length: 18 }, (_, i) => i + 1);
  }, [weeksA, weeksB]);

  // ✅ Mobile: fewer ticks (every 2 weeks, include start/end)
  const xTicksMobile = useMemo(() => {
    if (!xTicks || xTicks.length === 0) return [];
    const out = xTicks.filter((w) => w % 2 === 1);
    if (!out.includes(xTicks[0])) out.unshift(xTicks[0]);
    if (!out.includes(xTicks[xTicks.length - 1])) out.push(xTicks[xTicks.length - 1]);
    return out;
  }, [xTicks]);

  // ✅ Merge weekly arrays into one chart dataset:
  // Recharts wants: [{week:1, "Player A": 33, "Player B": 28}, ...]
  const mergedWeeks = useMemo(() => {
    const mapA = new Map((weeksA || []).map((r) => [Number(r.week), r]));
    const mapB = new Map((weeksB || []).map((r) => [Number(r.week), r]));

    return xTicks.map((wk) => {
      const ra = mapA.get(wk);
      const rb = mapB.get(wk);

      const aName = playerA?.display_name || "Player A";
      const bName = playerB?.display_name || "Player B";

      return {
        week: wk,
        [aName]: ra ? Number(ra[selectedStat] ?? 0) : null,
        [bName]: rb ? Number(rb[selectedStat] ?? 0) : null,
      };
    });
  }, [weeksA, weeksB, xTicks, selectedStat, playerA, playerB]);

  // Filter options based on search (optional)
  const optionsA = useMemo(() => {
    const s = searchA.trim().toLowerCase();
    if (!s) return players;
    return players.filter((p) => p.display_name?.toLowerCase().includes(s));
  }, [players, searchA]);

  const optionsB = useMemo(() => {
    const s = searchB.trim().toLowerCase();
    if (!s) return players;
    return players.filter((p) => p.display_name?.toLowerCase().includes(s));
  }, [players, searchB]);

  const aName = playerA?.display_name || "Player A";
  const bName = playerB?.display_name || "Player B";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlayerPicker
          title="Player A"
          search={searchA}
          onSearch={setSearchA}
          options={optionsA}
          valueId={playerAId}
          onChangeId={setPlayerAId}
        />
        <PlayerPicker
          title="Player B"
          search={searchB}
          onSearch={setSearchB}
          options={optionsB}
          valueId={playerBId}
          onChangeId={setPlayerBId}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlayerCard player={playerA} />
        <PlayerCard player={playerB} />
      </div>

      <div className="mt-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {STAT_DISPLAY_NAMES?.[selectedStat] || selectedStat}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Weekly comparison throughout the season
            </p>
          </div>

          <select
            value={selectedStat}
            onChange={(e) => setSelectedStat(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm"
          >
            {/* 🔁 Add/remove stats to match your data keys */}
            <option value="pass_attempts">Pass Attempts</option>
            <option value="pass_yards">Pass Yards</option>
            <option value="pass_tds">Pass TDs</option>
            <option value="interceptions">INT</option>
            <option value="cpoe">CPOE</option>
            <option value="epa">EPA</option>
          </select>
        </div>

        {/* ✅ Chart block with mobile scaling fixes */}
        <div className="mt-4 rounded-xl overflow-hidden">
          <div className={isMobile ? "h-[320px]" : "h-[500px]"}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={mergedWeeks}
                margin={
                  isMobile
                    ? { top: 70, right: 12, left: 10, bottom: 55 }
                    : { top: 110, right: 32, left: 48, bottom: 96 }
                }
              >
                <XAxis
                  dataKey="week"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  ticks={isMobile ? xTicksMobile : xTicks}
                  interval={isMobile ? "preserveStartEnd" : 0}
                  allowDecimals={false}
                  tick={{
                    fontSize: isMobile ? 10 : 13,
                    fill: "#cbd5e1",
                  }}
                  tickMargin={isMobile ? 6 : 10}
                  angle={isMobile ? -30 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  label={
                    isMobile
                      ? undefined
                      : { value: "Week", position: "bottom", offset: 36 }
                  }
                />

                <YAxis
                  width={isMobile ? 34 : 60}
                  allowDecimals={false}
                  tick={{ fontSize: isMobile ? 10 : 13, fill: "#cbd5e1" }}
                  label={
                    isMobile
                      ? undefined
                      : {
                          value:
                            STAT_DISPLAY_NAMES?.[selectedStat] || selectedStat,
                          angle: -90,
                          position: "insideLeft",
                          offset: 12,
                          style: { textAnchor: "middle", fontSize: 13 },
                        }
                  }
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    fontSize: isMobile ? 12 : 14,
                  }}
                  itemStyle={{ padding: 0 }}
                  labelStyle={{ color: "rgba(226,232,240,0.9)" }}
                />

                <Legend
                  verticalAlign="top"
                  align="center"
                  height={isMobile ? 44 : 64}
                  iconSize={isMobile ? 10 : 14}
                  wrapperStyle={{
                    top: isMobile ? 6 : 12,
                    fontSize: isMobile ? 12 : 14,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey={aName}
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={isMobile ? { r: 2 } : true}
                  activeDot={isMobile ? { r: 4 } : { r: 6 }}
                  isAnimationActive={false}
                  connectNulls={false}
                />

                <Line
                  type="monotone"
                  dataKey={bName}
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={isMobile ? { r: 2 } : true}
                  activeDot={isMobile ? { r: 4 } : { r: 6 }}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Your Analysis block continues below (keep your existing logic) */}
      {/* <Analysis ... /> */}
    </div>
  );
}
