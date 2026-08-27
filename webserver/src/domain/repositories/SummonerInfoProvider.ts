/** Datos de invocador que no vienen en League-V4 (Summoner-V4). */
export interface SummonerInfoProvider {
  getProfileIconId(puuid: string): Promise<number>;
}
