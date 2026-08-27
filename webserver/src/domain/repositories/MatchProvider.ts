export interface MatchListFilter {
  /** Solo partidas jugadas desde esta fecha. */
  since: Date;
  /** Máximo de IDs a pedir. */
  count: number;
}

/** Datos de un jugador puntual dentro de una partida (Match-V5). */
export interface MatchParticipationData {
  matchId: string;
  puuid: string;
  gameCreation: Date;
  queueId: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
  damageTaken: number;
  visionScore: number;
  championId: number;
  championName: string;
  teamId: number;
  /** TOP | JUNGLE | MIDDLE | BOTTOM | UTILITY, o '' en modos sin líneas (ARAM, etc.) */
  teamPosition: string;
  minionsKilled: number;
  neutralMinionsKilled: number;
  gameDurationSeconds: number;
}

/** Acceso al historial de partidas (Match-V5). */
export interface MatchProvider {
  listMatchIds(puuid: string, filter: MatchListFilter): Promise<string[]>;
  /** null si la partida no existe o el jugador no participó en ella. */
  getParticipation(matchId: string, puuid: string): Promise<MatchParticipationData | null>;
}
