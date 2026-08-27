import type { SummonerRepository } from '@/domain/repositories/SummonerRepository';
import type { PrismaClient } from '@prisma/client';

export class PrismaSummonerRepository implements SummonerRepository {
  constructor(private readonly db: PrismaClient) {}

  async getCachedPuuid(riotId: string): Promise<string | null> {
    const found = await this.db.summoner.findUnique({ where: { riotId }, select: { puuid: true } });
    return found?.puuid ?? null;
  }

  async saveSummoner(riotId: string, puuid: string, gameName: string, tagLine: string): Promise<void> {
    await this.db.summoner.upsert({
      where: { puuid },
      create: { puuid, riotId, gameName, tagLine },
      update: { riotId, gameName, tagLine },
    });
  }
}
