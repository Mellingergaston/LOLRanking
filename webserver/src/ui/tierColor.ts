import type { CSSProperties } from 'react';
import type { Tier } from '@/domain/entities/RankedStanding';

const TIER_COLOR_VARS: Record<Tier, string> = {
  IRON: 'var(--tier-iron)',
  BRONZE: 'var(--tier-bronze)',
  SILVER: 'var(--tier-silver)',
  GOLD: 'var(--tier-gold)',
  PLATINUM: 'var(--tier-platinum)',
  EMERALD: 'var(--tier-emerald)',
  DIAMOND: 'var(--tier-diamond)',
  MASTER: 'var(--tier-master)',
  GRANDMASTER: 'var(--tier-grandmaster)',
  CHALLENGER: 'var(--tier-challenger)',
  UNRANKED: 'var(--tier-unranked)',
};

export function tierColor(tier: Tier): string {
  return TIER_COLOR_VARS[tier] ?? 'var(--tier-unranked)';
}

export const APEX_TIERS: Tier[] = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];

/** CSS custom property que consumen .tier-dot / .tier-label / .modal__tier-badge / .modal__progress-bar__fill */
export function tierColorStyle(tier: Tier): CSSProperties {
  return { '--tier-color': tierColor(tier) } as CSSProperties;
}
