import type {
  ChampionMasteryEntry,
  ChampionMasteryProvider,
} from '@/domain/repositories/ChampionMasteryProvider';
import type { RiotApiClient } from './RiotApiClient';

interface ChampionMasteryDto {
  championId: number;
  championPoints: number;
}

export class RiotChampionMasteryProviderImpl implements ChampionMasteryProvider {
  constructor(
    private readonly client: RiotApiClient,
    private readonly platformBaseUrl: string
  ) {}

  async getTopMasteries(puuid: string, count: number): Promise<ChampionMasteryEntry[]> {
    const url = `${this.platformBaseUrl}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`;
    const entries = await this.client.get<ChampionMasteryDto[]>(url);
    return entries.map((e) => ({ championId: e.championId, championPoints: e.championPoints }));
  }
}
