

export function PlayerCard({ player }) {
  if (!player) return null;
  return (
    <div className="flex items-center gap-4 bg-slate-900/40 rounded-xl p-3">
      <img
        src={player.headshot}
        alt={player.name}
        className="w-16 h-16 rounded-full object-cover border border-white/10"
      />
      <div className="flex items-center justify-between w-full">
        <div>
            <div className="font-semibold text-xl">{player.name}</div>
            <div className="text-slate-400 text-sm">{player.team} &middot; {player.position} &middot; {`#${player.jerseyNum}`}</div>
        </div>
        <div>
            <div className="text-slate-400 text-sm mt-1">
                <div>Height: {player.height}</div>
                <div>Weight: {player.weight} lbs</div>
                <div>College: {player.college}</div>
                <div>Birth Date: {player.birthDate} </div>
            </div>
        </div>
      </div>
    </div>
  );
}