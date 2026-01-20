//  bg-slate-900/40



export function ArchPlayerType({ player }) {
    return(
        <div className="flex items-center gap-2 bg-slate-900/40 rounded-xl p-3">
            <img src={player.headShot} alt={player.displayName}  className="w-60" />
            <div className="flex items-center justify-between w-full">
                <div>
                    <div className="font-semibold text-4xl">{player.displayName}</div>
                    <div className="text-slate-400 text-lg">{player.team} &middot; {player.position} &middot; {`#${player.num}`}</div>
                </div>
                <div>
                    <div className="text-slate-400 text-lg mt-1">
                        <div>Height: {`${player.height / 12}'${player.height % 12}`}</div>
                        <div>Weight: {player.weight} lbs</div>
                        <div>College: {player.college}</div>
                        <div>Birth Date: {player.birthDate} </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

