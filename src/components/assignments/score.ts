/**
 * Score presentation helpers shared by the assignment dialogs
 */

export function formatPercent(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

/**
 * Badge classes for a similarity score, using the app's design tokens.
 */
export function scoreBadgeClass(score: number): string {
  if (score >= 0.9) return 'bg-primary-fixed text-on-primary-fixed';
  if (score >= 0.7) return 'bg-secondary-fixed text-on-secondary-fixed';
  return 'bg-error-container text-on-error-container';
}
