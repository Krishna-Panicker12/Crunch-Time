import React, { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { PlayerPicker } from "../components/PlayerPicker";
import { listPlayers, getPlayerSeason, getPlayerWeeks } from "../db/playerReads";
import { analyzePlayer } from "../archetypes/engine";
import { STAT_DISPLAY_NAMES, STAT_ORDER } from "../utils/statsMapping";
import { generateExplanation } from "../archetypes/aiExplainer";

import ARI from "../assets/arizona-cardinals-logo-transparent.png";
import ATL from "../assets/atlanta-falcons-logo-transparent.png";
import BAL from "../assets/baltimore-ravens-logo-transparent.png";
import BUF from "../assets/buffalo-bills-logo-transparent.png";
import CAR from "../assets/carolina-panthers-logo-transparent.png";
import CHI from "../assets/chicago-bears-logo-transparent.png";
import CIN from "../assets/cincinnati-bengals-logo-transparent.png";
import CLE from "../assets/cleveland-browns-logo-transparent.png";
import DAL from "../assets/Dallas-Cowboys.png";
import DEN from "../assets/denver-broncos-logo-transparent.png";
import DET from "../assets/detroit-lions-logo-transparent.png";
import GB from "../assets/green-bay-packers-logo-transparent.png";
import HOU from "../assets/houston-texans-logo-transparent.png";
import IND from "../assets/indianapolis-colts-logo-transparent.png";
import JAX from "../assets/jacksonville-jaguars-logo-transparent.png";
import KC from "../assets/kansas-city-chiefs-logo-transparent.png";
import LAC from "../assets/los-angeles-chargers-logo-transparent.png";
import LAR from "../assets/la-rams-logo-png-transparent.png";
import MIA from "../assets/miami-dolphins-logo-transparent.png";
import MIN from "../assets/minnesota-vikings-logo-transparent.png";
import NE from "../assets/new-england-patriots-logo-transparent.png";
import NO from "../assets/new-orleans-saints-logo-transparent.png";
import NYG from "../assets/new-york-giants-logo-transparent.png";
import NYJ from "../assets/new-york-jets-logo-png-transparent-2024.png";
import OAK from "../assets/oakland-raiders-logo-transparent.png";
import PHI from "../assets/philadelphia-eagles-logo-transparent.png";
import PIT from "../assets/pittsburgh-steelers-logo-transparent.png";
import SF from "../assets/san-francisco-49ers-logo-transparent.png";
import SEA from "../assets/seattle-seahawks-logo-transparent.png";
import TB from "../assets/tampa-bay-buccaneers-logo-transparent.png";
import TEN from "../assets/tennessee-titans-logo-transparent.png";
import WAS from "../assets/Washington-Commanders.png";

export const teamLogoMap = {
  ARI,
  ATL,
  BAL,
  BUF,
  CAR,
  CHI,
  CIN,
  CLE,
  DAL,
  DEN,
  DET,
  GB,
  HOU,
  IND,
  JAX,
  KC,
  LAC,
  LAR,
  MIA,
  MIN,
  NE,
  NO,
  NYG,
  NYJ,
  OAK,
  PHI,
  PIT,
  SF,
  SEA,
  TB,
  TEN,
  WAS,
};

// Archetype color styles
const archetypeStyles = {
  field_general: "from-blue-600 to-blue-400",
  dual_threat: "from-purple-600 to-purple-400",
  gunslinger: "from-red-600 to-red-400",
  game_changer: "from-yellow-600 to-yellow-400",
  workhorse: "from-blue-600 to-blue-400",
  receiving: "from-purple-600 to-purple-400",
  all_purpose_back: "from-pink-600 to-pink-400",
  yac_monster: "from-orange-600 to-orange-400",
  red_zone_threat: "from-red-600 to-red-400",
  x_factor: "from-pink-600 to-pink-400",
  deep_threat: "from-sky-600 to-sky-400",
  chain_mover: "from-green-600 to-green-400",
  lockdown: "from-blue-600 to-blue-400",
  ballhawk: "from-yellow-600 to-yellow-400",
  swiss_army_knife: "from-purple-600 to-purple-400",
};

export default function ArchetypeDefinitions() {
  const [position, setPosition] = useState("QB");
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [search, setSearch] = useState("");
  const [allPlayers, setAllPlayers] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false); // base analysis loading
  const [aiLoading, setAiLoading] = useState(false); // AI explanation loading
  const [error, setError] = useState(null);

  // Prevent late AI responses from old player selections overwriting the UI
  const reqRef = useRef(0);

  const selectedPlayer = allPlayers.find((p) => p.id === selectedPlayerId);
  const filteredPlayers = allPlayers.filter((p) => p.position === position);
  const searchFiltered = filteredPlayers.filter((p) =>
    p.display_name.toLowerCase().includes(search.toLowerCase())
  );

  // Load all players for initial roster
  useEffect(() => {
    async function load() {
      try {
        const players = await listPlayers({ limit: 5000 });

        const playersWithStats = await Promise.all(
          (players || []).map(async (player) => {
            try {
              const seasonStats = await getPlayerSeason(player.id, 2025);
              return { ...player, seasonStats: seasonStats?.stats || {} };
            } catch {
              return { ...player, seasonStats: {} };
            }
          })
        );

        setAllPlayers(playersWithStats);
      } catch (err) {
        console.error("Failed to load players:", err);
        setError("Failed to load players");
      }
    }
    load();
  }, []);

  // Load player stats and run analysis when player selected
  useEffect(() => {
    // bump request id so any in-flight AI completion is ignored
    reqRef.current += 1;
    const myReq = reqRef.current;

    if (!selectedPlayerId) {
      setAnalysis(null);
      setPlayerStats(null);
      setWeeklyStats([]);
      setAiLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setAiLoading(false);
      setError(null);

      try {
        const seasonStats = await getPlayerSeason(selectedPlayerId, 2025);

        if (!seasonStats) {
          setError("No stats available for this player in 2025");
          setPlayerStats(null);
          setWeeklyStats([]);
          setAnalysis(null);
          setLoading(false);
          return;
        }

        const seasonStatObj = seasonStats?.stats || {};
        setPlayerStats(seasonStatObj);

        const weekly = await getPlayerWeeks(selectedPlayerId, 2025);
        setWeeklyStats(weekly || []);

        // 1) FAST base analysis (NO AI) so UI renders immediately
        const baseResult = await analyzePlayer(
          selectedPlayer,
          seasonStatObj,
          weekly || [],
          allPlayers,
          false // <-- IMPORTANT: no AI here
        );

        if (reqRef.current !== myReq) return; // player changed mid-load

        // render everything immediately, but without explanation yet
        setAnalysis({
          ...baseResult,
          explanation: null,
          timestamp: null,
        });

        setLoading(false);

        // 2) AI explanation in the background (does NOT block UI)
        setAiLoading(true);

        (async () => {
          try {
            const playerData = {
              playerName: selectedPlayer?.display_name || "Unknown",
              position: selectedPlayer?.position || position,
              stats: seasonStatObj,
            };

            // generateExplanation expects (playerData, archetypeResult, similarPlayers, useAI)
            const explanation = await generateExplanation(
              playerData,
              {
                primary: baseResult?.archetype,
                confidence: baseResult?.confidence ?? 0.7,
                reasons: baseResult?.reasons || [],
              },
              baseResult?.similarPlayers || [],
              true
            );

            if (reqRef.current !== myReq) return; // player changed; ignore

            setAnalysis((prev) =>
              prev ? { ...prev, explanation, timestamp: Date.now() } : prev
            );
          } catch (e) {
            console.warn("AI explanation failed, leaving empty:", e);
          } finally {
            if (reqRef.current === myReq) setAiLoading(false);
          }
        })();
      } catch (err) {
        console.error("Failed to load player analysis:", err);
        setError("Failed to analyze player");
        setLoading(false);
        setAiLoading(false);
      }
    }

    load();
  }, [selectedPlayerId, selectedPlayer, allPlayers, position]);

  // Get stats to display for this position
  const positionStats = STAT_ORDER[position] || [];

  const formatCamelCase = (str) => {
    if (!str) return "";
    return str
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (char) => char.toUpperCase())
      .trim();
  };

  const formatHeight = (inches) => {
    if (!inches) return "—";
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "—";
    if (typeof num !== "number") return num;
    if (num < 1 && num > 0) return (num * 100).toFixed(1) + "%";
    if (num >= 1000)
      return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (num % 1 !== 0) return num.toFixed(2);
    return num.toString();
  };

  const getStatValue = (stat) => formatNumber(playerStats?.[stat]);
  const getStatLabel = (stat) => STAT_DISPLAY_NAMES[stat] || stat;

  // ===== Weekly chart keys + data (robust + non-AI-dependent) =====
  const safeWeekly = Array.isArray(weeklyStats) ? weeklyStats : [];
  const weeklyStatsObj = safeWeekly[0]?.stats ?? null;
  const weeklyAvailableKeys = weeklyStatsObj ? Object.keys(weeklyStatsObj) : [];

  // Position-specific stats for weekly trend
  const positionChartStats = {
    QB: ["clutch", "pass_yards", "pass_tds"],
    RB: ["rush_yards", "rec_yards", "rush_tds"],
    WR: ["rec_yards", "receptions", "rec_tds"],
    DB: ["passes_defended", "solo_tackles", "interceptions"],
  };

  const effectiveChartKeys = (() => {
    const specificStats = positionChartStats[position];
    if (specificStats) {
      const validSpecific = specificStats.filter(
        (k) => k === "clutch" || weeklyAvailableKeys.includes(k)
      );
      if (validSpecific.length > 0) return validSpecific;
    }

    const posKeys = Array.isArray(positionStats) ? positionStats : [];
    const validPosKeys = posKeys.filter((k) => weeklyAvailableKeys.includes(k));
    return validPosKeys.slice(0, 3);
  })();

  const chartData = safeWeekly.map((week) => {
    const weekData = { week: `W${week.week}` };
    const stats = week?.stats ?? {};

    effectiveChartKeys.forEach((key) => {
      const label =
        key === "clutch" ? "Crunch Time Grade" : getStatLabel(key);
      const raw = key === "clutch" ? stats?.[key] ?? null : stats?.[key] ?? null;
      const num =
        raw == null ? null : key === "clutch" ? Number(raw) * 100 : Number(raw);
      weekData[label] = Number.isFinite(num) ? num : null;
    });

    return weekData;
  });

  const hasWeeklySeriesData =
    chartData.length > 0 &&
    effectiveChartKeys.some((key) => {
      const label = getStatLabel(key);
      return chartData.some((row) => row[label] != null);
    });

  // Archetype signature data (REAL stat keys only, plus clutch for QB)
  const signatureData = (() => {
    const data = [];

    // Add crunch time grade for QB
    if (position === "QB" && analysis?.features?.clutch !== undefined) {
      data.push({
        name: "Crunch Time Grade",
        value: Math.round(analysis.features.clutch * 100), // as percentage
      });
    }

    if (!playerStats) return data;

    const baseKeys =
      Array.isArray(effectiveChartKeys) && effectiveChartKeys.length > 0
        ? effectiveChartKeys
        : positionStats.slice(0, 6);

    const validKeys = baseKeys.filter((k) => playerStats[k] !== undefined);

    const finalKeys =
      validKeys.length > 0
        ? validKeys.slice(0, 6 - data.length)
        : positionStats
            .filter((k) => playerStats[k] !== undefined)
            .slice(0, 6 - data.length);

    finalKeys.forEach((key) => {
      data.push({
        name: getStatLabel(key),
        value: Number.isFinite(Number(playerStats[key]))
          ? Number(playerStats[key])
          : 0,
      });
    });

    return data;
  })();

  // --- Similar player meta lookup (adds headshot + ensures team/pos present) ---
  const getPlayerMetaById = (id) => allPlayers.find((p) => p.id === id) || null;

  const SimilarPlayerRow = ({ similar }) => {
    const meta = getPlayerMetaById(similar.id);
    const headshot = meta?.headshot || null;
    const team = meta?.team || similar.team || "—";
    const pos = meta?.position || similar.position || "—";
    const name = meta?.display_name || similar.name || "Unknown";

    // your similarity engine dampens to ~30-80; UI can still cap if you want
    const similarity = Math.min(similar.similarity ?? 0, 99);

    return (
      <button
        type="button"
        onClick={() => setSelectedPlayerId(similar.id)}
        className="w-full text-left bg-slate-900/50 rounded-lg px-3 py-3 border border-white/5 hover:border-white/20 hover:bg-slate-900/60 transition flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          {headshot ? (
            <img
              src={headshot}
              alt={name}
              className="w-10 h-10 rounded-md object-cover border border-white/10 shrink-0"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 shrink-0" />
          )}

          <div className="min-w-0">
            <p className="text-white font-semibold truncate">{name}</p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="truncate">
                {team} • {pos}
              </span>
              {teamLogoMap[team] && (
                <img
                  src={`${teamLogoMap[team]}`}
                  alt={team}
                  className="w-4 h-4 object-contain"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
            </div>

            {similar.sharedTraits?.length > 0 && (
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                Shared:{" "}
                <span className="text-slate-400">
                  {similar.sharedTraits
                    .map((trait) => formatCamelCase(trait))
                    .join(", ")}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="flex items-center gap-2 mb-1 justify-end">
            <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                style={{ width: `${similarity}%` }}
              />
            </div>
            <p className="text-base font-bold text-white min-w-10 text-right">
              {similarity.toFixed(0)}%
            </p>
          </div>
          <p className="text-xs text-slate-400">Match</p>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Archetype Definitions
          </h1>
          <p className="text-slate-300">
            Understand player styles and find comparable athletes
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* LEFT SIDEBAR: Position + Picker + Comparable Players */}
          <div className="lg:col-span-1 space-y-4">
            {/* Position Filter */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition">
              <label className="block text-sm font-semibold text-white mb-3">
                Position
              </label>
              <select
                value={position}
                onChange={(e) => {
                  setPosition(e.target.value);
                  setSelectedPlayerId(null);
                  setSearch("");
                }}
                className="w-full bg-slate-900/50 border border-white/20 rounded px-3 py-2 text-white text-sm hover:border-white/30 focus:border-white/50 outline-none transition"
              >
                {["QB", "RB", "WR", "TE", "DB"].map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            {/* Player Picker */}
            <PlayerPicker
              title="Select Player"
              search={search}
              onSearch={setSearch}
              options={searchFiltered}
              valueId={selectedPlayerId}
              onChangeId={setSelectedPlayerId}
            />

            {/* Comparable Players (moved here: below selector, left of analysis) */}
            {selectedPlayerId && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-white">
                    Comparable Players
                  </h3>
                  {loading && (
                    <span className="text-xs text-slate-400">Loading…</span>
                  )}
                </div>

                {!loading &&
                analysis?.similarPlayers &&
                analysis.similarPlayers.length > 0 ? (
                  <div className="space-y-2">
                    {analysis.similarPlayers.map((similar, idx) => (
                      <SimilarPlayerRow key={`${similar.id}-${idx}`} similar={similar} />
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">
                    {loading
                      ? "Finding similar players…"
                      : "Select a player to see comps."}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT CONTENT: Report Card / Analysis */}
          {selectedPlayer && (
            <div className="lg:col-span-3 space-y-6">
              {/* Player Info Card */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
                <div className="flex justify-between items-start gap-6">
                  <div className="flex gap-4 flex-1">
                    {selectedPlayer.headshot && (
                      <img
                        src={selectedPlayer.headshot}
                        alt={selectedPlayer.display_name}
                        className="w-32 h-32 rounded-lg object-cover border border-white/10"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold text-white">
                          {selectedPlayer.display_name}
                        </h2>
                        {selectedPlayer.team &&
                          teamLogoMap[selectedPlayer.team] && (
                            <img
                              src={`${teamLogoMap[selectedPlayer.team]}`}
                              alt={selectedPlayer.team}
                              className="w-10 h-10 object-contain"
                              onError={(e) =>
                                (e.currentTarget.style.display = "none")
                              }
                            />
                          )}
                      </div>
                      <p className="text-slate-300 text-lg font-semibold">
                        {selectedPlayer.team} • {selectedPlayer.position}
                      </p>
                      {selectedPlayer.college && (
                        <p className="text-slate-400 text-sm mt-1">
                          {selectedPlayer.college}
                        </p>
                      )}
                      <div className="flex gap-4 mt-3 text-sm text-slate-400 flex-wrap">
                        {selectedPlayer.jersey_number && (
                          <p>
                            Jersey:{" "}
                            <span className="text-white font-semibold">
                              #{selectedPlayer.jersey_number}
                            </span>
                          </p>
                        )}
                        {selectedPlayer.height && (
                          <p>
                            Height:{" "}
                            <span className="text-white font-semibold">
                              {formatHeight(selectedPlayer.height)}
                            </span>
                          </p>
                        )}
                        {selectedPlayer.weight && (
                          <p>
                            Weight:{" "}
                            <span className="text-white font-semibold">
                              {selectedPlayer.weight} lbs
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {analysis?.archetype && (
                    <div
                      className={`bg-gradient-to-br ${
                        archetypeStyles[analysis.archetypeKey] ||
                        "from-slate-600 to-slate-400"
                      } rounded-lg px-6 py-4 min-w-max`}
                    >
                      <div className="text-sm font-semibold text-white uppercase tracking-wider">
                        {analysis.archetype.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-8 text-center">
                  <p className="text-slate-300">Analyzing player...</p>
                </div>
              ) : error ? (
                <div className="backdrop-blur-xl bg-white/5 border border-red-500/20 rounded-lg p-8 text-center">
                  <p className="text-red-300">{error}</p>
                </div>
              ) : analysis && analysis.archetype ? (
                <>
                  {/* Archetype Description */}
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Archetype Profile
                    </h3>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                      {analysis.archetype.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.reasons.slice(0, 4).map((reason, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/50 rounded px-4 py-3 border border-white/5 hover:border-white/20 transition"
                        >
                          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">
                            {reason.feature.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                          <p className="text-sm text-white leading-relaxed">
                            {reason.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Loading indicator for AI analysis */}
                  {aiLoading && (
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                      <p className="text-slate-300 mt-2">
                        Generating AI analysis. It can take up to 30 seconds to
                        load. We appreciate your patience.
                      </p>
                    </div>
                  )}

                  {/* AI Explanation: only show when AI has finished and we actually have text */}
                  {!aiLoading && analysis?.explanation?.text ? (
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Analysis
                      </h3>
                      <p className="text-slate-300 text-sm">
                        {analysis.explanation.text}
                      </p>

                      {analysis?.explanation?.source === "ai" && (
                        <p className="text-slate-300 text-xs whitespace-pre-wrap">
                          Generated by AI •{" "}
                          {analysis?.timestamp
                            ? new Date(analysis.timestamp).toLocaleDateString()
                            : "Unknown date"}
                        </p>
                      )}
                    </div>
                  ) : null}

                  {/* Stats Grid */}
                  {playerStats && Object.keys(playerStats).length > 0 && (
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Season Stats
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {positionStats.slice(0, 12).map((stat) => (
                          <div
                            key={stat}
                            className="bg-slate-900/50 rounded px-3 py-3 border border-white/5"
                          >
                            <p className="text-xs font-semibold text-slate-400 uppercase">
                              {getStatLabel(stat)}
                            </p>
                            <p className="text-lg font-bold text-white mt-1">
                              {getStatValue(stat)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Archetype Signature Chart */}
                  {signatureData.length > 0 && (
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Archetype Signature
                      </h3>
                      <p className="text-slate-400 text-sm mb-4">
                        Stats driving this classification
                      </p>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={signatureData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.1)"
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(15, 23, 42, 0.8)",
                              border: "1px solid rgba(255,255,255,0.2)",
                              borderRadius: "8px",
                            }}
                            labelStyle={{ color: "#f1f5f9" }}
                          />
                          <Bar dataKey="value" fill="#60a5fa" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Weekly Trend Chart */}
                  {weeklyStats &&
                    weeklyStats.length > 0 &&
                    hasWeeklySeriesData && (
                      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
                        <h3 className="text-lg font-semibold text-white mb-4">
                          Weekly Trend
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="rgba(255,255,255,0.1)"
                            />
                            <XAxis
                              dataKey="week"
                              tick={{ fill: "#94a3b8", fontSize: 12 }}
                            />
                            <YAxis
                              tick={{ fill: "#94a3b8", fontSize: 12 }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(15, 23, 42, 0.8)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: "8px",
                              }}
                              labelStyle={{ color: "#f1f5f9" }}
                            />
                            {effectiveChartKeys.map((key, idx) => (
                              <Line
                                key={key}
                                type="monotone"
                                dataKey={
                                  key === "clutch"
                                    ? "Crunch Time Grade"
                                    : getStatLabel(key)
                                }
                                stroke={
                                  ["#60a5fa", "#34d399", "#fbbf24", "#f87171"][
                                    idx % 4
                                  ]
                                }
                                strokeWidth={2}
                                isAnimationActive={false}
                                connectNulls
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                  {weeklyStats && weeklyStats.length > 0 && !hasWeeklySeriesData && (
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Weekly Trend
                      </h3>
                      <div className="text-center py-8 text-slate-400">
                        <p>Weekly data not available.</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-8 text-center text-slate-400">
                  Select a player to view archetype analysis
                </div>
              )}
            </div>
          )}
        </div>

        {/* Archetype Library (unchanged) */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-white mb-2">
            Archetype Library
          </h2>
          <p className="text-slate-400 mb-8">
            Explore all player archetypes and their characteristics
          </p>

          <div className="space-y-8">
            {/* QB Archetypes */}
            <div>
              <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center text-white font-bold">
                  QB
                </span>
                Quarterbacks
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: "Field General",
                    desc: "Natural leader commanding the offense with poise and accuracy",
                  },
                  {
                    name: "Dual Threat",
                    desc: "Mobile QB who can beat defenses with both arm and legs",
                  },
                  {
                    name: "Gunslinger",
                    desc: "High-volume passer who takes risks and generates big plays",
                  },
                  {
                    name: "Game Changer",
                    desc: "Elite performer who impacts all aspects of the game",
                  },
                ].map((archetype, idx) => (
                  <div
                    key={`qb-${idx}`}
                    className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-5 hover:border-blue-500/50 hover:bg-white/10 transition cursor-pointer"
                  >
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                      ARCHETYPE
                    </p>
                    <p className="text-lg font-bold text-white mb-3 group-hover:text-blue-300 transition">
                      {archetype.name}
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {archetype.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* RB Archetypes */}
            <div>
              <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded flex items-center justify-center text-white font-bold">
                  RB
                </span>
                Running Backs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: "Workhorse",
                    desc: "Durable back handling heavy workload with consistency",
                  },
                  {
                    name: "Receiving Back",
                    desc: "Versatile pass-catching threat out of backfield",
                  },
                  {
                    name: "All-Purpose",
                    desc: "Elite contributor in rushing, receiving, and versatility",
                  },
                ].map((archetype, idx) => (
                  <div
                    key={`rb-${idx}`}
                    className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-5 hover:border-green-500/50 hover:bg-white/10 transition cursor-pointer"
                  >
                    <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">
                      ARCHETYPE
                    </p>
                    <p className="text-lg font-bold text-white mb-3 group-hover:text-green-300 transition">
                      {archetype.name}
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {archetype.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* WR Archetypes */}
            <div>
              <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded flex items-center justify-center text-white font-bold">
                  WR
                </span>
                Wide Receivers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: "YAC Monster",
                    desc: "Yards after catch specialist dominating after the grab",
                  },
                  {
                    name: "Red Zone Threat",
                    desc: "Reliable target near the end zone",
                  },
                  {
                    name: "X-Factor",
                    desc: "Game-changing playmaker who creates explosive opportunities",
                  },
                  {
                    name: "Deep Threat",
                    desc: "Specialized in vertical routes and big plays",
                  },
                  {
                    name: "Chain Mover",
                    desc: "Consistent performer who keeps drives alive",
                  },
                ].map((archetype, idx) => (
                  <div
                    key={`wr-${idx}`}
                    className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-5 hover:border-purple-500/50 hover:bg-white/10 transition cursor-pointer"
                  >
                    <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                      ARCHETYPE
                    </p>
                    <p className="text-lg font-bold text-white mb-3 group-hover:text-purple-300 transition">
                      {archetype.name}
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {archetype.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* DB Archetypes */}
            <div>
              <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded flex items-center justify-center text-white font-bold">
                  DB
                </span>
                Defensive Backs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: "Lockdown",
                    desc: "Elite man-coverage cornerback shutting down receivers",
                  },
                  {
                    name: "Ballhawk",
                    desc: "Ball-hawking safety excelling at turnovers",
                  },
                  {
                    name: "Swiss Army Knife",
                    desc: "Versatile defender aligned in multiple positions",
                  },
                ].map((archetype, idx) => (
                  <div
                    key={`db-${idx}`}
                    className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-5 hover:border-red-500/50 hover:bg-white/10 transition cursor-pointer"
                  >
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                      ARCHETYPE
                    </p>
                    <p className="text-lg font-bold text-white mb-3 group-hover:text-red-300 transition">
                      {archetype.name}
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {archetype.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
