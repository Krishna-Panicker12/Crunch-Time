

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
            <div className="text-slate-400 text-sm">{player.team} &middot; {player.position} &middot; {`#${player.jersey_number || "N/A"}`}</div>
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