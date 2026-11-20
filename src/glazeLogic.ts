export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function computeUnitPx(viewportWidth: number, viewportHeight: number, inHero: boolean): number {
  if (viewportWidth <= 820) {
    return viewportWidth / 390;
  }
  if (inHero) {
    return Math.min(viewportWidth / 1536, viewportHeight / 864);
  }
  return viewportWidth / 1536;
}

export function keyringAttachmentPoint(angleDeg: number, radius = 0.5): {x: number; y: number} {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: radius * Math.cos(rad),
    y: radius * Math.sin(rad),
  };
}

export function charmOutwardForce(phiDeg: number, z: number): {x: number; y: number; z: number} {
  const rad = ((phiDeg - 90) * Math.PI) / 180;
  return {
    x: 0.7 * Math.cos(rad),
    y: 0.7 * Math.sin(rad),
    z,
  };
}

export const COLLISION_GROUP = {
  NONE: 0,
  TAGS: 1,
  CHAIN: 2,
} as const;

export function makeCollisionGroups(membershipBit: number, filterMask: number): number {
  return (((1 << membershipBit) << 16) | filterMask) >>> 0;
}

export function shouldCollide(groupA: number, groupB: number): boolean {
  const memA = (groupA >>> 16) & 0xffff;
  const filtA = groupA & 0xffff;
  const memB = (groupB >>> 16) & 0xffff;
  const filtB = groupB & 0xffff;
  return (memA & filtB) !== 0 && (memB & filtA) !== 0;
}

export function computeMousePushImpulse(
  dx: number,
  dy: number,
  dz: number,
  dt: number,
): {x: number; y: number; z: number} | null {
  const d = Math.hypot(dx, dy, dz);
  if (d <= 0 || d >= 2) return null;
  const factor = (4.4 * Math.pow(1 - d / 2, 2) * dt) / d;
  return {
    x: dx * factor,
    y: dy * factor,
    z: dz * factor,
  };
}

export function advanceTrailHeat(
  currentHeat: number,
  pushIntensity: number,
  speed: number,
  dt: number,
): number {
  const clampedCurrent = Math.max(0, Math.min(1, currentHeat));
  const clampedPush = Math.max(0, Math.min(1, pushIntensity));
  const boosted = Math.max(clampedCurrent, clampedPush);
  const safeDt = Math.max(0, dt);
  if (clampedPush > 0) {
    return boosted;
  }
  const decayRate = speed > 0.35 ? 1.05 : 2.35;
  const next = boosted * Math.exp(-decayRate * safeDt);
  return next < 0.004 ? 0 : next;
}

export function computeTrailWidthProfile(
  sampleCount: number,
  baseHalfWidth: number,
  heat: number,
  speed: number,
): number[] {
  if (sampleCount <= 1 || heat <= 0 || baseHalfWidth <= 0) {
    return new Array(Math.max(0, sampleCount)).fill(0);
  }
  const speedScale = Math.min(1, Math.max(0.18, speed * 0.48));
  const scale = baseHalfWidth * Math.max(0, Math.min(1, heat)) * speedScale;
  const widths: number[] = new Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const t = i / (sampleCount - 1);
    const headEase = i === 0 ? 0.65 : 1;
    widths[i] = scale * headEase * Math.pow(1 - t, 1.35);
  }
  widths[sampleCount - 1] = 0;
  return widths;
}

export function buildSquirclePoints(samples = 160, exponent = 4.2): Array<{x: number; y: number}> {
  const pts: Array<{x: number; y: number}> = [];
  const power = 2 / exponent;
  for (let i = 0; i < samples; i++) {
    const theta = (i / samples) * Math.PI * 2;
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const x = 0.5 + 0.5 * Math.sign(c) * Math.pow(Math.abs(c), power);
    const y = 0.5 + 0.5 * Math.sign(s) * Math.pow(Math.abs(s), power);
    pts.push({x, y});
  }
  return pts;
}

export const PIPELINE_STAGES = ['init', 'types', 'build', 'test', 'lint', 'edge', 'ship'] as const;

export function formatTimecode(seconds: number): string {
  const wrapped = ((seconds % 6) + 6) % 6;
  const whole = Math.floor(wrapped + 1e-6) % 6;
  const centis = Math.floor((wrapped - whole) * 100 + 1e-4) % 100;
  return `00:${String(whole).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

export function formatExecutionLine(seconds: number): string {
  const wrapped = ((seconds % 6) + 6) % 6;
  const line = Math.min(120, Math.floor(wrapped * 20 + 1e-4) + 1);
  return `LN ${String(line).padStart(3, '0')}`;
}

export function getPipelineStageIndex(seconds: number): number {
  const wrapped = ((seconds % 6) + 6) % 6;
  return Math.min(PIPELINE_STAGES.length - 1, Math.max(0, Math.round(wrapped)));
}

export function computePlayheadLeftPercent(seconds: number): number {
  const wrapped = ((seconds % 6) + 6) % 6;
  return 8 + (89.6 * wrapped) / 6;
}

export function computeFlipDelta(trackRect: RectLike, slotRect: RectLike): {x: number; y: number; scale: number} {
  const scale = slotRect.width / trackRect.width;
  const x = slotRect.left - trackRect.left + (slotRect.width - trackRect.width) / 2;
  const y = slotRect.top - trackRect.top + (slotRect.height - trackRect.height) / 2;
  return {x, y, scale};
}

export function computeTileCrop(
  crop: {x: number; y: number; size: number},
  imgWidth: number,
  imgHeight: number,
): {sx: number; sy: number; sw: number; sh: number} {
  return {
    sx: imgWidth * crop.x,
    sy: imgHeight * crop.y,
    sw: imgWidth * crop.size,
    sh: imgHeight * crop.size,
  };
}

export type CapabilityId = 'web' | 'mobile' | 'ai' | 'design';
export type HorizonId = 'sprint' | 'flagship' | 'partner';

export interface Zxtni StudioPlanEstimate {
  squadLabel: string;
  timelineLabel: string;
  cadenceLabel: string;
  summaryText: string;
}

export function estimateZxtni StudioPlan(
  capabilities: ReadonlyArray<CapabilityId>,
  horizon: HorizonId,
): Zxtni StudioPlanEstimate {
  const unique = Array.from(new Set(capabilities));
  const count = Math.max(1, unique.length);

  const squadSize =
    horizon === 'partner'
      ? Math.max(4, count + 2)
      : horizon === 'flagship'
        ? Math.max(3, count + 1)
        : Math.max(2, count);

  const squadLabel = `${squadSize} Senior Engineers & Designers`;

  const timelineLabel =
    horizon === 'sprint'
      ? `${4 + Math.min(2, count - 1)} Weeks to V1`
      : horizon === 'flagship'
        ? `${8 + count * 2} Weeks Full Launch`
        : 'Continuous Weekly Releases';

  const cadenceLabel =
    horizon === 'sprint'
      ? 'Rapid Ship'
      : horizon === 'flagship'
        ? 'End-to-End Build'
        : 'Embedded Pod';

  const names: Record<CapabilityId, string> = {
    web: 'Web Platform',
    mobile: 'Native Mobile',
    ai: 'AI Systems',
    design: 'Design System',
  };
  const scopeList = unique.length > 0 ? unique.map((c) => names[c]).join(' + ') : 'Web Platform';

  return {
    squadLabel,
    timelineLabel,
    cadenceLabel,
    summaryText: `${scopeList} · ${timelineLabel}`,
  };
}

export function computeCylinderArcTransform(
  cardCenterX: number,
  viewportWidth: number,
): {rotateYDeg: number; translateZPx: number; scale: number} {
  const safeVw = Math.max(1, viewportWidth);
  const centerX = safeVw * 0.5;
  const norm = Math.max(-1.25, Math.min(1.25, (cardCenterX - centerX) / (safeVw * 0.52)));
  const rotateYDeg = norm === 0 ? 0 : -norm * 15;
  const translateZPx = norm === 0 ? 0 : -Math.abs(norm) * 90;
  return {
    rotateYDeg,
    translateZPx,
    scale: 1 - Math.min(0.14, Math.abs(norm) * 0.1),
  };
}

export function computeScrollWarpMultiplier(scrollVelocityPxPerSec: number): number {
  return 1 + Math.min(5.5, Math.abs(scrollVelocityPxPerSec) * 0.0028);
}


