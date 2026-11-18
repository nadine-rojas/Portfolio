import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PARTICLE_PALETTES,
  createSoftParticleSeeds,
  evaluateParticleState,
} from './floatingParticles';

test('createSoftParticleSeeds builds both inner and outer soft particle layers deterministically', () => {
  const a = createSoftParticleSeeds(96, 44, 202611);
  const b = createSoftParticleSeeds(96, 44, 202611);

  assert.equal(a.length, 140);
  assert.deepEqual(a, b);

  const innerCount = a.filter((p) => p.layer === 'inner').length;
  const outerCount = a.filter((p) => p.layer === 'outer').length;
  assert.equal(innerCount, 96);
  assert.equal(outerCount, 44);
});

test('evaluateParticleState advances smooth orbital positions without NaN and honors reducedMotion', () => {
  const [seed] = createSoftParticleSeeds(10, 5, 42);
  const t0 = evaluateParticleState(seed, 0, 0, 0, false);
  const t1 = evaluateParticleState(seed, 2.5, 0.4, -0.2, false);
  const reducedA = evaluateParticleState(seed, 0, 0, 0, true);
  const reducedB = evaluateParticleState(seed, 5.0, 0, 0, true);

  assert.ok(Number.isFinite(t1.x) && Number.isFinite(t1.y) && Number.isFinite(t1.z));
  assert.ok(t1.alpha > 0 && t1.alpha <= 1);
  assert.notEqual(t0.x, t1.x);
  assert.deepEqual(reducedA, reducedB);
});

test('PARTICLE_PALETTES provides 3 valid hex colors for every chess finish', () => {
  for (const finish of ['obsidian_gold', 'emerald_crystal', 'cyan_titanium'] as const) {
    const palette = PARTICLE_PALETTES[finish];
    assert.equal(palette.length, 3);
    for (const hex of palette) {
      assert.match(hex, /^#[0-9a-f]{6}$/i);
    }
  }
});
