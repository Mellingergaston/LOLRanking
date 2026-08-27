import type { MonthlyStats } from '../entities/MonthlyStats';

export type GroupStatKey = 'kills' | 'damageDealt' | 'damageTaken' | 'visionScore' | 'csPerMinute';

export interface GroupRecord {
  statKey: GroupStatKey;
  label: string;
  riotId: string;
  value: number;
}

export interface GroupStatRankingEntry {
  riotId: string;
  value: number;
}

const RECORD_DEFS: { statKey: GroupStatKey; label: string }[] = [
  { statKey: 'kills', label: 'Más kills' },
  { statKey: 'damageDealt', label: 'Más daño hecho' },
  { statKey: 'damageTaken', label: 'Más daño recibido' },
  { statKey: 'visionScore', label: 'Más visión' },
  { statKey: 'csPerMinute', label: 'Más CS/min' },
];

export function getStatLabel(statKey: GroupStatKey): string {
  return RECORD_DEFS.find((def) => def.statKey === statKey)?.label ?? statKey;
}

/** Para cada stat, quién del grupo lidera. Ignora jugadores sin partidas sincronizadas. */
export function computeGroupRecords(stats: MonthlyStats[]): GroupRecord[] {
  const withGames = stats.filter((s) => s.gamesPlayed > 0);
  if (withGames.length === 0) return [];

  return RECORD_DEFS.map(({ statKey, label }) => {
    const leader = withGames.reduce((best, current) =>
      current[statKey] > best[statKey] ? current : best
    );
    return { statKey, label, riotId: leader.riotId, value: leader[statKey] };
  });
}

/** Todo el grupo ordenado de mayor a menor para una stat puntual. */
export function getStatRanking(stats: MonthlyStats[], statKey: GroupStatKey): GroupStatRankingEntry[] {
  return stats
    .filter((s) => s.gamesPlayed > 0)
    .map((s) => ({ riotId: s.riotId, value: s[statKey] }))
    .sort((a, b) => b.value - a.value);
}
