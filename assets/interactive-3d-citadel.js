// ==========================================================================
// SHEKHAR KUMAR — 3D INTERACTIVE HIMALAYAN CITADEL & PROJECT MONUMENTS
// Real-Time WebGL Three.js Engine inspired by Jordan Breton ("My Contemplative Portfolio")
// Features: Multi-Octave FBM Himalayan Valleys, Glacial Fluid River, Cascading Seracs,
// Instanced Pine Forests, IslandBender Curved Horizon, AuroraPass Shimmering Ribbons,
// Volumetric River Mist, Celestial Day/Night/Spirit Transitions, and 5 Architectural Project Shrines.
// ==========================================================================

// --- Procedural Himalayan Synthesis & Fluid River Mathematics ---
function hash2d(x, z) {
  const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x, z) {
  const i = Math.floor(x);
  const j = Math.floor(z);
  const fx = x - i;
  const fz = z - j;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash2d(i, j);
  const b = hash2d(i + 1, j);
  const c = hash2d(i, j + 1);
  const d = hash2d(i + 1, j + 1);
  return (a * (1 - ux) + b * ux) * (1 - uz) + (c * (1 - ux) + d * ux) * uz;
}

function fbm(x, z, octaves = 3) {
  let val = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let o = 0; o < octaves; o++) {
    val += smoothNoise(x * freq, z * freq) * amp;
    freq *= 2.05;
    amp *= 0.5;
  }
  return val;
}

function getRiverCenter(z) {
  const base = Math.sin(z * 0.032) * 9.0 + Math.cos(z * 0.016) * 3.0;
  const centerDist = Math.abs(z);
  const islandDeflect = (centerDist < 20) ? -7.0 * Math.cos((centerDist / 20) * (Math.PI * 0.5)) : 0;
  return base + islandDeflect;
}

function computeTerrainHeight(x, z) {
  const terraces = [
    { x: 0, z: 0, r: 8.5 },
    { x: 22, z: -8, r: 7.5 },
    { x: -22, z: -8, r: 7.5 },
    { x: 18, z: 18, r: 7.5 },
    { x: -18, z: 18, r: 7.5 }
  ];

  const rivX = getRiverCenter(z);
  const dRiv = Math.abs(x - rivX);
  let h = 0;

  if (dRiv < 3.2) {
    h = -0.22 + (dRiv / 3.2) * 0.42; // Glacial riverbed
  } else if (dRiv < 14) {
    const u = (dRiv - 3.2) / (14 - 3.2);
    h = 0.2 + u * u * 2.0;
  } else {
    const u = Math.min(1.0, (dRiv - 14) / 75.0);
    h = 2.2 + Math.pow(u, 1.3) * 26.0;
  }

  // Procedural mountain crags and gullies
  h += fbm(x * 0.03, z * 0.03, 3) * 12.0;

  // Northern Himalayan Massifs
  if (z < -10) {
    const northFactor = Math.min(1.0, (-z - 10) / 70.0);
    h += northFactor * 24.0 * (0.5 + fbm(x * 0.05, z * 0.05, 3) * 0.8);
  }

  // Sculpt sanctuary terraces
  for (const terr of terraces) {
    const d = Math.hypot(x - terr.x, z - terr.z);
    if (d < terr.r) {
      const blend = d / terr.r;
      const smooth = blend * blend * (3 - 2 * blend);
      h = h * smooth + 0.35 * (1 - smooth);
    }
  }

  // IslandBender Curvature
  const r = Math.hypot(x, z);
  if (r > 72) {
    const curve = Math.min(1.5, (r - 72) / 45);
    h -= curve * curve * 22.0;
  }

  return h;
}

function createSnowTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 512);

  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    const wave = Math.sin(y * 0.08 + Math.sin(y * 0.02) * 2.5) * 16;
    for (let x = 0; x < 512; x++) {
      const idx = (y * 512 + x) * 4;
      const sparkle = (Math.random() - 0.5) * 14;
      const sastrugi = Math.sin((x + wave) * 0.035 + y * 0.015) * 12;
      const val = Math.max(180, Math.min(255, 245 + sastrugi + sparkle));

      data[idx] = val;
      data[idx + 1] = Math.min(255, val + 2);
      data[idx + 2] = Math.min(255, val + 6);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 24);
  return tex;
}

function createPineTreeGeometry() {
  // Layered Himalayan Blue Pine with realistic scalloped drooping branch whorls and frosted boughs
  const tiers = [
    { r: 1.75, yBase: 1.15, yApex: 2.35, rot: 0.0 },
    { r: 1.45, yBase: 1.85, yApex: 3.05, rot: 0.45 },
    { r: 1.15, yBase: 2.55, yApex: 3.70, rot: 0.90 },
    { r: 0.85, yBase: 3.25, yApex: 4.30, rot: 1.35 },
    { r: 0.50, yBase: 3.85, yApex: 4.80, rot: 1.80 }
  ];

  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.22, 1.4, 8);
  trunkGeo.translate(0, 0.7, 0);

  let totalPos = trunkGeo.attributes.position.count;
  let totalIdx = trunkGeo.index ? trunkGeo.index.count : 0;

  const N = 16; // 16 radial points per bough whorl with 8 drooping lobes
  tiers.forEach(() => {
    totalPos += 2 + N;
    totalIdx += N * 6; // 2 triangles per segment = 6 indices
  });

  const mergedPos = new Float32Array(totalPos * 3);
  const mergedNorm = new Float32Array(totalPos * 3);
  const mergedCol = new Float32Array(totalPos * 3);
  const mergedIdx = new Uint16Array(totalIdx);

  // 1. Trunk
  const tPos = trunkGeo.attributes.position.array;
  const tNorm = trunkGeo.attributes.normal.array;
  const tCount = trunkGeo.attributes.position.count;
  mergedPos.set(tPos, 0);
  mergedNorm.set(tNorm, 0);
  for (let k = 0; k < tCount; k++) {
    mergedCol[k * 3] = 0.16;     // Weathered Himalayan pine bark
    mergedCol[k * 3 + 1] = 0.11;
    mergedCol[k * 3 + 2] = 0.07;
  }

  const tIdx = trunkGeo.index.array;
  mergedIdx.set(tIdx, 0);

  let pOffset = tCount;
  let iOffset = tIdx.length;
  let vOffset = tCount;

  // 2. Tiers
  tiers.forEach((t) => {
    const tierPos = new Float32Array((2 + N) * 3);
    const tierNorm = new Float32Array((2 + N) * 3);
    const tierCol = new Float32Array((2 + N) * 3);

    // Apex (index 0)
    tierPos[0] = 0;
    tierPos[1] = t.yApex;
    tierPos[2] = 0;

    // Recessed underside apex (index 1) - arched up inside canopy
    tierPos[3] = 0;
    tierPos[4] = t.yBase + 0.18;
    tierPos[5] = 0;

    // 16 scalloped perimeter points (indices 2 to 17)
    for (let j = 0; j < N; j++) {
      const theta = (j / N) * Math.PI * 2 + t.rot;
      const lobeFactor = 1.0 + 0.32 * Math.cos(8 * theta) + 0.14 * Math.sin(16 * theta);
      const r = t.r * lobeFactor;
      const yDroop = t.yBase - 0.20 * Math.cos(8 * theta);
      const v3 = (2 + j) * 3;
      tierPos[v3] = Math.cos(theta) * r;
      tierPos[v3 + 1] = yDroop;
      tierPos[v3 + 2] = Math.sin(theta) * r;
    }

    // Indices for upper bough and recessed underside
    let tierIdxOffset = 0;
    const tierIdx = new Uint16Array(N * 6);
    for (let j = 0; j < N; j++) {
      const cur = 2 + j;
      const next = 2 + ((j + 1) % N);
      // Upper snow-catching bough face
      tierIdx[tierIdxOffset++] = 0;
      tierIdx[tierIdxOffset++] = cur;
      tierIdx[tierIdxOffset++] = next;
      // Recessed lower underside needle face
      tierIdx[tierIdxOffset++] = 1;
      tierIdx[tierIdxOffset++] = next;
      tierIdx[tierIdxOffset++] = cur;
    }

    // Compute normals for this tier
    const tempGeo = new THREE.BufferGeometry();
    tempGeo.setAttribute('position', new THREE.BufferAttribute(tierPos, 3));
    tempGeo.setIndex(new THREE.BufferAttribute(tierIdx, 1));
    tempGeo.computeVertexNormals();

    const cNorm = tempGeo.attributes.normal.array;
    tierNorm.set(cNorm);

    // Vertex colors based on normal.y
    for (let k = 0; k < 2 + N; k++) {
      const ny = tierNorm[k * 3 + 1];
      const c3 = k * 3;
      if (ny > 0.32) {
        // Upper bough snow blanket
        const snow = 0.88 + ny * 0.11;
        tierCol[c3] = snow * 0.94;
        tierCol[c3 + 1] = snow * 0.98;
        tierCol[c3 + 2] = snow;
      } else {
        // Underside deep evergreen pine needles
        tierCol[c3] = 0.05;
        tierCol[c3 + 1] = 0.18;
        tierCol[c3 + 2] = 0.10;
      }
    }

    // Append to merged arrays
    mergedPos.set(tierPos, pOffset * 3);
    mergedNorm.set(tierNorm, pOffset * 3);
    mergedCol.set(tierCol, pOffset * 3);

    for (let i = 0; i < tierIdx.length; i++) {
      mergedIdx[iOffset + i] = tierIdx[i] + vOffset;
    }

    iOffset += tierIdx.length;
    vOffset += (2 + N);
    pOffset += (2 + N);
  });

  const mergedGeo = new THREE.BufferGeometry();
  mergedGeo.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  mergedGeo.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
  mergedGeo.setAttribute('color', new THREE.BufferAttribute(mergedCol, 3));
  mergedGeo.setIndex(new THREE.BufferAttribute(mergedIdx, 1));
  return mergedGeo;
}

function createRiverGeometry() {
  const zSegs = 90;
  const wSegs = 6;
  const zStart = -85;
  const zEnd = 85;
  const halfW = 2.8;

  const numVerts = (zSegs + 1) * (wSegs + 1);
  const pos = new Float32Array(numVerts * 3);
  const uvs = new Float32Array(numVerts * 2);
  const indices = new Uint16Array(zSegs * wSegs * 6);

  let vIdx = 0;
  for (let i = 0; i <= zSegs; i++) {
    const tz = i / zSegs;
    const z = zStart + tz * (zEnd - zStart);
    const cx = getRiverCenter(z);

    for (let j = 0; j <= wSegs; j++) {
      const tw = j / wSegs;
      const xOffset = (tw - 0.5) * 2 * halfW;
      const x = cx + xOffset;
      const y = 0.28;

      pos[vIdx * 3] = x;
      pos[vIdx * 3 + 1] = y;
      pos[vIdx * 3 + 2] = z;

      uvs[vIdx * 2] = tw;
      uvs[vIdx * 2 + 1] = tz * 12.0;
      vIdx++;
    }
  }

  let iIdx = 0;
  for (let i = 0; i < zSegs; i++) {
    for (let j = 0; j < wSegs; j++) {
      const a = i * (wSegs + 1) + j;
      const b = (i + 1) * (wSegs + 1) + j;
      const c = (i + 1) * (wSegs + 1) + j + 1;
      const d = i * (wSegs + 1) + j + 1;

      indices[iIdx++] = a;
      indices[iIdx++] = b;
      indices[iIdx++] = d;

      indices[iIdx++] = b;
      indices[iIdx++] = c;
      indices[iIdx++] = d;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();
  return geo;
}

function createAuroraRibbon(width = 160, height = 24, zOffset = -55) {
  const xSegs = 40;
  const ySegs = 6;
  const numVerts = (xSegs + 1) * (ySegs + 1);
  const pos = new Float32Array(numVerts * 3);
  const colors = new Float32Array(numVerts * 3);
  const indices = new Uint16Array(xSegs * ySegs * 6);

  let vIdx = 0;
  for (let i = 0; i <= ySegs; i++) {
    const ty = i / ySegs;
    const y = 28 + ty * height;

    for (let j = 0; j <= xSegs; j++) {
      const tx = j / xSegs;
      const x = (tx - 0.5) * width;
      const z = zOffset + Math.sin(tx * Math.PI * 2.5) * 8.0;

      pos[vIdx * 3] = x;
      pos[vIdx * 3 + 1] = y;
      pos[vIdx * 3 + 2] = z;

      const c1 = new THREE.Color(0x10b981); // Emerald Green
      const c2 = new THREE.Color(0x06b6d4); // Vibrant Cyan
      const c3 = new THREE.Color(0x8b5cf6); // Mystical Violet
      const col = new THREE.Color();
      if (ty < 0.5) {
        col.copy(c1).lerp(c2, ty * 2.0);
      } else {
        col.copy(c2).lerp(c3, (ty - 0.5) * 2.0);
      }

      colors[vIdx * 3] = col.r;
      colors[vIdx * 3 + 1] = col.g;
      colors[vIdx * 3 + 2] = col.b;
      vIdx++;
    }
  }

  let iIdx = 0;
  for (let i = 0; i < ySegs; i++) {
    for (let j = 0; j < xSegs; j++) {
      const a = i * (xSegs + 1) + j;
      const b = (i + 1) * (xSegs + 1) + j;
      const c = (i + 1) * (xSegs + 1) + j + 1;
      const d = i * (xSegs + 1) + j + 1;

      indices[iIdx++] = a;
      indices[iIdx++] = b;
      indices[iIdx++] = d;

      indices[iIdx++] = b;
      indices[iIdx++] = c;
      indices[iIdx++] = d;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  return geo;
}

function createCodexTabletTexture(tag, title, lines, status) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 680;
  const ctx = canvas.getContext('2d');

  // Translucent dark slate background
  ctx.fillStyle = '#06111e';
  ctx.fillRect(0, 0, 512, 680);

  // Outer border with cyan cyber trim
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, 488, 656);

  // Corner brackets
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(6, 6, 24, 6);
  ctx.fillRect(6, 6, 6, 24);
  ctx.fillRect(482, 6, 24, 6);
  ctx.fillRect(500, 6, 6, 24);
  ctx.fillRect(6, 668, 24, 6);
  ctx.fillRect(6, 650, 6, 24);
  ctx.fillRect(482, 668, 24, 6);
  ctx.fillRect(500, 650, 6, 24);

  // Header banner
  ctx.fillStyle = '#0369a1';
  ctx.fillRect(16, 16, 480, 56);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(tag, 28, 52);

  // Title
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(title, 28, 115);

  // Accent divider line
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, 134);
  ctx.lineTo(484, 134);
  ctx.stroke();

  // Content lines
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '18px monospace';
  let y = 180;
  lines.forEach(l => {
    ctx.fillText(l, 28, y);
    y += 44;
  });

  // Bottom verification badge
  ctx.fillStyle = 'rgba(14, 165, 233, 0.18)';
  ctx.fillRect(28, 550, 456, 80);
  ctx.strokeStyle = '#38bdf8';
  ctx.strokeRect(28, 550, 456, 80);

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('STATUS: ' + status, 45, 598);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

export class GlacialCitadel3D {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // State
    this.currentStage = 'citadel';
    this.isExploded = false;
    this.isTransitioning = false;
    this.transitionStart = 0;
    this.mouse = new THREE.Vector2(0, 0);

    // Jordan Breton Inspiration: Celestial Modes, Guided Tour & Viewpoints
    this.isNightMode = false;
    this.isSpiritMode = false;
    this.isFuturisticMode = false;
    this.isAutoTourActive = false;
    this.tourIndex = 0;
    this.tourTimer = null;
    this.discoveredSet = new Set(['citadel']);
    this.hotspotElements = [];
    this.isFpsActive = false;
    this.isPointerLocked = false;

    // Initial Camera Vectors
    this.startCamPos = new THREE.Vector3(0, 16, 36);
    this.targetCamPos = new THREE.Vector3(0, 16, 36);
    this.startLookAt = new THREE.Vector3(0, 3, 0);
    this.targetLookAt = new THREE.Vector3(0, 3, 0);

    // Camera viewpoints for stages
    this.stages = {
      citadel: {
        cameraPos: new THREE.Vector3(0, 16, 36),
        lookAt: new THREE.Vector3(0, 3, 0),
        title: "THE HIMALAYAN CITADEL // SACRED VALLEYS & GLACIERS",
        code: "PANORAMA // 5 SANCTUARY SHRINES",
        tech: "Three.js • Procedural FBM • Glacial Fluid Dynamics • IslandBender • AuroraPass",
        repo: "https://github.com/Shekhar938",
        desc: "A contemplative Himalayan landscape featuring winding glacial rivers, cascading icefalls, ancient pine forests, and curved horizon planetary geometry housing Shekhar Kumar's enterprise architectural monuments."
      },
      agentic: {
        cameraPos: new THREE.Vector3(0, 5.2, 9.8),
        lookAt: new THREE.Vector3(0, 3.6, 0),
        title: "AGENTIC FRAMEWORK // NEURAL REACTOR",
        code: "PR_01 // AUTONOMOUS AI ECOSYSTEM",
        tech: "Semantic Kernel • Model Context Protocol • Python • Multi-Agent",
        repo: "https://github.com/Shekhar938/AgenticFramework",
        desc: "A crystalline neural reactor core orchestrating dynamic tool sequencing and self-healing reasoning loops through Semantic Kernel and MCP bridges."
      },
      dotnet: {
        cameraPos: new THREE.Vector3(22, 7.5, 3.5),
        lookAt: new THREE.Vector3(22, 5.5, -8),
        title: ".NET 8 DESIGN PATTERNS // ENTERPRISE MONOLITH",
        code: "PR_02 // GOF ENTERPRISE ARCHITECTURE",
        tech: "C# 12 • .NET 8 • Clean Architecture • GoF Patterns • Microservices",
        repo: "https://github.com/Shekhar938/dotnet-design-patterns-playground",
        desc: "A towering stepped hexagonal crystal monolith with 3 floating architectural tiers: Creational crowns, Structural brackets, and Behavioral foundations."
      },
      floorplan: {
        cameraPos: new THREE.Vector3(-22, 11, 4),
        lookAt: new THREE.Vector3(-22, 1.8, -8),
        title: "3D VASTU DESIGNER (SHARP-DARWIN) // ARCHITECTURAL CITADEL",
        code: "PR_04 // SPATIAL ARCHITECTURE & VASTU CAD",
        tech: "Three.js • WebGL • CAD Floor Plan Engine • Vastu Shastra Analytics • HTML5 Canvas",
        repo: "https://github.com/Shekhar938/sharp-darwin",
        desc: "An architectural spatial CAD visualizer and Vastu Shastra energy engine built with Three.js. Features 2D/3D floor plan layout generation, room zoning, real-time cardinal orientation analytics, and architectural glass chambers."
      },
      codex: {
        cameraPos: new THREE.Vector3(18, 7.5, 27),
        lookAt: new THREE.Vector3(18, 6.0, 18),
        title: "LEGAL INTELLIGENCE (LL) // GEMINI CODEX",
        code: "PR_03 // MULTIMODAL AI & VERIFICATION",
        tech: "Next.js 16 • React 19 • Google Gemini API • Vercel Postgres • TypeScript",
        repo: "https://github.com/Shekhar938/ll",
        desc: "Twin crystalline Pillars of Justice framing a suspended multimodal Gemini double-helix energy core, balanced Scales of Justice, and orbiting holographic legal document tablets for real-time contract parsing and case intelligence."
      },
      guardrail: {
        cameraPos: new THREE.Vector3(-18, 6.5, 27),
        lookAt: new THREE.Vector3(-18, 4.2, 18),
        title: "SYSTEM PROMPTS // QUANTUM GUARDRAIL LATTICE",
        code: "PR_05 // AI SAFETY & MODEL INTERNALS",
        tech: "Prompt Architecture • Safety Guardrails • Policy Enforcement",
        repo: "https://github.com/Shekhar938/system_prompts_leaks",
        desc: "A geodesic icosahedral forcefield with rotating laser containment rings locking a turbulent non-deterministic AI plasma within verifiable bounds."
      },
      fps: {
        cameraPos: new THREE.Vector3(0, 1.68, 14),
        lookAt: new THREE.Vector3(0, 1.68, 0),
        title: "FIRST-PERSON EXPEDITION // REAL-TIME CHARACTER POV",
        code: "PLAYER_01 // WASD • SPRINT • JUMP • POV [V]",
        tech: "Pointer Lock API • First-Person POV • Character Rigging • Terrain Physics • Web Audio",
        repo: "https://github.com/Shekhar938",
        desc: "Traverse the vast Himalayan valley, glacial rivers, and 5 architectural shrines in real-time first-person POV with procedural walk/run skeletal animation, sprint stamina, and terrain height following."
      }
    };

    this.init();
  }

  init() {
    // 1. Scene, Camera, Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7e9cb8);
    this.scene.fog = new THREE.FogExp2(0x8faec9, 0.0075);

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 500);
    this.camera.position.copy(this.stages.citadel.cameraPos);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.98;

    this.renderer.domElement.id = 'citadelCanvas';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.zIndex = '1';
    this.container.appendChild(this.renderer.domElement);

    // 2. Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent ground clip
      this.controls.minDistance = 3.5;
      this.controls.maxDistance = 85;
      this.controls.target.copy(this.targetLookAt);

      // Stop auto-tour on manual drag
      this.controls.addEventListener('start', () => {
        this.stopAutoTour();
      });
    }

    // 3. Materials Library
    this.createMaterials();

    // 4. Build Environment
    this.buildEnvironment();
    this.buildHoloReticle();

    // 5. Build Project Monuments
    this.buildMonumentAgentic();    // PR_01: Agentic Reactor
    this.buildMonumentDotNet();     // PR_02: .NET 8 Hexagonal Monolith
    this.buildMonumentFloorPlan();  // PR_04: 3D Architectural Citadel
    this.buildMonumentCodex();      // PR_03: Gemini Codex Obelisk
    this.buildMonumentGuardrail();  // PR_05: Quantum Guardrail Sphere
    this.buildCentralIglooHeritage();// Central Crystal Dome & Floating Rings

    // 5b. Build Playable First-Person Character Avatar & Controls
    this.buildPlayerCharacter();
    this.setupGameInput();

    // 6. Lighting
    this.setupLighting();

    // 7. In-Scene 3D Hotspots (Jordan Breton inspiration)
    this.setupHotspots();

    // 8. Event Listeners
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.setupRaycasting();

    // 9. Start Loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  createMaterials() {
    // 1. Frosted Crystal Ice (Physical transmission material)
    this.matIce = new THREE.MeshPhysicalMaterial({
      color: 0xecf8ff,
      metalness: 0.1,
      roughness: 0.12,
      transmission: 0.82,
      ior: 1.46,
      thickness: 1.4,
      reflectivity: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.95
    });

    // 2. Glowing Neon Cyan Emissive
    this.matNeonCyan = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.8
    });

    // 3. Golden Amber Circuits (.NET Accent)
    this.matGoldCircuit = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 1.2,
      roughness: 0.25,
      metalness: 0.9
    });

    // 4. Carved Himalayan Slate & Granite (Replaces harsh obsidian blocks)
    this.matObsidian = new THREE.MeshStandardMaterial({
      color: 0x243248,
      roughness: 0.65,
      metalness: 0.25
    });
    this.matCarvedGranite = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.72,
      metalness: 0.15
    });
    this.matFlagstone = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.65,
      metalness: 0.20
    });

    // 5. Holographic Wireframe
    this.matHoloWire = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      wireframe: true,
      transparent: true,
      opacity: 0.65
    });

    // 6. Semi-transparent Architectural Glass
    this.matArchGlass = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      roughness: 0.12,
      metalness: 0.85
    });

    // 7. Gemini Multimodal Violet Energy
    this.matGeminiViolet = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 1.6,
      roughness: 0.2,
      metalness: 0.8
    });

    // 8. Polished Legal Scales Gold
    this.matLegalGold = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xd97706,
      emissiveIntensity: 1.1,
      roughness: 0.22,
      metalness: 0.95
    });

    // 9. Crystalline White Marble
    this.matMarble = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.18,
      metalness: 0.15
    });
  }

  buildEnvironment() {
    this.buildSkyDome();
    this.buildDistantPeaks();
    this.buildHimalayanTerrain();
    this.buildSanctuaryTerraces();
    this.buildGlacialRiver();
    this.buildGlacierTongues();
    this.buildPineForest();
    this.buildAuroraRibbons();
    this.buildMountainMist();
    this.buildCelestialStars();
    this.buildSnowDust();
  }

  buildSkyDome() {
    const skyGeo = new THREE.SphereGeometry(360, 48, 24);
    const count = skyGeo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const pos = skyGeo.attributes.position;

    this.skyPositions = pos;
    this.skyColors = colors;
    this.skyColorAttr = new THREE.BufferAttribute(colors, 3);

    for (let i = 0; i < count; i++) {
      const y = pos.getY(i);
      const t = Math.max(0, Math.min(1, (y + 40) / 380));
      
      let r, g, b;
      if (t > 0.45) {
        const u = (t - 0.45) / 0.55;
        r = THREE.MathUtils.lerp(0.24, 0.10, u);
        g = THREE.MathUtils.lerp(0.50, 0.22, u);
        b = THREE.MathUtils.lerp(0.90, 0.54, u);
      } else {
        const u = t / 0.45;
        r = THREE.MathUtils.lerp(0.92, 0.24, u);
        g = THREE.MathUtils.lerp(0.95, 0.50, u);
        b = THREE.MathUtils.lerp(1.00, 0.90, u);
      }
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    skyGeo.setAttribute('color', this.skyColorAttr);
    this.skyMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      depthWrite: false
    });
    this.skyDome = new THREE.Mesh(skyGeo, this.skyMat);
    this.scene.add(this.skyDome);

    // Radiant Alpine Sun Disk with soft volumetric corona
    const sunGeo = new THREE.PlaneGeometry(36, 36);
    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 128;
    sunCanvas.height = 128;
    const sCtx = sunCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    sGrad.addColorStop(0, 'rgba(255, 255, 245, 1.0)');
    sGrad.addColorStop(0.22, 'rgba(254, 243, 199, 0.85)');
    sGrad.addColorStop(0.55, 'rgba(224, 242, 254, 0.35)');
    sGrad.addColorStop(1, 'rgba(224, 242, 254, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 128, 128);

    const sunTex = new THREE.CanvasTexture(sunCanvas);
    this.sunMat = new THREE.MeshBasicMaterial({
      map: sunTex,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.sunDisk = new THREE.Mesh(sunGeo, this.sunMat);
    this.sunDisk.position.set(110, 160, 85);
    this.sunDisk.lookAt(0, 0, 0);
    this.scene.add(this.sunDisk);
  }

  buildDistantPeaks() {
    this.distantPeaksGroup = new THREE.Group();
    const peakCount = 28;
    const peakGeo = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const indices = [];

    let vIdx = 0;
    for (let p = 0; p < peakCount; p++) {
      const angle = (p / peakCount) * Math.PI * 2 + (Math.sin(p * 3.7) * 0.08);
      const dist = 165 + (p % 3) * 25 + Math.sin(p * 2.1) * 20;
      const cx = Math.cos(angle) * dist;
      const cz = Math.sin(angle) * dist;
      const peakH = 36 + (p % 5) * 9 + Math.cos(p * 1.8) * 12;
      const peakW = 26 + (p % 4) * 8;

      const baseY = -8;
      const apexIdx = vIdx++;
      positions.push(cx, peakH, cz);
      colors.push(0.98, 0.99, 1.0); // Pure snow peak summit

      const numRidge = 6;
      const ridgeStart = vIdx;
      for (let r = 0; r < numRidge; r++) {
        const rAng = angle + (r / numRidge) * Math.PI * 2;
        const rDist = peakW * (0.8 + Math.sin(r * 2.5) * 0.35);
        const rx = cx + Math.cos(rAng) * rDist;
        const rz = cz + Math.sin(rAng) * rDist;
        const ry = baseY + Math.sin(r * 1.5) * 4;

        vIdx++;
        positions.push(rx, ry, rz);
        colors.push(0.20, 0.26, 0.34); // Weathered slate granite rock base
      }

      for (let r = 0; r < numRidge; r++) {
        const next = (r + 1) % numRidge;
        indices.push(apexIdx, ridgeStart + r, ridgeStart + next);
      }
    }

    peakGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    peakGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    peakGeo.setIndex(indices);
    peakGeo.computeVertexNormals();

    const peakMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.08,
      flatShading: true
    });
    const peaksMesh = new THREE.Mesh(peakGeo, peakMat);
    peaksMesh.receiveShadow = false;
    this.distantPeaksGroup.add(peaksMesh);
    this.scene.add(this.distantPeaksGroup);
  }

  // 1. Procedural Himalayan Valley & Alpine Terrain
  buildHimalayanTerrain() {
    const segments = 160;
    const size = 260;
    const groundGeo = new THREE.PlaneGeometry(size, size, segments, segments);
    groundGeo.rotateX(-Math.PI / 2); // Orient so Y is elevation

    const pos = groundGeo.attributes.position;
    const count = pos.count;
    const terraces = [
      { x: 0, z: 0, r: 8.5 },
      { x: 22, z: -8, r: 7.5 },
      { x: -22, z: -8, r: 7.5 },
      { x: 18, z: 18, r: 7.5 },
      { x: -18, z: 18, r: 7.5 }
    ];

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, computeTerrainHeight(x, z));
    }

    // Compute smooth vertex normals for authentic alpine topography and slope calculation
    groundGeo.computeVertexNormals();
    const norm = groundGeo.attributes.normal;

    // Biome Vertex Colors: Slope-Based Snow Adhesion & Alpine Rock Exposure
    const colors = new Float32Array(count * 3);
    const col = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const ny = norm.getY(i); // 1.0 = completely flat, 0.0 = sheer vertical cliff

      if (y < 0.28) {
        // Glacial riverbed loam & gravel
        col.setRGB(0.14, 0.18, 0.24);
      } else {
        // Natural Himalayan Alpine Slope Calculation:
        // Snow settles on flatter ground (ny > 0.65). Steep cliffs shed snow, exposing dark granite rock.
        const slopeSteepness = 1.0 - ny; // 0 = flat, 1 = vertical
        const rockNoise = fbm(x * 0.08, z * 0.08, 2) * 0.12;

        if (ny > 0.68) {
          // Deep crystalline powdery snow with subtle sky-blue subsurface scattering
          const snowVar = fbm(x * 0.15, z * 0.15, 2) * 0.04;
          col.setRGB(0.92 + snowVar, 0.95 + snowVar, 0.99);
        } else if (ny > 0.52) {
          // Transitional frost and snow-dusted rock shelves
          const t = (ny - 0.52) / (0.68 - 0.52);
          const r = THREE.MathUtils.lerp(0.24 + rockNoise, 0.92, t);
          const g = THREE.MathUtils.lerp(0.28 + rockNoise, 0.95, t);
          const b = THREE.MathUtils.lerp(0.34 + rockNoise, 0.99, t);
          col.setRGB(r, g, b);
        } else {
          // Sheer vertical granite horns & weathered slate crags
          const darkTone = 0.18 + rockNoise;
          col.setRGB(darkTone * 0.85, darkTone, darkTone * 1.25);
        }
      }

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const snowTex = createSnowTexture();
    const groundMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.04,
      bumpMap: snowTex,
      bumpScale: 0.045,
      flatShading: false
    });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.receiveShadow = true;
    this.ground.castShadow = true;
    this.scene.add(this.ground);
  }

  // 2. Sculpted Architectural Sanctuaries
  buildSanctuaryTerraces() {
    const terraces = [
      { x: 0, z: 0, r: 8.5 },
      { x: 22, z: -8, r: 7.5 },
      { x: -22, z: -8, r: 7.5 },
      { x: 18, z: 18, r: 7.5 },
      { x: -18, z: 18, r: 7.5 }
    ];

    // Smooth 48-segment beveled stone plinths (weathered Himalayan slate & granite)
    const curbGeo = new THREE.CylinderGeometry(7.6, 8.0, 0.22, 48);
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Weathered slate curbing
      roughness: 0.75,
      metalness: 0.15
    });

    const paveGeo = new THREE.CylinderGeometry(7.2, 7.4, 0.12, 48);
    const paveMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Carved granite paving
      roughness: 0.65,
      metalness: 0.20
    });

    const runeGeo = new THREE.RingGeometry(7.1, 7.35, 48);
    const runeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55
    });

    terraces.forEach(t => {
      // 1. Outer stone curb
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(t.x, 0.32, t.z);
      curb.receiveShadow = true;
      this.scene.add(curb);

      // 2. Inner flagstone paving
      const pave = new THREE.Mesh(paveGeo, paveMat);
      pave.position.set(t.x, 0.43, t.z);
      pave.receiveShadow = true;
      this.scene.add(pave);

      // 3. Cyber rune border ring
      const rune = new THREE.Mesh(runeGeo, runeMat);
      rune.rotation.x = -Math.PI / 2;
      rune.position.set(t.x, 0.495, t.z);
      this.scene.add(rune);
    });
  }

  // 3. Flowing Glacial Meltwater River
  buildGlacialRiver() {
    this.riverGeo = createRiverGeometry();
    const pos = this.riverGeo.attributes.position.array;
    this.riverBasePositions = new Float32Array(pos.length);
    this.riverBasePositions.set(pos);

    const riverMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4, // Deep glacial turquoise
      transmission: 0.88,
      opacity: 0.94,
      transparent: true,
      roughness: 0.06,
      metalness: 0.08,
      ior: 1.333,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04
    });

    this.riverMesh = new THREE.Mesh(this.riverGeo, riverMat);
    this.riverMesh.receiveShadow = true;
    this.scene.add(this.riverMesh);

    // Shoreline Whitewater Rapids Foam Ribbons
    const foamCount = 80;
    const foamGeo = new THREE.BufferGeometry();
    const foamPos = new Float32Array(foamCount * 2 * 3);
    for (let i = 0; i < foamCount; i++) {
      const tz = i / (foamCount - 1);
      const z = -85 + tz * 170;
      const cx = getRiverCenter(z);
      // Left bank
      foamPos[i * 6] = cx - 2.85;
      foamPos[i * 6 + 1] = 0.32;
      foamPos[i * 6 + 2] = z;
      // Right bank
      foamPos[i * 6 + 3] = cx + 2.85;
      foamPos[i * 6 + 4] = 0.32;
      foamPos[i * 6 + 5] = z;
    }
    foamGeo.setAttribute('position', new THREE.BufferAttribute(foamPos, 3));
    const foamMat = new THREE.PointsMaterial({
      color: 0xe0f7ff,
      size: 0.45,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });
    this.foamParticles = new THREE.Points(foamGeo, foamMat);
    this.scene.add(this.foamParticles);
  }

  // 4. Stepped Crystalline Glacier Tongues & Icefalls
  buildGlacierTongues() {
    this.glacierGroup = new THREE.Group();

    const tiers = [
      { x: -8, y: 18.5, z: -68, sx: 15, sy: 7.5, sz: 12 },
      { x: -6, y: 9.8, z: -55, sx: 13, sy: 6.5, sz: 11 },
      { x: -5, y: 3.2, z: -43, sx: 10, sy: 4.8, sz: 10 }
    ];

    const glacierMat = new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      emissive: 0x064e6b,
      emissiveIntensity: 0.35,
      roughness: 0.08,
      metalness: 0.15,
      transmission: 0.85,
      ior: 1.44,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.92,
      flatShading: true
    });

    tiers.forEach((t, idx) => {
      const blockGeo = new THREE.CylinderGeometry(t.sx * 0.45, t.sx * 0.55, t.sy, 6);
      const block = new THREE.Mesh(blockGeo, glacierMat);
      block.position.set(t.x, t.y, t.z);
      block.rotation.y = idx * 0.4;
      block.rotation.x = 0.15;
      block.castShadow = true;
      block.receiveShadow = true;
      this.glacierGroup.add(block);

      // Jagged seracs on top of glacier
      for (let s = 0; s < 5; s++) {
        const seracGeo = new THREE.ConeGeometry(1.2 + Math.random() * 0.8, 3.2 + Math.random() * 2.5, 4);
        const serac = new THREE.Mesh(seracGeo, glacierMat);
        serac.position.set(
          t.x + (Math.random() - 0.5) * t.sx * 0.7,
          t.y + t.sy * 0.5 + 1.2,
          t.z + (Math.random() - 0.5) * t.sz * 0.7
        );
        serac.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
        this.glacierGroup.add(serac);
      }
    });

    // Sub-surface Glacial Cavern Light
    const glacierLight = new THREE.PointLight(0x22d3ee, 2.5, 35);
    glacierLight.position.set(-5, 4.0, -45);
    this.glacierGroup.add(glacierLight);

    this.scene.add(this.glacierGroup);
  }

  // 5. Instanced Himalayan Pine Forest
  buildPineForest() {
    const pineGeo = createPineTreeGeometry();
    const pineMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: false
    });

    this.pineCount = 700;
    this.pineForestMesh = new THREE.InstancedMesh(pineGeo, pineMat, this.pineCount);
    this.pineForestMesh.castShadow = true;
    this.pineForestMesh.receiveShadow = true;

    this.pineData = [];
    this.pineDummy = new THREE.Object3D();

    const terraces = [
      { x: 0, z: 0, r: 14.5 },
      { x: 22, z: -8, r: 11.5 },
      { x: -22, z: -8, r: 11.5 },
      { x: 18, z: 18, r: 11.5 },
      { x: -18, z: 18, r: 11.5 }
    ];

    let planted = 0;
    let attempts = 0;
    while (planted < this.pineCount && attempts < 4000) {
      attempts++;
      const r = 10 + Math.random() * 64;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      // Check distance to river
      const rivX = getRiverCenter(z);
      const dRiv = Math.abs(x - rivX);
      if (dRiv < 5.2) continue; // Don't plant inside river bed

      // Check distance to project monuments
      let tooClose = false;
      for (const t of terraces) {
        if (Math.hypot(x - t.x, z - t.z) < t.r) {
          tooClose = true;
          break;
        }
      }
      // Clear camera approach corridor for codex (x: 18, z between 16 and 35)
      if (Math.hypot(x - 18, z - 26) < 6.5) tooClose = true;
      // Clear player spawn and promenade corridor
      if (Math.hypot(x, z - 12) < 6.0) tooClose = true;
      // Clear radial trails connecting monuments
      if (Math.abs(x) < 20 && Math.abs(z - (-8 * (x / 22))) < 2.8) tooClose = true;
      if (Math.abs(x) < 16 && Math.abs(z - (18 * (x / 18))) < 2.8) tooClose = true;
      if (tooClose) continue;

      // Approximate terrain elevation at (x, z)
      let u = 0;
      if (dRiv < 14) {
        const f = (dRiv - 3.2) / (14 - 3.2);
        u = 0.2 + f * f * 2.0;
      } else {
        const f = Math.min(1.0, (dRiv - 14) / 75.0);
        u = 2.2 + Math.pow(f, 1.3) * 26.0;
      }
      u += fbm(x * 0.03, z * 0.03, 3) * 12.0;
      if (z < -10) {
        u += Math.min(1.0, (-z - 10) / 70.0) * 16.0;
      }
      if (r > 72) {
        const curve = Math.min(1.5, (r - 72) / 45);
        u -= curve * curve * 22.0;
      }

      if (u < 0.35 || u > 15.5) continue; // Tree line limits

      const scale = 0.75 + Math.random() * 0.55;
      const rotY = Math.random() * Math.PI * 2;
      const phase = Math.random() * Math.PI * 2;

      this.pineDummy.position.set(x, u - 0.15, z);
      this.pineDummy.rotation.set(0, rotY, 0);
      this.pineDummy.scale.set(scale, scale * (0.9 + Math.random() * 0.3), scale);
      this.pineDummy.updateMatrix();

      this.pineForestMesh.setMatrixAt(planted, this.pineDummy.matrix);
      this.pineData.push({
        x,
        y: u - 0.15,
        z,
        scaleX: scale,
        scaleY: scale * (0.9 + Math.random() * 0.3),
        scaleZ: scale,
        rotY,
        phase
      });
      planted++;
    }

    this.pineForestMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.pineForestMesh);
  }

  // 6. Jordan Breton AuroraPass Ribbons
  buildAuroraRibbons() {
    this.auroraRibbons = [];
    const ribbonConfigs = [
      { width: 170, height: 26, z: -52, color: 0x10b981 },
      { width: 155, height: 24, z: -66, color: 0x06b6d4 },
      { width: 140, height: 22, z: -78, color: 0x8b5cf6 },
      { width: 130, height: 20, z: -88, color: 0xa855f7 }
    ];

    ribbonConfigs.forEach(cfg => {
      const geo = createAuroraRibbon(cfg.width, cfg.height, cfg.z);
      const pos = geo.attributes.position.array;
      const orig = new Float32Array(pos.length);
      orig.set(pos);

      const mat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { origPositions: orig };
      this.scene.add(mesh);
      this.auroraRibbons.push(mesh);
    });
  }

  // 7. Volumetric Mountain Mist & Low River Vapors
  buildMountainMist() {
    this.mistCount = 140;
    const mistGeo = new THREE.BufferGeometry();
    const mistPos = new Float32Array(this.mistCount * 3);
    this.mistTypes = new Uint8Array(this.mistCount);

    for (let i = 0; i < this.mistCount; i++) {
      if (i < 80) {
        // Low valley river mist
        const tz = (i / 80) * 160 - 80;
        const cx = getRiverCenter(tz);
        mistPos[i * 3] = cx + (Math.random() - 0.5) * 10.0;
        mistPos[i * 3 + 1] = 0.4 + Math.random() * 2.4;
        mistPos[i * 3 + 2] = tz + (Math.random() - 0.5) * 5.0;
        this.mistTypes[i] = 0;
      } else {
        // High mountain clouds clinging to distant peaks
        mistPos[i * 3] = (Math.random() - 0.5) * 160;
        mistPos[i * 3 + 1] = 24 + Math.random() * 22;
        mistPos[i * 3 + 2] = -35 - Math.random() * 55;
        this.mistTypes[i] = 1;
      }
    }

    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));

    // Soft procedural cloud sprite texture with smooth gaussian falloff
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(215, 230, 245, 0.35)');
    grad.addColorStop(0.5, 'rgba(195, 220, 240, 0.14)');
    grad.addColorStop(1, 'rgba(190, 215, 235, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const mistTex = new THREE.CanvasTexture(canvas);

    const mistMat = new THREE.PointsMaterial({
      map: mistTex,
      size: 8.5,
      transparent: true,
      opacity: 0.16,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.mistParticles = new THREE.Points(mistGeo, mistMat);
    this.scene.add(this.mistParticles);
  }

  // 8. Cosmic Night Stars with Milky Way Galactic Density
  buildCelestialStars() {
    const starCount = 2600;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const radius = 95 + Math.random() * 85;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85); // Dome upper hemisphere
      starPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = radius * Math.cos(phi) + 4;
      starPos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.starMat = new THREE.PointsMaterial({
      color: 0xcbe7ff,
      size: 0.38,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
    this.stars = new THREE.Points(starGeo, this.starMat);
    this.scene.add(this.stars);
  }

  // 9. Floating Snow & Cyber-Dust Particles
  buildSnowDust() {
    const snowCount = 1800;
    const snowGeo = new THREE.BufferGeometry();
    const snowPositions = new Float32Array(snowCount * 3);
    const snowVelocities = new Float32Array(snowCount);

    for (let i = 0; i < snowCount; i++) {
      snowPositions[i * 3] = (Math.random() - 0.5) * 160;
      snowPositions[i * 3 + 1] = Math.random() * 38;
      snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 160;
      snowVelocities[i] = 0.03 + Math.random() * 0.05;
    }

    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    this.snowVelocities = snowVelocities;

    const snowMat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 0.28,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.snowParticles = new THREE.Points(snowGeo, snowMat);
    this.scene.add(this.snowParticles);
  }

  buildHoloReticle() {
    this.reticleGroup = new THREE.Group();
    this.reticleGroup.position.set(0, 0.05, 0);

    this.reticleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });

    // Outer dashed ring
    const outerRingGeo = new THREE.RingGeometry(5.4, 5.55, 48);
    const outerRing = new THREE.Mesh(outerRingGeo, this.reticleMat);
    outerRing.rotation.x = -Math.PI / 2;
    this.reticleGroup.add(outerRing);

    // Inner dashed ring
    const innerRingGeo = new THREE.RingGeometry(4.0, 4.12, 36);
    const innerRing = new THREE.Mesh(innerRingGeo, this.reticleMat);
    innerRing.rotation.x = -Math.PI / 2;
    this.reticleGroup.add(innerRing);

    // 4 cardinal targeting brackets
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const bracketGeo = new THREE.PlaneGeometry(0.9, 0.14);
      const bracket = new THREE.Mesh(bracketGeo, this.reticleMat);
      bracket.rotation.x = -Math.PI / 2;
      bracket.rotation.z = -angle;
      bracket.position.set(Math.cos(angle) * 5.8, 0.01, Math.sin(angle) * 5.8);
      this.reticleGroup.add(bracket);
    }

    this.scene.add(this.reticleGroup);
    this.hoveredMonument = null;
    this.targetReticlePos = new THREE.Vector3(0, 0.05, 0);
  }

  // ========================================================================
  // MONUMENT 01: AgenticFramework — Autonomous Neural Reactor
  // ========================================================================
  buildMonumentAgentic() {
    this.agenticGroup = new THREE.Group();
    this.agenticGroup.position.set(0, 0, 0);

    // Tier 1: Carved Himalayan stone dais (smooth 48-segment plinth)
    const baseGeo = new THREE.CylinderGeometry(4.6, 5.0, 0.35, 48);
    const base = new THREE.Mesh(baseGeo, this.matCarvedGranite);
    base.position.y = 0.65;
    base.receiveShadow = true;
    base.castShadow = true;
    this.agenticGroup.add(base);

    // Tier 2: Beveled crystalline marble step
    const stepGeo = new THREE.CylinderGeometry(3.8, 4.2, 0.20, 48);
    const step = new THREE.Mesh(stepGeo, this.matFlagstone);
    step.position.y = 0.90;
    step.receiveShadow = true;
    this.agenticGroup.add(step);

    const ringGeo = new THREE.TorusGeometry(4.0, 0.06, 16, 48);
    const ring = new THREE.Mesh(ringGeo, this.matNeonCyan);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.02;
    this.agenticGroup.add(ring);

    const coreGeo = new THREE.IcosahedronGeometry(1.8, 1);
    this.agenticCore = new THREE.Mesh(coreGeo, this.matIce);
    this.agenticCore.position.y = 3.6;
    this.agenticCore.castShadow = true;
    this.agenticGroup.add(this.agenticCore);

    const innerLight = new THREE.PointLight(0x38bdf8, 2.5, 12);
    innerLight.position.y = 3.6;
    this.agenticGroup.add(innerLight);
    this.agenticCoreLight = innerLight;

    const innerSphere = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), this.matNeonCyan);
    innerSphere.position.y = 3.6;
    this.agenticGroup.add(innerSphere);

    this.agenticRings = [];
    const ringRadii = [2.6, 3.2, 3.8];
    const ringThickness = [0.06, 0.08, 0.05];

    ringRadii.forEach((r, idx) => {
      const rGeo = new THREE.TorusGeometry(r, ringThickness[idx], 16, 64);
      const rMesh = new THREE.Mesh(rGeo, idx === 1 ? this.matNeonCyan : this.matIce);
      rMesh.position.y = 3.6;
      rMesh.rotation.x = (idx + 1) * 0.45;
      rMesh.rotation.y = (idx + 1) * 0.6;
      this.agenticGroup.add(rMesh);
      this.agenticRings.push(rMesh);
    });

    this.agenticSatellites = [];
    this.agenticBeams = [];
    const toolCount = 4;
    const toolLabels = ['SemanticKernel', 'MCP_Bridge', 'ReasoningLoop', 'PolicyGuard'];

    for (let i = 0; i < toolCount; i++) {
      const satGroup = new THREE.Group();
      const sGeo = new THREE.OctahedronGeometry(0.4, 0);
      const sMesh = new THREE.Mesh(sGeo, this.matIce);
      sMesh.castShadow = true;
      satGroup.add(sMesh);

      const hGeo = new THREE.TorusGeometry(0.6, 0.03, 8, 24);
      const hMesh = new THREE.Mesh(hGeo, this.matNeonCyan);
      hMesh.rotation.x = Math.PI / 2;
      satGroup.add(hMesh);

      satGroup.position.set(Math.cos((i / toolCount) * Math.PI * 2) * 5.2, 3.6, Math.sin((i / toolCount) * Math.PI * 2) * 5.2);
      this.agenticGroup.add(satGroup);

      this.agenticSatellites.push({
        group: satGroup,
        baseAngle: (i / toolCount) * Math.PI * 2,
        baseRadius: 5.2,
        name: toolLabels[i]
      });

      const beamGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 3.6, 0),
        satGroup.position
      ]);
      const beamMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
      const beam = new THREE.Line(beamGeo, beamMat);
      this.agenticGroup.add(beam);
      this.agenticBeams.push(beam);
    }

    this.agenticGroup.userData = { id: 'agentic', name: 'AgenticFramework' };
    this.scene.add(this.agenticGroup);
  }

  // ========================================================================
  // MONUMENT 02: .NET 8 Patterns — The Hexagonal Enterprise Monolith
  // ========================================================================
  buildMonumentDotNet() {
    this.dotnetGroup = new THREE.Group();
    this.dotnetGroup.position.set(22, 0, -8);

    const baseGeo = new THREE.CylinderGeometry(5.2, 5.8, 1.2, 6);
    const base = new THREE.Mesh(baseGeo, this.matObsidian);
    base.position.y = 0.6;
    base.castShadow = true;
    base.receiveShadow = true;
    this.dotnetGroup.add(base);

    const tier1Geo = new THREE.CylinderGeometry(3.6, 4.2, 2.5, 6);
    this.dotnetTier1 = new THREE.Mesh(tier1Geo, this.matObsidian);
    this.dotnetTier1.position.y = 2.45;
    this.dotnetTier1.castShadow = true;
    this.dotnetGroup.add(this.dotnetTier1);

    const tier2Geo = new THREE.CylinderGeometry(2.4, 3.2, 3.8, 6);
    this.dotnetTier2 = new THREE.Mesh(tier2Geo, this.matIce);
    this.dotnetTier2.position.y = 5.6;
    this.dotnetTier2.castShadow = true;
    this.dotnetGroup.add(this.dotnetTier2);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const barGeo = new THREE.BoxGeometry(0.12, 3.5, 0.12);
      const bar = new THREE.Mesh(barGeo, this.matGoldCircuit);
      bar.position.set(Math.cos(angle) * 2.55, 5.6, Math.sin(angle) * 2.55);
      this.dotnetGroup.add(bar);
    }

    this.dotnetTier3 = new THREE.Group();
    this.dotnetTier3.position.y = 8.5;

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const spireGeo = new THREE.ConeGeometry(0.55, 3.2, 4);
      const spire = new THREE.Mesh(spireGeo, this.matIce);
      spire.position.set(Math.cos(angle) * 1.6, 1.6, Math.sin(angle) * 1.6);
      spire.rotation.y = angle;
      this.dotnetTier3.add(spire);
    }

    const polyGeo = new THREE.DodecahedronGeometry(0.9, 0);
    this.dotnetCore = new THREE.Mesh(polyGeo, this.matGoldCircuit);
    this.dotnetCore.position.set(0, 2.2, 0);
    this.dotnetTier3.add(this.dotnetCore);

    this.dotnetGroup.add(this.dotnetTier3);

    const dotNetLight = new THREE.PointLight(0xf59e0b, 2.2, 14);
    dotNetLight.position.set(0, 7.5, 0);
    this.dotnetGroup.add(dotNetLight);

    this.dotnetGroup.userData = { id: 'dotnet', name: '.NET 8 Design Patterns' };
    this.scene.add(this.dotnetGroup);
  }

  // ========================================================================
  // MONUMENT 03: 3D Vastu Floor Plan Designer (sharp-darwin) — Architectural Citadel
  // ========================================================================
  buildMonumentFloorPlan() {
    this.floorplanGroup = new THREE.Group();
    this.floorplanGroup.position.set(-22, 0, -8);

    // 1. Foundation Plinth & CAD Blueprint Substrate
    const baseGeo = new THREE.BoxGeometry(11, 0.8, 11);
    const base = new THREE.Mesh(baseGeo, this.matObsidian);
    base.position.y = 0.4;
    base.receiveShadow = true;
    this.floorplanGroup.add(base);

    // 2. CAD Floor Plan Blueprint Grid Floor
    const floorGeo = new THREE.PlaneGeometry(9.6, 9.6, 8, 8);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.15,
      metalness: 0.85
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.82;
    this.floorplanGroup.add(floor);

    // 3. Architectural Glass Rooms (Living, Kitchen, Master, Study)
    this.fpWalls = new THREE.Group();
    this.fpWalls.position.y = 0.85;

    const wallDefs = [
      { x: 0, z: -4.5, w: 9.6, h: 2.4, d: 0.2 },
      { x: 0, z: 4.5, w: 9.6, h: 2.4, d: 0.2 },
      { x: -4.5, z: 0, w: 0.2, h: 2.4, d: 9.6 },
      { x: 4.5, z: 0, w: 0.2, h: 2.4, d: 9.6 },
      { x: -1.2, z: 0, w: 0.2, h: 2.0, d: 6.0 },
      { x: 1.5, z: -1.2, w: 5.6, h: 2.0, d: 0.2 },
      { x: 1.5, z: 1.8, w: 5.6, h: 2.0, d: 0.2 }
    ];

    wallDefs.forEach((w) => {
      const wGeo = new THREE.BoxGeometry(w.w, w.h, w.d);
      const wMesh = new THREE.Mesh(wGeo, this.matArchGlass);
      wMesh.position.set(w.x, w.h / 2, w.z);
      wMesh.castShadow = true;
      this.fpWalls.add(wMesh);

      // Cyan Glowing Laser Chamfer Edges
      const edgeGeo = new THREE.BoxGeometry(w.w, 0.06, w.d);
      const edge = new THREE.Mesh(edgeGeo, this.matNeonCyan);
      edge.position.set(w.x, w.h + 0.03, w.z);
      this.fpWalls.add(edge);
    });

    this.floorplanGroup.add(this.fpWalls);

    // 4. Central Brahmasthan Light Spire (Sacred Center Nexus)
    const brahmGeo = new THREE.CylinderGeometry(0.8, 1.1, 0.25, 16);
    const brahm = new THREE.Mesh(brahmGeo, this.matGoldCircuit);
    brahm.position.set(0, 0.95, 0);
    this.floorplanGroup.add(brahm);

    const brahmCoreGeo = new THREE.OctahedronGeometry(0.65, 0);
    this.brahmCore = new THREE.Mesh(brahmCoreGeo, this.matIce);
    this.brahmCore.position.set(0, 1.8, 0);
    this.floorplanGroup.add(this.brahmCore);

    const brahmLight = new THREE.PointLight(0xfbbf24, 2.4, 18);
    brahmLight.position.set(0, 2.2, 0);
    this.floorplanGroup.add(brahmLight);

    // 5. Four Vastu Elemental Corner Beacons (NE Water, SE Fire, SW Earth, NW Air)
    const vastuZones = [
      { name: 'Ishanya (NE Water)', x: 4.0, z: -4.0, col: 0x38bdf8 },
      { name: 'Agneya (SE Fire)', x: 4.0, z: 4.0, col: 0xf43f5e },
      { name: 'Nairutya (SW Earth)', x: -4.0, z: 4.0, col: 0xf59e0b },
      { name: 'Vayavya (NW Air)', x: -4.0, z: -4.0, col: 0xa855f7 }
    ];

    vastuZones.forEach(z => {
      const pGeo = new THREE.CylinderGeometry(0.2, 0.35, 2.8, 6);
      const pMat = new THREE.MeshStandardMaterial({
        color: z.col,
        emissive: z.col,
        emissiveIntensity: 1.4,
        roughness: 0.2,
        metalness: 0.8
      });
      const pillar = new THREE.Mesh(pGeo, pMat);
      pillar.position.set(z.x, 2.2, z.z);
      pillar.castShadow = true;
      this.floorplanGroup.add(pillar);

      const zoneLight = new THREE.PointLight(z.col, 1.2, 8);
      zoneLight.position.set(z.x, 3.8, z.z);
      this.floorplanGroup.add(zoneLight);
    });

    // 6. Rotating 8-Point Cardinal Vastu Compass Ring
    this.compassGroup = new THREE.Group();
    this.compassGroup.position.set(0, 4.4, 0);

    const cRing = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.08, 8, 48), this.matNeonCyan);
    cRing.rotation.x = Math.PI / 2;
    this.compassGroup.add(cRing);

    // 8 Cardinal & Intercardinal Arrows (N, NE, E, SE, S, SW, W, NW)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const isCardinal = (i % 2 === 0);
      const pMesh = new THREE.Mesh(
        new THREE.ConeGeometry(isCardinal ? 0.28 : 0.18, isCardinal ? 0.9 : 0.6, 4),
        isCardinal ? this.matNeonCyan : this.matGoldCircuit
      );
      pMesh.position.set(Math.sin(angle) * 3.6, 0, Math.cos(angle) * 3.6);
      pMesh.rotation.x = Math.PI / 2;
      pMesh.rotation.z = -angle;
      this.compassGroup.add(pMesh);
    }

    this.floorplanGroup.add(this.compassGroup);

    this.floorplanGroup.userData = { id: 'floorplan', name: '3D Vastu Floor Plan Designer (sharp-darwin)' };
    this.scene.add(this.floorplanGroup);
  }

  // ========================================================================
  // MONUMENT 04: Legal Intelligence (ll) — Gemini Codex & Pillars of Justice
  // ========================================================================
  buildMonumentCodex() {
    this.codexGroup = new THREE.Group();
    this.codexGroup.position.set(18, 0, 18);

    // 1. Tiered Sanctuary Dais (Obsidian bedrock + Polished white marble step)
    const baseGeo = new THREE.CylinderGeometry(5.2, 5.8, 0.5, 8);
    const base = new THREE.Mesh(baseGeo, this.matObsidian);
    base.position.y = 0.25;
    base.receiveShadow = true;
    this.codexGroup.add(base);

    const stepGeo = new THREE.CylinderGeometry(4.4, 4.8, 0.4, 8);
    const step = new THREE.Mesh(stepGeo, this.matMarble);
    step.position.y = 0.65;
    step.receiveShadow = true;
    this.codexGroup.add(step);

    // Cyan-gold energy rune ring around dais
    const runeRing = new THREE.Mesh(new THREE.RingGeometry(4.85, 5.1, 32), this.matNeonCyan);
    runeRing.rotation.x = -Math.PI / 2;
    runeRing.position.y = 0.51;
    this.codexGroup.add(runeRing);

    // 2. Twin Fluted Pillars of Justice (Lex Aeterna & Veritas)
    const pillarSpacing = 2.4;
    [-pillarSpacing, pillarSpacing].forEach((xOffset, idx) => {
      // Plinth base
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.6), this.matMarble);
      plinth.position.set(xOffset, 1.1, 0);
      plinth.castShadow = true;
      this.codexGroup.add(plinth);

      // Fluted crystalline column
      const colGeo = new THREE.CylinderGeometry(0.55, 0.65, 8.2, 12);
      const column = new THREE.Mesh(colGeo, this.matIce);
      column.position.set(xOffset, 5.4, 0);
      column.castShadow = true;
      this.codexGroup.add(column);

      // Inner glowing energy core inside the crystal column
      const coreGeo = new THREE.CylinderGeometry(0.12, 0.12, 8.0, 6);
      const coreCol = idx === 0 ? this.matNeonCyan : this.matGeminiViolet;
      const core = new THREE.Mesh(coreGeo, coreCol);
      core.position.set(xOffset, 5.4, 0);
      this.codexGroup.add(core);

      // Fluted capital crown
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), this.matMarble);
      cap.position.set(xOffset, 9.7, 0);
      cap.castShadow = true;
      this.codexGroup.add(cap);

      // Ground uplight for each pillar
      const pLight = new THREE.PointLight(idx === 0 ? 0x38bdf8 : 0xa855f7, 1.4, 9);
      pLight.position.set(xOffset, 1.8, 0.5);
      this.codexGroup.add(pLight);
    });

    // 3. Spanning Lintel Architrave Beam
    const lintelGeo = new THREE.BoxGeometry(6.6, 0.7, 1.6);
    const lintel = new THREE.Mesh(lintelGeo, this.matMarble);
    lintel.position.set(0, 10.25, 0);
    lintel.castShadow = true;
    this.codexGroup.add(lintel);

    // Architrave Inlay Neon Frieze
    const friezeGeo = new THREE.BoxGeometry(6.4, 0.12, 1.62);
    const frieze = new THREE.Mesh(friezeGeo, this.matLegalGold);
    frieze.position.set(0, 10.25, 0);
    this.codexGroup.add(frieze);

    // 4. The Verifiable Scales of Justice (atop the architrave)
    this.scalesGroup = new THREE.Group();
    this.scalesGroup.position.set(0, 10.6, 0);

    // Fulcrum base & pivot
    const fulcrum = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 0.9, 6), this.matLegalGold);
    fulcrum.position.set(0, 0.45, 0);
    fulcrum.castShadow = true;
    this.scalesGroup.add(fulcrum);

    // Rocking Crossbeam
    this.scalesBeam = new THREE.Group();
    this.scalesBeam.position.set(0, 0.9, 0);

    const beamMesh = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, 0.14), this.matLegalGold);
    beamMesh.castShadow = true;
    this.scalesBeam.add(beamMesh);

    // Left Pan Suspension
    this.scalePanLeft = new THREE.Group();
    this.scalePanLeft.position.set(-2.5, 0, 0);

    const cordGeo = new THREE.CylinderGeometry(0.012, 0.012, 1.6, 4);
    const cordLeft = new THREE.Mesh(cordGeo, this.matLegalGold);
    cordLeft.position.y = -0.8;
    this.scalePanLeft.add(cordLeft);

    const panLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.65, 0.14, 16), this.matLegalGold);
    panLeft.position.y = -1.6;
    this.scalePanLeft.add(panLeft);

    // Left Pan Cargo: Multimodal Intake Crystal
    const gemLeft = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), this.matNeonCyan);
    gemLeft.position.y = -1.35;
    this.scalePanLeft.add(gemLeft);

    this.scalesBeam.add(this.scalePanLeft);

    // Right Pan Suspension
    this.scalePanRight = new THREE.Group();
    this.scalePanRight.position.set(2.5, 0, 0);

    const cordRight = new THREE.Mesh(cordGeo, this.matLegalGold);
    cordRight.position.y = -0.8;
    this.scalePanRight.add(cordRight);

    const panRight = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.65, 0.14, 16), this.matLegalGold);
    panRight.position.y = -1.6;
    this.scalePanRight.add(panRight);

    // Right Pan Cargo: Verification Golden Glyph Tablet
    const gemRight = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.15, 0.45), this.matGoldCircuit);
    gemRight.position.y = -1.45;
    this.scalePanRight.add(gemRight);

    this.scalesBeam.add(this.scalePanRight);
    this.scalesGroup.add(this.scalesBeam);
    this.codexGroup.add(this.scalesGroup);

    // 5. Multimodal Gemini Double-Helix Core (ascending between pillars)
    this.helixGroup = new THREE.Group();
    this.helixGroup.position.set(0, 5.2, 0);

    const helixCount = 44;
    this.helixNodes = [];
    for (let i = 0; i < helixCount; i++) {
      const t = (i / helixCount) * Math.PI * 4;
      const y = (i / helixCount) * 6.8 - 3.4;
      const r = 1.05;
      const x1 = Math.sin(t) * r;
      const z1 = Math.cos(t) * r;
      const x2 = Math.sin(t + Math.PI) * r;
      const z2 = Math.cos(t + Math.PI) * r;

      // Cyan strand (Multimodal Document Parsing)
      const n1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), this.matNeonCyan);
      n1.position.set(x1, y, z1);
      this.helixGroup.add(n1);

      // Violet strand (Gemini Deep Reasoning)
      const n2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), this.matGeminiViolet);
      n2.position.set(x2, y, z2);
      this.helixGroup.add(n2);

      // Semantic bridge rung every 4 nodes
      if (i % 4 === 0) {
        const rungMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, r * 2, 4), this.matLegalGold);
        rungMesh.position.set(0, y, 0);
        rungMesh.rotation.z = Math.PI / 2;
        rungMesh.rotation.y = -t;
        this.helixGroup.add(rungMesh);
      }
    }

    // Central Gemini Core Orb
    this.geminiCoreOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 1), this.matIce);
    this.geminiCoreOrb.position.set(0, 0, 0);
    this.helixGroup.add(this.geminiCoreOrb);

    const geminiInner = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 16), this.matNeonCyan);
    this.geminiCoreOrb.add(geminiInner);

    this.geminiCoreLight = new THREE.PointLight(0x38bdf8, 2.2, 12);
    this.helixGroup.add(this.geminiCoreLight);

    this.codexGroup.add(this.helixGroup);

    // 6. Four Floating Holographic Legal Codex Tablets
    this.codexPlates = [];
    const tabletSpecs = [
      {
        tag: 'PR_03 // LEX_INGEST',
        title: 'MULTIMODAL GEMINI 2.5',
        lines: [
          '• Input: Statutory Briefs & Deeds',
          '• Multimodal Vision & OCR Parse',
          '• Vector Embedding: 768-dim',
          '• Latency: 420ms Stream Pipeline'
        ],
        status: 'INGESTION ACTIVE (99.8%)'
      },
      {
        tag: 'PR_03 // VERITAS',
        title: 'CONTRACT RISK AUDIT',
        lines: [
          '• Indemnity Exposure: Scored',
          '• Termination: 30-Day Notice OK',
          '• Liability Cap: ARR Benchmark',
          '• Privacy: GDPR/CCPA Compliant'
        ],
        status: 'AUDIT VERIFIED // PASSED'
      },
      {
        tag: 'PR_03 // PRECEDENT',
        title: 'PGVECTOR RETRIEVAL',
        lines: [
          '• Index: HNSW Cosine Similarity',
          '• Database: Vercel Postgres',
          '• Case Law: 14 Matches Found',
          '• Top-3 Accuracy: 98.4%'
        ],
        status: 'PRECEDENT ALIGNED'
      },
      {
        tag: 'PR_03 // ADVISORY',
        title: 'CASE LIFECYCLE & PORTAL',
        lines: [
          '• Next.js 16 + React 19 SSR',
          '• Automated Consultation Sync',
          '• Client Portal & Vault Storage',
          '• Role-Based Access Control'
        ],
        status: 'PORTAL READY // DEPLOYED'
      }
    ];

    tabletSpecs.forEach((spec, i) => {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const tex = createCodexTabletTexture(spec.tag, spec.title, spec.lines, spec.status);
      const plateMat = new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        opacity: 0.94,
        roughness: 0.15,
        metalness: 0.25,
        side: THREE.DoubleSide
      });

      const plateGeo = new THREE.BoxGeometry(2.0, 2.7, 0.05);
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.set(Math.cos(angle) * 3.8, 5.2, Math.sin(angle) * 3.8);
      plate.rotation.y = angle + Math.PI / 2;
      plate.castShadow = true;

      // Glow border frame
      const frameGeo = new THREE.BoxGeometry(2.06, 2.76, 0.03);
      const frame = new THREE.Mesh(frameGeo, this.matHoloWire);
      plate.add(frame);

      this.codexGroup.add(plate);
      this.codexPlates.push(plate);
    });

    this.codexGroup.userData = { id: 'codex', name: 'Legal Intelligence Platform (ll)' };
    this.scene.add(this.codexGroup);
  }

  // ========================================================================
  // MONUMENT 05: System Prompts — Quantum Guardrail Sphere
  // ========================================================================
  buildMonumentGuardrail() {
    this.guardrailGroup = new THREE.Group();
    this.guardrailGroup.position.set(-18, 0, 18);

    const baseGeo = new THREE.CylinderGeometry(4.2, 4.8, 0.8, 8);
    const base = new THREE.Mesh(baseGeo, this.matObsidian);
    base.position.y = 0.4;
    this.guardrailGroup.add(base);

    const cageGeo = new THREE.IcosahedronGeometry(2.8, 1);
    this.guardrailCage = new THREE.Mesh(cageGeo, this.matHoloWire);
    this.guardrailCage.position.y = 4.2;
    this.guardrailGroup.add(this.guardrailCage);

    const plasmaGeo = new THREE.SphereGeometry(1.4, 24, 24);
    this.plasmaMesh = new THREE.Mesh(plasmaGeo, this.matNeonCyan);
    this.plasmaMesh.position.y = 4.2;
    this.guardrailGroup.add(this.plasmaMesh);

    this.plasmaLight = new THREE.PointLight(0x38bdf8, 2.0, 10);
    this.plasmaLight.position.y = 4.2;
    this.guardrailGroup.add(this.plasmaLight);

    this.guardrailRing1 = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.06, 8, 48), this.matIce);
    this.guardrailRing1.position.y = 4.2;
    this.guardrailRing1.rotation.x = Math.PI / 3;
    this.guardrailGroup.add(this.guardrailRing1);

    this.guardrailRing2 = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.06, 8, 48), this.matNeonCyan);
    this.guardrailRing2.position.y = 4.2;
    this.guardrailRing2.rotation.y = Math.PI / 4;
    this.guardrailGroup.add(this.guardrailRing2);

    this.guardrailGroup.userData = { id: 'guardrail', name: 'LLM System Prompts & Guardrails' };
    this.scene.add(this.guardrailGroup);
  }

  // ========================================================================
  // CENTRAL LANDMARK: The Crystal Igloo Dome & Shattered Rings
  // ========================================================================
  buildCentralIglooHeritage() {
    this.iglooGroup = new THREE.Group();
    this.iglooGroup.position.set(0, 0, -20);

    const domeGeo = new THREE.SphereGeometry(4.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    this.crystalDome = new THREE.Mesh(domeGeo, this.matIce);
    this.crystalDome.position.y = 0;
    this.crystalDome.castShadow = true;
    this.iglooGroup.add(this.crystalDome);

    const cageGeo = new THREE.SphereGeometry(4.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const cage = new THREE.Mesh(cageGeo, this.matHoloWire);
    this.iglooGroup.add(cage);

    this.heritageRings = [];
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(6.5 + i * 2.2, 0.15, 6, 32);
      const ring = new THREE.Mesh(ringGeo, this.matIce);
      ring.position.y = 2 + i * 2.5;
      ring.rotation.x = Math.PI * 0.45;
      ring.rotation.z = i * 0.5;
      this.iglooGroup.add(ring);
      this.heritageRings.push(ring);
    }

    this.scene.add(this.iglooGroup);
  }

  // ========================================================================
  // PLAYABLE FIRST-PERSON CHARACTER & EXPEDITION SYSTEM
  // ========================================================================
  buildPlayerCharacter() {
    this.playerGroup = new THREE.Group();
    this.playerGroup.name = "playerCharacter";

    const startX = 0;
    const startZ = 12;
    const startY = Math.max(0.35, computeTerrainHeight(startX, startZ));

    this.player = {
      pos: new THREE.Vector3(startX, startY, startZ),
      vel: new THREE.Vector3(0, 0, 0),
      yaw: 0,
      pitch: 0,
      isGrounded: true,
      isMoving: false,
      isRunning: false,
      stamina: 100,
      walkSpeed: 4.8,
      runSpeed: 10.5,
      jumpVelocity: 9.0,
      gravity: 24.0,
      povMode: 'first_person',
      animCycle: 0,
      headBobX: 0,
      headBobY: 0
    };

    // Authentic High-Altitude Alpine Expedition Materials (Himalayan 8000M Summit Suit)
    const matDownSuit = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // High-altitude safety saffron / summit gold
      roughness: 0.50,
      metalness: 0.08
    });
    const matParkaYoke = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Ballistic charcoal Cordura reinforcement yoke
      roughness: 0.72,
      metalness: 0.12
    });
    const matParka = matDownSuit;
    const matPants = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Saffron down expedition pants
      roughness: 0.52,
      metalness: 0.08
    });
    const matBoots = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Double mountaineering shell
      roughness: 0.85,
      metalness: 0.20
    });
    const matSteel = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Forged chrome-moly crampon steel
      roughness: 0.15,
      metalness: 0.95
    });
    const matGoggles = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Polarized mirrored glacier goggle glass
      emissive: 0x0369a1,
      emissiveIntensity: 0.45,
      roughness: 0.03,
      metalness: 0.98
    });
    const matGoggleStrap = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85
    });
    const matFaceMask = new THREE.MeshStandardMaterial({
      color: 0x111827, // Neoprene windproof storm balaclava
      roughness: 0.82
    });
    const matHoodFleece = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Thermal fleece storm gasket rim
      roughness: 0.88,
      metalness: 0.04
    });
    const matRope = new THREE.MeshStandardMaterial({
      color: 0xf97316, // High-visibility safety orange dynamic rope
      roughness: 0.72
    });
    const matBackpack = new THREE.MeshStandardMaterial({
      color: 0x0b1329, // Alpine summit technical rucksack
      roughness: 0.52,
      metalness: 0.35
    });
    const matScarf = new THREE.MeshStandardMaterial({
      color: 0xe11d48, // Crimson-coral expedition thermal trail scarf
      roughness: 0.82,
      side: THREE.DoubleSide
    });

    // 1. Torso & Anatomical Body Root
    this.playerBody = new THREE.Group();
    this.playerBody.position.y = 0.85;

    // Pelvis & Climbing Harness (Smooth contoured cylinder)
    const hipsGeo = new THREE.CylinderGeometry(0.22, 0.20, 0.20, 16);
    const hips = new THREE.Mesh(hipsGeo, matPants);
    hips.castShadow = true;
    this.playerBody.add(hips);

    const harnessBelt = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 20), matParkaYoke);
    harnessBelt.rotation.x = Math.PI / 2;
    harnessBelt.position.y = 0.06;
    this.playerBody.add(harnessBelt);

    // Carabiners hanging from harness loops
    [-0.18, 0.18].forEach(xOff => {
      const biner = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 6, 12), matSteel);
      biner.position.set(xOff, 0.02, 0.12);
      this.playerBody.add(biner);
    });

    // Expedition Puffy Down Suit Torso (4 smoothly stacked quilted baffle chambers)
    const baffleConfigs = [
      { rT: 0.23, rB: 0.22, h: 0.14, y: 0.12, mat: matParka },     // Lower abdomen
      { rT: 0.25, rB: 0.23, h: 0.15, y: 0.26, mat: matParka },     // Midriff
      { rT: 0.26, rB: 0.25, h: 0.16, y: 0.41, mat: matParka },     // Lower chest
      { rT: 0.25, rB: 0.26, h: 0.16, y: 0.56, mat: matParkaYoke }  // Upper chest & reinforced yoke
    ];

    baffleConfigs.forEach(b => {
      const baffleGeo = new THREE.CylinderGeometry(b.rT, b.rB, b.h, 16);
      const baffleMesh = new THREE.Mesh(baffleGeo, b.mat);
      baffleMesh.position.y = b.y;
      baffleMesh.castShadow = true;
      this.playerBody.add(baffleMesh);
    });

    // Anatomical Shoulder Deltoids
    [-0.31, 0.31].forEach(xOff => {
      const delt = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 12), matParkaYoke);
      delt.position.set(xOff, 0.60, 0);
      delt.scale.set(1.1, 0.9, 1.0);
      delt.castShadow = true;
      this.playerBody.add(delt);
    });

    // High Storm Collar Gasket
    const stormCollar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.055, 12, 24), matParkaYoke);
    stormCollar.rotation.x = Math.PI / 2;
    stormCollar.position.y = 0.68;
    this.playerBody.add(stormCollar);

    // Subtle luminescent chest beacon badge
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.03), this.matNeonCyan);
    badge.position.set(0, 0.52, 0.24);
    this.playerBody.add(badge);

    // Alpine Technical Summit Backpack
    const packGroup = new THREE.Group();
    packGroup.position.set(0, 0.44, -0.22);

    const packBody = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.52, 14), matBackpack);
    packBody.scale.set(1.2, 1.0, 0.85); // Ergonomic flattened silhouette
    packBody.castShadow = true;
    packGroup.add(packBody);

    // Pack top lid
    const packLid = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), matParkaYoke);
    packLid.position.y = 0.26;
    packLid.scale.set(1.15, 0.8, 0.85);
    packGroup.add(packLid);

    // Dual Technical Ice Climbing Axes (mounted in 'V' formation on backpack)
    [-0.14, 0.14].forEach((xOff, idx) => {
      const axeGroup = new THREE.Group();
      axeGroup.position.set(xOff, 0.05, -0.15);
      axeGroup.rotation.z = idx === 0 ? 0.22 : -0.22;

      // Shaft
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.54, 8), matParkaYoke);
      axeGroup.add(shaft);

      // Curved steel pick
      const pick = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 12, Math.PI * 0.65), matSteel);
      pick.rotation.z = Math.PI * 0.7;
      pick.position.set(-0.04, 0.26, 0);
      axeGroup.add(pick);

      // Steel spike
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.06, 6), matSteel);
      spike.rotation.x = Math.PI;
      spike.position.y = -0.28;
      axeGroup.add(spike);

      packGroup.add(axeGroup);
    });

    // Coiled Dynamic Climbing Rope strapped across the pack
    const ropeCoil = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.045, 10, 20), matRope);
    ropeCoil.rotation.y = Math.PI / 2;
    ropeCoil.position.set(0, 0.08, -0.16);
    packGroup.add(ropeCoil);

    this.playerBody.add(packGroup);

    // Dynamic Trailing Expedition Scarf (Billows physically in the alpine wind)
    this.scarfSegments = [];
    let prevScarfJoint = this.playerBody;
    const scarfAnchorY = 0.68;
    const scarfCount = 5;

    for (let s = 0; s < scarfCount; s++) {
      const segGroup = new THREE.Group();
      if (s === 0) segGroup.position.set(0.08, scarfAnchorY, -0.15);
      else segGroup.position.set(0, 0, -0.11);

      const segMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12 - s * 0.012, 0.02, 0.12), matScarf);
      segMesh.position.set(0, 0, -0.06);
      segGroup.add(segMesh);

      prevScarfJoint.add(segGroup);
      this.scarfSegments.push(segGroup);
      prevScarfJoint = segGroup;
    }

    // 2. Sculpted Organic Head & Hood
    this.playerHeadGroup = new THREE.Group();
    this.playerHeadGroup.position.set(0, 0.88, 0);

    // Organic Down-Insulated Expedition Hood (Smooth rounded shell)
    const hoodGeo = new THREE.SphereGeometry(0.22, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.78);
    const hood = new THREE.Mesh(hoodGeo, matParka);
    hood.position.set(0, 0.08, -0.02);
    hood.castShadow = true;
    this.playerHeadGroup.add(hood);

    // Storm Gasket Visor Rim
    const gasket = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 10, 24), matHoodFleece);
    gasket.rotation.x = Math.PI * 0.12;
    gasket.position.set(0, 0.06, 0.12);
    this.playerHeadGroup.add(gasket);

    // Neoprene Thermal Storm Mask (covering mouth and nose)
    const mask = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.14, 14), matFaceMask);
    mask.position.set(0, 0.02, 0.10);
    this.playerHeadGroup.add(mask);

    // Polarized Mirrored Glacier Goggles (Curved panoramic optical lenses)
    const goggleGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.10, 18, 1, false, -Math.PI * 0.38, Math.PI * 0.76);
    const goggles = new THREE.Mesh(goggleGeo, matGoggles);
    goggles.rotation.y = -Math.PI / 2;
    goggles.position.set(0, 0.12, 0.04);
    this.playerHeadGroup.add(goggles);

    // Goggle Elastic Strap wrapping around the hood
    const goggleStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.222, 0.222, 0.035, 18), matGoggleStrap);
    goggleStrap.position.set(0, 0.12, -0.02);
    this.playerHeadGroup.add(goggleStrap);

    // Micro Alpine Antenna with subtle cyan beacon
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 6), matParkaYoke);
    ant.position.set(0.21, 0.22, -0.08);
    ant.rotation.z = -0.25;
    this.playerHeadGroup.add(ant);

    this.playerBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), this.matNeonCyan);
    this.playerBeacon.position.set(0.24, 0.34, -0.08);
    this.playerHeadGroup.add(this.playerBeacon);

    this.playerBody.add(this.playerHeadGroup);

    // 3. Left Arm with Natural Human Articulation (Shoulder -> Bicep -> Elbow -> Forearm -> Glove)
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.31, 0.60, 0);

    const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.075, 0.28, 12), matParka);
    bicep.position.y = -0.14;
    bicep.castShadow = true;
    this.leftArmGroup.add(bicep);

    this.leftForearmGroup = new THREE.Group();
    this.leftForearmGroup.position.set(0, -0.28, 0);

    const leftElbow = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), matParkaYoke);
    this.leftForearmGroup.add(leftElbow);

    const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.068, 0.26, 12), matParkaYoke);
    leftForearm.position.y = -0.13;
    leftForearm.castShadow = true;
    this.leftForearmGroup.add(leftForearm);

    // Insulated Mountaineering Expedition Mitten
    const leftMitten = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.072, 0.16, 10), matBoots);
    leftMitten.position.y = -0.28;
    leftMitten.scale.set(1.1, 1.0, 0.7);
    this.leftForearmGroup.add(leftMitten);

    const leftThumb = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.020, 0.08, 8), matBoots);
    leftThumb.position.set(0.04, -0.24, 0.04);
    leftThumb.rotation.z = -0.4;
    this.leftForearmGroup.add(leftThumb);

    this.leftArmGroup.add(this.leftForearmGroup);
    this.playerBody.add(this.leftArmGroup);

    // 4. Right Arm with Natural Human Articulation & Wrist Telemetry HUD
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.31, 0.60, 0);

    const rightBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.075, 0.28, 12), matParka);
    rightBicep.position.y = -0.14;
    rightBicep.castShadow = true;
    this.rightArmGroup.add(rightBicep);

    this.rightForearmGroup = new THREE.Group();
    this.rightForearmGroup.position.set(0, -0.28, 0);

    const rightElbow = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), matParkaYoke);
    this.rightForearmGroup.add(rightElbow);

    const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.068, 0.26, 12), matParkaYoke);
    rightForearm.position.y = -0.13;
    rightForearm.castShadow = true;
    this.rightForearmGroup.add(rightForearm);

    // Integrated Holographic Altimeter / GPS Datapad
    const wristHUD = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.09), this.matNeonCyan);
    wristHUD.position.set(0.04, -0.16, 0.06);
    this.rightForearmGroup.add(wristHUD);

    const rightMitten = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.072, 0.16, 10), matBoots);
    rightMitten.position.y = -0.28;
    rightMitten.scale.set(1.1, 1.0, 0.7);
    this.rightForearmGroup.add(rightMitten);

    const rightThumb = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.020, 0.08, 8), matBoots);
    rightThumb.position.set(-0.04, -0.24, 0.04);
    rightThumb.rotation.z = 0.4;
    this.rightForearmGroup.add(rightThumb);

    this.rightArmGroup.add(this.rightForearmGroup);
    this.playerBody.add(this.rightArmGroup);

    this.playerGroup.add(this.playerBody);

    // 5. Left Leg (Hip Joint -> Down Trouser Thigh -> Articulated Knee -> Mountaineering Gaiter -> Double Boot & Crampons)
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.14, 0.82, 0);

    const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.092, 0.42, 14), matPants);
    leftThigh.position.y = -0.21;
    leftThigh.castShadow = true;
    this.leftLegGroup.add(leftThigh);

    this.leftShinGroup = new THREE.Group();
    this.leftShinGroup.position.set(0, -0.42, 0);

    const leftKnee = new THREE.Mesh(new THREE.SphereGeometry(0.092, 12, 10), matParkaYoke);
    leftKnee.scale.set(1.0, 1.0, 1.15);
    this.leftShinGroup.add(leftKnee);

    const leftGaiter = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.082, 0.38, 14), matParkaYoke);
    leftGaiter.position.y = -0.19;
    leftGaiter.castShadow = true;
    this.leftShinGroup.add(leftGaiter);

    // Double Mountaineering Expedition Boot (Anatomically rockered toe & vibram sole)
    const leftBootGroup = new THREE.Group();
    leftBootGroup.position.set(0, -0.38, 0.04);

    const bootFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.098, 0.18, 12), matBoots);
    bootFoot.rotation.x = Math.PI * 0.12;
    bootFoot.scale.set(1.0, 1.0, 1.45);
    bootFoot.position.set(0, -0.02, 0.04);
    bootFoot.castShadow = true;
    leftBootGroup.add(bootFoot);

    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.32), matBoots);
    sole.position.set(0, -0.11, 0.04);
    leftBootGroup.add(sole);

    // Steel Crampon Frame & 10 Forged Spikes
    const crampon = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.02, 0.33), matSteel);
    crampon.position.set(0, -0.135, 0.04);
    leftBootGroup.add(crampon);

    [-0.07, 0.07].forEach(xS => {
      [-0.10, -0.02, 0.06, 0.14, 0.18].forEach(zS => {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.04, 4), matSteel);
        spike.rotation.x = Math.PI;
        spike.position.set(xS, -0.155, zS);
        leftBootGroup.add(spike);
      });
    });

    this.leftShinGroup.add(leftBootGroup);
    this.leftLegGroup.add(this.leftShinGroup);
    this.playerGroup.add(this.leftLegGroup);

    // 6. Right Leg (Hip Joint -> Down Trouser Thigh -> Articulated Knee -> Mountaineering Gaiter -> Double Boot & Crampons)
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.14, 0.82, 0);

    const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.092, 0.42, 14), matPants);
    rightThigh.position.y = -0.21;
    rightThigh.castShadow = true;
    this.rightLegGroup.add(rightThigh);

    this.rightShinGroup = new THREE.Group();
    this.rightShinGroup.position.set(0, -0.42, 0);

    const rightKnee = new THREE.Mesh(new THREE.SphereGeometry(0.092, 12, 10), matParkaYoke);
    rightKnee.scale.set(1.0, 1.0, 1.15);
    this.rightShinGroup.add(rightKnee);

    const rightGaiter = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.082, 0.38, 14), matParkaYoke);
    rightGaiter.position.y = -0.19;
    rightGaiter.castShadow = true;
    this.rightShinGroup.add(rightGaiter);

    const rightBootGroup = new THREE.Group();
    rightBootGroup.position.set(0, -0.38, 0.04);

    const rightBootFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.098, 0.18, 12), matBoots);
    rightBootFoot.rotation.x = Math.PI * 0.12;
    rightBootFoot.scale.set(1.0, 1.0, 1.45);
    rightBootFoot.position.set(0, -0.02, 0.04);
    rightBootFoot.castShadow = true;
    rightBootGroup.add(rightBootFoot);

    const rightSole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.32), matBoots);
    rightSole.position.set(0, -0.11, 0.04);
    rightBootGroup.add(rightSole);

    const rightCrampon = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.02, 0.33), matSteel);
    rightCrampon.position.set(0, -0.135, 0.04);
    rightBootGroup.add(rightCrampon);

    [-0.07, 0.07].forEach(xS => {
      [-0.10, -0.02, 0.06, 0.14, 0.18].forEach(zS => {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.04, 4), matSteel);
        spike.rotation.x = Math.PI;
        spike.position.set(xS, -0.155, zS);
        rightBootGroup.add(spike);
      });
    });

    this.rightShinGroup.add(rightBootGroup);
    this.rightLegGroup.add(this.rightShinGroup);
    this.playerGroup.add(this.rightLegGroup);

    // 7. Ground Soft Shadow Decal
    const shadowGeo = new THREE.RingGeometry(0.05, 0.58, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide
    });
    this.playerShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.playerShadow.rotation.x = -Math.PI / 2;
    this.playerShadow.position.y = 0.02;
    this.playerGroup.add(this.playerShadow);

    this.playerGroup.position.copy(this.player.pos);
    this.scene.add(this.playerGroup);
  }

  setupGameInput() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false
    };

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.sprint = true;
      if (e.code === 'Space') {
        this.keys.jump = true;
        if (this.isFpsActive) e.preventDefault();
      }

      // 'V' toggles POV: 1st person vs 3rd person
      if (e.code === 'KeyV' && this.isFpsActive) {
        this.togglePovMode();
      }

      // 'E' examines nearby monument in Game Mode
      if (e.code === 'KeyE' && this.isFpsActive) {
        if (this.currentNearbySanctuary) {
          window.dispatchEvent(new CustomEvent('citadel_inspect_monument', {
            detail: { id: this.currentNearbySanctuary }
          }));
        }
      }

      // 'C' or 'KeyG' toggles Game Mode
      if ((e.code === 'KeyC' || e.code === 'KeyG') && !e.ctrlKey && !e.metaKey) {
        this.toggleGameMode();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.sprint = false;
      if (e.code === 'Space') this.keys.jump = false;
    });

    const canvas = this.renderer.domElement;
    canvas.addEventListener('click', () => {
      if (this.isFpsActive && document.pointerLockElement !== canvas) {
        try {
          canvas.requestPointerLock();
        } catch (err) {}
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === canvas);
      window.dispatchEvent(new CustomEvent('citadel_pointer_lock', {
        detail: { locked: this.isPointerLocked }
      }));
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isFpsActive && this.isPointerLocked && this.player) {
        const sens = 0.0022;
        this.player.yaw -= e.movementX * sens;
        this.player.pitch -= e.movementY * sens;
        this.player.pitch = Math.max(-1.35, Math.min(1.35, this.player.pitch));
      }
    });
  }

  updatePlayer(delta, time) {
    if (!this.player || !this.playerGroup) return;
    const p = this.player;

    if (!this.isFpsActive) {
      if (this.playerHeadGroup) this.playerHeadGroup.visible = true;
      this.playerGroup.position.copy(p.pos);
      this.playerBody.position.y = 0.85 + Math.sin(time * 2.0) * 0.02;
      return;
    }

    if (this.playerBeacon && this.playerBeacon.material) {
      this.playerBeacon.material.emissiveIntensity = 1.6 + Math.sin(time * 5.0) * 1.2;
    }

    // 1. Movement Input Vector
    let moveX = 0;
    let moveZ = 0;
    if (this.keys.forward) moveZ -= 1;
    if (this.keys.backward) moveZ += 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    const inputMag = Math.hypot(moveX, moveZ);
    p.isMoving = inputMag > 0.1;

    if (p.isMoving && this.keys.sprint && p.stamina > 5) {
      p.isRunning = true;
      p.stamina = Math.max(0, p.stamina - delta * 22);
    } else {
      p.isRunning = false;
      p.stamina = Math.min(100, p.stamina + delta * 18);
    }

    const curSpeed = p.isRunning ? p.runSpeed : (p.isMoving ? p.walkSpeed : 0);

    const forwardX = -Math.sin(p.yaw);
    const forwardZ = -Math.cos(p.yaw);
    const rightX = Math.cos(p.yaw);
    const rightZ = -Math.sin(p.yaw);

    let targetVelX = 0;
    let targetVelZ = 0;
    if (p.isMoving) {
      const normX = moveX / inputMag;
      const normZ = moveZ / inputMag;
      targetVelX = (rightX * normX + forwardX * (-normZ)) * curSpeed;
      targetVelZ = (rightZ * normX + forwardZ * (-normZ)) * curSpeed;
    }

    const accel = p.isGrounded ? (p.isMoving ? 14 : 18) : 4;
    p.vel.x = THREE.MathUtils.lerp(p.vel.x, targetVelX, Math.min(1, delta * accel));
    p.vel.z = THREE.MathUtils.lerp(p.vel.z, targetVelZ, Math.min(1, delta * accel));

    if (this.keys.jump && p.isGrounded) {
      p.vel.y = p.jumpVelocity;
      p.isGrounded = false;
      window.dispatchEvent(new CustomEvent('citadel_player_jump'));
    }

    if (!p.isGrounded) {
      p.vel.y -= p.gravity * delta;
    }

    p.pos.x += p.vel.x * delta;
    p.pos.y += p.vel.y * delta;
    p.pos.z += p.vel.z * delta;

    const terrainFloor = computeTerrainHeight(p.pos.x, p.pos.z);
    const minHeight = Math.max(0.28, terrainFloor);

    if (p.pos.y <= minHeight) {
      p.pos.y = minHeight;
      p.vel.y = 0;
      p.isGrounded = true;
    }

    const curR = Math.hypot(p.pos.x, p.pos.z);
    if (curR > 105) {
      p.pos.x = (p.pos.x / curR) * 105;
      p.pos.z = (p.pos.z / curR) * 105;
    }

    // 2. Procedural Walking & Running Animation
    const animFreq = p.isRunning ? 13.5 : 8.2;
    if (p.isMoving && p.isGrounded) {
      p.animCycle += delta * animFreq;

      if (Math.sin(p.animCycle) * Math.sin(p.animCycle - delta * animFreq) < 0) {
        window.dispatchEvent(new CustomEvent('citadel_footstep', { detail: { isRunning: p.isRunning } }));
      }
    } else {
      p.animCycle = THREE.MathUtils.lerp(p.animCycle, Math.round(p.animCycle / Math.PI) * Math.PI, delta * 8);
    }

    const legAmp = p.isRunning ? 0.88 : (p.isMoving ? 0.52 : 0);
    const armAmp = p.isRunning ? 0.82 : (p.isMoving ? 0.44 : 0);

    // 1. Thigh & Arm Primary Swing
    this.leftLegGroup.rotation.x = Math.sin(p.animCycle) * legAmp;
    this.rightLegGroup.rotation.x = -Math.sin(p.animCycle) * legAmp;
    this.leftArmGroup.rotation.x = -Math.sin(p.animCycle) * armAmp;
    this.rightArmGroup.rotation.x = Math.sin(p.animCycle) * armAmp;

    // 2. Anatomical Knee Flexion (Bends dynamically during push-off and backswing)
    if (this.leftShinGroup && this.rightShinGroup) {
      if (p.isMoving) {
        this.leftShinGroup.rotation.x = -Math.max(0, -Math.sin(p.animCycle)) * (p.isRunning ? 1.05 : 0.65);
        this.rightShinGroup.rotation.x = -Math.max(0, Math.sin(p.animCycle)) * (p.isRunning ? 1.05 : 0.65);
      } else {
        this.leftShinGroup.rotation.x = THREE.MathUtils.lerp(this.leftShinGroup.rotation.x, 0, delta * 10);
        this.rightShinGroup.rotation.x = THREE.MathUtils.lerp(this.rightShinGroup.rotation.x, 0, delta * 10);
      }
    }

    // 3. Anatomical Elbow Flexion (Forearm flexes forward on swing, straightens on backswing)
    if (this.leftForearmGroup && this.rightForearmGroup) {
      if (p.isMoving) {
        this.leftForearmGroup.rotation.x = Math.max(0, -Math.sin(p.animCycle)) * (p.isRunning ? 0.85 : 0.45) + 0.15;
        this.rightForearmGroup.rotation.x = Math.max(0, Math.sin(p.animCycle)) * (p.isRunning ? 0.85 : 0.45) + 0.15;
      } else {
        this.leftForearmGroup.rotation.x = THREE.MathUtils.lerp(this.leftForearmGroup.rotation.x, 0.15, delta * 10);
        this.rightForearmGroup.rotation.x = THREE.MathUtils.lerp(this.rightForearmGroup.rotation.x, 0.15, delta * 10);
      }
    }

    // 4. Biomechanical Torso Dynamics: Thoracic Counter-Rotation, Pelvis Lateral Sway & Forward Sprinter Lean
    this.playerBody.rotation.x = p.isRunning ? 0.20 : (p.isMoving ? 0.08 : 0.02 + Math.sin(time * 2.0) * 0.015);
    this.playerBody.rotation.y = p.isMoving ? -Math.sin(p.animCycle) * (p.isRunning ? 0.16 : 0.08) : 0;
    this.playerBody.rotation.z = p.isMoving ? Math.sin(p.animCycle) * (p.isRunning ? 0.06 : 0.03) : 0;
    this.playerBody.position.y = 0.85 + Math.abs(Math.sin(p.animCycle * 2)) * (p.isRunning ? 0.08 : 0.04);

    // 5. Dynamic Trailing Expedition Scarf (Billows in alpine wind & momentum)
    if (this.scarfSegments && this.scarfSegments.length > 0) {
      const windSpeed = p.isRunning ? 12.0 : (p.isMoving ? 8.0 : 4.5);
      const windLift = p.isRunning ? 0.45 : (p.isMoving ? 0.25 : 0.10);
      this.scarfSegments.forEach((seg, s) => {
        const wave = Math.sin(time * windSpeed + s * 0.65);
        const cross = Math.cos(time * (windSpeed * 0.7) + s * 0.5);
        seg.rotation.x = windLift + wave * (p.isRunning ? 0.22 : 0.10);
        seg.rotation.y = cross * 0.14;
        seg.rotation.z = Math.sin(time * 5.0 + s * 0.4) * 0.08;
      });
    }

    this.playerGroup.position.copy(p.pos);
    this.playerGroup.rotation.y = p.yaw + Math.PI;

    // 3. Camera Positioning: First-Person vs Third-Person POV
    if (p.povMode === 'first_person') {
      this.playerHeadGroup.visible = false;

      const bobY = p.isGrounded && p.isMoving ? Math.sin(p.animCycle * 2) * (p.isRunning ? 0.07 : 0.035) : 0;
      const bobX = p.isGrounded && p.isMoving ? Math.cos(p.animCycle) * (p.isRunning ? 0.035 : 0.015) : 0;

      const eyeHeight = 1.65 + bobY;
      const eyePos = p.pos.clone().add(new THREE.Vector3(
        bobX * Math.cos(p.yaw),
        eyeHeight,
        -bobX * Math.sin(p.yaw)
      ));

      this.camera.position.copy(eyePos);

      const targetLook = eyePos.clone().add(new THREE.Vector3(
        -Math.sin(p.yaw) * Math.cos(p.pitch),
        Math.sin(p.pitch),
        -Math.cos(p.yaw) * Math.cos(p.pitch)
      ));
      this.camera.lookAt(targetLook);

    } else {
      this.playerHeadGroup.visible = true;

      const chaseDist = 4.8;
      const chaseHeight = 2.2;
      const shoulderOffset = 0.75;

      const camOffset = new THREE.Vector3(
        Math.sin(p.yaw) * chaseDist + Math.cos(p.yaw) * shoulderOffset,
        chaseHeight - Math.sin(p.pitch) * 2.2,
        Math.cos(p.yaw) * chaseDist - Math.sin(p.yaw) * shoulderOffset
      );

      const targetCamPos = p.pos.clone().add(camOffset);

      // Camera-Terrain Collision Clearance: Prevent camera from ever clipping inside mountain geometry
      const terrainAtCam = computeTerrainHeight(targetCamPos.x, targetCamPos.z);
      if (targetCamPos.y < terrainAtCam + 0.85) {
        targetCamPos.y = terrainAtCam + 0.85;
      }

      const headPos = p.pos.clone().add(new THREE.Vector3(0, 1.6, 0));
      for (let step = 1; step <= 5; step++) {
        const t = step / 5;
        const testPos = headPos.clone().lerp(targetCamPos, t);
        const groundAtTest = computeTerrainHeight(testPos.x, testPos.z) + 0.55;
        if (testPos.y < groundAtTest) {
          testPos.y = groundAtTest;
          targetCamPos.copy(testPos);
          break;
        }
      }

      // Tree Obstacle Clearance: Ensure camera never clips inside pine tree foliage
      if (this.pineData && this.pineData.length > 0) {
        for (let i = 0; i < this.pineData.length; i++) {
          const pt = this.pineData[i];
          const dTree = Math.hypot(targetCamPos.x - pt.x, targetCamPos.z - pt.z);
          if (dTree < 3.2 && targetCamPos.y >= pt.y && targetCamPos.y <= pt.y + 5.2) {
            targetCamPos.lerp(headPos, 0.65);
            break;
          }
        }
      }

      const lookTarget = p.pos.clone().add(new THREE.Vector3(
        -Math.sin(p.yaw) * 3.2,
        1.45 + Math.sin(p.pitch) * 1.8,
        -Math.cos(p.yaw) * 3.2
      ));

      this.camera.position.lerp(targetCamPos, 0.25);
      this.camera.lookAt(lookTarget);
    }

    // 4. Proximity Detection to Architectural Sanctuaries
    const sanctuaries = [
      { id: 'agentic', name: 'AGENTIC AI REACTOR (Semantic Kernel & MCP)', x: 0, z: 0 },
      { id: 'dotnet', name: '.NET 8 ENTERPRISE MONOLITH', x: 22, z: -8 },
      { id: 'floorplan', name: '3D VASTU SPATIAL ENGINE (sharp-darwin)', x: -22, z: -8 },
      { id: 'codex', name: 'LEGAL AI GEMINI CODEX (ll)', x: 18, z: 18 },
      { id: 'guardrail', name: 'QUANTUM GUARDRAIL CITADEL', x: -18, z: 18 }
    ];

    let nearestSanctuary = null;
    let nearestDist = 999;
    for (const s of sanctuaries) {
      const d = Math.hypot(p.pos.x - s.x, p.pos.z - s.z);
      if (d < 8.5 && d < nearestDist) {
        nearestDist = d;
        nearestSanctuary = s;
      }
    }

    if (nearestSanctuary) {
      if (this.currentNearbySanctuary !== nearestSanctuary.id) {
        this.currentNearbySanctuary = nearestSanctuary.id;
        window.dispatchEvent(new CustomEvent('citadel_proximity_prompt', {
          detail: { active: true, id: nearestSanctuary.id, name: nearestSanctuary.name, dist: nearestDist }
        }));
      }
    } else if (this.currentNearbySanctuary) {
      this.currentNearbySanctuary = null;
      window.dispatchEvent(new CustomEvent('citadel_proximity_prompt', {
        detail: { active: false }
      }));
    }

    window.dispatchEvent(new CustomEvent('citadel_player_telemetry', {
      detail: {
        x: p.pos.x,
        y: p.pos.y,
        z: p.pos.z,
        speed: p.vel.length(),
        isRunning: p.isRunning,
        stamina: p.stamina,
        pov: p.povMode,
        yawDeg: Math.round(((p.yaw % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) * (180 / Math.PI))
      }
    }));
  }

  enableGameMode(initialPov = 'first_person') {
    this.isFpsActive = true;
    this.currentStage = 'fps';
    if (this.controls) this.controls.enabled = false;
    if (this.player) {
      this.player.povMode = initialPov;
      this.player.pos.y = Math.max(0.35, computeTerrainHeight(this.player.pos.x, this.player.pos.z));
      this.player.vel.set(0, 0, 0);
      this.player.isGrounded = true;
    }
    const stage = this.stages.fps;
    window.dispatchEvent(new CustomEvent('citadel_stage_change', {
      detail: {
        id: 'fps',
        title: stage.title,
        code: stage.code,
        tech: stage.tech,
        repo: stage.repo,
        desc: stage.desc
      }
    }));
    window.dispatchEvent(new CustomEvent('citadel_game_mode', {
      detail: { active: true, pov: this.player ? this.player.povMode : 'first_person' }
    }));
  }

  disableGameMode() {
    this.isFpsActive = false;
    if (this.controls) {
      this.controls.enabled = true;
      this.controls.target.set(0, 3, 0);
    }
    if (document.exitPointerLock && document.pointerLockElement) {
      document.exitPointerLock();
    }
    window.dispatchEvent(new CustomEvent('citadel_game_mode', {
      detail: { active: false }
    }));
  }

  toggleGameMode() {
    if (this.isFpsActive) {
      this.disableGameMode();
      this.switchStage('citadel');
    } else {
      this.enableGameMode();
    }
    return this.isFpsActive;
  }

  togglePovMode() {
    if (!this.player) return;
    this.player.povMode = (this.player.povMode === 'first_person') ? 'third_person' : 'first_person';
    window.dispatchEvent(new CustomEvent('citadel_pov_change', {
      detail: { pov: this.player.povMode }
    }));
    return this.player.povMode;
  }

  setupLighting() {
    this.ambLight = new THREE.AmbientLight(0xdbeafe, 0.60);
    this.scene.add(this.ambLight);

    // Natural Himalayan Alpine Sunlight
    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 1.45);
    this.dirLight.position.set(45, 65, 35);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 220;
    this.dirLight.shadow.camera.left = -70;
    this.dirLight.shadow.camera.right = 70;
    this.dirLight.shadow.camera.top = 70;
    this.dirLight.shadow.camera.bottom = -70;
    this.scene.add(this.dirLight);

    // Subtle alpine blue rim light catching jagged mountain horns and snow crests
    this.rimLight = new THREE.DirectionalLight(0xbae6fd, 0.75);
    this.rimLight.position.set(-50, 45, -60);
    this.scene.add(this.rimLight);

    // Aurora Celestial Light (Night & Spirit modes)
    this.auroraLight = new THREE.PointLight(0x10b981, 0.0, 90);
    this.auroraLight.position.set(0, 32, -45);
    this.scene.add(this.auroraLight);
  }

  setupRaycasting() {
    this.raycaster = new THREE.Raycaster();
    this.interactiveObjects = [
      this.agenticGroup,
      this.dotnetGroup,
      this.floorplanGroup,
      this.codexGroup,
      this.guardrailGroup
    ];

    window.addEventListener('click', (e) => {
      if (e.target.closest('.hud-header') || e.target.closest('.portfolio-dialog') || e.target.closest('.hud-sidebar-left') || e.target.closest('.stage-selector-bar') || e.target.closest('.hud-monument-telemetry') || e.target.closest('.ui-stack') || e.target.closest('.hotspot-point') || e.target.closest('.look-around-hint')) {
        return;
      }

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

      if (intersects.length > 0) {
        let root = intersects[0].object;
        while (root.parent && root.parent !== this.scene) {
          if (root.userData && root.userData.id) break;
          root = root.parent;
        }

        if (root.userData && root.userData.id) {
          this.switchStage(root.userData.id);
        }
      }
    });
  }

  onMouseMove(e) {
    this.mouse.x = (e.clientX / this.width) * 2 - 1;
    this.mouse.y = -(e.clientY / this.height) * 2 + 1;

    if (this.cursorLight) {
      this.cursorLight.position.x = this.mouse.x * 20;
      this.cursorLight.position.z = -this.mouse.y * 20;
    }

    // Hover raycasting
    if (this.interactiveObjects && this.interactiveObjects.length > 0 && !this.isTransitioning) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);
      if (intersects.length > 0) {
        let root = intersects[0].object;
        while (root.parent && root.parent !== this.scene) {
          if (root.userData && root.userData.id) break;
          root = root.parent;
        }
        if (root.userData && root.userData.id) {
          this.hoveredMonument = root;
          this.targetReticlePos.set(root.position.x, 0.05, root.position.z);
          document.body.style.cursor = 'pointer';
          return;
        }
      }
    }
    this.hoveredMonument = null;
    document.body.style.cursor = 'default';
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  // ========================================================================
  // CINEMATIC STAGE TRANSITIONS & CAMERA DIRECTOR
  // ========================================================================
  switchStage(stageId) {
    if (stageId === 'fps') {
      this.enableGameMode();
      return;
    }

    if (this.isFpsActive) {
      this.disableGameMode();
    }

    if (!this.stages[stageId]) return;
    this.currentStage = stageId;
    const stage = this.stages[stageId];

    this.isTransitioning = true;
    this.transitionStart = performance.now();
    this.startCamPos = this.camera.position.clone();
    this.targetCamPos = stage.cameraPos.clone();
    this.startLookAt = (this.controls ? this.controls.target.clone() : new THREE.Vector3(0, 3, 0));
    this.targetLookAt = stage.lookAt.clone();

    // Track discovery of monuments (Jordan Breton discovery system)
    if (stageId !== 'citadel') {
      this.discoveredSet.add(stageId);
    }
    const foundCount = Math.min(5, this.discoveredSet.has('citadel') ? this.discoveredSet.size - 1 : this.discoveredSet.size);
    window.dispatchEvent(new CustomEvent('citadel_discovery_update', {
      detail: {
        count: foundCount,
        total: 5,
        allFound: foundCount >= 5
      }
    }));

    // Broadcast update to Telemetry HUD
    window.dispatchEvent(new CustomEvent('citadel_stage_change', {
      detail: {
        id: stageId,
        title: stage.title,
        code: stage.code,
        tech: stage.tech,
        repo: stage.repo,
        desc: stage.desc
      }
    }));
  }

  toggleExplode() {
    this.isExploded = !this.isExploded;
    return this.isExploded;
  }

  // ========================================================================
  // JORDAN BRETON INSPIRATION: CELESTIAL ATMOSPHERE & AUTO-TOUR
  // ========================================================================
  setDayNightMode(isNight) {
    this.isNightMode = isNight;
    return this.isNightMode;
  }

  toggleDayNight() {
    this.isNightMode = !this.isNightMode;
    return this.isNightMode;
  }

  toggleSpiritMode() {
    this.isSpiritMode = !this.isSpiritMode;
    window.dispatchEvent(new CustomEvent('citadel_spirit_state', { detail: { active: this.isSpiritMode } }));
    return this.isSpiritMode;
  }

  toggleFuturisticMode() {
    this.isFuturisticMode = !this.isFuturisticMode;
    window.dispatchEvent(new CustomEvent('citadel_futuristic_state', { detail: { active: this.isFuturisticMode } }));
    return this.isFuturisticMode;
  }

  toggleAutoTour() {
    this.isAutoTourActive = !this.isAutoTourActive;
    if (this.isAutoTourActive) {
      this.tourIndex = 0;
      this.tourStages = ['agentic', 'dotnet', 'floorplan', 'codex', 'guardrail', 'citadel'];
      this.runNextTourStep();
    } else {
      if (this.tourTimer) clearTimeout(this.tourTimer);
    }
    window.dispatchEvent(new CustomEvent('citadel_tour_state', { detail: { active: this.isAutoTourActive } }));
    return this.isAutoTourActive;
  }

  stopAutoTour() {
    if (this.isAutoTourActive) {
      this.isAutoTourActive = false;
      if (this.tourTimer) clearTimeout(this.tourTimer);
      window.dispatchEvent(new CustomEvent('citadel_tour_state', { detail: { active: false } }));
    }
  }

  runNextTourStep() {
    if (!this.isAutoTourActive) return;
    const stageId = this.tourStages[this.tourIndex];
    this.switchStage(stageId);
    this.tourIndex = (this.tourIndex + 1) % this.tourStages.length;
    this.tourTimer = setTimeout(() => {
      if (this.isAutoTourActive) this.runNextTourStep();
    }, 6200);
  }

  // ========================================================================
  // IN-SCENE 3D HOTSPOT ANCHORS (3D-TO-2D PROJECTION)
  // ========================================================================
  setupHotspots() {
    this.hotspotAnchors = [
      { id: 'agentic', pos: new THREE.Vector3(0, 5.2, 0), title: 'AGENTIC REACTOR', code: 'PR_01' },
      { id: 'dotnet', pos: new THREE.Vector3(22, 10.8, -8), title: '.NET 8 MONOLITH', code: 'PR_02' },
      { id: 'floorplan', pos: new THREE.Vector3(-22, 5.4, -8), title: 'SHARP DARWIN (3D VASTU)', code: 'PR_04' },
      { id: 'codex', pos: new THREE.Vector3(18, 11.2, 18), title: 'LEGAL AI CODEX (LL)', code: 'PR_03' },
      { id: 'guardrail', pos: new THREE.Vector3(-18, 8.4, 18), title: 'QUANTUM GUARDRAIL', code: 'PR_05' }
    ];

    const container = document.getElementById('hotspotsContainer');
    if (!container) return;

    container.innerHTML = '';
    this.hotspotElements = [];

    this.hotspotAnchors.forEach(h => {
      const el = document.createElement('div');
      el.className = 'hotspot-point';
      el.setAttribute('data-stage', h.id);
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('title', `Explore ${h.title}`);
      el.innerHTML = `
        <div class="circle-container">
          <div class="ring"></div>
          <div class="circle"></div>
        </div>
        <div class="hotspot-label">
          <span class="hotspot-num">${h.code}</span>
          <span class="hotspot-title">${h.title}</span>
        </div>
      `;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.switchStage(h.id);
      });
      container.appendChild(el);
      this.hotspotElements.push({ ...h, element: el });
    });
  }

  updateHotspots() {
    if (!this.hotspotElements || this.hotspotElements.length === 0) return;

    const tempV = new THREE.Vector3();
    const halfW = this.width * 0.5;
    const halfH = this.height * 0.5;

    this.hotspotElements.forEach(item => {
      tempV.copy(item.pos);
      tempV.project(this.camera);

      // Occlude if behind camera, or currently in close-up view of this stage
      const isBehind = tempV.z > 1.0;
      const dist = this.camera.position.distanceTo(item.pos);
      const isCurrent = this.currentStage === item.id;

      if (isBehind || isCurrent || dist < 7.0) {
        item.element.classList.add('occluded');
      } else {
        item.element.classList.remove('occluded');
        let x = (tempV.x * halfW) + halfW;
        let y = -(tempV.y * halfH) + halfH;
        // Clamp so badges never bleed outside screen boundaries
        x = Math.max(90, Math.min(this.width - 120, x));
        y = Math.max(70, Math.min(this.height - 90, y));
        item.element.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;

        if (this.discoveredSet && this.discoveredSet.has(item.id)) {
          item.element.classList.add('visited');
        } else {
          item.element.classList.remove('visited');
        }
      }
    });
  }

  // ========================================================================
  // RENDER LOOP
  // ========================================================================
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // 0. Celestial Day / Night / Spirit Atmosphere Easing (Jordan Breton Inspiration)
    let targetBg, targetFog, targetDirIntensity, targetDirColor, targetRimIntensity, targetRimColor, targetAmbIntensity, targetStarOpacity, targetAurora, targetGroundColor;

    if (this.isSpiritMode) {
      targetBg = new THREE.Color(0x130e22);
      targetFog = new THREE.Color(0x130e22);
      targetDirIntensity = 1.9;
      targetDirColor = new THREE.Color(0xfde047);
      targetRimIntensity = 3.2;
      targetRimColor = new THREE.Color(0xa855f7);
      targetAmbIntensity = 0.85;
      targetStarOpacity = 0.85;
      targetAurora = 3.2;
      targetGroundColor = new THREE.Color(0xd8b4fe);
    } else if (this.isNightMode) {
      targetBg = new THREE.Color(0x030712);
      targetFog = new THREE.Color(0x030712);
      targetDirIntensity = 0.35;
      targetDirColor = new THREE.Color(0x38bdf8);
      targetRimIntensity = 3.6;
      targetRimColor = new THREE.Color(0x60a5fa);
      targetAmbIntensity = 0.35;
      targetStarOpacity = 1.0;
      targetAurora = 2.8;
      targetGroundColor = new THREE.Color(0x384a60);
    } else {
      // Crisp Himalayan Alpine Day Mode (Jordan Breton & FWA award level realism)
      targetBg = new THREE.Color(0x7e9cb8);
      targetFog = new THREE.Color(0x8faec9);
      targetDirIntensity = 1.45;
      targetDirColor = new THREE.Color(0xfff7ed);
      targetRimIntensity = 0.75;
      targetRimColor = new THREE.Color(0xbae6fd);
      targetAmbIntensity = 0.60;
      targetStarOpacity = 0.0;
      targetAurora = 0.0;
      targetGroundColor = new THREE.Color(0xffffff);
    }

    const lerpFactor = Math.min(1.0, Math.max(0.08, delta * 5.0));

    this.scene.background.lerp(targetBg, lerpFactor);
    this.scene.fog.color.lerp(targetFog, lerpFactor);

    // Sky Dome & Sun Disk Mode Transition
    let targetSunOpacity = 0.95;
    if (this.isNightMode) {
      targetSunOpacity = 0.0;
    } else if (this.isSpiritMode) {
      targetSunOpacity = 0.25;
    }

    if (this.sunMat) {
      this.sunMat.opacity = THREE.MathUtils.lerp(this.sunMat.opacity, targetSunOpacity, lerpFactor);
    }

    if (this.skyDome && this.skyColors && this.skyPositions) {
      const count = this.skyPositions.count;
      for (let i = 0; i < count; i++) {
        const y = this.skyPositions.getY(i);
        const t = Math.max(0, Math.min(1, (y + 40) / 380));
        let tr, tg, tb;
        if (this.isNightMode) {
          tr = THREE.MathUtils.lerp(0.04, 0.01, t);
          tg = THREE.MathUtils.lerp(0.06, 0.02, t);
          tb = THREE.MathUtils.lerp(0.14, 0.05, t);
        } else if (this.isSpiritMode) {
          tr = THREE.MathUtils.lerp(0.05, 0.18, t);
          tg = THREE.MathUtils.lerp(0.35, 0.06, t);
          tb = THREE.MathUtils.lerp(0.48, 0.38, t);
        } else {
          if (t > 0.45) {
            const u = (t - 0.45) / 0.55;
            tr = THREE.MathUtils.lerp(0.24, 0.10, u);
            tg = THREE.MathUtils.lerp(0.50, 0.22, u);
            tb = THREE.MathUtils.lerp(0.90, 0.54, u);
          } else {
            const u = t / 0.45;
            tr = THREE.MathUtils.lerp(0.92, 0.24, u);
            tg = THREE.MathUtils.lerp(0.95, 0.50, u);
            tb = THREE.MathUtils.lerp(1.00, 0.90, u);
          }
        }
        const idx = i * 3;
        this.skyColors[idx] = THREE.MathUtils.lerp(this.skyColors[idx], tr, lerpFactor);
        this.skyColors[idx + 1] = THREE.MathUtils.lerp(this.skyColors[idx + 1], tg, lerpFactor);
        this.skyColors[idx + 2] = THREE.MathUtils.lerp(this.skyColors[idx + 2], tb, lerpFactor);
      }
      this.skyColorAttr.needsUpdate = true;
    }

    if (this.ground && this.ground.material) {
      this.ground.material.color.lerp(targetGroundColor, lerpFactor);
    }
    if (this.dirLight) {
      this.dirLight.intensity = THREE.MathUtils.lerp(this.dirLight.intensity, targetDirIntensity, lerpFactor);
      this.dirLight.color.lerp(targetDirColor, lerpFactor);
    }
    if (this.rimLight) {
      this.rimLight.intensity = THREE.MathUtils.lerp(this.rimLight.intensity, targetRimIntensity, lerpFactor);
      this.rimLight.color.lerp(targetRimColor, lerpFactor);
    }
    if (this.ambLight) {
      this.ambLight.intensity = THREE.MathUtils.lerp(this.ambLight.intensity, targetAmbIntensity, lerpFactor);
    }
    if (this.auroraLight) {
      this.auroraLight.intensity = THREE.MathUtils.lerp(this.auroraLight.intensity, targetAurora, lerpFactor);
      const auroraCol = this.isSpiritMode ? new THREE.Color(0x8b5cf6) : new THREE.Color(0x10b981);
      this.auroraLight.color.lerp(auroraCol, lerpFactor);
    }
    if (this.starMat) {
      this.starMat.opacity = THREE.MathUtils.lerp(this.starMat.opacity, targetStarOpacity, lerpFactor);
      if ((this.isNightMode || this.isSpiritMode) && this.stars) {
        this.stars.rotation.y = time * 0.012;
      }
    }

    // 1. Flowing Glacial River Vertex Undulation
    if (this.riverMesh && this.riverBasePositions) {
      const pos = this.riverMesh.geometry.attributes.position;
      const count = pos.count;
      for (let i = 0; i < count; i++) {
        const x = this.riverBasePositions[i * 3];
        const z = this.riverBasePositions[i * 3 + 2];
        const wave = Math.sin(z * 0.22 - time * 2.5) * 0.12 + Math.cos(x * 0.5 + time * 1.8) * 0.06;
        pos.setY(i, 0.28 + wave);
      }
      pos.needsUpdate = true;
    }

    // Shoreline Whitewater Rapids Foam Pulse
    if (this.foamParticles) {
      this.foamParticles.material.opacity = 0.45 + Math.sin(time * 3.0) * 0.15;
    }

    // 2. Himalayan Pine Forest Wind Sway
    if (this.pineForestMesh && this.pineData) {
      const dummy = this.pineDummy;
      const swayTime = time * 1.6;
      for (let i = 0; i < this.pineData.length; i++) {
        const d = this.pineData[i];
        const sway = Math.sin(swayTime + d.phase) * 0.035;
        dummy.position.set(d.x, d.y, d.z);
        dummy.rotation.set(sway * 0.5, d.rotY, sway);
        dummy.scale.set(d.scaleX, d.scaleY, d.scaleZ);
        dummy.updateMatrix();
        this.pineForestMesh.setMatrixAt(i, dummy.matrix);
      }
      this.pineForestMesh.instanceMatrix.needsUpdate = true;
    }

    // 3. Jordan Breton AuroraPass Curtains Undulation
    if (this.auroraRibbons) {
      const targetAuroraOpacity = (this.isNightMode || this.isSpiritMode) ? (this.isSpiritMode ? 0.95 : 0.85) : 0.0;
      this.auroraRibbons.forEach((ribbon, rIdx) => {
        ribbon.material.opacity = THREE.MathUtils.lerp(ribbon.material.opacity, targetAuroraOpacity, 0.08);
        if (ribbon.material.opacity > 0.01) {
          const pos = ribbon.geometry.attributes.position;
          const orig = ribbon.userData.origPositions;
          const speed = time * (1.1 + rIdx * 0.25);
          for (let i = 0; i < pos.count; i++) {
            const ox = orig[i * 3];
            const oy = orig[i * 3 + 1];
            const oz = orig[i * 3 + 2];
            const waveX = Math.sin(oz * 0.08 + speed) * 3.8;
            const waveY = Math.cos(ox * 0.06 + speed * 1.2) * 1.8;
            const waveZ = Math.sin(speed * 0.8 + ox * 0.04) * 2.5;
            pos.setXYZ(i, ox + waveX, oy + waveY, oz + waveZ);
          }
          pos.needsUpdate = true;
        }
      });
    }

    // 4. Volumetric Mountain Mist & River Vapors Drift
    if (this.mistParticles && this.mistTypes) {
      const pos = this.mistParticles.geometry.attributes.position.array;
      for (let i = 0; i < this.mistCount; i++) {
        if (this.mistTypes[i] === 0) {
          // Low river mist drifts downstream along Z
          pos[i * 3 + 2] += delta * 1.8;
          if (pos[i * 3 + 2] > 75) {
            pos[i * 3 + 2] = -75;
          }
          pos[i * 3] += Math.sin(time * 0.4 + i) * 0.02;
        } else {
          // High mountain clouds drift slowly across peaks
          pos[i * 3] += delta * 1.2;
          if (pos[i * 3] > 105) {
            pos[i * 3] = -105;
          }
          pos[i * 3 + 1] += Math.sin(time * 0.2 + i) * 0.01;
        }
      }
      this.mistParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Update 3D-to-2D Projected Hotspot Anchors
    this.updateHotspots();

    // Update Playable Character Avatar & FPS Camera
    this.updatePlayer(delta, time);

    // 1. Cinematic Camera Fly-through Easing (when not in First-Person Game Mode)
    if (!this.isFpsActive) {
      if (this.isTransitioning) {
        const elapsed = (performance.now() - this.transitionStart) / 1400; // 1.4s smooth glide
        if (elapsed >= 1.0) {
          this.isTransitioning = false;
          this.camera.position.copy(this.targetCamPos);
          if (this.controls) {
            this.controls.target.copy(this.targetLookAt);
            this.controls.update();
          }
        } else {
          // Cubic easeInOut curve
          const ease = elapsed < 0.5
            ? 4 * elapsed * elapsed * elapsed
            : 1 - Math.pow(-2 * elapsed + 2, 3) / 2;

          this.camera.position.lerpVectors(this.startCamPos, this.targetCamPos, ease);
          if (this.controls) {
            this.controls.target.lerpVectors(this.startLookAt, this.targetLookAt, ease);
          }
        }
      } else if (this.controls) {
        this.controls.update();
      }
    }

    // 2. Snow Particles Motion
    if (this.snowParticles) {
      const positions = this.snowParticles.geometry.attributes.position.array;
      for (let i = 0; i < this.snowVelocities.length; i++) {
        positions[i * 3 + 1] -= this.snowVelocities[i];
        positions[i * 3] += Math.sin(time * 0.5 + i) * 0.02;
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 35;
        }
      }
      this.snowParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Animate Agentic Reactor
    if (this.agenticCore) {
      this.agenticCore.rotation.x = time * 0.3;
      this.agenticCore.rotation.y = time * 0.45;
      const pulse = 1.8 + Math.sin(time * 3.5) * 0.7;
      this.agenticCoreLight.intensity = pulse;

      this.agenticRings.forEach((r, idx) => {
        r.rotation.z = time * (0.4 + idx * 0.25) * (idx % 2 === 0 ? 1 : -1);
      });

      const satRadius = this.isExploded ? 8.5 : 5.2;
      this.agenticSatellites.forEach((sat, i) => {
        const curRadius = THREE.MathUtils.lerp(sat.group.position.length(), satRadius, 0.08);
        const ang = sat.baseAngle + time * 0.35;
        sat.group.position.x = Math.cos(ang) * curRadius;
        sat.group.position.z = Math.sin(ang) * curRadius;
        sat.group.position.y = 3.6 + Math.sin(time * 2 + i) * 0.4;
        sat.group.rotation.y = time * 1.5;

        const beamPos = this.agenticBeams[i].geometry.attributes.position.array;
        beamPos[3] = sat.group.position.x;
        beamPos[4] = sat.group.position.y;
        beamPos[5] = sat.group.position.z;
        this.agenticBeams[i].geometry.attributes.position.needsUpdate = true;
      });
    }

    // 4. Animate .NET 8 Monolith
    if (this.dotnetTier3) {
      const tierOffset = this.isExploded ? 3.5 : 0;
      this.dotnetTier3.position.y = THREE.MathUtils.lerp(this.dotnetTier3.position.y, 8.5 + tierOffset, 0.08);
      this.dotnetTier2.position.y = THREE.MathUtils.lerp(this.dotnetTier2.position.y, 5.6 + tierOffset * 0.4, 0.08);
      this.dotnetCore.rotation.y = time * 0.8;
      this.dotnetCore.rotation.x = time * 0.5;
    }

    // 5. Animate 3D Vastu Floor Plan Designer
    if (this.compassGroup) {
      this.compassGroup.rotation.y = time * 0.4;
      const wallHeight = this.isExploded ? 1.8 : 1.0;
      this.fpWalls.scale.y = THREE.MathUtils.lerp(this.fpWalls.scale.y, wallHeight, 0.08);
    }

    // 6. Animate Gemini Legal Codex & Scales of Justice
    if (this.scalesBeam) {
      const sway = Math.sin(time * 1.5) * 0.08;
      this.scalesBeam.rotation.z = sway;
      if (this.scalePanLeft) {
        this.scalePanLeft.rotation.z = -sway; // maintain level pan
      }
      if (this.scalePanRight) {
        this.scalePanRight.rotation.z = -sway; // maintain level pan
      }
    }
    if (this.helixGroup) {
      this.helixGroup.rotation.y = time * 0.8;
    }
    if (this.geminiCoreOrb) {
      const s = 1.0 + Math.sin(time * 3.5) * 0.12;
      this.geminiCoreOrb.scale.set(s, s, s);
      this.geminiCoreOrb.rotation.y = -time * 0.5;
      if (this.geminiCoreLight) {
        this.geminiCoreLight.intensity = 2.0 + Math.sin(time * 4.2) * 0.7;
      }
    }
    if (this.codexPlates) {
      this.codexPlates.forEach((plate, i) => {
        const ang = (i / 4) * Math.PI * 2 + Math.PI / 4 + time * 0.22;
        const rad = this.isExploded ? 6.2 : 3.8;
        plate.position.x = Math.cos(ang) * rad;
        plate.position.z = Math.sin(ang) * rad;
        plate.position.y = 5.2 + Math.sin(time * 1.8 + i) * 0.35;
        plate.rotation.y = ang + Math.PI / 2;
      });
    }

    // 7. Animate Quantum Guardrail Sphere
    if (this.guardrailCage) {
      this.guardrailCage.rotation.x = time * 0.25;
      this.guardrailCage.rotation.y = time * 0.35;
      this.guardrailRing1.rotation.z = time * 0.6;
      this.guardrailRing2.rotation.z = -time * 0.7;

      const s = 1.0 + Math.sin(time * 6) * 0.18 + Math.cos(time * 8) * 0.12;
      this.plasmaMesh.scale.set(s, s, s);
      this.plasmaLight.intensity = 1.5 + Math.sin(time * 10) * 0.8;
    }

    // 8. Animate Heritage Igloo Rings
    if (this.heritageRings) {
      this.heritageRings.forEach((ring, idx) => {
        ring.rotation.z = time * (0.15 + idx * 0.08) * (idx % 2 === 0 ? 1 : -1);
      });
    }

    // 9. Animate Holographic Hover Reticle
    if (this.reticleGroup) {
      const targetOpacity = this.hoveredMonument ? 0.9 : 0.0;
      this.reticleMat.opacity = THREE.MathUtils.lerp(this.reticleMat.opacity, targetOpacity, 0.12);
      if (this.reticleMat.opacity > 0.01) {
        this.reticleGroup.position.lerp(this.targetReticlePos, 0.15);
        this.reticleGroup.rotation.y = time * 0.9;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
