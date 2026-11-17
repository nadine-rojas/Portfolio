import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type ChessPieceKind = 'knight' | 'king';
export type ChessFinishKind = 'obsidian_gold' | 'emerald_crystal' | 'cyan_titanium';

export interface ChessSceneOptions {
  initialPiece?: ChessPieceKind;
  initialFinish?: ChessFinishKind;
  initialAutoRotate?: boolean;
  onWebGLFallback?: () => void;
}

export interface ChessSceneController {
  setPiece: (piece: ChessPieceKind) => void;
  setFinish: (finish: ChessFinishKind) => void;
  setAutoRotate: (enabled: boolean) => void;
  resetCamera: () => void;
  dispose: () => void;
}

interface ParticleSeed {
  radius: number;
  angle: number;
  speed: number;
  yBase: number;
  yAmp: number;
  phase: number;
  scale: number;
}

// Scratch objects pre-allocated at module scope to keep 60fps loop GC-free
const _dummy = new THREE.Object3D();
const _targetColor = new THREE.Color();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createMicroGrainTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 2) {
      const shade = 116 + Math.floor(Math.sin(y * 0.45) * 10 + ((y * 37) % 19));
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(0, y, 256, 1);
    }
    for (let i = 0; i < 900; i++) {
      const x = (i * 73) % 256;
      const y = (i * 139) % 256;
      const v = 108 + (i % 38);
      ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
      ctx.fillRect(x, y, 2, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

function createChessboardTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const cell = size / 8;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isLight = (r + c) % 2 === 0;
        ctx.fillStyle = isLight ? '#222631' : '#13151b';
        ctx.fillRect(c * cell, r * cell, cell, cell);

        // Subtle inner chamfer line on each square
        ctx.strokeStyle = isLight ? 'rgba(16, 185, 129, 0.16)' : 'rgba(148, 163, 184, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * cell + 1.5, r * cell + 1.5, cell - 3, cell - 3);
      }
    }

    // Crisp outer border accent
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

function createRadialShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.08,
      size / 2,
      size / 2,
      size * 0.5,
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  return new THREE.CanvasTexture(canvas);
}

/**
 * Builds a composite 7-part procedural Knight (`Caballo`) pivoted at bottom-center (y = 0).
 */
function buildKnightGroup(
  primaryMat: THREE.Material,
  accentMat: THREE.Material,
  trimMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'knight-group';

  // 1. Turned pedestal base (LatheGeometry)
  const baseProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.92, 0.0),
    new THREE.Vector2(0.92, 0.14),
    new THREE.Vector2(0.84, 0.22),
    new THREE.Vector2(0.72, 0.26),
    new THREE.Vector2(0.75, 0.34),
    new THREE.Vector2(0.58, 0.42),
    new THREE.Vector2(0.52, 0.52),
    new THREE.Vector2(0.0, 0.52),
  ];
  const baseGeo = new THREE.LatheGeometry(baseProfile, 36);
  const baseMesh = new THREE.Mesh(baseGeo, primaryMat);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Metallic collar ring (TorusGeometry)
  const collarGeo = new THREE.TorusGeometry(0.55, 0.052, 16, 42);
  const collarMesh = new THREE.Mesh(collarGeo, accentMat);
  collarMesh.rotation.x = Math.PI / 2;
  collarMesh.position.y = 0.52;
  collarMesh.castShadow = true;
  group.add(collarMesh);

  // 3. Fluted waist plinth (CylinderGeometry)
  const plinthGeo = new THREE.CylinderGeometry(0.44, 0.51, 0.36, 16);
  const plinthMesh = new THREE.Mesh(plinthGeo, primaryMat);
  plinthMesh.position.y = 0.7;
  plinthMesh.castShadow = true;
  plinthMesh.receiveShadow = true;
  group.add(plinthMesh);

  // 4. Sculpted geometric Knight body & snout (ExtrudeGeometry with bevels)
  const headShape = new THREE.Shape();
  headShape.moveTo(-0.38, 0.0);
  headShape.lineTo(0.36, 0.0);
  headShape.lineTo(0.42, 0.48);
  headShape.lineTo(0.24, 0.94);
  headShape.lineTo(0.54, 1.18);
  headShape.lineTo(0.66, 1.02);
  headShape.lineTo(0.74, 1.16);
  headShape.lineTo(0.52, 1.52);
  headShape.lineTo(0.14, 1.72);
  headShape.lineTo(-0.18, 1.68);
  headShape.lineTo(-0.44, 1.24);
  headShape.lineTo(-0.48, 0.62);
  headShape.closePath();

  const headGeo = new THREE.ExtrudeGeometry(headShape, {
    depth: 0.44,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 3,
  });
  headGeo.translate(0, 0, -0.22);
  const headMesh = new THREE.Mesh(headGeo, primaryMat);
  headMesh.position.y = 0.84;
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  group.add(headMesh);

  // 5. Crested mane spine (ExtrudeGeometry accent)
  const maneShape = new THREE.Shape();
  maneShape.moveTo(-0.46, 0.55);
  maneShape.lineTo(-0.34, 0.58);
  maneShape.lineTo(-0.28, 1.28);
  maneShape.lineTo(-0.08, 1.78);
  maneShape.lineTo(-0.24, 1.84);
  maneShape.lineTo(-0.48, 1.36);
  maneShape.lineTo(-0.56, 0.85);
  maneShape.closePath();

  const maneGeo = new THREE.ExtrudeGeometry(maneShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
  });
  maneGeo.translate(0, 0, -0.08);
  const maneMesh = new THREE.Mesh(maneGeo, accentMat);
  maneMesh.position.y = 0.84;
  maneMesh.castShadow = true;
  group.add(maneMesh);

  // 6. Twin sculpted pointed ears (ConeGeometry)
  const earGeo = new THREE.ConeGeometry(0.095, 0.34, 6);
  const leftEar = new THREE.Mesh(earGeo, primaryMat);
  leftEar.position.set(0.0, 2.72, 0.14);
  leftEar.rotation.z = -0.18;
  leftEar.rotation.x = 0.12;
  leftEar.castShadow = true;
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, primaryMat);
  rightEar.position.set(0.0, 2.72, -0.14);
  rightEar.rotation.z = -0.18;
  rightEar.rotation.x = -0.12;
  rightEar.castShadow = true;
  group.add(rightEar);

  // 7. Tactical orbital halo ring around chest/crown (TorusGeometry)
  const haloGeo = new THREE.TorusGeometry(0.95, 0.022, 12, 64);
  const haloMesh = new THREE.Mesh(haloGeo, trimMat);
  haloMesh.position.y = 1.58;
  haloMesh.rotation.x = Math.PI * 0.38;
  haloMesh.rotation.y = 0.3;
  group.add(haloMesh);

  return group;
}

/**
 * Builds a composite 7-part procedural King (`Rey`) pivoted at bottom-center (y = 0).
 */
function buildKingGroup(
  primaryMat: THREE.Material,
  accentMat: THREE.Material,
  trimMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'king-group';

  // 1. Turned pedestal base (LatheGeometry)
  const baseProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.95, 0.0),
    new THREE.Vector2(0.95, 0.14),
    new THREE.Vector2(0.86, 0.24),
    new THREE.Vector2(0.72, 0.3),
    new THREE.Vector2(0.74, 0.38),
    new THREE.Vector2(0.56, 0.48),
    new THREE.Vector2(0.0, 0.48),
  ];
  const baseMesh = new THREE.Mesh(new THREE.LatheGeometry(baseProfile, 36), primaryMat);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Lower accent ring (TorusGeometry)
  const lowerRing = new THREE.Mesh(new THREE.TorusGeometry(0.57, 0.048, 16, 42), accentMat);
  lowerRing.rotation.x = Math.PI / 2;
  lowerRing.position.y = 0.48;
  lowerRing.castShadow = true;
  group.add(lowerRing);

  // 3. Tapered royal column (LatheGeometry)
  const stemProfile = [
    new THREE.Vector2(0.0, 0.48),
    new THREE.Vector2(0.52, 0.48),
    new THREE.Vector2(0.39, 1.05),
    new THREE.Vector2(0.33, 1.58),
    new THREE.Vector2(0.46, 1.92),
    new THREE.Vector2(0.0, 1.92),
  ];
  const stemMesh = new THREE.Mesh(new THREE.LatheGeometry(stemProfile, 32), primaryMat);
  stemMesh.castShadow = true;
  stemMesh.receiveShadow = true;
  group.add(stemMesh);

  // 4. Upper crown collar (TorusGeometry)
  const upperRing = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.045, 16, 42), accentMat);
  upperRing.rotation.x = Math.PI / 2;
  upperRing.position.y = 1.94;
  upperRing.castShadow = true;
  group.add(upperRing);

  // 5. Faceted royal diadem (12-sided CylinderGeometry)
  const crownGeo = new THREE.CylinderGeometry(0.6, 0.46, 0.42, 12);
  const crownMesh = new THREE.Mesh(crownGeo, primaryMat);
  crownMesh.position.y = 2.18;
  crownMesh.castShadow = true;
  crownMesh.receiveShadow = true;
  group.add(crownMesh);

  // 6. Smooth dome cap (LatheGeometry)
  const domeProfile = [
    new THREE.Vector2(0.0, 2.38),
    new THREE.Vector2(0.5, 2.38),
    new THREE.Vector2(0.4, 2.52),
    new THREE.Vector2(0.2, 2.6),
    new THREE.Vector2(0.0, 2.62),
  ];
  const domeMesh = new THREE.Mesh(new THREE.LatheGeometry(domeProfile, 28), trimMat);
  domeMesh.castShadow = true;
  group.add(domeMesh);

  // 7. Beveled royal cross finial (ExtrudeGeometry)
  const crossShape = new THREE.Shape();
  const arm = 0.085;
  const len = 0.25;
  crossShape.moveTo(-arm, 0);
  crossShape.lineTo(arm, 0);
  crossShape.lineTo(arm, len * 0.85);
  crossShape.lineTo(len, len * 0.85);
  crossShape.lineTo(len, len * 1.45);
  crossShape.lineTo(arm, len * 1.45);
  crossShape.lineTo(arm, len * 2.15);
  crossShape.lineTo(-arm, len * 2.15);
  crossShape.lineTo(-arm, len * 1.45);
  crossShape.lineTo(-len, len * 1.45);
  crossShape.lineTo(-len, len * 0.85);
  crossShape.lineTo(-arm, len * 0.85);
  crossShape.closePath();

  const crossGeo = new THREE.ExtrudeGeometry(crossShape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
  crossGeo.translate(0, 0, -0.05);
  const crossMesh = new THREE.Mesh(crossGeo, accentMat);
  crossMesh.position.y = 2.58;
  crossMesh.castShadow = true;
  group.add(crossMesh);

  // Orbital tactical ring
  const haloMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.022, 12, 64),
    trimMat,
  );
  haloMesh.position.y = 1.55;
  haloMesh.rotation.x = Math.PI * 0.36;
  haloMesh.rotation.y = -0.25;
  group.add(haloMesh);

  return group;
}

export function mountChessHeroScene(
  container: HTMLElement,
  options: ChessSceneOptions = {},
): ChessSceneController {
  const isSoftwareGl = detectSoftwareWebGL();
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x16181d);
  scene.fog = new THREE.FogExp2(0x16181d, 0.042);

  const width = Math.max(container.clientWidth, 320);
  const height = Math.max(container.clientHeight, 320);
  let lastWidth = width;
  let lastHeight = height;

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);
  const defaultCameraPos = new THREE.Vector3(3.6, 3.25, 5.45);
  camera.position.copy(defaultCameraPos);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.setAttribute('aria-label', 'Escena 3D interactiva de pieza de ajedrez');

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const handleContextLost = (e: Event) => {
    e.preventDefault();
    options.onWebGLFallback?.();
  };
  renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

  // Studio environment reflections (PMREM + RoomEnvironment) on all devices
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  pmremGenerator.dispose();

  // Warm key light + cool Hemisphere fill + emerald/cyan rim light
  const hemiLight = new THREE.HemisphereLight(0xbfe0ff, 0x10131e, 0.95);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff4de, 2.75);
  keyLight.position.set(4.5, 7.5, 4.5);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 20;
  keyLight.shadow.camera.left = -4;
  keyLight.shadow.camera.right = 4;
  keyLight.shadow.camera.top = 4;
  keyLight.shadow.camera.bottom = -4;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x34d399, 1.85);
  rimLight.position.set(-4.5, 3.5, -4.0);
  scene.add(rimLight);

  const cyanAccentLight = new THREE.PointLight(0x22d3ee, 2.8, 14, 2);
  cyanAccentLight.position.set(2.5, 2.2, 2.6);
  scene.add(cyanAccentLight);

  // Procedural surface maps
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const grainBump = createMicroGrainTexture();
  const boardTex = createChessboardTexture(maxAniso);
  const shadowTex = createRadialShadowTexture();

  // Shared materials mutated smoothly when switching finishes
  const primaryMat = new THREE.MeshPhysicalMaterial({
    color: 0x161925,
    roughness: 0.36,
    metalness: 0.28,
    clearcoat: 0.5,
    clearcoatRoughness: 0.22,
    bumpMap: grainBump,
    bumpScale: 0.012,
  });

  const accentMat = new THREE.MeshPhysicalMaterial({
    color: 0xeab308,
    roughness: 0.16,
    metalness: 0.94,
    clearcoat: 0.4,
    clearcoatRoughness: 0.15,
  });

  const trimMat = new THREE.MeshPhysicalMaterial({
    color: 0x10b981,
    emissive: new THREE.Color(0x064e3b),
    emissiveIntensity: 0.65,
    roughness: 0.18,
    metalness: 0.72,
  });

  // Root stage group positioned cleanly above the bottom control dock
  const stageGroup = new THREE.Group();
  stageGroup.position.set(0, -0.78, 0);
  scene.add(stageGroup);

  // Stylized chessboard pedestal + subtle wireframe floor grid
  const plinthGeo = new THREE.BoxGeometry(4.4, 0.16, 4.4);
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x16181d,
    roughness: 0.45,
    metalness: 0.4,
  });
  const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
  plinthMesh.position.y = -0.1;
  plinthMesh.receiveShadow = true;
  stageGroup.add(plinthMesh);

  const boardPlaneGeo = new THREE.PlaneGeometry(4.2, 4.2);
  const boardPlaneMat = new THREE.MeshStandardMaterial({
    map: boardTex,
    roughness: 0.42,
    metalness: 0.22,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const boardPlane = new THREE.Mesh(boardPlaneGeo, boardPlaneMat);
  boardPlane.rotation.x = -Math.PI / 2;
  boardPlane.position.y = -0.015;
  boardPlane.receiveShadow = true;
  stageGroup.add(boardPlane);

  const gridHelper = new THREE.GridHelper(12, 16, 0x10b981, 0x252834);
  gridHelper.position.y = -0.22;
  const gridMats = Array.isArray(gridHelper.material)
    ? gridHelper.material
    : [gridHelper.material];
  gridMats.forEach((m) => {
    m.transparent = true;
    m.opacity = 0.24;
  });
  stageGroup.add(gridHelper);

  // Soft radial contact shadow directly beneath the chess piece
  const contactShadowGeo = new THREE.CircleGeometry(1.18, 32);
  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.012;
  stageGroup.add(contactShadow);

  // Build both composite chess pieces and mount inside pivot group
  const piecePivot = new THREE.Group();
  stageGroup.add(piecePivot);

  const knightGroup = buildKnightGroup(primaryMat, accentMat, trimMat);
  const kingGroup = buildKingGroup(primaryMat, accentMat, trimMat);
  piecePivot.add(knightGroup);
  piecePivot.add(kingGroup);

  let activePiece: ChessPieceKind = options.initialPiece ?? 'knight';
  knightGroup.visible = activePiece === 'knight';
  kingGroup.visible = activePiece === 'king';

  // Instanced floating geometric particles orbiting the chessboard
  const particleCount = 48;
  const particleGeo = new THREE.OctahedronGeometry(0.042, 0);
  const particleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.6,
    emissive: 0x064e3b,
    emissiveIntensity: 0.35,
  });
  const particlesMesh = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
  particlesMesh.frustumCulled = false;

  const particleSeeds: ParticleSeed[] = [];
  const paletteHex = [0x10b981, 0x06b6d4, 0xeab308];
  for (let i = 0; i < particleCount; i++) {
    particleSeeds.push({
      radius: 1.7 + (i % 7) * 0.34,
      angle: (i / particleCount) * Math.PI * 2,
      speed: 0.14 + (i % 5) * 0.045,
      yBase: 0.35 + ((i * 19) % 24) * 0.11,
      yAmp: 0.12 + (i % 4) * 0.05,
      phase: i * 0.7,
      scale: 0.65 + (i % 5) * 0.18,
    });
    _targetColor.setHex(paletteHex[i % paletteHex.length]);
    particlesMesh.setColorAt(i, _targetColor);
  }
  if (particlesMesh.instanceColor) {
    particlesMesh.instanceColor.needsUpdate = true;
  }
  particlesMesh.computeBoundingSphere();
  stageGroup.add(particlesMesh);

  // OrbitControls: allow dragging to inspect piece, disable zoom so scroll works cleanly
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.06;
  controls.minPolarAngle = Math.PI * 0.2;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.set(0, 0.35, 0);
  controls.update();

  let autoRotate = options.initialAutoRotate ?? !prefersReducedMotion;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let smoothParallaxX = 0;
  let smoothParallaxY = 0;

  const updateViewOffset = (w: number, h: number) => {
    camera.aspect = w / h;
    if (w >= 1024) {
      // Shift projection cleanly so the 3D piece anchors the right half of the desktop Hero
      camera.setViewOffset(w, h, -w * 0.21, -h * 0.02, w, h);
    } else {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();
  };
  updateViewOffset(width, height);

  const applyFinish = (finish: ChessFinishKind) => {
    if (finish === 'obsidian_gold') {
      primaryMat.color.setHex(0x283044);
      primaryMat.roughness = 0.28;
      primaryMat.metalness = 0.45;
      primaryMat.transmission = 0;
      primaryMat.transparent = false;
      primaryMat.opacity = 1;
      primaryMat.clearcoat = 0.72;

      accentMat.color.setHex(0xfacc15);
      accentMat.roughness = 0.14;
      accentMat.metalness = 0.94;

      trimMat.color.setHex(0x10b981);
      trimMat.emissive.setHex(0x059669);
      trimMat.emissiveIntensity = 0.85;
    } else if (finish === 'emerald_crystal') {
      primaryMat.color.setHex(0x34d399);
      primaryMat.roughness = 0.09;
      primaryMat.metalness = 0.08;
      primaryMat.transmission = isSoftwareGl ? 0 : 0.84;
      primaryMat.transparent = true;
      primaryMat.opacity = isSoftwareGl ? 0.62 : 1;
      primaryMat.ior = 1.62;
      primaryMat.thickness = 1.4;
      primaryMat.attenuationColor.setHex(0x059669);
      primaryMat.clearcoat = 1.0;

      accentMat.color.setHex(0xd1fae5);
      accentMat.roughness = 0.14;
      accentMat.metalness = 0.9;

      trimMat.color.setHex(0x06b6d4);
      trimMat.emissive.setHex(0x0e7490);
      trimMat.emissiveIntensity = 0.75;
    } else {
      primaryMat.color.setHex(0x334155);
      primaryMat.roughness = 0.22;
      primaryMat.metalness = 0.88;
      primaryMat.transmission = 0;
      primaryMat.transparent = false;
      primaryMat.opacity = 1;
      primaryMat.clearcoat = 0.35;

      accentMat.color.setHex(0x22d3ee);
      accentMat.roughness = 0.18;
      accentMat.metalness = 0.78;

      trimMat.color.setHex(0xfacc15);
      trimMat.emissive.setHex(0x713f12);
      trimMat.emissiveIntensity = 0.55;
    }
    primaryMat.needsUpdate = true;
    accentMat.needsUpdate = true;
    trimMat.needsUpdate = true;
  };

  applyFinish(options.initialFinish ?? 'obsidian_gold');

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  const handlePointerMove = (e: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    pointerTargetX = THREE.MathUtils.clamp(nx, -1, 1);
    pointerTargetY = THREE.MathUtils.clamp(ny, -1, 1);
  };
  window.addEventListener('pointermove', handlePointerMove, { passive: true });

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const nextW = Math.max(Math.floor(entry.contentRect.width), 320);
      const nextH = Math.max(Math.floor(entry.contentRect.height), 320);
      if (nextW === lastWidth && nextH === lastHeight) continue;
      lastWidth = nextW;
      lastHeight = nextH;
      renderer.setSize(nextW, nextH);
      updateViewOffset(nextW, nextH);
      renderer.render(scene, camera);
    }
  });
  resizeObserver.observe(container);

  // Animation loop with software-WebGL afterDraw pacing
  let disposed = false;
  let frameId = 0;
  let spinAngle = 0;
  let elapsed = 0;
  let lastTime = performance.now();

  function afterDraw(cb: () => void) {
    if (disposed) return;
    const gl = renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  function tick(now = performance.now()) {
    if (disposed) return;
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    elapsed += dt;

    if (autoRotate && !prefersReducedMotion) {
      spinAngle += dt * 0.42;
    }

    // Damped mouse parallax & gentle levitation
    smoothParallaxX = THREE.MathUtils.damp(smoothParallaxX, pointerTargetX * 0.18, 4.5, dt);
    smoothParallaxY = THREE.MathUtils.damp(smoothParallaxY, pointerTargetY * 0.1, 4.5, dt);

    const floatY = prefersReducedMotion ? 0.12 : 0.14 + Math.sin(elapsed * 1.45) * 0.08;
    piecePivot.position.y = floatY;
    piecePivot.rotation.y = spinAngle + smoothParallaxX * 0.7;
    piecePivot.rotation.x = smoothParallaxY * 0.45;
    piecePivot.rotation.z = -smoothParallaxX * 0.25;

    // Contact shadow breathes inversely with levitation height
    const shadowScale = 1 - (floatY - 0.14) * 0.6;
    contactShadow.scale.setScalar(shadowScale);

    // Update instanced orbiting particles without allocations
    for (let i = 0; i < particleCount; i++) {
      const seed = particleSeeds[i];
      const theta = seed.angle + (prefersReducedMotion ? 0 : elapsed * seed.speed);
      _dummy.position.set(
        Math.cos(theta) * seed.radius,
        seed.yBase + Math.sin(elapsed * 1.2 + seed.phase) * seed.yAmp,
        Math.sin(theta) * seed.radius,
      );
      _dummy.rotation.set(elapsed * 0.5 + seed.phase, theta, 0);
      _dummy.scale.setScalar(seed.scale);
      _dummy.updateMatrix();
      particlesMesh.setMatrixAt(i, _dummy.matrix);
    }
    particlesMesh.instanceMatrix.needsUpdate = true;

    controls.update();
    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(() => tick(performance.now()));
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  if (isSoftwareGl) {
    // Draw immediate initial frame, then pace softly
    tick(performance.now());
  } else {
    frameId = requestAnimationFrame(tick);
  }

  return {
    setPiece(piece: ChessPieceKind) {
      activePiece = piece;
      knightGroup.visible = piece === 'knight';
      kingGroup.visible = piece === 'king';
      renderer.render(scene, camera);
    },
    setFinish(finish: ChessFinishKind) {
      applyFinish(finish);
      renderer.render(scene, camera);
    },
    setAutoRotate(enabled: boolean) {
      autoRotate = enabled;
    },
    resetCamera() {
      camera.position.copy(defaultCameraPos);
      controls.target.set(0, 0.35, 0);
      controls.update();
      renderer.render(scene, camera);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      resizeObserver.disconnect();
      controls.dispose();

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material?.dispose();
          }
        }
      });

      grainBump.dispose();
      boardTex.dispose();
      shadowTex.dispose();
      envTex.dispose();
      renderer.dispose();
    },
  };
}
