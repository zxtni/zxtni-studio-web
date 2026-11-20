import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLLISION_GROUP,
  PIPELINE_STAGES,
  advanceTrailHeat,
  buildSquirclePoints,
  charmOutwardForce,
  computeCylinderArcTransform,
  computeFlipDelta,
  computeMousePushImpulse,
  computePlayheadLeftPercent,
  computeScrollWarpMultiplier,
  computeTileCrop,
  computeTrailWidthProfile,
  computeUnitPx,
  estimateZxtni StudioPlan,
  formatExecutionLine,
  formatTimecode,
  getPipelineStageIndex,
  keyringAttachmentPoint,
  makeCollisionGroups,
  shouldCollide,
} from './glazeLogic';

test('computeUnitPx respects desktop, hero height constraint, and mobile <= 820px', () => {
  assert.equal(computeUnitPx(1536, 864, false), 1);
  assert.equal(computeUnitPx(1440, 810, true), 1440 / 1536);
  assert.equal(computeUnitPx(1920, 700, true), 700 / 864);
  assert.equal(computeUnitPx(390, 844, true), 1);
  assert.equal(computeUnitPx(820, 900, false), 820 / 390);
});

test('keyring attachment places 0 deg at bottom and fans left/right symmetrically', () => {
  const bottom = keyringAttachmentPoint(0);
  assert.ok(Math.abs(bottom.x) < 1e-9);
  assert.ok(Math.abs(bottom.y + 0.5) < 1e-9);

  const left = keyringAttachmentPoint(-50);
  const right = keyringAttachmentPoint(50);
  assert.ok(left.x < 0 && right.x > 0);
  assert.ok(Math.abs(left.x + right.x) < 1e-9);
  assert.ok(Math.abs(left.y - right.y) < 1e-9);
});

test('charm outward force fans charms according to phi', () => {
  const f1 = charmOutwardForce(-64, -0.2);
  const f5 = charmOutwardForce(88, -0.25);
  assert.ok(f1.x < 0);
  assert.ok(f5.x > 0);
  assert.equal(f1.z, -0.2);
  assert.equal(f5.z, -0.25);
});

test('Rapier collision groups enforce tag-tag, chain-none, and ring-tag/chain', () => {
  const tagsGroup = makeCollisionGroups(COLLISION_GROUP.TAGS, 1 << COLLISION_GROUP.TAGS);
  const chainGroup = makeCollisionGroups(COLLISION_GROUP.CHAIN, 1 << COLLISION_GROUP.NONE);
  const ringGroup = makeCollisionGroups(
    COLLISION_GROUP.CHAIN,
    (1 << COLLISION_GROUP.TAGS) | (1 << COLLISION_GROUP.CHAIN),
  );

  assert.equal(shouldCollide(tagsGroup, tagsGroup), true);
  assert.equal(shouldCollide(chainGroup, tagsGroup), false);
  assert.equal(shouldCollide(chainGroup, chainGroup), false);
  assert.equal(shouldCollide(chainGroup, ringGroup), false);
  assert.equal(shouldCollide(ringGroup, tagsGroup), false);
  assert.equal(shouldCollide(ringGroup, ringGroup), true);
});

test('mouse push impulse attenuates quadratically inside radius 2 and vanishes outside', () => {
  assert.equal(computeMousePushImpulse(2, 0, 0, 1 / 60), null);
  assert.equal(computeMousePushImpulse(0, 0, 0, 1 / 60), null);
  const near = computeMousePushImpulse(0.5, 0, 0, 1 / 60)!;
  const far = computeMousePushImpulse(1.5, 0, 0, 1 / 60)!;
  assert.ok(near.x > far.x && far.x > 0);
  assert.ok(Math.abs(near.x - 4.4 * Math.pow(1 - 0.5 / 2, 2) * (1 / 60)) < 1e-9);
});

test('squircle generator creates 160 normalized points with exponent 4.2', () => {
  const pts = buildSquirclePoints(160, 4.2);
  assert.equal(pts.length, 160);
  assert.ok(Math.abs(pts[0].x - 1) < 1e-6 && Math.abs(pts[0].y - 0.5) < 1e-6);
  assert.ok(Math.abs(pts[40].x - 0.5) < 1e-6 && Math.abs(pts[40].y - 1) < 1e-6);
});

test('playhead position, timecode, and coding pipeline cursor wrap cleanly at 6s', () => {
  assert.equal(formatTimecode(2.4), '00:02.40');
  assert.equal(formatTimecode(6.05), '00:00.05');
  assert.equal(formatExecutionLine(0), 'LN 001');
  assert.equal(formatExecutionLine(2.4), 'LN 049');
  assert.equal(formatExecutionLine(5.99), 'LN 120');
  assert.equal(PIPELINE_STAGES[getPipelineStageIndex(0)], 'init');
  assert.equal(PIPELINE_STAGES[getPipelineStageIndex(2.4)], 'build');
  assert.equal(PIPELINE_STAGES[getPipelineStageIndex(5.8)], 'ship');
  assert.ok(Math.abs(computePlayheadLeftPercent(0) - 8) < 1e-9);
  assert.ok(Math.abs(computePlayheadLeftPercent(3) - (8 + 89.6 / 2)) < 1e-9);
});

test('FLIP delta aligns centers and scales width accurately', () => {
  const track = {left: 200, top: 1000, width: 120, height: 120};
  const slot = {left: 500, top: 1400, width: 60, height: 60};
  const {x, y, scale} = computeFlipDelta(track, slot);
  assert.equal(scale, 0.5);
  assert.equal(x, 270);
  assert.equal(y, 370);
});

test('Zxtni Studio tile crops stay within image bounds', () => {
  const crops = [
    {x: 0.13, y: 0.13, size: 0.74},
    {x: 0.06, y: 0.06, size: 0.88},
    {x: 0.11, y: 0.04, size: 0.78},
    {x: 0.06, y: 0.03, size: 0.86},
    {x: 0.1, y: 0.1, size: 0.8},
  ];
  for (const crop of crops) {
    const c = computeTileCrop(crop, 1024, 1024);
    assert.ok(c.sx >= 0 && c.sx + c.sw <= 1024);
    assert.ok(c.sy >= 0 && c.sy + c.sh <= 1024);
  }
});

test('estimateZxtni StudioPlan scales squad and timeline accurately across scopes and horizons', () => {
  const sprint = estimateZxtni StudioPlan(['web'], 'sprint');
  assert.equal(sprint.squadLabel, '2 Senior Engineers & Designers');
  assert.equal(sprint.timelineLabel, '4 Weeks to V1');
  assert.equal(sprint.summaryText, 'Web Platform · 4 Weeks to V1');

  const flagship = estimateZxtni StudioPlan(['web', 'mobile', 'ai'], 'flagship');
  assert.equal(flagship.squadLabel, '4 Senior Engineers & Designers');
  assert.equal(flagship.timelineLabel, '14 Weeks Full Launch');
  assert.equal(flagship.cadenceLabel, 'End-to-End Build');

  const partner = estimateZxtni StudioPlan(['design', 'web'], 'partner');
  assert.equal(partner.squadLabel, '4 Senior Engineers & Designers');
  assert.equal(partner.timelineLabel, 'Continuous Weekly Releases');
});

test('charm motion trail heat boosts on push, decays slower while swinging, and tapers widths to zero', () => {
  const pushed = advanceTrailHeat(0, 0.85, 0.1, 1 / 60);
  assert.equal(pushed, 0.85);

  const swingingDecay = advanceTrailHeat(pushed, 0, 1.8, 0.25);
  const idleDecay = advanceTrailHeat(pushed, 0, 0.05, 0.25);
  assert.ok(swingingDecay > idleDecay && idleDecay > 0);
  assert.equal(advanceTrailHeat(0.01, 0, 0, 2), 0);

  const widths = computeTrailWidthProfile(20, 0.12, 1, 2.5);
  assert.equal(widths.length, 20);
  assert.ok(widths[1] > widths[10] && widths[10] > 0);
  assert.equal(widths[19], 0);
  assert.deepEqual(computeTrailWidthProfile(5, 0.12, 0, 2), [0, 0, 0, 0, 0]);
});

test('3D cinema reel arc and scroll warp multiplier respond symmetrically to screen position and velocity', () => {
  const centered = computeCylinderArcTransform(720, 1440);
  assert.equal(centered.rotateYDeg, 0);
  assert.equal(centered.translateZPx, 0);
  assert.equal(centered.scale, 1);

  const left = computeCylinderArcTransform(200, 1440);
  const right = computeCylinderArcTransform(1240, 1440);
  assert.ok(left.rotateYDeg > 0 && right.rotateYDeg < 0);
  assert.ok(Math.abs(left.translateZPx - right.translateZPx) < 1e-9);
  assert.ok(left.scale < 1);

  assert.equal(computeScrollWarpMultiplier(0), 1);
  assert.ok(computeScrollWarpMultiplier(1000) > computeScrollWarpMultiplier(200));
  assert.equal(computeScrollWarpMultiplier(50000), 6.5);
});


