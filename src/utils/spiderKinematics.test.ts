import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceSpiderLegs,
  computeSurfaceElevation,
  createSpiderLegs,
  solveTwoBoneIK,
} from './spiderKinematics';

test('solveTwoBoneIK preserves bone segment lengths and never produces NaN', () => {
  const res = solveTwoBoneIK(100, 100, 145, 130, 40, 50, 1);
  assert.ok(Number.isFinite(res.kneeX));
  assert.ok(Number.isFinite(res.kneeY));
  assert.ok(Number.isFinite(res.footX));
  assert.ok(Number.isFinite(res.footY));

  const seg1 = Math.hypot(res.kneeX - 100, res.kneeY - 100);
  const seg2 = Math.hypot(res.footX - res.kneeX, res.footY - res.kneeY);
  assert.ok(Math.abs(seg1 - 40) < 0.01);
  assert.ok(Math.abs(seg2 - 50) < 0.01);
});

test('solveTwoBoneIK clamps unreachable targets cleanly', () => {
  const res = solveTwoBoneIK(0, 0, 500, 0, 30, 40, -1);
  const reach = Math.hypot(res.footX, res.footY);
  assert.ok(reach <= 70);
  assert.ok(reach >= 69);
});

test('computeSurfaceElevation returns 0 outside cards and > 0 when climbing on a card', () => {
  const rects = [{ left: 100, top: 100, right: 300, bottom: 250 }];

  assert.equal(computeSurfaceElevation(50, 50, rects), 0);
  const edgeClimb = computeSurfaceElevation(102, 150, rects);
  assert.ok(edgeClimb > 0 && edgeClimb < 1);

  const centerClimb = computeSurfaceElevation(200, 175, rects);
  assert.equal(centerClimb, 1);
});

test('createSpiderLegs builds 8 legs and advanceSpiderLegs steps toward movement', () => {
  const legs = createSpiderLegs(200, 200);
  assert.equal(legs.length, 8);

  const initialFootX = legs[0].footX;
  // Move body significantly forward
  advanceSpiderLegs(legs, 260, 200, 0, 180, 0, 0.016);
  // Advance animation frames to complete step
  for (let f = 0; f < 15; f++) {
    advanceSpiderLegs(legs, 260, 200, 0, 180, 0, 0.016);
  }

  assert.notEqual(legs[0].footX, initialFootX);
});
