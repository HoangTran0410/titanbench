<div align="center">

# ⚡ TitanBench

### Browser-Based Hardware Benchmark Tool

[![Built with React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)

**Measure your device's CPU and GPU performance directly in the browser.**

[Try it Live](http://hoangtran99.is-a.dev/titanbench) · [How It Works](#-how-it-works) · [AI Analysis](#-ai-analysis-feature)

</div>

---

## ✨ Features

- 🧠 **Single-Core CPU Benchmark** - Tests raw single-threaded performance using intensive math operations
- 🔥 **Multi-Core CPU Benchmark** - Utilizes all available CPU threads via Web Workers
- 🎮 **GPU Compute Benchmark** - Heavy WebGL shader workload to stress-test your GPU
- 📊 **Power Tier Classification** - Ranks your device from "Potato" to "Titan Workstation"
- 🤖 **AI Analysis Prompt** - One-click copy of detailed results for AI analysis (ChatGPT, Claude, Gemini)
- 💾 **History Tracking** - All benchmark results saved locally

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun

### Installation

```bash
# Clone the repository
git clone https://github.com/user/titanbench.git
cd titanbench

# Install dependencies
bun install   # or: npm install

# Start development server
bun run dev   # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
bun run build   # or: npm run build
bun run preview # or: npm run preview
```

---

## 🔬 How It Works

### Benchmark Tests

| Test | Duration | Method | Score Calculation |
|------|----------|--------|-------------------|
| **Single-Core** | 2.5s | Web Worker running sin/cos/sqrt math loops | Operations ÷ 1000 |
| **Multi-Core** | 3s | N workers (one per logical core) in parallel | Total ops ÷ 1000 |
| **GPU Compute** | 3s | WebGL fragment shader (600 iterations/pixel) | FPS × 150 × consistency |

### Composite Score Formula

```
Composite = (Single-Core × 2) + (Multi-Core × 1) + (GPU × 10)
```

### Power Tiers

| Tier | Min Score | Description |
|------|-----------|-------------|
| 🥔 Potato / Calculator | 0 | Basic tasks only |
| 📎 Office Clerk | 100,000 | Documents, browsing |
| 💻 Student Laptop | 300,000 | Light gaming, multitasking |
| 🎨 Creative Pro | 600,000 | Video editing, development |
| 🎮 Gaming Rig | 1,000,000 | AAA gaming ready |
| ⚡ Titan Workstation | 1,800,000 | Heavy rendering, computation |

---

## 🤖 AI Analysis Feature

After running a benchmark, click **"Copy AI Prompt"** to get a detailed markdown report including:

- All benchmark scores with explanations
- Full system information (GPU, platform, browser, resolution)
- Benchmark methodology for AI context
- Structured analysis questions

Paste into ChatGPT, Claude, or Gemini for personalized hardware analysis!

---

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite 6** - Build tool & dev server
- **Lucide React** - Icons
- **Web Workers** - CPU benchmark isolation
- **WebGL** - GPU compute testing

---

## 📁 Project Structure

```
titanbench/
├── src/
│   ├── App.tsx              # Main application logic
│   ├── index.tsx            # React entry point
│   ├── index.html           # HTML template
│   ├── types.ts             # TypeScript definitions
│   ├── components/
│   │   ├── RadialScore.tsx  # Circular score display
│   │   └── HistoryLog.tsx   # Benchmark history panel
│   └── services/
│       └── benchmarkUtils.ts # Benchmark algorithms
├── vite.config.ts           # Vite configuration
├── CLAUDE.md                # AI assistant context
└── README.md
```

---

## ⚠️ Browser Limitations

Due to browser privacy protections:

| API | Limitation |
|-----|------------|
| `navigator.hardwareConcurrency` | Often capped at 8-16 threads |
| `navigator.deviceMemory` | Max 8GB reported |
| `screen.width/height` | Returns CSS pixels (use devicePixelRatio for physical) |

TitanBench accounts for these limitations and explains them in the AI analysis prompt.

---

## 📄 License

MIT License - feel free to use, modify, and distribute.

---

<div align="center">

**Built with ❤️ for hardware enthusiasts**

</div>
