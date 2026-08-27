/** Resuelve la identidad de Riot (Account-V1): Riot ID -> PUUID. */
export interface RiotAccountProvider {
  resolvePuuid(riotId: string): Promise<string>;
}
