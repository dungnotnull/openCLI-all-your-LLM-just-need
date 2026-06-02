/**
 * KnowledgePulse Component
 *
 * Subtle indicator showing when knowledge brain was consulted.
 *
 * NOTE: Requires Ink to be installed:
 * npm install ink react @types/react
 */

import type { ComponentProps } from '../types.js';
import { colors } from '../theme.js';

export interface KnowledgePulseProps extends ComponentProps {
  active: boolean;
  entriesFound?: number;
  lastQuery?: string;
}

/**
 * KnowledgePulse component
 *
 * Shows: When knowledge brain was consulted
 */
export function KnowledgePulse(props: KnowledgePulseProps): string {
  const { active, entriesFound, lastQuery } = props;

  if (!active) {
    return '';
  }

  const lines: string[] = [];

  // Knowledge consulted indicator
  lines.push(`${colors.secondary('○')} ${colors.muted('Knowledge consulted')}`);

  if (entriesFound !== undefined) {
    lines.push(`  ${colors.dim(`${entriesFound} relevant entries found`)}`);
  }

  if (lastQuery) {
    const truncatedQuery = lastQuery.length > 40
      ? lastQuery.slice(0, 40) + '...'
      : lastQuery;
    lines.push(`  ${colors.dim(`Query: "${truncatedQuery}"`)}`);
  }

  return lines.join('\n');
}

/**
 * Knowledge brief component - shows compact knowledge info
 */
export function KnowledgeBrief(props: {
  count: number;
  category?: string;
}): string {
  const { count, category } = props;

  if (count === 0) {
    return `${colors.muted('○ No knowledge')}`;
  }

  const categoryText = category ? ` (${category})` : '';
  return `${colors.secondary('●')} ${colors.primary(`${count} knowledge entries${categoryText}`)}`;
}

/**
 * Get knowledge icon based on status
 */
export function getKnowledgeIcon(active: boolean, hasResults: boolean): string {
  if (!active) {
    return colors.muted('○');
  }

  if (hasResults) {
    return colors.success('◆');
  }

  return colors.secondary('◇');
}
