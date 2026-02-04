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
  ARI, ATL, BAL, BUF, CAR, CHI, CIN, CLE, DAL, DEN, DET, GB, HOU, IND, JAX, KC,
  LAC, LAR, MIA, MIN, NE, NO, NYG, NYJ, OAK, PHI, PIT, SF, SEA, TB, TEN, WAS,
};

export function PlayerCard({ player }) {
  if (!player) return null;

  const foot = Math.floor(player.height / 12);
  const inch = player.height % 12;

  const formatBirthDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex items-start sm:items-center gap-3 sm:gap-4 bg-slate-900/40 rounded-xl p-3">
      <img
        src={player.headshot || "/default-player.png"}
        alt={player.display_name}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border border-white/10 flex-shrink-0"
        onError={(e) => {
          e.target.src = "/default-player.png";
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-6">
        {/* Left: name + compact team line */}
        <div className="min-w-0">
          <div className="font-semibold text-lg sm:text-xl leading-tight truncate">
            {player.display_name}
          </div>

          {player.team && teamLogoMap[player.team] && (
            <div className="mt-1 flex items-center gap-2 text-slate-400 text-xs sm:text-sm">
              <img
                src={teamLogoMap[player.team]}
                alt={player.team}
                className="w-5 h-5 sm:w-7 sm:h-7 object-contain"
              />
              {/* one line, smaller, not crowded */}
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span>{player.team}</span>
                <span className="opacity-60">•</span>
                <span>{player.position}</span>
                <span className="opacity-60">•</span>
                <span>{`#${player.jersey_number || "N/A"}`}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: spaced out on mobile using a 2-col grid */}
        <div className="text-slate-400 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:flex sm:flex-col">
            <div>Height: {`${foot}'${inch}`}</div>
            <div>Weight: {player.weight || "N/A"} lbs</div>
            <div className="col-span-2 sm:col-span-1">
              College: {player.college || "N/A"}
            </div>
            <div className="col-span-2 sm:col-span-1">
              Birth Date: {formatBirthDate(player.birth_date)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
