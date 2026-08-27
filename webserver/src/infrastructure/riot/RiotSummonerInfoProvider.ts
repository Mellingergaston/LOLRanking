import type { SummonerInfoProvider } from '@/domain/repositories/SummonerInfoProvider';
import type { RiotApiClient } from './RiotApiClient';

interface SummonerDto {
  profileIconId: number;
}

export class RiotSummonerInfoProviderImpl implements SummonerInfoProvider {
  constructor(
    private readonly client: RiotApiClient,
    private readonly platformBaseUrl: string
  ) {}

  async getProfileIconId(puuid: string): Promise<number> {
    const url = `${this.platformBaseUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const data = await this.client.get<SummonerDto>(url);
    return data.profileIconId;
  }
}
