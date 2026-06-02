/**
 * ModelBadge Component
 *
 * Displays the current provider and model name in the top-right.
 *
 * NOTE: Requires Ink to be installed:
 * npm install ink react @types/react
 */
import { colors } from '../theme.js';
/**
 * ModelBadge component
 *
 * Shows: Provider + model name top-right
 */
export function ModelBadge(props) {
    const { provider, model } = props;
    const providerFormatted = provider.charAt(0).toUpperCase() + provider.slice(1);
    return `${colors.secondary(`${providerFormatted} | ${model}`)}`;
}
//# sourceMappingURL=ModelBadge.js.map