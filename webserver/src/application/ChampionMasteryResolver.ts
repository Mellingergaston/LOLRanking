import type { ChampionMasteryProvider } from '@/domain/repositories/ChampionMasteryProvider';
import type { DataDragonClient } from '@/infrastructure/riot/DataDragonClient';

export interface ChampionMasteryView {
  championId: number;
  championName: string;
  championIconUrl: string | null;
  championPoints: number;
}

/** Trae el top de maestrías con nombre e ícono ya resueltos. Nunca tira error: si falla, lista vacía. */
export class ChampionMasteryResolver {
  constructor(
    private readonly masteryProvider: ChampionMasteryProvider,
    private readonly dataDragon: DataDragonClient
  ) {}

  async resolveTop(puuid: string, count: number): Promise<ChampionMasteryView[]> {
    try {
      const entries = await this.masteryProvider.getTopMasteries(puuid, count);
      return await Promise.all(
        entries.map(async (entry) => {
          const champion = await this.dataDragon.getChampionById(entry.championId);
          const championIconUrl = await this.dataDragon.getChampionIconUrl(entry.championId);
          return {
            championId: entry.championId,
            championName: champion?.name ?? `Campeón ${entry.championId}`,
            championIconUrl,
            championPoints: entry.championPoints,
          };
        })
      );
    } catch {
      return [];
    }
  }
}
