# TitanBench - Browser-Based Hardware Benchmark

## Project Overview
TitanBench is a comprehensive browser-based CPU and GPU benchmark tool built with React, TypeScript, and Vite. It measures hardware performance through three key tests: single-core CPU, multi-core CPU, and GPU compute.

## Tech Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Package Manager**: Bun
- **Styling**: Tailwind CSS (via utility classes)
- **Icons**: Lucide React

## Commands

```bash
# Development server (port 3000)
bun run dev

# Production build
bun run build

# Preview production build
bun run preview
```

## Project Structure

```
titanbench/
├── src/
│   ├── App.tsx              # Main application component
│   ├── index.tsx            # React entry point
│   ├── index.html           # HTML template
│   ├── types.ts             # TypeScript type definitions
│   ├── components/
│   │   ├── RadialScore.tsx  # Circular score visualization component
│   │   └── HistoryLog.tsx   # Benchmark history list component
│   └── services/
│       └── benchmarkUtils.ts # Core benchmark logic (CPU/GPU tests)
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── metadata.json            # App metadata
```

## Key Components

### App.tsx
- Main orchestrator for benchmark flow
- Manages benchmark state (IDLE → RUNNING_* → COMPLETED)
- Handles power tier calculation and history management
- Stores history in localStorage (`titanBenchHistory`)

### benchmarkUtils.ts
- `getSystemInfo()`: Detects hardware (threads, GPU, memory, resolution)
- `runCpuSingleCore()`: Single-threaded math benchmark using Web Workers
- `runCpuMultiCore()`: Multi-threaded benchmark across all available cores
- `runGpuBenchmark()`: WebGL-based shader compute test (600 iterations per pixel)

### Power Tiers
Scores are classified into 6 tiers based on composite score:
1. Potato / Calculator (0+)
2. Office Clerk (500k+)
3. Student Laptop (1M+)
4. Creative Pro (1.5M+)
5. Gaming Rig (2M+)
6. Titan Workstation (3M+)

**Composite Score Formula**:
```
total = cpuSingle * 10 + cpuMulti * 0.5 + gpuScore * 10
```
> Multi-core is weighted lower because browser thread capping makes it unreliable.

## Architecture Notes

### Web Worker Pattern
CPU benchmarks use inline Web Workers (blob URLs) to avoid blocking the main thread. Each worker:
1. Runs a 2-stage warmup (100ms cache warming + 200ms JIT/P-core migration)
2. Executes 100,000 math operations per batch (4× loop unrolling)
3. Reports total operations on completion

### GPU Benchmark
Uses WebGL with a computationally heavy fragment shader (600 loop iterations) to stress-test GPU. Measures frames rendered during the test duration.

### State Management
- Uses React's `useState` for local state
- History persisted to `localStorage`
- No external state management library

## Development Patterns
- Components use functional React with hooks
- Tailwind classes for all styling (dark theme: slate-950 background)
- SVG-based visualizations (RadialScore component)
- Lucide icons throughout the UI
