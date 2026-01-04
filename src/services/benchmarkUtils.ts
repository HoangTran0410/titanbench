// Worker script as a string to be blobbed
// Optimized for maximum throughput and accurate measurement
const workerScript = `
  self.onmessage = function(e) {
    const duration = e.data.duration;
    const BATCH_SIZE = 100000; // Increased batch for less overhead

    // --- WARMUP PHASE (Multi-stage) ---
    // Stage 1: Cache warming (100ms) - lighter ops to wake up caches
    const cacheWarmStart = performance.now();
    let dummy = 1.5;
    while (performance.now() - cacheWarmStart < 100) {
      dummy = dummy * 1.0001 + 0.0001;
    }

    // Stage 2: JIT + P-core migration (200ms) - full intensity
    const warmStart = performance.now();
    while (performance.now() - warmStart < 200) {
      dummy = Math.sin(dummy) + Math.cos(dummy + 0.5);
      dummy = Math.sqrt(dummy * dummy + 1.1);
    }

    // --- MEASUREMENT PHASE ---
    const start = performance.now();
    let operations = 0;

    // Localize for V8 optimization
    let val = dummy;
    const sin = Math.sin;
    const cos = Math.cos;
    const sqrt = Math.sqrt;

    // Unrolled inner loop for better ILP (Instruction Level Parallelism)
    while (performance.now() - start < duration) {
      for (let i = 0; i < BATCH_SIZE; i += 4) {
        // Unroll 4x to reduce loop overhead and improve pipelining
        val = sin(val * 1.0001) * cos(val + 0.1);
        val = sqrt(val * val + 1.1);

        val = sin(val * 1.0001) * cos(val + 0.1);
        val = sqrt(val * val + 1.1);

        val = sin(val * 1.0001) * cos(val + 0.1);
        val = sqrt(val * val + 1.1);

        val = sin(val * 1.0001) * cos(val + 0.1);
        val = sqrt(val * val + 1.1);
      }
      operations += BATCH_SIZE;
    }

    // Prevent dead code elimination
    self.postMessage({ ops: operations, checksum: val });
  };
`;

export const getSystemInfo = (): {
  threads: number;
  threadsNote: string;
  platform: string;
  userAgent: string;
  gpuRenderer: string;
  gpuVendor: string;
  gpuDriverVersion: string;
  vram: string;
  memory: number | string;
  memoryNote: string;
  resolution: string;
  physicalResolution: string;
  devicePixelRatio: number;
} => {
  // Note: hardwareConcurrency is often capped by browsers (Chrome caps at 8-16 for fingerprinting)
  const threads = navigator.hardwareConcurrency || 4;
  const threadsNote = threads <= 8 ? " (may be browser-capped)" : "";

  const platform = navigator.platform;
  const userAgent = navigator.userAgent;

  // deviceMemory is capped at 8GB max by spec, often lower due to fingerprinting protection
  const navWithMemory = navigator as Navigator & { deviceMemory?: number };
  const deviceMemory = navWithMemory.deviceMemory;
  const memory = deviceMemory ? `${deviceMemory} GB` : "Unknown";
  const memoryNote =
    deviceMemory && deviceMemory <= 8
      ? " (browser-reported, may be capped)"
      : "";

  // Resolution: CSS pixels vs Physical pixels
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = window.screen.width;
  const cssHeight = window.screen.height;
  const physicalWidth = Math.round(cssWidth * dpr);
  const physicalHeight = Math.round(cssHeight * dpr);

  const resolution = `${cssWidth}x${cssHeight}`;
  const physicalResolution =
    dpr !== 1
      ? `${physicalWidth}x${physicalHeight} @${dpr}x`
      : `${cssWidth}x${cssHeight}`;

  let gpuRenderer = "Unknown GPU";
  let gpuVendor = "Unknown Vendor";
  let gpuDriverVersion = "Unknown";
  const vram = "Protected";

  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      }
      gpuDriverVersion = gl.getParameter(gl.VERSION);
    }
  } catch (e) {
    console.warn("Could not get GPU info", e);
  }

  return {
    threads,
    threadsNote,
    platform,
    userAgent,
    gpuRenderer,
    gpuVendor,
    gpuDriverVersion,
    vram,
    memory,
    memoryNote,
    resolution,
    physicalResolution,
    devicePixelRatio: dpr,
  };
};

export const runCpuSingleCore = async (
  durationMs: number = 2500
): Promise<number> => {
  return new Promise((resolve) => {
    const blob = new Blob([workerScript], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (e) => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl); // Clean up blob URL to prevent memory leak
      // Handle new response format with ops/checksum
      const ops = e.data.ops ?? e.data;
      resolve(Math.floor(ops / 1000));
    };

    worker.postMessage({ duration: durationMs });
  });
};

export const runCpuMultiCore = async (
  durationMs: number = 3000
): Promise<number> => {
  // Use logical cores. Modern browsers often clamp this to prevent fingerprinting,
  // but on local/trusted contexts it might work.
  const threadCount = navigator.hardwareConcurrency || 8;
  const workers: Worker[] = [];
  const promises: Promise<number>[] = [];

  const blob = new Blob([workerScript], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);

  for (let i = 0; i < threadCount; i++) {
    const worker = new Worker(url);
    workers.push(worker);
    promises.push(
      new Promise((resolve) => {
        worker.onmessage = (e) => {
          // Handle new response format with ops/checksum
          const ops = e.data.ops ?? e.data;
          resolve(ops);
        };
      })
    );
  }

  // Reduced stagger (5ms) - minimal to prevent freeze, keeps cores synchronized
  workers.forEach((w, index) => {
    setTimeout(() => w.postMessage({ duration: durationMs }), index * 5);
  });

  const results = await Promise.all(promises);
  workers.forEach((w) => w.terminate());
  URL.revokeObjectURL(url);

  const totalOps = (results as number[]).reduce((a, b) => a + b, 0);
  return Math.floor(totalOps / 1000);
};

export const runGpuBenchmark = async (
  durationMs: number = 3000
): Promise<number> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    // Increased resolution for more GPU stress
    canvas.width = 640;
    canvas.height = 640;
    const gl = canvas.getContext("webgl", {
      antialias: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false,
    });

    if (!gl) {
      resolve(0);
      return;
    }

    const vsSource = `
      attribute vec4 position;
      void main() {
        gl_Position = position;
      }
    `;

    // Increased complexity massively (800 iterations)
    // This forces the GPU to actually calculate, making the frame time > 16ms (60fps)
    // for most cards, which effectively unbinds the score from V-Sync limits.
    const fsSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float color = 0.0;
        float s = sin(u_time);
        float c = cos(u_time);

        // Very heavy loop
        for(float i = 1.0; i < 600.0; i++) {
            uv.x += 0.01 * s / i * sin(uv.y * i + u_time);
            uv.y += 0.01 * c / i * cos(uv.x * i + u_time);
            float dist = length(uv - vec2(0.5));
            color += sin(dist * 10.0 + u_time) / i;
        }

        gl_FragColor = vec4(color, c, s, 1.0);
      }
    `;

    const createShader = (
      gl: WebGLRenderingContext,
      type: number,
      source: string
    ) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) {
      resolve(0);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      resolve(0);
      return;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "position");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    let frameCount = 0;
    let totalFrameTime = 0;
    const startTime = performance.now();
    let lastFrameTime = startTime;
    let running = true;

    const render = () => {
      if (!running) return;
      const now = performance.now();
      const elapsed = now - startTime;

      if (elapsed > durationMs) {
        running = false;
        // Enhanced scoring with consistency factor
        const avgFps = (frameCount / elapsed) * 1000;
        const avgFrameTime =
          frameCount > 0 ? totalFrameTime / frameCount : 16.67;
        // Bonus for consistent frame times (steadier = better GPU scheduling)
        const consistencyFactor = Math.min(
          1.15,
          16.67 / Math.max(avgFrameTime, 1)
        );
        const score = Math.floor(avgFps * 150 * consistencyFactor);
        resolve(score);
        return;
      }

      // Track frame timing for consistency scoring
      const frameTime = now - lastFrameTime;
      if (frameCount > 0) totalFrameTime += frameTime; // Skip first frame (outlier)
      lastFrameTime = now;

      gl.uniform1f(timeLocation, elapsed / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Use finish() for more accurate GPU timing measurement
      gl.finish();

      frameCount++;
      requestAnimationFrame(render);
    };

    render();
  });
};
