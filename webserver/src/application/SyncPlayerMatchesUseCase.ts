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
const MATCHES_PER_PAGE = 100;
const DELAY_BETWEEN_REQUESTS_MS = 150;

/**
 * Trae las partidas nuevas de cada jugador del grupo (últimos 30 días,
 * en páginas de 100) y completa encuentros de las partidas guardadas. Se salta
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
      let seen = 0;
      let synced = 0;
      try {
        const puuid = await this.puuidResolver.resolve(player);
        const matchIds = new Set<string>();
        for (let start = 0; ; start += MATCHES_PER_PAGE) {
          const page = await this.matchProvider.listMatchIds(puuid, { since, count: MATCHES_PER_PAGE, start });
          page.forEach((id) => matchIds.add(id));
          if (page.length < MATCHES_PER_PAGE) break;
          await sleep(DELAY_BETWEEN_REQUESTS_MS);
        }
        const pending = await this.matchStatsRepository.getMatchesMissingEncounters(puuid);
        pending.forEach((id) => matchIds.add(id));
        seen = matchIds.size;
        let unavailable = 0;
        for (const matchId of matchIds) {
          const alreadyStored = await this.matchStatsRepository.hasMatch(matchId, puuid);
          if (alreadyStored) continue;
          await sleep(DELAY_BETWEEN_REQUESTS_MS);
          let participation;
          try {
            participation = await this.matchProvider.getParticipation(matchId, puuid);
          } catch (error) {
            // An expired historical match must not block the rest of the backfill.
            if (error instanceof Error && 'status' in error && error.status === 404) {
              unavailable++;
              continue;
            }
            throw error;
          }
          if (!participation) { unavailable++; continue; }

          await this.matchStatsRepository.saveParticipation(participation);
          synced += 1;
        }

        results.push({ riotId: player.riotId, matchesSeen: seen, matchesSynced: synced,
          error: unavailable ? `${unavailable} partidas no están disponibles en Riot.` : null });
      } catch (error) {
        results.push({
          riotId: player.riotId,
          matchesSeen: seen,
          matchesSynced: synced,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }

      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }

    return { since, players: results };
  }
}
