/** Estadísticas agregadas de un jugador en una ventana de tiempo, sacadas de la cache local. */
export interface MonthlyStats {
  puuid: string;
  riotId: string;
  since: Date;
  gamesPlayed: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
  damageTaken: number;
  visionScore: number;
  csPerMinute: number;
}

export function emptyMonthlyStats(puuid: string, riotId: string, since: Date): MonthlyStats {
  return {
    puuid,
    riotId,
    since,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    damageDealt: 0,
    damageTaken: 0,
    visionScore: 0,
    csPerMinute: 0,
  };
}
