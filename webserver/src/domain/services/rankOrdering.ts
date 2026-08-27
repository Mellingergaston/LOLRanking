import type { RankedStanding, Tier, Division } from '../entities/RankedStanding';

const TIER_VALUES: Record<Tier, number> = {
  CHALLENGER: 4500,
  GRANDMASTER: 4500,
  MASTER: 4500,
  DIAMOND: 4000,
  EMERALD: 3500,
  PLATINUM: 3000,
  GOLD: 2500,
  SILVER: 2000,
  BRONZE: 1500,
  IRON: 1000,
  UNRANKED: 0,
};

const DIVISION_VALUES: Record<Division, number> = {
  I: 300,
  II: 200,
  III: 100,
  IV: 0,
};

/**
 * Valor numérico para ordenar por elo. Cada división suma hasta 300 puntos y
 * cada tier se separa por 500, así un Oro I con 99 LP nunca supera a un
 * Platino IV con 0 LP.
 */
export function getTierValue(tier: Tier, division: Division | null): number {
  return TIER_VALUES[tier] + (division ? DIVISION_VALUES[division] : 0);
}

/** Ordena de mayor a menor elo (tier + división + LP). Los jugadores con error van al final. */
export function sortByStanding(standings: RankedStanding[]): RankedStanding[] {
  return [...standings].sort((a, b) => {
    if (a.error && !b.error) return 1;
    if (!a.error && b.error) return -1;
    const aValue = getTierValue(a.tier, a.division) + a.leaguePoints / 100;
    const bValue = getTierValue(b.tier, b.division) + b.leaguePoints / 100;
    return bValue - aValue;
  });
}
