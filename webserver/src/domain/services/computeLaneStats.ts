import type { MatchParticipationData } from '../repositories/MatchProvider';

export type Lane = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';

export const ALL_LANES: Lane[] = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];

export const LANE_LABELS: Record<Lane, string> = {
  TOP: 'Top',
  JUNGLE: 'Jungla',
  MIDDLE: 'Mid',
  BOTTOM: 'ADC',
  UTILITY: 'Support',
};

export const LANE_SHORT_LABELS: Record<Lane, string> = {
  TOP: 'TOP',
  JUNGLE: 'JG',
  MIDDLE: 'MID',
  BOTTOM: 'ADC',
  UTILITY: 'SUP',
};

function isLane(value: string): value is Lane {
  return (ALL_LANES as string[]).includes(value);
}

export interface LaneStat {
  lane: Lane;
  games: number;
  wins: number;
  winRate: number;
}

/** Winrate por línea. Ignora partidas sin línea asignada (ARAM, etc.). */
export function computeLaneStats(records: MatchParticipationData[]): LaneStat[] {
  const map = new Map<Lane, { games: number; wins: number }>();

  for (const record of records) {
    if (!isLane(record.teamPosition)) continue;
    const entry = map.get(record.teamPosition) ?? { games: 0, wins: 0 };
    entry.games += 1;
    if (record.win) entry.wins += 1;
    map.set(record.teamPosition, entry);
  }

  return Array.from(map.entries()).map(([lane, entry]) => ({
    lane,
    games: entry.games,
    wins: entry.wins,
    winRate: Math.round((entry.wins / entry.games) * 1000) / 10,
  }));
}

/** La línea con más partidas jugadas. */
export function computeMainLane(records: MatchParticipationData[]): Lane | null {
  const stats = computeLaneStats(records);
  if (stats.length === 0) return null;
  return stats.reduce((best, current) => (current.games > best.games ? current : best)).lane;
}
