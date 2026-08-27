import type { RiotAccountProvider } from '@/domain/repositories/RiotAccountProvider';
import { parseRiotId } from '@/domain/entities/Player';
import type { RiotApiClient } from './RiotApiClient';

interface AccountDto {
  puuid: string;
}

export class RiotAccountProviderImpl implements RiotAccountProvider {
  constructor(
    private readonly client: RiotApiClient,
    private readonly continent: 'americas' | 'europe' | 'asia'
  ) {}

  async resolvePuuid(riotId: string): Promise<string> {
    const { gameName, tagLine } = parseRiotId(riotId);
    const url = `https://${this.continent}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const data = await this.client.get<AccountDto>(url);
    return data.puuid;
  }
}
