export enum BenchmarkStatus {
  IDLE = "IDLE",
  RUNNING_CPU_SINGLE = "RUNNING_CPU_SINGLE",
  RUNNING_CPU_MULTI = "RUNNING_CPU_MULTI",
  RUNNING_GPU = "RUNNING_GPU",
  CALCULATING = "CALCULATING",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
}

export interface BenchmarkScores {
  cpuSingle: number;
  cpuMulti: number;
  gpuScore: number;
}

export interface SystemInfo {
  threads: number;
  threadsNote: string;
  userAgent: string;
  platform: string;
  gpuRenderer: string;
  gpuVendor: string;
  gpuDriverVersion: string;
  vram: string;
  memory: number | string; // GB
  memoryNote: string;
  resolution: string;
  physicalResolution: string;
  devicePixelRatio: number;
}

export interface PowerTier {
  name: string;
  color: string;
  description: string;
  minScore: number;
}

export interface BenchmarkResult {
  scores: BenchmarkScores;
  system: SystemInfo;
}

export interface HistoryEntry extends BenchmarkResult {
  id: string;
  timestamp: number;
  totalScore: number;
  tierName: string;
  tierColor: string;
}
