import { useEffect, useState } from "react";
import { PlayerCard } from "../components/PlayerCard";
import { ArchPlayerType } from "../components/archPlayerType";
import { ArchetypeDefinitions } from "../components/ArchetypeDefinitions";
import { listPlayers } from "../db/playerReads";


function PickEmPage() {
  const [player, setPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArchetype, setSelectedArchetype] = useState(null);

  // For now we hardcode week 10 and the static file
  useEffect(() => {
    listPlayers({ position: "QB" }).then(console.log).catch(console.error);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/pickem-week10.json", {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        setPlayer(json.player);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err);
        }
      } finally {
        setIsLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  if (isLoading) {
    return <div>Loading Pick&apos;em…</div>;
  }

  if (error) {
    return <div>Failed to load Pick&apos;em: {error.message}</div>;
  }

  if (!player) {
    return <div>No data</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6">
      <header className = "flex items-center flex-col gap-4 mb-8">
        <h1 className="text-3xl font-semibold">
          PLAYER ARCHETYPE
        </h1>
        <p>
          This page takes season-long player statistics to generate a player profile that best fits the player's playstyle.
        </p>
      </header>
      <section className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4">
        This will be the player selector. We will do this section later.
      </section>
      <section className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 mt-6 space-y-5">
        <ArchPlayerType player={player} />
        <h2 className = "text-center font-bold text-2xl">View Postion Archetypes</h2>
        <section className ="flex space-x-4 mt-4 mb-8 justify-evenly">
          <button className="flex flex-col items-center font-bold text-center bg-white/10 border border-white/20 rounded-lg p-10 space-y-5 mr-4 transition
                                    shadow-md
                                    hover:bg-gradient-to-r from-purple-600 via-blue-500 to-red-500
                                    animate-gradient-x
                                    hover:scale-105 hover:shadow-lg active:scale-95" onClick={() => setSelectedArchetype("QB")}>
            QB
          </button>
          <button className="flex flex-col items-center font-bold text-center bg-white/10 border border-white/20 rounded-lg p-10 space-y-5 mr-4 transition
                                    shadow-md
                                    hover:bg-gradient-to-r from-purple-600 via-blue-500 to-red-500
                                    animate-gradient-x
                                    hover:scale-105 hover:shadow-lg active:scale-95" onClick={() => setSelectedArchetype("RB")}>
            RB
          </button>
          <button className="flex flex-col items-center font-bold text-center bg-white/10 border border-white/20 rounded-lg p-10 space-y-5 mr-4 shadow-md
                                    hover:bg-gradient-to-r from-purple-600 via-blue-500 to-red-500
                                    animate-gradient-x
                                    hover:scale-105 hover:shadow-lg active:scale-95" onClick={() => setSelectedArchetype("WR")}>
            WR
          </button>
          <button className="flex flex-col items-center font-bold text-center bg-white/10 border border-white/20 rounded-lg p-10 space-y-5 mr-4 shadow-md
                                    hover:bg-gradient-to-r from-purple-600 via-blue-500 to-red-500
                                    animate-gradient-x
                                    hover:scale-105 hover:shadow-lg active:scale-95" onClick={() => setSelectedArchetype("TE")}>
            TE
          </button>
      </section>
      <ArchetypeDefinitions specPosition = {selectedArchetype}/>
      </section>

    </div>
  );
}

export default PickEmPage;
