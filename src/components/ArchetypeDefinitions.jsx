const positions = ["QB", "RB", "WR", "TE"];

import cancel from '../assets/remove.png';
import demon from '../assets/demon.png';
import rocket from '../assets/rocket.png';
import chain from '../assets/chain.png';
import lightning from '../assets/lightning.png';
import engine from '../assets/car-machine.png';
import cowboy from '../assets/cowboy.png';
import militaryHelmet from '../assets/military-hat.png';
import trophy from '../assets/trophy.png';
import clipboard from '../assets/shopping-list_9332198.png'
import infiniti from '../assets/autism.png';
import baseballMitt from '../assets/baseball-team_13544997.png';
import horse from '../assets/game_16463847.png';
import gear from '../assets/performance_1593616.png';
import punch from '../assets/punch.png';
import stethoscope from '../assets/stethoscope.png';
import shield from '../assets/shield.png';
import seamRipper from '../assets/seam-ripper.png';
import puzzle from '../assets/puzzle.png';
import { PlayerPicker } from './PlayerPicker';

export const ArcheDefinitions = {
  QB: [
    {
      name: "Field General",
      description:
        "A quarterback who excels at managing the game, making smart decisions, and leading the offense with precision and accuracy. They prioritize ball security and situational awareness over flashy plays.",
    icon: militaryHelmet
    },
    {
      name: "Dual Threat",
      description:
        "A versatile quarterback who is equally dangerous with his arm and legs. They can extend plays with their mobility and create opportunities by scrambling or running the ball.",
    icon: engine
    },
    {
      name: "Gunslinger",
      description:
        "An aggressive passer who takes risks to make big plays. They prioritize deep throws and high-risk, high-reward passes, often leading to explosive gains but also turnovers.",
    icon: cowboy
    },
    {
      name: "Game Changer (Alpha)",
      description:
        "An elite, transformative quarterback who dominates games with their talent. They have the ability to single-handedly change the outcome of contests through exceptional playmaking.",
    icon: trophy
    },
  ],
  RB: [
    {
      name: "Workhorse",
      description:
        "A durable running back who can handle a heavy workload. They are built to carry the ball 20+ times per game and maintain effectiveness throughout the season.",
    icon: horse
    },
    {
      name: "Receiving Back",
      description:
        "A running back who is primarily a threat in the passing game. They have excellent route-running skills and can stretch the field as a receiver out of the backfield.",
    icon:baseballMitt
    },
    {
      name: "All Purpose Back",
      description:
        "A versatile running back who excels in multiple facets: rushing, receiving, blocking, and special teams. They are a complete back who can do it all.",
    icon: infiniti
    },
  ],
  WR: [
    {
      name: "YAC Monster",
      description:
        "A wide receiver who excels after the catch, turning short receptions into big gains with speed and elusiveness. They are dangerous in open space and create yards after contact.",
        icon: lightning
    },
    {
      name: "Red-Zone Threat",
      description:
        "A wide receiver who is most dangerous near the goal line. They have great body control, leaping ability, and can score from anywhere in the red zone.",
        icon: demon
    },
    {
      name: "X-Factor",
      description:
        "An unpredictable wide receiver who can make game-changing plays. They have elite speed, agility, or playmaking ability that defenses can't account for.",
        icon: cancel
    },
    {
      name: "Deep Threat",
      description:
        "A wide receiver who stretches the field vertically. They have exceptional speed and can beat defenders downfield, creating big plays on deep routes.",
        icon: rocket
    },
    {
      name: "Chain Mover",
      description:
        "A consistent, dependable wide receiver who catches everything thrown their way. They are masters of the intermediate game and rarely drop passes.",
        icon: chain
    },
  ],
  TE: [
    {
      name: "Safety Blanket",
      description:
        "A tight end who is the quarterback's most trusted target. They provide security in tough situations and excel at making the routine catch to keep drives alive.",
    icon: shield
    },
    {
      name: "Seam Stretcher",
      description:
        "A tall, athletic tight end who can stretch the field vertically. They excel on deep routes and can win jump balls against defensive backs.",
    icon: seamRipper
    },
    {
      name: "Red-Zone Specialist",
      description:
        "A tight end who dominates in the scoring area. They have great hands, body control, and can score from anywhere in the red zone with their size advantage.",
    icon: stethoscope
    },
    {
      name: "Complete TE",
      description:
        "A versatile tight end who excels in all aspects: blocking, receiving, and playmaking. They are a true three-down player who can do it all on the field.",
    icon: puzzle
    },
  ],
};

export function ArchetypeDefinitions({ specPosition }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100  font-bold p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 md:mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1">
              Find your player's archetype
            </h1>
            <p className="text-slate-400 text-sm md:text-base">Analyze player performance and match them to their archetype</p>
          </div>
          <button
            // This should be a link back to the pick'em page/playerhub
            className="mt-4 md:mt-0 px-6 py-2.5 rounded-xl bg-gradient-to-r from-slate-700/60 to-slate-600/60 hover:from-slate-600/80 hover:to-slate-500/80 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 font-medium text-sm"
          >
            Back to player hub
          </button>
        </header>

        

      </div>
    </div>

  );
}

// Header 
// Explanation of what happens on this page
// Player picker jsx
// Then it shows the report card
// --> Player info at the top with name, team, position, photo
// --> Archetype section with icon, name, description
// --> Stats section with relevant stats based on position
// --> Graphs and such with AI blurb explaning
// -=> At the bottom it shows players that share the same archetype and are the most similar to the player that was chosen
// At the bottom it shows archetype definitions with icons and descriptions
