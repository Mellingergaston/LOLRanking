import type { MatchParticipationData } from '../repositories/MatchProvider';
import { ALL_LANES, computeLaneStats, type Lane } from './computeLaneStats';

export interface LaneLeaderEntry {
  lane: Lane;
  riotId: string;
  winRate: number;
  games: number;
}

/**
 * Mejor jugador por línea del grupo, sin repetir jugador entre líneas.
 * Greedy: ordena todas las combinaciones (jugador, línea) que cumplen el
 * mínimo de partidas por winrate descendente, y va asignando mientras la
 * línea y el jugador sigan libres.
 */
export function computeLaneLeaderboard(
  players: { riotId: string; records: MatchParticipationData[] }[],
  minGames = 3
): LaneLeaderEntry[] {
  const candidates: LaneLeaderEntry[] = [];

  for (const { riotId, records } of players) {
    for (const stat of computeLaneStats(records)) {
      if (stat.games >= minGames) {
        candidates.push({ lane: stat.lane, riotId, winRate: stat.winRate, games: stat.games });
      }
    }
  }

  candidates.sort((a, b) => b.winRate - a.winRate);

  const usedLanes = new Set<Lane>();
  const usedPlayers = new Set<string>();
  const result: LaneLeaderEntry[] = [];

  for (const candidate of candidates) {
    if (usedLanes.has(candidate.lane) || usedPlayers.has(candidate.riotId)) continue;
    result.push(candidate);
    usedLanes.add(candidate.lane);
    usedPlayers.add(candidate.riotId);
    if (result.length === ALL_LANES.length) break;
  }

  return result.sort((a, b) => ALL_LANES.indexOf(a.lane) - ALL_LANES.indexOf(b.lane));
}
