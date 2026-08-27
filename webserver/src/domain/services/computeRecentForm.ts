import type { MatchParticipationData } from '../repositories/MatchProvider';

export interface RecentMatchSummary {
  matchId: string;
  win: boolean;
  gameCreation: Date;
  championId: number;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
}

/** Las últimas N partidas, más reciente primero. */
export function computeRecentForm(records: MatchParticipationData[], limit = 10): RecentMatchSummary[] {
  return [...records]
    .sort((a, b) => b.gameCreation.getTime() - a.gameCreation.getTime())
    .slice(0, limit)
    .map((r) => ({
      matchId: r.matchId,
      win: r.win,
      gameCreation: r.gameCreation,
      championId: r.championId,
      championName: r.championName,
      kills: r.kills,
      deaths: r.deaths,
      assists: r.assists,
    }));
}
