/** Cache local de la resolución Riot ID -> PUUID (Account-V1 casi no cambia). */
export interface SummonerRepository {
  getCachedPuuid(riotId: string): Promise<string | null>;
  saveSummoner(riotId: string, puuid: string, gameName: string, tagLine: string): Promise<void>;
}
