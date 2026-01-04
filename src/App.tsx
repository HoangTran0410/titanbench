import React, { useState, useEffect, useCallback } from "react";
import {
  BenchmarkStatus,
  BenchmarkScores,
  SystemInfo,
  PowerTier,
  HistoryEntry,
} from "./types";
import {
  getSystemInfo,
  runCpuSingleCore,
  runCpuMultiCore,
  runGpuBenchmark,
} from "./services/benchmarkUtils";
import RadialScore from "./components/RadialScore";
import HistoryLog from "./components/HistoryLog";
import {
  Activity,
  Cpu,
  Play,
  RotateCcw,
  Trophy,
  Zap,
  Copy,
  Check,
  Layers,
  Gamepad2,
  Github,
  ChevronDown,
  Sparkles,
} from "lucide-react";

// Define Power Tiers for comparison
// Recalibrated for new formula: Single×10 + Multi×0.5 + GPU×10
const POWER_TIERS: PowerTier[] = [
  {
    name: "Potato / Calculator",
    emoji: "🥔",
    minScore: 0,
    color: "text-gray-400",
    description: "Basic tasks only. Might struggle with modern web apps.",
    shortDesc: "Basic tasks only",
  },
  {
    name: "Office Clerk",
    emoji: "📎",
    minScore: 500000,
    color: "text-blue-400",
    description: "Good for documents, browsing, and media consumption.",
    shortDesc: "Documents, browsing",
  },
  {
    name: "Student Laptop",
    emoji: "💻",
    minScore: 1000000,
    color: "text-green-400",
    description: "Capable multitasker. Handles light gaming and creative work.",
    shortDesc: "Light gaming, multitasking",
  },
  {
    name: "Creative Pro",
    emoji: "🎨",
    minScore: 1500000,
    color: "text-purple-400",
    description: "Great for video editing, coding, and design work.",
    shortDesc: "Video editing, development",
  },
  {
    name: "Gaming Rig",
    emoji: "🎮",
    minScore: 2000000,
    color: "text-orange-400",
    description: "High-performance machine ready for AAA gaming.",
    shortDesc: "AAA gaming ready",
  },
  {
    name: "Titan Workstation",
    emoji: "⚡",
    minScore: 3000000,
    color: "text-red-500",
    description:
      "Extreme performance. Crushes heavy rendering and computation.",
    shortDesc: "Heavy rendering, computation",
  },
];

const App: React.FC = () => {
  const [status, setStatus] = useState<BenchmarkStatus>(BenchmarkStatus.IDLE);
  const [scores, setScores] = useState<BenchmarkScores>({
    cpuSingle: 0,
    cpuMulti: 0,
    gpuScore: 0,
  });
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTier, setCurrentTier] = useState<PowerTier | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  useEffect(() => {
    setSystemInfo(getSystemInfo());

    // Load history from local storage
    const savedHistory = localStorage.getItem("titanBenchHistory");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (entry: HistoryEntry) => {
    const updatedHistory = [...history, entry];
    setHistory(updatedHistory);
    localStorage.setItem("titanBenchHistory", JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("titanBenchHistory");
  };

  const calculateTotalAndTier = (
    finalScores: BenchmarkScores
  ): { total: number; tier: PowerTier } => {
    // Weighted formula: Single-core and GPU are reliable, multi-core is capped by browsers
    // Single×10 + Multi×0.5 + GPU×10
    const total = Math.floor(
      finalScores.cpuSingle * 10 +
        finalScores.cpuMulti * 0.5 +
        finalScores.gpuScore * 10
    );

    const tier =
      [...POWER_TIERS].reverse().find((t) => total >= t.minScore) ||
      POWER_TIERS[0];
    return { total, tier };
  };

  const runBenchmark = useCallback(async () => {
    setStatus(BenchmarkStatus.RUNNING_CPU_SINGLE);
    setScores({ cpuSingle: 0, cpuMulti: 0, gpuScore: 0 });
    setCurrentTier(null);
    setTotalScore(0);
    setProgress(0);
    setCopied(false);

    // Refresh system info before run in case window moved monitors
    const currentSysInfo = getSystemInfo();
    setSystemInfo(currentSysInfo);

    try {
      // 1. CPU Single Core (Warmup + Test is longer now)
      setProgress(10);
      const singleScore = await runCpuSingleCore(2500);
      setScores((prev) => ({ ...prev, cpuSingle: singleScore }));

      // 2. CPU Multi Core
      setStatus(BenchmarkStatus.RUNNING_CPU_MULTI);
      setProgress(40);
      const multiScore = await runCpuMultiCore(3000);
      setScores((prev) => ({ ...prev, cpuMulti: multiScore }));

      // 3. GPU
      setStatus(BenchmarkStatus.RUNNING_GPU);
      setProgress(70);
      const gpuScore = await runGpuBenchmark(3000);
      setScores((prev) => ({ ...prev, gpuScore: gpuScore }));

      // 4. Calculate Results
      setStatus(BenchmarkStatus.CALCULATING);
      setProgress(95);

      setTimeout(() => {
        const finalScores = {
          cpuSingle: singleScore,
          cpuMulti: multiScore,
          gpuScore,
        };
        const { total, tier } = calculateTotalAndTier(finalScores);

        setTotalScore(total);
        setCurrentTier(tier);
        setStatus(BenchmarkStatus.COMPLETED);
        setProgress(100);

        // Create History Entry
        const newEntry: HistoryEntry = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          scores: finalScores,
          system: currentSysInfo,
          totalScore: total,
          tierName: tier.name,
          tierColor: tier.color,
        };

        saveToHistory(newEntry);
      }, 800);
    } catch (e) {
      console.error(e);
      setStatus(BenchmarkStatus.ERROR);
    }
  }, [history]);

  const handleCopyPrompt = () => {
    // Parse userAgent for cleaner display
    const ua = systemInfo?.userAgent || "";
    const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
    const osMatch = ua.match(
      /(Mac OS X|Windows NT|Linux|Android|iOS)[\s\d._]*/
    );
    const browserInfo = browserMatch ? browserMatch[0] : "Unknown Browser";
    const osInfo = osMatch
      ? osMatch[0].replace(/_/g, ".")
      : systemInfo?.platform || "Unknown OS";

    const text = `# TitanBench Results Analysis Request

## My Benchmark Results
| Metric | Score | Description |
|--------|-------|-------------|
| Single-Core | ${scores.cpuSingle.toLocaleString()} | Single-threaded CPU performance |
| Multi-Core | ${scores.cpuMulti.toLocaleString()} | Multi-threaded CPU performance (${
      systemInfo?.threads || "?"
    } threads used) |
| GPU Compute | ${scores.gpuScore.toLocaleString()} | WebGL shader compute performance |
| **Composite** | **${totalScore.toLocaleString()}** | Weighted total score |
| Tier Rank | ${currentTier?.name} | ${currentTier?.description || ""} |

## System Information

### Device Info (from browser APIs)
| Property | Value |
|----------|-------|
| Operating System | ${osInfo} |
| Browser | ${browserInfo} |
| Platform | ${systemInfo?.platform || "Unknown"} |
| Display | ${
      systemInfo?.physicalResolution || systemInfo?.resolution || "Unknown"
    } (physical pixels) |

### GPU Details
| Property | Value |
|----------|-------|
| GPU Renderer | ${systemInfo?.gpuRenderer || "Unknown"} |
| GPU Vendor | ${systemInfo?.gpuVendor || "Unknown"} |
| WebGL Version | ${systemInfo?.gpuDriverVersion || "Unknown"} |

### Browser-Reported Hardware (may be capped for privacy)
| Property | Reported Value | Note |
|----------|----------------|------|
| CPU Threads | ${
      systemInfo?.threads || "Unknown"
    } | Browsers often cap at 8-16 for fingerprinting protection |
| Device Memory | ${
      systemInfo?.memory || "Unknown"
    } | Capped at 8GB max by navigator.deviceMemory spec |

### Raw User Agent
\`\`\`
${systemInfo?.userAgent || "Unknown"}
\`\`\`

## Benchmark Methodology (for AI context)

### How TitanBench Works:
1. **Single-Core Test** (2.5s): Runs intensive math operations (sin, cos, sqrt) in a Web Worker. Score = operations completed / 1000. Higher = faster single-thread performance.

2. **Multi-Core Test** (3s): Spawns N workers (one per logical core as reported by browser) running the same math workload in parallel. Score = total operations across all workers / 1000.

3. **GPU Compute Test** (3s): Renders a WebGL fragment shader with 600 loop iterations per pixel at 640x640 resolution. Score = (FPS × 150 × consistency_bonus). Uses gl.finish() for accurate timing.

### Composite Score Formula:
\`\`\`
Composite = (Single-Core × 10) + (Multi-Core × 0.5) + (GPU × 10)
\`\`\`
Note: Multi-core is weighted lower because browser thread capping makes it unreliable.

### Tier Thresholds:
| Tier | Min Score | Use Case |
|------|-----------|----------|
${POWER_TIERS.map(
  (tier) =>
    `| ${tier.name} | ${tier.minScore.toLocaleString()} | ${tier.description} |`
).join("\n")}

## Important Context for Analysis:
- **Browser limitations**: Thread count and memory are often capped by browsers for fingerprinting protection. Multi-core scores may be lower than native benchmarks due to this.
- **GPU via WebGL**: This tests WebGL compute, not native GPU (Vulkan/Metal). Actual GPU performance in games/apps may differ.
- **JavaScript engine**: Performance varies by browser. V8 (Chrome) typically fastest, followed by SpiderMonkey (Firefox) and JavaScriptCore (Safari).

## Questions for Analysis:
1. Based on my GPU renderer string and scores, what device/chip am I likely using?
2. How do my scores compare to typical modern devices (2023-2024 laptops/desktops)?
3. Which component (CPU single/multi, GPU) appears to be my bottleneck?
4. Based on these scores, what real-world tasks would my device handle well or struggle with?
5. Given the browser may be capping my thread count, what's your estimate of my actual CPU core count based on the single vs multi-core scaling ratio?`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusMessage = () => {
    switch (status) {
      case BenchmarkStatus.RUNNING_CPU_SINGLE:
        return "Igniting Single Core (Warming Up)...";
      case BenchmarkStatus.RUNNING_CPU_MULTI:
        return "Full Throttle Multi-Core...";
      case BenchmarkStatus.RUNNING_GPU:
        return "Heavy Shader Compilation...";
      case BenchmarkStatus.CALCULATING:
        return "Calculating Power Level...";
      case BenchmarkStatus.COMPLETED:
        return "Benchmark Complete";
      case BenchmarkStatus.ERROR:
        return "Benchmark Failed";
      default:
        return "Ready to Bench";
    }
  };

  const formatNumber = (num: number) => num.toLocaleString("de-DE");

  const isRunning =
    status !== BenchmarkStatus.IDLE &&
    status !== BenchmarkStatus.COMPLETED &&
    status !== BenchmarkStatus.ERROR;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="text-cyan-400" size={24} />
            <h1 className="text-xl font-bold tracking-tight">
              Titan<span className="text-cyan-400">Bench</span>
            </h1>
          </div>
          <a
            href="https://github.com/HoangTran0410/titanbench"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <Github size={20} />
            <span className="text-xs font-mono hidden sm:block">GitHub</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* Hero / Status Section */}
        <section className="mb-12 text-center">
          {/* Welcome Info - Only show when IDLE */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
              Browser Hardware Diagnostics
            </h2>
            <p className="text-slate-400 mb-4">
              Benchmark your CPU and GPU performance in seconds, right in your
              browser.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
                <Cpu className="text-cyan-400" size={14} /> CPU Single
              </span>
              <span className="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
                <Layers className="text-indigo-400" size={14} /> CPU Multi
              </span>
              <span className="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
                <Gamepad2 className="text-pink-400" size={14} /> GPU
              </span>
              {/* <span className="text-slate-600">~8s</span> */}
            </div>
          </div>

          <div className="inline-flex items-center justify-center p-3 rounded-full bg-slate-900 border border-slate-800 mt-8 shadow-lg">
            <span
              className={`w-2.5 h-2.5 rounded-full mr-3 ${
                isRunning
                  ? "animate-pulse bg-cyan-400"
                  : status === BenchmarkStatus.COMPLETED
                  ? "bg-green-400"
                  : "bg-slate-500"
              }`}
            ></span>
            <span className="text-sm font-medium text-slate-300 uppercase tracking-wide">
              {getStatusMessage()}
            </span>
          </div>

          <div className="max-w-2xl mx-auto relative group flex justify-center py-4">
            {/* Dynamic background effect behind start button */}
            <div
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full transition-all duration-700
                ${
                  isRunning
                    ? "bg-cyan-500 opacity-20 blur-3xl scale-150 animate-pulse"
                    : status === BenchmarkStatus.COMPLETED
                    ? "bg-green-500 opacity-10 blur-2xl scale-100"
                    : "bg-blue-500 opacity-0 blur-xl scale-75"
                }
             `}
            ></div>

            <button
              onClick={runBenchmark}
              disabled={isRunning}
              className={`relative z-10 px-16 py-6 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-2xl overflow-hidden group
                ${
                  isRunning
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    : "bg-gradient-to-br from-slate-800 to-slate-900 text-white border border-slate-700 hover:border-cyan-500/50"
                }
              `}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] ${
                  isRunning ? "hidden" : ""
                }`}
              ></div>

              {status === BenchmarkStatus.COMPLETED ? (
                <RotateCcw size={24} />
              ) : status === BenchmarkStatus.IDLE ? (
                <Play size={24} fill="currentColor" />
              ) : (
                <Sparkles size={24} className="animate-bounce" />
              )}
              <span>
                {status === BenchmarkStatus.COMPLETED
                  ? "Rerun"
                  : status === BenchmarkStatus.IDLE
                  ? "Start"
                  : "Running"}
              </span>
            </button>
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div className="max-w-md mx-auto mt-8">
              <div className="flex justify-between text-xs text-slate-400 mb-2 font-mono">
                <span>PROGRESS</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300 ease-linear shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Results Grid - Using SVG Radial Scores with Icons */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <RadialScore
            score={scores.cpuSingle}
            max={300000}
            label="Single-Core"
            color="#22d3ee" // cyan-400
            icon={<Cpu size={28} />}
          />
          <RadialScore
            score={scores.cpuMulti}
            max={2500000}
            label="Multi-Core"
            color="#818cf8" // indigo-400
            icon={<Layers size={28} />}
          />
          <RadialScore
            score={scores.gpuScore}
            max={15000}
            label="GPU Compute"
            color="#f472b6" // pink-400
            icon={<Gamepad2 size={28} />}
          />
        </section>

        {/* Power Tier Card (Full Width) */}
        <div className="w-full">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between group min-h-[400px]">
            {/* Background decoration */}
            <div className="absolute -top-10 -right-10 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
              <Trophy size={300} />
            </div>

            <div className="flex justify-between items-start relative z-10">
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                <Zap size={16} className="text-yellow-500" /> Performance Rank
              </h3>

              {/* Copy Prompt Button */}
              {status === BenchmarkStatus.COMPLETED && (
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-2 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                >
                  {copied ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                  {copied ? "Copied to Clipboard" : "Copy AI Prompt"}
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
              {status === BenchmarkStatus.IDLE && (
                <div className="text-center space-y-4">
                  <div className="text-slate-500 text-sm">
                    Awaiting benchmark results...
                  </div>
                  <div className="flex gap-1 justify-center opacity-30">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-8 bg-slate-500 rounded-full"
                      ></div>
                    ))}
                  </div>
                </div>
              )}

              {status !== BenchmarkStatus.IDLE &&
                status !== BenchmarkStatus.COMPLETED &&
                status !== BenchmarkStatus.ERROR && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-slate-800 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-12 h-12 border-4 border-t-cyan-400 rounded-full animate-spin"></div>
                    </div>
                    <span className="text-cyan-400 text-sm font-mono animate-pulse">
                      ANALYZING HARDWARE...
                    </span>
                  </div>
                )}

              {status === BenchmarkStatus.COMPLETED && currentTier && (
                <div className="w-full animate-in fade-in zoom-in duration-500">
                  <div className="flex flex-col items-center text-center">
                    {/* Total Score Display */}
                    <div className="relative mb-8 group cursor-default">
                      <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-1">
                        Composite Score
                      </div>
                      <div className="text-6xl md:text-8xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-2xl">
                        {formatNumber(totalScore)}
                      </div>
                    </div>

                    {/* Rank Name */}
                    <div
                      className={`text-4xl md:text-6xl font-black italic tracking-tighter mb-4 ${currentTier.color} drop-shadow-[0_0_25px_rgba(0,0,0,0.5)] transform -skew-x-6`}
                    >
                      {currentTier.name}
                    </div>

                    <p className="text-slate-400 text-lg max-w-xl font-light mb-8">
                      {currentTier.description}
                    </p>
                  </div>

                  {/* Tier Meter Visual */}
                  <div className="mt-6 px-4 md:px-24 w-full">
                    <div className="h-3 bg-slate-800 rounded-full flex w-full relative">
                      {POWER_TIERS.map((tier, index) => {
                        const isActive = totalScore >= tier.minScore;
                        const isCurrent = currentTier.name === tier.name;
                        return (
                          <div
                            key={index}
                            className={`group/tier flex-1 transition-all duration-700 relative border-r border-slate-900 last:border-0 first:rounded-l-full last:rounded-r-full
                              ${
                                isActive
                                  ? isCurrent
                                    ? tier.color.replace("text-", "bg-")
                                    : "bg-slate-600"
                                  : "bg-slate-800"
                              }
                              ${
                                isCurrent
                                  ? "shadow-[0_0_15px_currentColor] z-10"
                                  : ""
                              }
                              cursor-help
                            `}
                          >
                            {/* Tooltip */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 hidden group-hover/tier:block z-50 pointer-events-none">
                              <div className="bg-slate-950/95 backdrop-blur text-slate-200 text-xs rounded-lg p-3 border border-slate-700 shadow-2xl relative">
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-950 border-r border-b border-slate-700 rotate-45"></div>
                                <div
                                  className={`font-bold ${tier.color} mb-1 border-b border-slate-800 pb-1`}
                                >
                                  {tier.name}
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1.5 font-mono">
                                  <span>Min Score:</span>
                                  <span className="text-slate-200">
                                    {tier.minScore.toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 leading-snug">
                                  {tier.description}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-600 uppercase tracking-widest mt-2 font-mono">
                      <span>Low End</span>
                      <span>Titan Class</span>
                    </div>
                  </div>

                  {/* System Info */}
                  {systemInfo && (
                    <div className="mt-8 pt-6 border-t border-slate-800">
                      <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">
                        System Detected
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                          <div className="text-slate-500 mb-1">Platform</div>
                          <div className="text-slate-300 font-mono">
                            {systemInfo.platform}
                          </div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                          <div className="text-slate-500 mb-1">GPU</div>
                          <div
                            className="text-slate-300 font-mono truncate"
                            title={systemInfo.gpuRenderer}
                          >
                            {systemInfo.gpuRenderer
                              .split("/")[0]
                              .split("(")[0]
                              .trim()}
                          </div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                          <div className="text-slate-500 mb-1">CPU Threads</div>
                          <div className="text-slate-300 font-mono">
                            {systemInfo.threads}
                            {systemInfo.threadsNote && (
                              <span className="text-slate-600 text-[10px]">
                                {" "}
                                {systemInfo.threadsNote}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                          <div className="text-slate-500 mb-1">Display</div>
                          <div className="text-slate-300 font-mono">
                            {systemInfo.physicalResolution}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History Section */}
        <HistoryLog history={history} onClear={clearHistory} />

        {/* How It Works Section */}
        <section className="mt-16 pt-12 border-t border-slate-800">
          <button
            onClick={() => setHowItWorksOpen(!howItWorksOpen)}
            className="w-full text-left text-2xl font-bold text-white flex items-center justify-between gap-3 group hover:text-cyan-400 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-cyan-400">🔬</span> How It Works
            </div>
            <ChevronDown
              size={24}
              className={`text-slate-400 group-hover:text-cyan-400 transition-transform duration-300 ${
                howItWorksOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              howItWorksOpen
                ? "max-h-[2000px] opacity-100 mt-8"
                : "max-h-0 opacity-0 mt-0"
            }`}
          >
            {/* Benchmark Tests */}
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-slate-300 mb-4">
                Benchmark Tests
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/80">
                    <tr className="text-left text-slate-400 uppercase text-xs tracking-wider">
                      <th className="px-4 py-3 font-semibold">Test</th>
                      <th className="px-4 py-3 font-semibold">Duration</th>
                      <th className="px-4 py-3 font-semibold">Method</th>
                      <th className="px-4 py-3 font-semibold">
                        Score Calculation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr className="bg-slate-900/30 hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-cyan-400">
                        Single-Core
                      </td>
                      <td className="px-4 py-3 text-slate-300">2.5s</td>
                      <td className="px-4 py-3 text-slate-400">
                        Web Worker running sin/cos/sqrt math loops
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                        Operations ÷ 1000
                      </td>
                    </tr>
                    <tr className="bg-slate-900/30 hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-indigo-400">
                        Multi-Core
                      </td>
                      <td className="px-4 py-3 text-slate-300">3s</td>
                      <td className="px-4 py-3 text-slate-400">
                        N workers (one per logical core) in parallel
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                        Total ops ÷ 1000
                      </td>
                    </tr>
                    <tr className="bg-slate-900/30 hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-pink-400">
                        GPU Compute
                      </td>
                      <td className="px-4 py-3 text-slate-300">3s</td>
                      <td className="px-4 py-3 text-slate-400">
                        WebGL fragment shader (600 iterations/pixel)
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                        FPS × 150 × consistency
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Composite Score Formula */}
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-slate-300 mb-4">
                Composite Score Formula
              </h3>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <code className="text-cyan-400 font-mono text-lg block mb-3">
                  Composite = (Single-Core × 10) + (Multi-Core × 0.5) + (GPU ×
                  10)
                </code>
                <p className="text-slate-500 text-sm">
                  <span className="text-yellow-500">Note:</span> Multi-core is
                  weighted lower because browser thread capping makes it
                  unreliable.
                </p>
              </div>
            </div>

            {/* Power Tiers */}
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-slate-300 mb-4">
                Power Tiers
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/80">
                    <tr className="text-left text-slate-400 uppercase text-xs tracking-wider">
                      <th className="px-4 py-3 font-semibold">Tier</th>
                      <th className="px-4 py-3 font-semibold">Min Score</th>
                      <th className="px-4 py-3 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {POWER_TIERS.map((tier, index) => (
                      <tr
                        key={index}
                        className="bg-slate-900/30 hover:bg-slate-800/50 transition-colors"
                      >
                        <td className={`px-4 py-3 font-medium ${tier.color}`}>
                          {tier.emoji} {tier.name}
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-mono">
                          {tier.minScore.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {tier.shortDesc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Browser Limitations */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <span className="text-yellow-500">⚠️</span> Browser Limitations
              </h3>
              <p className="text-slate-500 text-sm mb-4">
                Due to browser privacy protections:
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/80">
                    <tr className="text-left text-slate-400 uppercase text-xs tracking-wider">
                      <th className="px-4 py-3 font-semibold">API</th>
                      <th className="px-4 py-3 font-semibold">Limitation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr className="bg-slate-900/30 hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-cyan-400 text-xs">
                        navigator.hardwareConcurrency
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        Often capped at 8-16 threads
                      </td>
                    </tr>
                    <tr className="bg-slate-900/30 hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-cyan-400 text-xs">
                        navigator.deviceMemory
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        Max 8GB reported
                      </td>
                    </tr>
                    <tr className="bg-slate-900/30 hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-cyan-400 text-xs">
                        screen.width/height
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        Returns CSS pixels (use devicePixelRatio for physical)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-slate-600 text-xs mt-3">
                TitanBench accounts for these limitations and explains them in
                the AI analysis prompt.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 text-center text-slate-600 text-xs border-t border-slate-900 bg-slate-950">
        <p>TitanBench • Built with ❤️ by Hoang Tran</p>
      </footer>
    </div>
  );
};

export default App;
