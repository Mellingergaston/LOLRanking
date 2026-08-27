import type { RiotAccountProvider } from '@/domain/repositories/RiotAccountProvider';
import type { SummonerRepository } from '@/domain/repositories/SummonerRepository';
import type { Player } from '@/domain/entities/Player';

/** Resuelve el PUUID de un jugador, cacheando en SQLite para no golpear Account-V1 de nuevo. */
export class PuuidResolver {
  constructor(
    private readonly accountProvider: RiotAccountProvider,
    private readonly summonerRepository: SummonerRepository
  ) {}

  async resolve(player: Player): Promise<string> {
    const cached = await this.summonerRepository.getCachedPuuid(player.riotId);
    if (cached) return cached;

    const puuid = await this.accountProvider.resolvePuuid(player.riotId);
    await this.summonerRepository.saveSummoner(player.riotId, puuid, player.gameName, player.tagLine);
    return puuid;
  }
}
