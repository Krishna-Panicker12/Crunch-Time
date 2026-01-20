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
      name: "Game Manager",
      description:
        "A steady, reliable quarterback who focuses on consistency and efficiency. They avoid mistakes, manage the clock well, and keep drives alive without necessarily being spectacular.",
    icon: clipboard
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
      name: "Efficiency Rusher",
      description:
        "A running back who maximizes every carry, converting short yardage situations and maintaining positive yards per attempt. They excel at grinding out tough yards.",
    icon:gear
    },
    {
      name: "Receiving Back",
      description:
        "A running back who is primarily a threat in the passing game. They have excellent route-running skills and can stretch the field as a receiver out of the backfield.",
    icon:baseballMitt
    },
    {
      name: "Red-Zone Back",
      description:
        "A running back who specializes in scoring touchdowns in the red zone. They have great vision, patience, and finishing ability near the goal line.",
    icon: punch
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
    <>
      <div>
        {specPosition && positions.includes(specPosition) ? (
          <div className = "flex flex-col items-center mt-6 mb-10 p-1 space-y-1.5">
            <h2 className="text-2xl font-bold mb-4 justify-center">{specPosition} Archetypes</h2>
            <div className="grid grid-cols-4 gap-4">
              {ArcheDefinitions[specPosition].map((arch) => (
                <div key={arch.name} className="flex flex-col items-center text-center bg-white/10 border border-white/20 rounded-lg p-4 space-y-5 shadow-md hover:scale-105 hover:shadow-lg active:scale-95 hover:bg-white/20">
                  <h3 className="text-xl font-semibold">{arch.name}</h3>
                  <p>{arch.description}</p>
                  <img className = "w-20 " src={arch.icon} alt = "Bro bro Bro"></img>
                </div>
              ))}
            </div>
          </div>
        ) : (
            <p className="text-center">Select a posistion to view archetypes</p>
        )}
      </div>
    </>
  );
}

