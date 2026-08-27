export type Tier =
  | 'IRON'
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'EMERALD'
  | 'DIAMOND'
  | 'MASTER'
  | 'GRANDMASTER'
  | 'CHALLENGER'
  | 'UNRANKED';

export type Division = 'I' | 'II' | 'III' | 'IV';

/** Rango vigente de un jugador (League-V4), en vivo en cada carga. */
export interface RankedStanding {
  riotId: string;
  puuid: string | null;
  tier: Tier;
  division: Division | null;
  leaguePoints: number;
  wins: number;
  losses: number;
  winRate: number;
  /** null si no se pudo resolver el ícono (no es motivo de error para el jugador). */
  profileIconUrl: string | null;
  /** Si no es null, no se pudo obtener el rango de este jugador. */
  error: string | null;
}
