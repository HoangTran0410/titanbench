const A=`
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
`,U=()=>{const c=navigator.hardwareConcurrency||4,s=c<=8?" (may be browser-capped)":"",n=navigator.platform,e=navigator.userAgent,a=navigator.deviceMemory,m=a?`${a} GB`:"Unknown",h=a&&a<=8?" (browser-reported, may be capped)":"",o=window.devicePixelRatio||1,t=window.screen.width,u=window.screen.height,v=Math.round(t*o),g=Math.round(u*o),R=`${t}x${u}`,f=o!==1?`${v}x${g} @${o}x`:`${t}x${u}`;let w="Unknown GPU",y="Unknown Vendor",S="Unknown";const E="Protected";try{const p=document.createElement("canvas"),r=p.getContext("webgl")||p.getContext("experimental-webgl");if(r){const i=r.getExtension("WEBGL_debug_renderer_info");i&&(w=r.getParameter(i.UNMASKED_RENDERER_WEBGL),y=r.getParameter(i.UNMASKED_VENDOR_WEBGL)),S=r.getParameter(r.VERSION)}}catch(p){console.warn("Could not get GPU info",p)}return{threads:c,threadsNote:s,platform:n,userAgent:e,gpuRenderer:w,gpuVendor:y,gpuDriverVersion:S,vram:E,memory:m,memoryNote:h,resolution:R,physicalResolution:f,devicePixelRatio:o}},L=async(c=2500)=>new Promise(s=>{const n=new Blob([A],{type:"application/javascript"}),e=URL.createObjectURL(n),l=new Worker(e);l.onmessage=a=>{l.terminate(),URL.revokeObjectURL(e);const m=a.data.ops??a.data;s(Math.floor(m/1e3))},l.postMessage({duration:c})}),C=async(c=3e3)=>{const s=navigator.hardwareConcurrency||8,n=[],e=[],l=new Blob([A],{type:"application/javascript"}),a=URL.createObjectURL(l);for(let o=0;o<s;o++){const t=new Worker(a);n.push(t),e.push(new Promise(u=>{t.onmessage=v=>{const g=v.data.ops??v.data;u(g)}}))}n.forEach((o,t)=>{setTimeout(()=>o.postMessage({duration:c}),t*5)});const m=await Promise.all(e);n.forEach(o=>o.terminate()),URL.revokeObjectURL(a);const h=m.reduce((o,t)=>o+t,0);return Math.floor(h/1e3)},x=async(c=3e3)=>new Promise(s=>{const n=document.createElement("canvas");n.width=640,n.height=640;const e=n.getContext("webgl",{antialias:!1,powerPreference:"high-performance",preserveDrawingBuffer:!1,failIfMajorPerformanceCaveat:!1});if(!e){s(0);return}const l=`
      attribute vec4 position;
      void main() {
        gl_Position = position;
      }
    `,a=`
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
    `,m=(r,i,b)=>{const d=r.createShader(i);return d?(r.shaderSource(d,b),r.compileShader(d),r.getShaderParameter(d,r.COMPILE_STATUS)?d:(r.deleteShader(d),null)):null},h=m(e,e.VERTEX_SHADER,l),o=m(e,e.FRAGMENT_SHADER,a);if(!h||!o){s(0);return}const t=e.createProgram();if(!t){s(0);return}e.attachShader(t,h),e.attachShader(t,o),e.linkProgram(t),e.useProgram(t);const u=e.getAttribLocation(t,"position"),v=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,v),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(u),e.vertexAttribPointer(u,2,e.FLOAT,!1,0,0);const g=e.getUniformLocation(t,"u_time"),R=e.getUniformLocation(t,"u_resolution");e.uniform2f(R,n.width,n.height);let f=0,w=0;const y=performance.now();let S=y,E=!0;const p=()=>{if(!E)return;const r=performance.now(),i=r-y;if(i>c){E=!1;const d=f/i*1e3,M=f>0?w/f:16.67,_=Math.min(1.15,16.67/Math.max(M,1)),P=Math.floor(d*150*_);s(P);return}const b=r-S;f>0&&(w+=b),S=r,e.uniform1f(g,i/1e3),e.drawArrays(e.TRIANGLES,0,6),e.finish(),f++,requestAnimationFrame(p)};p()});export{C as a,x as b,U as g,L as r};
