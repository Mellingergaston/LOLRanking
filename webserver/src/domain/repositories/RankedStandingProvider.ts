import type { Division, Tier } from '../entities/RankedStanding';

export interface RankedLeagueEntry {
  tier: Tier;
  division: Division;
  leaguePoints: number;
  wins: number;
  losses: number;
}

/** Rango vigente de un jugador (League-V4). null = sin rango (unranked) en solo/duo. */
export interface RankedStandingProvider {
  getSoloQueueStanding(puuid: string): Promise<RankedLeagueEntry | null>;
}
