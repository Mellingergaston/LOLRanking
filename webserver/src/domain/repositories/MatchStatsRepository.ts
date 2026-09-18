import type { MonthlyStats } from '../entities/MonthlyStats';
import type { MatchParticipationData } from './MatchProvider';

/** Cache local (SQLite) de partidas ya procesadas y sus estadísticas agregadas. */
export interface MatchStatsRepository {
  hasMatch(matchId: string, puuid: string): Promise<boolean>;
  getMatchesMissingEncounters(puuid: string): Promise<string[]>;
  getEncounters(puuid: string): Promise<import('../services/computeEncounters').EncounterRecord[]>;
  saveParticipation(data: MatchParticipationData): Promise<void>;
  getStatsSince(puuid: string, riotId: string, since: Date): Promise<MonthlyStats>;
  /** Filas crudas (no agregadas) de un jugador, más nuevas primero. Base de casi todas las stats avanzadas. */
  getRecentMatches(puuid: string, since: Date): Promise<MatchParticipationData[]>;
}
