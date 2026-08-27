import type { MatchStatsRepository } from '@/domain/repositories/MatchStatsRepository';
import type { MonthlyStats } from '@/domain/entities/MonthlyStats';

export interface PuuidRiotIdPair {
  puuid: string;
  riotId: string;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Lee las estadísticas agregadas del último mes (ventana móvil de 30 días) desde la cache. */
export class GetMonthlyStatsUseCase {
  constructor(private readonly matchStatsRepository: MatchStatsRepository) {}

  async execute(players: PuuidRiotIdPair[], since = new Date(Date.now() - THIRTY_DAYS_MS)): Promise<MonthlyStats[]> {
    return Promise.all(
      players.map((p) => this.matchStatsRepository.getStatsSince(p.puuid, p.riotId, since))
    );
  }
}
