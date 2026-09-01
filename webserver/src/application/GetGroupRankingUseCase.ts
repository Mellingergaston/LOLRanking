import type { PlayerRepository } from '@/domain/repositories/PlayerRepository';
import type { RankedStandingProvider } from '@/domain/repositories/RankedStandingProvider';
import type { RankedStanding } from '@/domain/entities/RankedStanding';
import type { Player } from '@/domain/entities/Player';
import { sortByStanding } from '@/domain/services/rankOrdering';
import type { PuuidResolver } from './PuuidResolver';
import type { ProfileIconResolver } from './ProfileIconResolver';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Trae el rango vigente de todo el grupo. Siempre en vivo contra Riot
 * (League-V4 es una sola llamada liviana por jugador, y el rango cambia
 * seguido) — a diferencia de las estadísticas de partidas, que se leen de cache.
 */
export class GetGroupRankingUseCase {
  constructor(
    private readonly playerRepository: PlayerRepository,
    private readonly puuidResolver: PuuidResolver,
    private readonly standingProvider: RankedStandingProvider,
    private readonly profileIconResolver: ProfileIconResolver,
  ) {}

  async execute(): Promise<RankedStanding[]> {
    const players = this.playerRepository.getTrackedPlayers();
    const results: RankedStanding[] = [];

    for (const player of players) {
      results.push(await this.getStandingFor(player));
    }

    return sortByStanding(results);
  }

  private async getStandingFor(player: Player): Promise<RankedStanding> {
    const { riotId } = player;
    try {
      const puuid = await this.puuidResolver.resolve(player);
      const [entry, profileIconUrl] = await Promise.all([
        this.standingProvider.getSoloQueueStanding(puuid),
        this.profileIconResolver.resolve(puuid),
      ]);

      if (!entry) {
        return {
          riotId,
          puuid,
          tier: 'UNRANKED',
          division: null,
          leaguePoints: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          profileIconUrl,
          error: null,
        };
      }

      const totalGames = entry.wins + entry.losses;
      const winRate = totalGames === 0 ? 0 : Math.round((entry.wins / totalGames) * 1000) / 10;

      return {
        riotId,
        puuid,
        tier: entry.tier,
        division: entry.division,
        leaguePoints: entry.leaguePoints,
        wins: entry.wins,
        losses: entry.losses,
        winRate,
        profileIconUrl,
        error: null,
      };
    } catch (error) {
      return {
        riotId,
        puuid: null,
        tier: 'UNRANKED',
        division: null,
        leaguePoints: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        profileIconUrl: null,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }
}
