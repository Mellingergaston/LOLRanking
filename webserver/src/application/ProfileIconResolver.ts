import type { SummonerInfoProvider } from '@/domain/repositories/SummonerInfoProvider';
import type { DataDragonClient } from '@/infrastructure/riot/DataDragonClient';

/** Resuelve la URL del ícono de invocador. Nunca tira error: si falla, no hay ícono y listo. */
export class ProfileIconResolver {
  constructor(
    private readonly summonerInfoProvider: SummonerInfoProvider,
    private readonly dataDragon: DataDragonClient
  ) {}

  async resolve(puuid: string): Promise<string | null> {
    try {
      const profileIconId = await this.summonerInfoProvider.getProfileIconId(puuid);
      return await this.dataDragon.getProfileIconUrl(profileIconId);
    } catch {
      return null;
    }
  }
}
