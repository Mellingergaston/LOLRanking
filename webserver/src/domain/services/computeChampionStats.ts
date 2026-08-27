import type { MatchParticipationData } from '../repositories/MatchProvider';

export interface ChampionStat {
  championId: number;
  championName: string;
  games: number;
  wins: number;
  winRate: number;
}

function groupByChampion(records: MatchParticipationData[]): ChampionStat[] {
  const map = new Map<number, { championName: string; games: number; wins: number }>();

  for (const record of records) {
    const entry = map.get(record.championId) ?? { championName: record.championName, games: 0, wins: 0 };
    entry.games += 1;
    if (record.win) entry.wins += 1;
    map.set(record.championId, entry);
  }

  return Array.from(map.entries()).map(([championId, entry]) => ({
    championId,
    championName: entry.championName,
    games: entry.games,
    wins: entry.wins,
    winRate: Math.round((entry.wins / entry.games) * 1000) / 10,
  }));
}

/** Los campeones más jugados, de mayor a menor cantidad de partidas. */
export function computeTopChampionsByGames(records: MatchParticipationData[], limit = 3): ChampionStat[] {
  return groupByChampion(records)
    .sort((a, b) => b.games - a.games)
    .slice(0, limit);
}

/** El campeón con mejor winrate, exigiendo un mínimo de partidas para contar. */
export function computeBestChampionByWinrate(records: MatchParticipationData[], minGames = 3): ChampionStat | null {
  const qualifying = groupByChampion(records).filter((c) => c.games >= minGames);
  if (qualifying.length === 0) return null;
  return qualifying.reduce((best, current) => (current.winRate > best.winRate ? current : best));
}
