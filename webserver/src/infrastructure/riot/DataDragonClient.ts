const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface ChampionInfo {
  id: string; // clave interna de ddragon, ej. "MonkeyKing" (para Wukong)
  name: string; // nombre de pantalla, ej. "Wukong"
}

interface ChampionJsonDto {
  data: Record<string, { key: string; id: string; name: string }>;
}

/**
 * Data Dragon es el CDN público de assets de Riot (íconos, splash arts, etc.).
 * No usa X-Riot-Token, por eso es un cliente aparte de RiotApiClient.
 */
export class DataDragonClient {
  private cachedVersion: string | null = null;
  private versionCachedAt = 0;

  private championMap: Map<number, ChampionInfo> | null = null;
  private championMapCachedAt = 0;

  async getLatestVersion(): Promise<string> {
    if (this.cachedVersion && Date.now() - this.versionCachedAt < CACHE_TTL_MS) {
      return this.cachedVersion;
    }

    const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    if (!response.ok) {
      throw new Error(`No se pudo obtener la versión de Data Dragon: HTTP ${response.status}`);
    }
    const versions: string[] = await response.json();
    this.cachedVersion = versions[0];
    this.versionCachedAt = Date.now();
    return this.cachedVersion;
  }

  async getProfileIconUrl(profileIconId: number): Promise<string> {
    const version = await this.getLatestVersion();
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${profileIconId}.png`;
  }

  async getChampionById(championId: number): Promise<ChampionInfo | null> {
    await this.ensureChampionMap();
    return this.championMap!.get(championId) ?? null;
  }

  async getChampionIconUrl(championId: number): Promise<string | null> {
    const champion = await this.getChampionById(championId);
    if (!champion) return null;
    const version = await this.getLatestVersion();
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.id}.png`;
  }

  private async ensureChampionMap(): Promise<void> {
    if (this.championMap && Date.now() - this.championMapCachedAt < CACHE_TTL_MS) return;

    const version = await this.getLatestVersion();
    const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`);
    if (!response.ok) {
      throw new Error(`No se pudo obtener la lista de campeones de Data Dragon: HTTP ${response.status}`);
    }
    const json: ChampionJsonDto = await response.json();

    const map = new Map<number, ChampionInfo>();
    for (const champion of Object.values(json.data)) {
      map.set(Number(champion.key), { id: champion.id, name: champion.name });
    }
    this.championMap = map;
    this.championMapCachedAt = Date.now();
  }
}
