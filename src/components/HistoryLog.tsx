import React, { useState } from "react";
import { HistoryEntry } from "../types";
import {
  ChevronDown,
  ChevronUp,
  History,
  Trash2,
  Cpu,
  Monitor,
  Clock,
} from "lucide-react";

interface HistoryLogProps {
  history: HistoryEntry[];
  onClear: () => void;
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const HistoryLog: React.FC<HistoryLogProps> = ({ history, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 mb-8">
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm">
        {/* Header */}
        <div
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
            <History className="text-cyan-400" size={20} />
            <h3 className="font-bold text-slate-200">History</h3>
            <span className="bg-slate-800 text-slate-400 text-xs font-mono py-0.5 px-2 rounded-full border border-slate-700">
              {history.length}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isOpen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="text-slate-500 hover:text-red-400 transition-colors p-1"
                title="Clear History"
              >
                <Trash2 size={16} />
              </button>
            )}
            {isOpen ? (
              <ChevronUp size={20} className="text-slate-400" />
            ) : (
              <ChevronDown size={20} className="text-slate-400" />
            )}
          </div>
        </div>

        {/* List */}
        {isOpen && (
          <div className="border-t border-slate-800 max-h-96 overflow-y-auto custom-scrollbar">
            {history
              .slice()
              .reverse()
              .map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors grid grid-cols-1 md:grid-cols-4 gap-4 items-center last:border-0"
                >
                  {/* Time & Tier */}
                  <div className="md:col-span-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 font-mono">
                      <Clock size={12} />
                      {formatDate(entry.timestamp)}
                    </div>
                    <div
                      className={`font-bold italic ${entry.tierColor} drop-shadow-sm`}
                    >
                      {entry.tierName}
                    </div>
                    <div
                      className="text-[10px] text-slate-400 mt-1 truncate max-w-[150px]"
                      title={entry.system.gpuRenderer}
                    >
                      {entry.system.platform} •{" "}
                      {entry.system.gpuRenderer.split("Direct")[0]}
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="md:col-span-3 grid grid-cols-3 gap-2">
                    <div className="bg-slate-950/50 rounded p-2 border border-slate-800/50 flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1 mb-1">
                        <Cpu size={10} /> Single
                      </span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {entry.scores.cpuSingle.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-950/50 rounded p-2 border border-slate-800/50 flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1 mb-1">
                        <Cpu size={10} /> Multi
                      </span>
                      <span className="font-mono text-indigo-300 font-bold">
                        {entry.scores.cpuMulti.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-950/50 rounded p-2 border border-slate-800/50 flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1 mb-1">
                        <Monitor size={10} /> GPU
                      </span>
                      <span className="font-mono text-pink-300 font-bold">
                        {entry.scores.gpuScore.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryLog;
