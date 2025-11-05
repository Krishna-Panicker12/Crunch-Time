import React from 'react';
import { useState, useEffect, useRef } from 'react';

const STAT_DESCRIPTIONS = {
  completions: {
    name: "Completions",
    description: "Number of completed passes by the quarterback"
  },
  completions_pct: {
    name: "Completion Percentage",
    description: "Percentage of pass attempts that were completed"
  },
  pass_yards: {
    name: "Passing Yards",
    description: "Total yards gained on completed passes"
  },
  pass_tds: {
    name: "Passing Touchdowns",
    description: "Number of touchdown passes thrown"
  },
  interceptions: {
    name: "Interceptions",
    description: "Number of passes intercepted by the defense"
  },
  sacks: {
    name: "Sacks",
    description: "Number of times the quarterback was tackled behind the line of scrimmage"
  },
  pass_epa: {
    name: "Passing Expected Points Added",
    description: "Expected points added on passing plays. Measures the value added above average on passing plays"
  },
  rush_yards: {
    name: "Rushing Yards",
    description: "Total yards gained on rushing attempts"
  },
  rush_tds: {
    name: "Rushing Touchdowns", 
    description: "Number of touchdowns scored on rushing plays"
  },
  rush_epa: {
    name: "Rushing Expected Points Added",
    description: "Expected points added on rushing plays. Measures the value added above average on running plays"
  },
  cpoe: {
    name: "Completion Percentage Over Expected",
    description: "Difference between actual completion percentage and expected completion percentage based on throw difficulty"
  },
  pacr: {
    name: "Pass Air Conversion Ratio",
    description: "Measures a QB's ability to convert air yards into receiving yards. Higher values indicate more efficient passing"
  },
  carries: {
    name: "Carries",
    description: "Number of rushing attempts"
  },
  receptions: {
    name: "Receptions",
    description: "Number of completed passes caught"
  },
  rec_yards: {
    name: "Receiving Yards",
    description: "Total yards gained on receptions"
  },
  rec_tds: {
    name: "Receiving Touchdowns",
    description: "Number of touchdowns scored on receptions"
  },
  rec_yac: {
    name: "Yards After Catch",
    description: "Receiving yards gained after catching the ball"
  },
  targets: {
    name: "Targets",
    description: "Number of passes thrown to the player"
  },
  rec_epa: {
    name: "Receiving Expected Points Added",
    description: "Expected points added on receiving plays. Measures the value added above average when targeted"
  },
  racr: {
    name: "Receiver Air Conversion Ratio",
    description: "Receiving yards divided by air yards. Measures efficiency in converting targets into yards"
  },
  target_share: {
    name: "Target Share",
    description: "Percentage of team's total targets that went to the player"
  },
  air_yards_share: {
    name: "Air Yards Share",
    description: "Percentage of team's total air yards that went to the player"
  },
  wopr: {
    name: "Weighted Opportunity Rating",
    description: "Combines target share and air yards share to measure a player's involvement in the passing game"
  },
  solo_tackles: {
    name: "Solo Tackles",
    description: "Number of unassisted tackles made"
  },
  passes_defended: {
    name: "Passes Defended",
    description: "Number of passes broken up or deflected"
  },
  crunch_time_grade: {
    name: "Crunch Time Grade",
    description: "Overall performance grade (0-100) based on weighted combination of key stats for the position"
  }
};

export function StatTooltip({ statKey, children }) {
  const stat = STAT_DESCRIPTIONS[statKey];
  const [shouldFlip, setShouldFlip] = useState(false);
  const tooltipRef = useRef(null);

  useEffect(() => {
    const handlePosition = () => {
      if (tooltipRef.current) {
        const rect = tooltipRef.current.getBoundingClientRect();
        setShouldFlip(rect.right > window.innerWidth);
      }
    };

    handlePosition();
    window.addEventListener('resize', handlePosition);
    return () => window.removeEventListener('resize', handlePosition);
  }, []);
  
  return (
    <div className="group relative inline-block">
      {children}
      {stat && (
        <div 
          ref={tooltipRef}
          className={`invisible group-hover:visible absolute z-10 w-64 p-4
            bg-slate-800 rounded-lg shadow-lg border border-white/10 text-sm
            ${shouldFlip ? 'right-full mr-2' : 'left-full ml-2'}
            -translate-y-1/2 top-1/2`}>
          <h4 className="font-semibold text-white mb-2">{stat.name}</h4>
          <p className="text-slate-300">{stat.description}</p>
        </div>
      )}
    </div>
  );
}