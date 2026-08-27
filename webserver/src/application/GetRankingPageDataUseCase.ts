import type { GetGroupRankingUseCase } from './GetGroupRankingUseCase';
import type { GetMonthlyStatsUseCase } from './GetMonthlyStatsUseCase';
import type { MatchStatsRepository } from '@/domain/repositories/MatchStatsRepository';
import type { RankedStanding } from '@/domain/entities/RankedStanding';
import type { MonthlyStats } from '@/domain/entities/MonthlyStats';
import { computeMainLane, type Lane } from '@/domain/services/computeLaneStats';
import { computeLaneLeaderboard, type LaneLeaderEntry } from '@/domain/services/computeLaneLeaderboard';

export interface PlayerWithStats extends RankedStanding {
  stats: MonthlyStats | null;
  mainLane: Lane | null;
}

export interface RankingPageData {
  players: PlayerWithStats[];
  totalConfigured: number;
  error: string | null;
  lastUpdated: string; // ISO
  laneLeaderboard: LaneLeaderEntry[];
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_GAMES_FOR_LANE = 3;

/**
 * Compone GetGroupRankingUseCase + GetMonthlyStatsUseCase (+ partidas crudas
 * para línea principal y el ranking de líneas del grupo) en el "read model"
 * que necesitan tanto la página inicial (Server Component) como /api/ranking.
 */
export class GetRankingPageDataUseCase {
  constructor(
    private readonly rankingUseCase: GetGroupRankingUseCase,
    private readonly statsUseCase: GetMonthlyStatsUseCase,
    private readonly matchStatsRepository: MatchStatsRepository
  ) {}

  async execute(): Promise<RankingPageData> {
    const standings = await this.rankingUseCase.execute();
    const successful = standings.filter((s) => !s.error);
    const totalConfigured = standings.length;
    const allFailed = totalConfigured > 0 && successful.length === 0;

    if (allFailed) {
      return {
        players: [],
        totalConfigured,
        error: standings[0].error,
        lastUpdated: new Date().toISOString(),
        laneLeaderboard: [],
      };
    }

    const since = new Date(Date.now() - THIRTY_DAYS_MS);
    const pairs = successful
      .filter((s): s is RankedStanding & { puuid: string } => s.puuid !== null)
      .map((s) => ({ puuid: s.puuid, riotId: s.riotId }));

    const [stats, recordsByRiotId] = await Promise.all([
      this.statsUseCase.execute(pairs, since),
      this.getRecordsByRiotId(pairs, since),
    ]);

    const players: PlayerWithStats[] = successful.map((s) => ({
      ...s,
      stats: stats.find((st) => st.puuid === s.puuid) ?? null,
      mainLane: computeMainLane(recordsByRiotId.get(s.riotId) ?? []),
    }));

    const laneLeaderboard = computeLaneLeaderboard(
      pairs.map((p) => ({ riotId: p.riotId, records: recordsByRiotId.get(p.riotId) ?? [] })),
      MIN_GAMES_FOR_LANE
    );

    return { players, totalConfigured, error: null, lastUpdated: new Date().toISOString(), laneLeaderboard };
  }

  private async getRecordsByRiotId(pairs: { puuid: string; riotId: string }[], since: Date) {
    const entries = await Promise.all(
      pairs.map(async (p) => [p.riotId, await this.matchStatsRepository.getRecentMatches(p.puuid, since)] as const)
    );
    return new Map(entries);
  }
}
