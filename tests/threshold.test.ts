/**
 * Threshold conversion tests (regression guard for the "10000%" bug).
 *
 * The canonical threshold representation is a normalized decimal in [0, 1].
 * The UI presents whole percentages (0..100) and must convert exactly once.
 *
 * Run with: npm run test:threshold
 *
 * These tests are pure (no database, no network, no UI), so they are safe to
 * run anywhere and leave no state behind.
 */

import {
  THRESHOLD_DEFAULT,
  THRESHOLD_MAX,
  THRESHOLD_MIN,
  clampThreshold,
  percentToThreshold,
  thresholdToPercent,
} from '@/lib/services/matching/threshold';

let passed = 0;
let failed = 0;

function check(name: string, actual: unknown, expected: unknown): void {
  const ok = Object.is(actual, expected);
  if (ok) passed += 1;
  else failed += 1;
  console.log(`${ok ? '✓' : '✗'} ${name} — expected ${String(expected)}, got ${String(actual)}`);
}

function checkRange(name: string, value: number, min: number, max: number): void {
  const ok = Number.isFinite(value) && value >= min && value <= max;
  if (ok) passed += 1;
  else failed += 1;
  console.log(`${ok ? '✓' : '✗'} ${name} — expected ${min}..${max}, got ${String(value)}`);
}

/**
 * Reproduces exactly what MatchingContent puts in the POST /api/matching body:
 * the canonical state value clamped, never a percentage.
 */
function buildPayload(datasetAId: number, datasetBId: number, percent: number) {
  const stateThreshold = percentToThreshold(percent);
  return {
    datasetAId,
    datasetBId,
    columnMappings: [{ columnA: 'nama_usaha', columnB: 'nama_usaha' }],
    threshold: clampThreshold(stateThreshold),
  };
}

console.log('=== THRESHOLD CONVERSION TESTS ===\n');

// --- Canonical bounds -------------------------------------------------------
console.log('[Canonical range]');
check('THRESHOLD_MIN is 0', THRESHOLD_MIN, 0);
check('THRESHOLD_MAX is 1', THRESHOLD_MAX, 1);
check('default threshold is 0.7', THRESHOLD_DEFAULT, 0.7);
console.log();

// --- percentToThreshold (UI percent -> canonical decimal) -------------------
console.log('[percentToThreshold: 0 / 50 / 75 / 100]');
check('0% -> 0', percentToThreshold(0), 0);
check('50% -> 0.5', percentToThreshold(50), 0.5);
check('75% -> 0.75', percentToThreshold(75), 0.75);
check('100% -> 1', percentToThreshold(100), 1);
check('above range (150%) clamps to 1', percentToThreshold(150), 1);
check('below range (-10%) clamps to 0', percentToThreshold(-10), 0);
console.log();

// --- thresholdToPercent (canonical decimal -> UI percent) -------------------
console.log('[thresholdToPercent: 0 / 0.5 / 0.75 / 1]');
check('0 -> 0%', thresholdToPercent(0), 0);
check('0.5 -> 50%', thresholdToPercent(0.5), 50);
check('0.75 -> 75%', thresholdToPercent(0.75), 75);
check('1 -> 100%', thresholdToPercent(1), 100);
check('default 0.7 -> 70%', thresholdToPercent(THRESHOLD_DEFAULT), 70);
console.log();

// --- The actual regression: never 10000% ------------------------------------
console.log('[Regression: accidental double conversion]');
// The buggy slider handler stored the raw percent (100) as the threshold, and
// the label then multiplied by 100 again -> 10000%.
check('thresholdToPercent(100) is 100, not 10000', thresholdToPercent(100), 100);
check(
  'display of a buggy raw percent (100) is 100%',
  thresholdToPercent(100),
  100
);
check(
  'round trip 100% -> 1 -> 100%',
  thresholdToPercent(percentToThreshold(100)),
  100
);
check(
  'round trip 0% -> 0 -> 0%',
  thresholdToPercent(percentToThreshold(0)),
  0
);
check(
  'round trip 75% -> 0.75 -> 75%',
  thresholdToPercent(percentToThreshold(75)),
  75
);
console.log();

// --- Slider DOM value simulation -------------------------------------------
// The <input type="range"> onChange gives a string percentage.
console.log('[Slider DOM value simulated with parseFloat]');
check('slider at max ("100") -> 1', percentToThreshold(parseFloat('100')), 1);
check('slider at min ("0") -> 0', percentToThreshold(parseFloat('0')), 0);
check('slider at "75" -> 0.75', percentToThreshold(parseFloat('75')), 0.75);
check('slider at "50" -> 0.5', percentToThreshold(parseFloat('50')), 0.5);
console.log();

// --- Payload correctness ----------------------------------------------------
console.log('[Request payload sent to POST /api/matching]');
for (const percent of [0, 50, 75, 100]) {
  const payload = buildPayload(978, 979, percent);
  check(`payload.threshold for ${percent}%`, payload.threshold, percent / 100);
  checkRange(`payload.threshold for ${percent}% is within provider range`, payload.threshold, 0, 1);
}
const payloadNoRawPercent = buildPayload(978, 979, 100);
check('payload never carries a raw percentage (100)', payloadNoRawPercent.threshold === 100, false);
console.log();

// --- Provider contract ------------------------------------------------------
// The provider requires 0..1 and includes pairs with overallScore >= threshold.
console.log('[Provider receives the intended threshold]');
for (const percent of [0, 50, 75, 100]) {
  const threshold = buildPayload(978, 979, percent).threshold;
  checkRange(`provider input for ${percent}%`, threshold, 0, 1);
}
const threshold75 = buildPayload(978, 979, 75).threshold;
check('score 0.75 is included at 75% threshold', 0.75 >= threshold75, true);
check('score 0.80 is included at 75% threshold', 0.8 >= threshold75, true);
check('score 0.70 is excluded at 75% threshold', 0.7 >= threshold75, false);
const threshold100 = buildPayload(978, 979, 100).threshold;
check('score 0.99 is excluded at 100% threshold', 0.99 >= threshold100, false);
check('score 1.00 is included at 100% threshold', 1 >= threshold100, true);
console.log();

// --- Non-finite safety ------------------------------------------------------
console.log('[No NaN% / Infinity%]');
check('NaN falls back to default', clampThreshold(NaN), THRESHOLD_DEFAULT);
check('Infinity clamps to 1', clampThreshold(Infinity), 1);
check('NaN percent falls back to default', percentToThreshold(NaN), THRESHOLD_DEFAULT);
check('thresholdToPercent(NaN) is finite', Number.isFinite(thresholdToPercent(NaN)), true);
console.log();

console.log('=== SUMMARY ===');
console.log(`PASSED: ${passed}/${passed + failed}`);
console.log(`FAILED: ${failed}/${passed + failed}`);
if (failed > 0) {
  console.log(`\n✗ ${failed} TESTS FAILED`);
  process.exit(1);
}
console.log('\n✓ ALL TESTS PASSED');
