/**
 * Canonical threshold representation.
 *
 * CANONICAL FORM: a NORMALIZED DECIMAL in [0, 1].
 *
 * This single form is used consistently by:
 *   - React state (`MatchingContent.state.threshold`, default 0.7)
 *   - the `POST /api/matching` request body (`threshold`)
 *   - the provider contract (`MatchingRequest.threshold`, valid 0..1)
 *   - the development fallback (`overallScore >= req.threshold`)
 *   - the Model Service adapter (forwarded unchanged)
 *
 * The UI is the ONLY place that presents the threshold as a percentage
 * (0..100), and it converts at the edge with the helpers below.
 *
 * Conversion rules — convert AT MOST ONCE:
 *   percentage -> decimal : divide by 100 (percentToThreshold)
 *   decimal -> percentage : multiply by 100 (thresholdToPercent)
 *
 * Doing both on the same value (i.e. multiplying by 100 twice) is what
 * produced the "10000%" display bug, so every conversion must go through
 * these helpers rather than ad-hoc `* 100` / `/ 100` arithmetic.
 *
 * Formatting note: the current UI works in whole percentages, so
 * `thresholdToPercent` rounds to the nearest integer (0.755 -> 76). This
 * matches the existing slider/number-input/display behaviour.
 */

/** Inclusive lower bound of the canonical threshold (0%). */
export const THRESHOLD_MIN = 0;

/** Inclusive upper bound of the canonical threshold (100%). */
export const THRESHOLD_MAX = 1;

/** Default threshold used by the matching configuration UI. */
export const THRESHOLD_DEFAULT = 0.7;

/**
 * Clamp an arbitrary number into the canonical [0, 1] range.
 * `NaN` falls back to the default threshold, while +/-Infinity clamp to the
 * nearest bound, so the UI can never render `NaN%`, `Infinity%` or `10000%`.
 */
export function clampThreshold(value: number): number {
  if (Number.isNaN(value)) return THRESHOLD_DEFAULT;
  if (value < THRESHOLD_MIN) return THRESHOLD_MIN;
  if (value > THRESHOLD_MAX) return THRESHOLD_MAX;
  return value;
}

/**
 * Canonical decimal -> whole percentage for display (guaranteed 0..100).
 * Because the value is clamped first, an accidental out-of-range threshold
 * (e.g. 100) renders as `100%`, never `10000%`.
 */
export function thresholdToPercent(threshold: number): number {
  return Math.round(clampThreshold(threshold) * 100);
}

/**
 * Whole percentage input (0..100) -> canonical decimal (0..1).
 * Guaranteed in-range, so it is safe to put straight into the request payload.
 */
export function percentToThreshold(percent: number): number {
  if (Number.isNaN(percent)) return THRESHOLD_DEFAULT;
  return clampThreshold(percent / 100);
}
