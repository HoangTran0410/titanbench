import React from 'react';

interface RadialScoreProps {
  score: number;
  max: number;
  label: string;
  color: string;
  icon?: React.ReactNode;
}

const formatNumber = (num: number) => {
  return num.toLocaleString('de-DE'); // Formats as 1.000.000
};

const RadialScore: React.FC<RadialScoreProps> = ({ score, max, label, color, icon }) => {
  // Configuration
  const radius = 58; // Radius of the circle
  const strokeWidth = 10; // Width of the progress bar
  const center = 70; // SVG Viewbox center
  
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(score, max);
  const progress = (normalizedScore / max) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-xl shadow-lg w-full border border-slate-800 relative overflow-hidden group">
      {/* Background Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 opacity-10 rounded-full blur-3xl transition-all duration-1000"
        style={{ backgroundColor: score > 0 ? color : 'transparent' }}
      ></div>

      <div className="relative w-full aspect-square max-h-64 max-w-[220px] flex items-center justify-center">
        {/* SVG Container */}
        <svg 
            viewBox="0 0 140 140" 
            className="w-full h-full transform -rotate-90"
        >
          {/* Track Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />
          
          {/* Progress Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ 
                transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s ease',
                filter: `drop-shadow(0 0 4px ${color})`
            }}
          />
        </svg>

        {/* Centered Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            {icon && (
              <div className="mb-1 text-slate-400" style={{ color: score > 0 ? color : undefined }}>
                {icon}
              </div>
            )}
            <span 
              className="text-3xl sm:text-4xl font-black font-mono tracking-tighter transition-colors duration-300"
              style={{ color: score > 0 ? '#f8fafc' : '#475569' }}
            >
              {formatNumber(score)}
            </span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 bg-slate-950/80 px-2 py-1 rounded backdrop-blur-sm border border-slate-800/50">
                {label}
            </span>
        </div>
      </div>
    </div>
  );
};

export default RadialScore;