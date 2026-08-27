export interface ChampionMasteryEntry {
  championId: number;
  championPoints: number;
}

/** Puntos de maestría por campeón (Champion-Mastery-V4). */
export interface ChampionMasteryProvider {
  getTopMasteries(puuid: string, count: number): Promise<ChampionMasteryEntry[]>;
}
