import type { MatchParticipationData } from '../repositories/MatchProvider';

export interface DuoStat {
  riotId: string;
  gamesTogether: number;
  winsTogether: number;
  winRateTogether: number;
}

/**
 * Cuánto juega y gana el jugador (targetRecords) junto a cada otro jugador
 * trackeado. "Juntos" = misma partida (matchId) y mismo equipo (teamId).
 */
export function computeDuoWinrates(
  targetRecords: MatchParticipationData[],
  others: { riotId: string; records: MatchParticipationData[] }[],
  minGamesTogether = 2
): DuoStat[] {
  const targetByMatch = new Map(targetRecords.map((r) => [r.matchId, r]));

  const stats: DuoStat[] = others.map(({ riotId, records }) => {
    let gamesTogether = 0;
    let winsTogether = 0;

    for (const record of records) {
      const mine = targetByMatch.get(record.matchId);
      if (mine && mine.teamId === record.teamId) {
        gamesTogether += 1;
        if (mine.win) winsTogether += 1;
      }
    }

    return {
      riotId,
      gamesTogether,
      winsTogether,
      winRateTogether: gamesTogether === 0 ? 0 : Math.round((winsTogether / gamesTogether) * 1000) / 10,
    };
  });

  return stats
    .filter((s) => s.gamesTogether >= minGamesTogether)
    .sort((a, b) => b.gamesTogether - a.gamesTogether);
}
