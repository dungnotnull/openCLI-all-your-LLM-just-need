/**
 * ModelBadge Component
 *
 * Displays the current provider and model name in the top-right.
 *
 * NOTE: Requires Ink to be installed:
 * npm install ink react @types/react
 */

import type { ComponentProps } from '../types.js';
import { colors } from '../theme.js';

export interface ModelBadgeProps extends ComponentProps {
  provider: string;
  model: string;
}

/**
 * ModelBadge component
 *
 * Shows: Provider + model name top-right
 */
export function ModelBadge(props: ModelBadgeProps): string {
  const { provider, model } = props;

  const providerFormatted = provider.charAt(0).toUpperCase() + provider.slice(1);

  return `${colors.secondary(`${providerFormatted} | ${model}`)}`;
}
