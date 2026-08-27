import type { RankedLeagueEntry, RankedStandingProvider } from '@/domain/repositories/RankedStandingProvider';
import type { Division, Tier } from '@/domain/entities/RankedStanding';
import type { RiotApiClient } from './RiotApiClient';

interface LeagueEntryDto {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export class RiotRankedStandingProviderImpl implements RankedStandingProvider {
  constructor(
    private readonly client: RiotApiClient,
    private readonly platformBaseUrl: string
  ) {}

  async getSoloQueueStanding(puuid: string): Promise<RankedLeagueEntry | null> {
    const url = `${this.platformBaseUrl}/lol/league/v4/entries/by-puuid/${puuid}`;
    const entries = await this.client.get<LeagueEntryDto[]>(url);
    const solo = entries.find((entry) => entry.queueType === 'RANKED_SOLO_5x5');
    if (!solo) return null;

    return {
      tier: solo.tier as Tier,
      division: solo.rank as Division,
      leaguePoints: solo.leaguePoints,
      wins: solo.wins,
      losses: solo.losses,
    };
  }
}
