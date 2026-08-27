import type { PlayerRepository } from '@/domain/repositories/PlayerRepository';
import type { MatchProvider } from '@/domain/repositories/MatchProvider';
import type { MatchStatsRepository } from '@/domain/repositories/MatchStatsRepository';
import type { PuuidResolver } from './PuuidResolver';

export interface PlayerSyncResult {
  riotId: string;
  matchesSeen: number;
  matchesSynced: number;
  error: string | null;
}

export interface SyncSummary {
  since: Date;
  players: PlayerSyncResult[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MATCHES_PER_PLAYER = 30;
const DELAY_BETWEEN_REQUESTS_MS = 150;

/**
 * Trae las partidas nuevas de cada jugador del grupo (últimos 30 días, hasta
 * MATCHES_PER_PLAYER por jugador) y las guarda en la cache local. Se salta
 * las partidas que ya están guardadas, así una segunda corrida es rápida.
 */
export class SyncPlayerMatchesUseCase {
  constructor(
    private readonly playerRepository: PlayerRepository,
    private readonly puuidResolver: PuuidResolver,
    private readonly matchProvider: MatchProvider,
    private readonly matchStatsRepository: MatchStatsRepository
  ) {}

  async execute(since = new Date(Date.now() - THIRTY_DAYS_MS)): Promise<SyncSummary> {
    const players = this.playerRepository.getTrackedPlayers();
    const results: PlayerSyncResult[] = [];

    for (const player of players) {
      try {
        const puuid = await this.puuidResolver.resolve(player);
        const matchIds = await this.matchProvider.listMatchIds(puuid, { since, count: MATCHES_PER_PLAYER });

        let synced = 0;
        for (const matchId of matchIds) {
          await sleep(DELAY_BETWEEN_REQUESTS_MS);
          const alreadyStored = await this.matchStatsRepository.hasMatch(matchId, puuid);
          if (alreadyStored) continue;

          const participation = await this.matchProvider.getParticipation(matchId, puuid);
          if (!participation) continue;

          await this.matchStatsRepository.saveParticipation(participation);
          synced += 1;
        }

        results.push({ riotId: player.riotId, matchesSeen: matchIds.length, matchesSynced: synced, error: null });
      } catch (error) {
        results.push({
          riotId: player.riotId,
          matchesSeen: 0,
          matchesSynced: 0,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }

      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }

    return { since, players: results };
  }
}
