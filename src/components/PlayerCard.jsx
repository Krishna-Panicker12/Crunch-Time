const teamLogoMap = {
  ARI: "arizona-cardinals-logo-transparent.png",
  ATL: "atlanta-falcons-logo-transparent.png",
  BAL: "baltimore-ravens-logo-transparent.png",
  BUF: "buffalo-bills-logo-transparent.png",
  CAR: "carolina-panthers-logo-transparent.png",
  CHI: "chicago-bears-logo-transparent.png",
  CIN: "cincinnati-bengals-logo-transparent.png",
  CLE: "cleveland-browns-logo-transparent.png",
  DAL: "Dallas-Cowboys.png",
  DEN: "denver-broncos-logo-transparent.png",
  DET: "detroit-lions-logo-transparent.png",
  GB: "green-bay-packers-logo-transparent.png",
  HOU: "houston-texans-logo-transparent.png",
  IND: "indianapolis-colts-logo-transparent.png",
  JAX: "jacksonville-jaguars-logo-transparent.png",
  KC: "kansas-city-chiefs-logo-transparent.png",
  LAC: "los-angeles-chargers-logo-transparent.png",
  LAR: "la-rams-logo-png-transparent.png",
  MIA: "miami-dolphins-logo-transparent.png",
  MIN: "minnesota-vikings-logo-transparent.png",
  NE: "new-england-patriots-logo-transparent.png",
  NO: "new-orleans-saints-logo-transparent.png",
  NYG: "new-york-giants-logo-transparent.png",
  NYJ: "new-york-jets-logo-png-transparent-2024.png",
  OAK: "oakland-raiders-logo-transparent.png",
  PHI: "philadelphia-eagles-logo-transparent.png",
  PIT: "pittsburgh-steelers-logo-transparent.png",
  SF: "san-francisco-49ers-logo-transparent.png",
  SEA: "seattle-seahawks-logo-transparent.png",
  TB: "tampa-bay-buccaneers-logo-transparent.png",
  TEN: "tennessee-titans-logo-transparent.png",
  WAS: "Washington-Commanders.png",
};

export function PlayerCard({ player }) {
  if (!player) return null;

  let foot = Math.floor(player.height / 12);
  let inch = player.height % 12;
  
  // Format birth date if available
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
    <div className="flex items-center gap-4 bg-slate-900/40 rounded-xl p-3">
      <img
        src={player.headshot || "/default-player.png"}
        alt={player.display_name}
        className="w-16 h-16 rounded-full object-cover border border-white/10"
        onError={(e) => {
          e.target.src = "/default-player.png";
        }}
      />
      <div className="flex items-center justify-between w-full">
        <div>
            <div className="font-semibold text-xl">{player.display_name}</div>
            {player.team && teamLogoMap[player.team] && (
              <div className = "flex">
              <img
                src={`/src/assets/${teamLogoMap[player.team]}`}
                alt={player.team}
                className="w-8 h-8 object-contain mr-2"
              />
              <div className="text-slate-400 text-sm"> &middot; {player.team} &middot; {player.position} &middot; {`#${player.jersey_number || "N/A"}`}</div>
              </div>
            )}
            
        </div>
        <div>
            <div className="text-slate-400 text-sm mt-1">
                <div>Height: {`${foot}'${inch}`}</div>
                <div>Weight: {player.weight || "N/A"} lbs</div>
                <div>College: {player.college || "N/A"}</div>
                <div>Birth Date: {formatBirthDate(player.birth_date)}</div>
            </div>
        </div>
      </div>
    </div>
  );
}