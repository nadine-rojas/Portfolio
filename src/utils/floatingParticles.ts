import type { ChessFinishKind } from '../three/chessScene';

export interface SoftParticleSeed {
  layer: 'inner' | 'outer';
  radius: number;
  baseAngle: number;
  orbitSpeed: number;
  baseY: number;
  bobAmplitude: number;
  bobSpeed: number;
  phase: number;
  size: number;
  alpha: number;
  colorIndex: 0 | 1 | 2;
}

export interface EvaluatedParticle {
  x: number;
  y: number;
  z: number;
  alpha: number;
  scale: number;
}

export const PARTICLE_PALETTES: Record<ChessFinishKind, [string, string, string]> = {
  obsidian_gold: ['#34d399', '#facc15', '#67e8f9'],
  emerald_crystal: ['#6ee7b7', '#34d399', '#22d3ee'],
  cyan_titanium: ['#22d3ee', '#a5f3fc', '#fde047'],
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Genera semillas deterministas para dos capas de partículas suaves:
 * - Capa 'inner': motas luminosas finas que orbitan cerca de la pieza de ajedrez.
 * - Capa 'outer': esferas bokeh suaves y difusas en el entorno del tablero.
 */
export function createSoftParticleSeeds(
  innerCount = 96,
  outerCount = 44,
  seedNumber = 202611,
): SoftParticleSeed[] {
  const rand = mulberry32(seedNumber);
  const seeds: SoftParticleSeed[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < innerCount; i++) {
    const t = innerCount > 1 ? i / (innerCount - 1) : 0;
    seeds.push({
      layer: 'inner',
      radius: 1.08 + Math.pow(rand(), 0.8) * 1.32,
      baseAngle: i * goldenAngle + rand() * 0.45,
      orbitSpeed: (0.14 + rand() * 0.22) * (i % 7 === 0 ? -0.7 : 1),
      baseY: 0.22 + t * 2.75 + (rand() - 0.5) * 0.24,
      bobAmplitude: 0.08 + rand() * 0.16,
      bobSpeed: 0.75 + rand() * 0.9,
      phase: rand() * Math.PI * 2,
      size: 0.34 + rand() * 0.42,
      alpha: 0.48 + rand() * 0.42,
      colorIndex: (i % 3) as 0 | 1 | 2,
    });
  }

  for (let j = 0; j < outerCount; j++) {
    const t = outerCount > 1 ? j / (outerCount - 1) : 0;
    seeds.push({
      layer: 'outer',
      radius: 2.15 + rand() * 2.15,
      baseAngle: j * goldenAngle * 1.3 + rand() * 0.6,
      orbitSpeed: (0.06 + rand() * 0.1) * (j % 3 === 0 ? -1 : 1),
      baseY: 0.1 + t * 3.25 + (rand() - 0.5) * 0.3,
      bobAmplitude: 0.12 + rand() * 0.22,
      bobSpeed: 0.45 + rand() * 0.55,
      phase: rand() * Math.PI * 2,
      size: 0.85 + rand() * 0.95,
      alpha: 0.18 + rand() * 0.22,
      colorIndex: ((j + 1) % 3) as 0 | 1 | 2,
    });
  }

  return seeds;
}

/**
 * Evalúa la posición 3D, opacidad respirante y escala de una partícula en el tiempo `elapsed`.
 */
export function evaluateParticleState(
  seed: SoftParticleSeed,
  elapsed: number,
  pointerX = 0,
  pointerY = 0,
  reducedMotion = false,
): EvaluatedParticle {
  const t = reducedMotion ? 0 : elapsed;
  const swirlOffset = Math.sin(t * 0.45 + seed.phase) * 0.08;
  const angle = seed.baseAngle + t * seed.orbitSpeed + swirlOffset;
  const radialBreath = Math.sin(t * 0.7 + seed.phase) * (seed.layer === 'inner' ? 0.08 : 0.15);
  const effectiveRadius = seed.radius + radialBreath;

  const breezeStrength = seed.layer === 'inner' ? 0.14 : 0.24;
  const x = Math.cos(angle) * effectiveRadius + pointerX * breezeStrength;
  const z = Math.sin(angle) * effectiveRadius - pointerX * breezeStrength * 0.45;
  const y =
    seed.baseY +
    Math.sin(t * seed.bobSpeed + seed.phase) * seed.bobAmplitude +
    pointerY * (seed.layer === 'inner' ? 0.09 : 0.16);

  const twinkle = reducedMotion ? 1 : 0.72 + 0.28 * Math.sin(t * 1.45 + seed.phase * 1.7);
  const scalePulse = reducedMotion ? 1 : 0.88 + 0.16 * Math.cos(t * 1.1 + seed.phase);

  return {
    x,
    y,
    z,
    alpha: Math.max(0.05, Math.min(1, seed.alpha * twinkle)),
    scale: seed.size * scalePulse,
  };
}
