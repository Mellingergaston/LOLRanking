import type { MatchParticipationData } from '../repositories/MatchProvider';

export function computeCsPerMinute(records: MatchParticipationData[]): number {
  if (records.length === 0) return 0;

  const totalCs = records.reduce((sum, r) => sum + r.minionsKilled + r.neutralMinionsKilled, 0);
  const totalMinutes = records.reduce((sum, r) => sum + r.gameDurationSeconds / 60, 0);
  if (totalMinutes === 0) return 0;

  return Math.round((totalCs / totalMinutes) * 10) / 10;
}
