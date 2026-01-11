
import React from 'react';

interface Props {
  score: number;
}

const CredibilityIndicator: React.FC<Props> = ({ score }) => {
  const getStatusColor = () => {
    if (score > 0.8) return 'bg-emerald-500';
    if (score > 0.5) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getStatusText = () => {
    if (score > 0.8) return 'Pristine';
    if (score > 0.5) return 'Questionable';
    return 'Bankrupt';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="58"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-200"
          />
          <circle
            cx="64"
            cy="64"
            r="58"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={364.4}
            strokeDashoffset={364.4 * (1 - score)}
            className={`${getStatusColor().replace('bg-', 'text-')} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{(score * 100).toFixed(0)}%</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{getStatusText()}</span>
        </div>
      </div>
    </div>
  );
};

export default CredibilityIndicator;
