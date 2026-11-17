export interface Point2D {
  x: number;
  y: number;
}

export interface IKJointResult {
  kneeX: number;
  kneeY: number;
  footX: number;
  footY: number;
}

export interface SurfaceRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface SpiderLegState {
  index: number;
  side: -1 | 1; // -1 = left, 1 = right
  baseAngle: number;
  restDistance: number;
  femurLength: number;
  tibiaLength: number;
  bendDir: -1 | 1;
  footX: number;
  footY: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  stepProgress: number; // 1 = planted, < 1 = mid-step
  stepHeight: number;
}

/**
 * Solves analytical 2-bone inverse kinematics in 2D screen space.
 * Safely clamps target distance inside reachable annulus so joints never produce NaN.
 */
export function solveTwoBoneIK(
  rootX: number,
  rootY: number,
  targetX: number,
  targetY: number,
  len1: number,
  len2: number,
  bendDir: -1 | 1,
): IKJointResult {
  const dx = targetX - rootX;
  const dy = targetY - rootY;
  const rawDist = Math.hypot(dx, dy);

  const minDist = Math.abs(len1 - len2) + 0.5;
  const maxDist = len1 + len2 - 0.5;
  const dist = Math.max(minDist, Math.min(maxDist, rawDist || minDist));

  const baseAngle = rawDist > 0.0001 ? Math.atan2(dy, dx) : 0;

  const cosAngle1 =
    (len1 * len1 + dist * dist - len2 * len2) / (2 * len1 * dist);
  const clampedCos = Math.max(-1, Math.min(1, cosAngle1));
  const angle1Offset = Math.acos(clampedCos) * bendDir;
  const jointAngle = baseAngle + angle1Offset;

  const kneeX = rootX + Math.cos(jointAngle) * len1;
  const kneeY = rootY + Math.sin(jointAngle) * len1;

  const footX = rootX + Math.cos(baseAngle) * dist;
  const footY = rootY + Math.sin(baseAngle) * dist;

  return { kneeX, kneeY, footX, footY };
}

/**
 * Computes smooth elevation factor (0..1) when a point climbs onto or across
 * neumorphic UI section cards. Returns 0 on background, 1 deep inside a card,
 * and smoothly interpolates across card edges.
 */
export function computeSurfaceElevation(
  x: number,
  y: number,
  rects: SurfaceRect[],
  edgeRamp = 18,
): number {
  let maxElevation = 0;

  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      const distEdge = Math.min(
        x - r.left,
        r.right - x,
        y - r.top,
        r.bottom - y,
      );
      const factor = Math.max(0.25, Math.min(1, distEdge / edgeRamp));
      if (factor > maxElevation) {
        maxElevation = factor;
      }
    }
  }

  return maxElevation;
}

/**
 * Creates 8 articulated legs arranged naturally around the spider body.
 */
export function createSpiderLegs(originX: number, originY: number): SpiderLegState[] {
  // Four pairs of legs from front-most to rear-most
  const pairAngles = [-0.95, -0.4, 0.25, 0.85];
  const pairReach = [56, 66, 64, 58];
  const femurSizes = [36, 42, 42, 38];
  const tibiaSizes = [44, 52, 50, 46];

  const legs: SpiderLegState[] = [];

  for (let pair = 0; pair < 4; pair++) {
    for (const side of [-1, 1] as const) {
      const index = legs.length;
      const angle = side === 1 ? pairAngles[pair] : Math.PI - pairAngles[pair];
      const dist = pairReach[pair];
      const footX = originX + Math.cos(angle) * dist;
      const footY = originY + Math.sin(angle) * dist;

      legs.push({
        index,
        side,
        baseAngle: angle,
        restDistance: dist,
        femurLength: femurSizes[pair],
        tibiaLength: tibiaSizes[pair],
        bendDir: side === 1 ? -1 : 1,
        footX,
        footY,
        startX: footX,
        startY: footY,
        targetX: footX,
        targetY: footY,
        stepProgress: 1,
        stepHeight: 0,
      });
    }
  }

  return legs;
}

/**
 * Advances spider leg stepping gait cleanly so opposite diagonal legs alternate steps.
 */
export function advanceSpiderLegs(
  legs: SpiderLegState[],
  bodyX: number,
  bodyY: number,
  bodyAngle: number,
  velX: number,
  velY: number,
  dt: number,
): void {
  const speed = Math.hypot(velX, velY);
  const stepThreshold = 26;
  const strideLead = Math.min(26, speed * 0.14);
  const leadX = speed > 1 ? (velX / speed) * strideLead : 0;
  const leadY = speed > 1 ? (velY / speed) * strideLead : 0;

  // Check if any leg in parity group 0 or 1 is currently mid-air
  let evenStepping = false;
  let oddStepping = false;
  for (let i = 0; i < legs.length; i++) {
    if (legs[i].stepProgress < 1) {
      const parity = (Math.floor(i / 2) + (legs[i].side === 1 ? 0 : 1)) % 2;
      if (parity === 0) evenStepping = true;
      else oddStepping = true;
    }
  }

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const worldAngle = leg.baseAngle + bodyAngle;
    const idealX = bodyX + Math.cos(worldAngle) * leg.restDistance + leadX;
    const idealY = bodyY + Math.sin(worldAngle) * leg.restDistance + leadY;

    if (leg.stepProgress < 1) {
      leg.stepProgress = Math.min(1, leg.stepProgress + dt * 6.8);
      const t = leg.stepProgress;
      const smooth = t * t * (3 - 2 * t);
      leg.footX = leg.startX + (leg.targetX - leg.startX) * smooth;
      leg.footY = leg.startY + (leg.targetY - leg.startY) * smooth;
      leg.stepHeight = Math.sin(t * Math.PI) * 14;
    } else {
      leg.stepHeight = 0;
      const drift = Math.hypot(idealX - leg.footX, idealY - leg.footY);
      const parity = (Math.floor(i / 2) + (leg.side === 1 ? 0 : 1)) % 2;
      const otherGroupBusy = parity === 0 ? oddStepping : evenStepping;

      if (drift > stepThreshold && !otherGroupBusy) {
        leg.startX = leg.footX;
        leg.startY = leg.footY;
        leg.targetX = idealX;
        leg.targetY = idealY;
        leg.stepProgress = 0;
        if (parity === 0) evenStepping = true;
        else oddStepping = true;
      }
    }
  }
}
