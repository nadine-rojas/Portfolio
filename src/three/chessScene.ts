import * as THREE from 'three';

export type ChessPieceKind = 'knight' | 'king';
export type ChessFinishKind = 'obsidian_gold' | 'emerald_crystal' | 'cyan_titanium';

export function detectSoftwareWebGL(): boolean {
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

export function createMicroGrainTexture(): THREE.CanvasTexture {
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

export function createChessboardTexture(maxAnisotropy: number): THREE.CanvasTexture {
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

        ctx.strokeStyle = isLight ? 'rgba(16, 185, 129, 0.16)' : 'rgba(148, 163, 184, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * cell + 1.5, r * cell + 1.5, cell - 3, cell - 3);
      }
    }

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createRadialShadowTexture(): THREE.CanvasTexture {
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
 * Construye el Caballo procedural de 7 partes con pivote en el centro inferior (y = 0).
 */
export function buildKnightGroup(
  primaryMat: THREE.Material,
  accentMat: THREE.Material,
  trimMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'knight-group';

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
  const baseMesh = new THREE.Mesh(new THREE.LatheGeometry(baseProfile, 36), primaryMat);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  const collarMesh = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.052, 16, 42), accentMat);
  collarMesh.rotation.x = Math.PI / 2;
  collarMesh.position.y = 0.52;
  collarMesh.castShadow = true;
  group.add(collarMesh);

  const plinthMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.51, 0.36, 16), primaryMat);
  plinthMesh.position.y = 0.7;
  plinthMesh.castShadow = true;
  plinthMesh.receiveShadow = true;
  group.add(plinthMesh);

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

  const haloMesh = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.022, 12, 64), trimMat);
  haloMesh.position.y = 1.58;
  haloMesh.rotation.x = Math.PI * 0.38;
  haloMesh.rotation.y = 0.3;
  group.add(haloMesh);

  return group;
}

/**
 * Construye el Rey procedural de 7 partes con pivote en el centro inferior (y = 0).
 */
export function buildKingGroup(
  primaryMat: THREE.Material,
  accentMat: THREE.Material,
  trimMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'king-group';

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

  const lowerRing = new THREE.Mesh(new THREE.TorusGeometry(0.57, 0.048, 16, 42), accentMat);
  lowerRing.rotation.x = Math.PI / 2;
  lowerRing.position.y = 0.48;
  lowerRing.castShadow = true;
  group.add(lowerRing);

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

  const upperRing = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.045, 16, 42), accentMat);
  upperRing.rotation.x = Math.PI / 2;
  upperRing.position.y = 1.94;
  upperRing.castShadow = true;
  group.add(upperRing);

  const crownMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.46, 0.42, 12), primaryMat);
  crownMesh.position.y = 2.18;
  crownMesh.castShadow = true;
  crownMesh.receiveShadow = true;
  group.add(crownMesh);

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

  const haloMesh = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.022, 12, 64), trimMat);
  haloMesh.position.y = 1.55;
  haloMesh.rotation.x = Math.PI * 0.36;
  haloMesh.rotation.y = -0.25;
  group.add(haloMesh);

  return group;
}

export function applyChessFinishMaterial(
  finish: ChessFinishKind,
  primaryMat: THREE.MeshPhysicalMaterial,
  accentMat: THREE.MeshPhysicalMaterial,
  trimMat: THREE.MeshPhysicalMaterial,
  isSoftwareGl: boolean,
): void {
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
}
