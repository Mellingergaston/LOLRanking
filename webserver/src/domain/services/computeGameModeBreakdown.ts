import type { MatchParticipationData } from '../repositories/MatchProvider';

const QUEUE_LABELS: Record<number, string> = {
  420: 'Ranked Solo/Duo',
  440: 'Ranked Flex',
  450: 'ARAM',
  400: 'Normal Draft',
  430: 'Normal Blind',
  490: 'Normal (Quickplay)',
  700: 'Clash',
  830: 'Co-op vs IA (Intro)',
  840: 'Co-op vs IA (Principiante)',
  850: 'Co-op vs IA (Intermedio)',
};

export interface GameModeStat {
  queueId: number;
  label: string;
  games: number;
  wins: number;
  winRate: number;
}

/** Partidas agrupadas por modo de juego (queueId), de más a menos jugadas. */
export function computeGameModeBreakdown(records: MatchParticipationData[]): GameModeStat[] {
  const map = new Map<number, { games: number; wins: number }>();

  for (const record of records) {
    const entry = map.get(record.queueId) ?? { games: 0, wins: 0 };
    entry.games += 1;
    if (record.win) entry.wins += 1;
    map.set(record.queueId, entry);
  }

  return Array.from(map.entries())
    .map(([queueId, entry]) => ({
      queueId,
      label: QUEUE_LABELS[queueId] ?? `Otros (${queueId})`,
      games: entry.games,
      wins: entry.wins,
      winRate: Math.round((entry.wins / entry.games) * 1000) / 10,
    }))
    .sort((a, b) => b.games - a.games);
}
